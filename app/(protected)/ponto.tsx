import { criarRegistroPonto,  listMeusPontos,  validarFimDescanso,  type PontoRegistro,  type PontoTipo } from '../../lib/pontos';
import { ActivityIndicator,  Pressable,  RefreshControl,  ScrollView,  Text,  TextInput,  View          } from 'react-native';
import { useCallback, useEffect, useState    } from 'react';
import { router                              } from 'expo-router';
import { LogOut                              } from 'lucide-react-native';
import { supabase                            } from '../../lib/supabase';
import { useSession                          } from '../../hooks/useSession';
import { fetchCadastro, type Cadastro        } from '../../lib/cadastros';
import { uploadSelfie                        } from '../../lib/storage';
import { getCurrentLocation                  } from '../../lib/geolocation';
import { formatDateTimeBr                    } from '../../lib/datetime';
import CameraCapture, { type CaptureMetadata } from '../../components/CameraCapture';

const TIPOS: { value: PontoTipo; label: string }[] = [
    { value: 'entrada'        , label: 'Entrada'         }
  , { value: 'inicio_descanso', label: 'Início descanso' }
  , { value: 'fim_descanso'   , label: 'Fim descanso'    }
  , { value: 'saida'          , label: 'Saída'           }
];

export default function PontoScreen() {
  const { session } = useSession();
  const email = session?.user?.email ?? null;

  const [cadastro, setCadastro] = useState<Cadastro | null>(null);
  const [tipo, setTipo] = useState<PontoTipo>('entrada');
  const [observacao, setObservacao] = useState('');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [captureMeta, setCaptureMeta] = useState<CaptureMetadata | null>(null);

  const [registros, setRegistros] = useState<PontoRegistro[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRegistros = useCallback(async (targetEmail: string) => {
    setLoadingList(true);
    try {
      const data = await listMeusPontos(targetEmail);
      setRegistros(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar registros.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (!email) return;
    fetchCadastro(email).then(setCadastro).catch(() => setCadastro(null));
    loadRegistros(email);
  }, [email, loadRegistros]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const baterPonto = async () => {
    if (!email || !cadastro) return;

    if (!selfieUri) {
      setError('A selfie é obrigatória para registrar o ponto.');
      return;
    }

    setError('');
    setSuccess('');
    setRegistering(true);

    try {
      if (tipo === 'fim_descanso') {
        const validationError = await validarFimDescanso(email);
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      const location =
        captureMeta?.latitude != null && captureMeta?.longitude != null
          ? { latitude: captureMeta.latitude, longitude: captureMeta.longitude }
          : await getCurrentLocation();

      const selfieUrl = await uploadSelfie(email, selfieUri);

      await criarRegistroPonto({
        email,
        nome: cadastro.name,
        role: cadastro.role,
        tipo,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        selfieUrl,
        observacao: observacao || null,
      });

      setSuccess('Ponto registrado com sucesso.');
      setObservacao('');
      setSelfieUri(null);
      setCaptureMeta(null);
      await loadRegistros(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar ponto.');
    } finally {
      setRegistering(false);
    }
  };

  const canRegister = !!email && !!cadastro && !registering;

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="p-4 gap-4"
      refreshControl={
        <RefreshControl
          refreshing={loadingList}
          onRefresh={() => email && loadRegistros(email)}
        />
      }
    >
      {/* Cabeçalho */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-slate-900">Bater ponto</Text>
          {cadastro && <Text className="text-slate-500">{cadastro.name}</Text>}
        </View>
        <Pressable
          onPress={handleLogout}
          className="flex-row items-center rounded-lg border border-slate-300 px-3 py-2"
        >
          <LogOut size={16} color="#475569" />
          <Text className="ml-2 text-sm text-slate-600">Sair</Text>
        </Pressable>
      </View>

      {/* Card de registro */}
      <View className="rounded-xl border border-slate-200 bg-white p-5 gap-4">
        <Text className="text-sm text-slate-600">
          Regras: descanso mínimo de 20 minutos entre início e fim do descanso.
        </Text>

        {!!error && (
          <View className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        )}
        {!!success && (
          <View className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <Text className="text-sm text-green-700">{success}</Text>
          </View>
        )}

        {/* Seleção de tipo */}
        <View>
          <Text className="mb-2 text-sm font-medium text-slate-700">Tipo</Text>
          <View className="flex-row flex-wrap gap-2">
            {TIPOS.map((item) => {
              const selected = tipo === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setTipo(item.value)}
                  className={`rounded-full border px-4 py-2 ${
                    selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                  }`}
                >
                  <Text className={selected ? 'text-white' : 'text-slate-700'}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Observação */}
        <View>
          <Text className="mb-2 text-sm font-medium text-slate-700">
            Observação (opcional)
          </Text>
          <TextInput
            value={observacao}
            onChangeText={setObservacao}
            placeholder="Observação"
            placeholderTextColor="#94a3b8"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </View>

        <CameraCapture
          selfieUri={selfieUri}
          onChange={setSelfieUri}
          onMetadataChange={setCaptureMeta}
        />

        <Pressable
          onPress={baterPonto}
          disabled={!canRegister}
          className={`items-center rounded-lg py-3 ${
            canRegister ? 'bg-blue-600' : 'bg-blue-300'
          }`}
        >
          {registering ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="font-semibold text-white">Registrar ponto</Text>
          )}
        </Pressable>
      </View>

      {/* Últimos registros */}
      <View className="rounded-xl border border-slate-200 bg-white p-5 gap-3">
        <Text className="text-lg font-semibold text-slate-900">Últimos registros</Text>

        {registros.length === 0 && !loadingList && (
          <Text className="text-sm text-slate-500">Nenhum registro encontrado.</Text>
        )}

        {registros.map((registro, index) => (
          <View
            key={`${registro.criadoEmIso}-${index}`}
            className="border-b border-slate-100 pb-3 last:border-b-0"
          >
            <Text className="text-sm font-medium text-slate-900">
              {registro.dataLocal || formatDateTimeBr(registro.criadoEmIso)}
            </Text>
            <Text className="text-sm text-slate-600">
              {TIPOS.find((t) => t.value === registro.tipo)?.label ?? registro.tipo}
            </Text>
            {!!registro.observacao && (
              <Text className="text-xs text-slate-400">{registro.observacao}</Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
