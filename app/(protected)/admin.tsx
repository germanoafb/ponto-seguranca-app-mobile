import { ActivityIndicator, Linking, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { listCadastros, updateCadastroActive, updateCadastroRole } from '../../lib/cadastros';
import { listRelatorio, type RelatorioFiltros } from '../../lib/relatorios';
import { useEffect, useState  } from 'react';
import { Download, FileSpreadsheet, Search } from 'lucide-react-native';
import { exportarRelatorioCsv } from '../../lib/csvExport';
import { formatDateTimeBr     } from '../../lib/datetime';
import { gerarPlanilhaPonto, isMesAnoValido, type Funcao } from '../../lib/planilhaExport';
import type { PontoRegistro, PontoTipo } from '../../lib/pontos';
import type { Cadastro                 } from '../../lib/cadastros';

const TIPO_LABEL: Record<PontoTipo, string> = {
    entrada        : 'Entrada'
  , inicio_descanso: 'Início descanso'
  , fim_descanso   : 'Fim descanso'
  , saida          : 'Saída'
};

// O valor gravado no banco precisa bater com o que o gatilho/RLS e o painel
// web esperam (minúsculo, snake_case) — só o rótulo exibido é em português.
const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'seguranca', label: 'Segurança' },
  { value: 'bombeiro_civil', label: 'Bombeiro Civil' },
  { value: 'admin', label: 'Admin' },
];

const ENDERECO_TITAS = 'Rua - Dr. Antônio Rodrigues Braga,118 - São Sebastião - Uberaba/MG';

function toIsoDate(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default function AdminScreen() {
  const [tab, setTab] = useState<'relatorios' | 'segurancas' | 'planilhas'>('relatorios');

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row gap-2 border-b border-slate-200 bg-white px-4 pt-14 pb-2">
        <Pressable
          onPress={() => setTab('relatorios')}
          className={`rounded-full px-4 py-2 ${tab === 'relatorios' ? 'bg-blue-600' : 'bg-slate-100'}`}
        >
          <Text className={tab === 'relatorios' ? 'text-white font-medium' : 'text-slate-700'}>
            Relatórios
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('segurancas')}
          className={`rounded-full px-4 py-2 ${tab === 'segurancas' ? 'bg-blue-600' : 'bg-slate-100'}`}
        >
          <Text className={tab === 'segurancas' ? 'text-white font-medium' : 'text-slate-700'}>
            Seguranças
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('planilhas')}
          className={`rounded-full px-4 py-2 ${tab === 'planilhas' ? 'bg-blue-600' : 'bg-slate-100'}`}
        >
          <Text className={tab === 'planilhas' ? 'text-white font-medium' : 'text-slate-700'}>
            Planilhas
          </Text>
        </Pressable>
      </View>

      {tab === 'relatorios' && <RelatoriosTab />}
      {tab === 'segurancas' && <SegurancasTab />}
      {tab === 'planilhas' && <PlanilhasTab />}
    </View>
  );
}

function RelatoriosTab() {
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registros, setRegistros] = useState<PontoRegistro[]>([]);

  const buscar = async () => {
    setLoading(true);
    setError('');
    try {
      const filtros: RelatorioFiltros = {
        query,
        fromIso: toIsoDate(from),
        toIso: toIsoDate(to),
      };
      const data = await listRelatorio(filtros);
      setRegistros(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatório.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportar = async () => {
    if (registros.length === 0) return;
    try {
      await exportarRelatorioCsv(registros);
    } catch {
      setError('Erro ao exportar CSV.');
    }
  };

  return (
    <ScrollView contentContainerClassName="p-4 gap-4">
      <View className="rounded-xl border border-slate-200 bg-white p-4 gap-3">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Nome ou email do segurança"
          placeholderTextColor="#94a3b8"
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
        <View className="flex-row gap-3">
          <TextInput
            value={from}
            onChangeText={setFrom}
            placeholder="De (AAAA-MM-DD)"
            placeholderTextColor="#94a3b8"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
          <TextInput
            value={to}
            onChangeText={setTo}
            placeholder="Até (AAAA-MM-DD)"
            placeholderTextColor="#94a3b8"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={buscar}
            className="flex-1 flex-row items-center justify-center rounded-lg bg-blue-600 py-3"
          >
            <Search size={16} color="#fff" />
            <Text className="ml-2 font-medium text-white">
              {loading ? 'Buscando...' : 'Buscar'}
            </Text>
          </Pressable>
          <Pressable
            onPress={exportar}
            disabled={registros.length === 0}
            className={`flex-1 flex-row items-center justify-center rounded-lg py-3 ${
              registros.length === 0 ? 'bg-emerald-300' : 'bg-emerald-600'
            }`}
          >
            <Download size={16} color="#fff" />
            <Text className="ml-2 font-medium text-white">Exportar CSV</Text>
          </Pressable>
        </View>

        {!!error && <Text className="text-sm text-red-600">{error}</Text>}
      </View>

      <View className="rounded-xl border border-slate-200 bg-white p-4 gap-3">
        {loading && <ActivityIndicator color="#2563eb" />}

        {!loading && registros.length === 0 && (
          <Text className="text-sm text-slate-500">Nenhum resultado.</Text>
        )}

        {registros.map((item, index) => (
          <View
            key={`${item.criadoEmIso}-${index}`}
            className="border-b border-slate-100 pb-3 last:border-b-0"
          >
            <Text className="text-sm font-semibold text-slate-900">
              {item.dataLocal || formatDateTimeBr(item.criadoEmIso)}
            </Text>
            <Text className="text-sm text-slate-700">{item.nome} · {item.email}</Text>
            <Text className="text-sm text-slate-600">{TIPO_LABEL[item.tipo] ?? item.tipo}</Text>
            {!!item.observacao && (
              <Text className="text-xs text-slate-400">{item.observacao}</Text>
            )}
            {!!item.selfieUrl && (
              <Pressable onPress={() => Linking.openURL(item.selfieUrl!)}>
                <Text className="mt-1 text-xs text-blue-600 underline">Ver selfie</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function SegurancasTab() {
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listCadastros();
      setCadastros(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar seguranças.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const toggleActive = async (item: Cadastro) => {
    setSavingId(item.id);
    try {
      await updateCadastroActive(item.id, !item.active);
      setCadastros((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, active: !c.active } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status.');
    } finally {
      setSavingId(null);
    }
  };

  const changeRole = async (item: Cadastro, role: string) => {
    if (role === item.role) return;
    setSavingId(item.id);
    try {
      await updateCadastroRole(item.id, role);
      setCadastros((prev) => prev.map((c) => (c.id === item.id ? { ...c, role } : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar função.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <ScrollView contentContainerClassName="p-4 gap-3">
      <View className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <Text className="text-xs text-amber-800">
          Novos usuários se cadastram sozinhos pela tela de "Criar conta" no login. Depois de
          cadastrado, ajuste a função (role) e o status aqui, se necessário.
        </Text>
      </View>

      {!!error && (
        <View className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <Text className="text-sm text-red-700">{error}</Text>
        </View>
      )}

      {loading && <ActivityIndicator color="#2563eb" />}

      {!loading &&
        cadastros.map((item) => (
          <View key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-semibold text-slate-900">{item.name}</Text>
                <Text className="text-xs text-slate-500">{item.email}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-slate-500">{item.active ? 'Ativo' : 'Inativo'}</Text>
                <Switch
                  value={item.active}
                  onValueChange={() => toggleActive(item)}
                  disabled={savingId === item.id}
                />
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {ROLE_OPTIONS.map((option) => {
                const selected = item.role === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => changeRole(item, option.value)}
                    disabled={savingId === item.id}
                    className={`rounded-full border px-3 py-1 ${
                      selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                    }`}
                  >
                    <Text className={`text-xs ${selected ? 'text-white' : 'text-slate-700'}`}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
    </ScrollView>
  );
}

function PlanilhasTab() {
  const [cnpj, setCnpj] = useState('');
  const [contratante, setContratante] = useState('');
  const [contratada, setContratada] = useState('TITÃS PRESTADORA DE SERVIÇOS LTDA');
  const [mesAno, setMesAno] = useState('');
  const [enderecoContratante, setEnderecoContratante] = useState('');
  const [nomeColaborador, setNomeColaborador] = useState('');
  const [funcao, setFuncao] = useState<Funcao>('seguranca');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const funcaoOptions: { value: Funcao; label: string }[] = [
    { value: 'seguranca', label: 'Segurança' },
    { value: 'bombeiro_civil', label: 'Bombeiro Civil' },
  ];

  const gerar = async () => {
    setError('');

    if (
      !cnpj.trim() ||
      !contratante.trim() ||
      !contratada.trim() ||
      !enderecoContratante.trim() ||
      !nomeColaborador.trim()
    ) {
      setError('Preencha todos os campos antes de gerar a planilha.');
      return;
    }
    if (!isMesAnoValido(mesAno)) {
      setError('Informe o Mês/Ano no formato AAAA-MM (ex.: 2026-03).');
      return;
    }

    setLoading(true);
    try {
      await gerarPlanilhaPonto({
        cnpj,
        contratante,
        contratada,
        mesAno,
        enderecoTitas: ENDERECO_TITAS,
        enderecoContratante,
        nomeColaborador,
        funcao,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar planilha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerClassName="p-4 gap-4">
      <View className="rounded-xl border border-slate-200 bg-white p-4 gap-3">
        <Text className="text-lg font-semibold text-slate-900">Criar Planilha</Text>
        <Text className="text-xs text-slate-500">
          Gera a Folha de Ponto Individual (.xlsx) para um colaborador, no mesmo layout usado no
          painel web. Gerado 100% no aparelho, para preenchimento manual de entrada/intervalo/saída.
        </Text>

        <TextInput
          value={cnpj}
          onChangeText={setCnpj}
          placeholder="CNPJ (ex.: 00.000.000/0000-00)"
          placeholderTextColor="#94a3b8"
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
        <TextInput
          value={contratante}
          onChangeText={setContratante}
          placeholder="Contratante"
          placeholderTextColor="#94a3b8"
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
        <TextInput
          value={contratada}
          onChangeText={setContratada}
          placeholder="Contratada"
          placeholderTextColor="#94a3b8"
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
        <TextInput
          value={mesAno}
          onChangeText={setMesAno}
          placeholder="Mês/Ano (AAAA-MM, ex.: 2026-03)"
          placeholderTextColor="#94a3b8"
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
        <TextInput
          value={ENDERECO_TITAS}
          editable={false}
          className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500"
        />
        <TextInput
          value={enderecoContratante}
          onChangeText={setEnderecoContratante}
          placeholder="Endereço da contratante"
          placeholderTextColor="#94a3b8"
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
        <TextInput
          value={nomeColaborador}
          onChangeText={setNomeColaborador}
          placeholder="Nome do colaborador"
          placeholderTextColor="#94a3b8"
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />

        <View className="flex-row gap-2">
          {funcaoOptions.map((option) => {
            const selected = funcao === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setFuncao(option.value)}
                className={`flex-1 items-center rounded-lg border px-3 py-2 ${
                  selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                }`}
              >
                <Text className={selected ? 'font-medium text-white' : 'text-slate-700'}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!!error && <Text className="text-sm text-red-600">{error}</Text>}

        <Pressable
          onPress={gerar}
          disabled={loading}
          className={`flex-row items-center justify-center rounded-lg py-3 ${
            loading ? 'bg-blue-300' : 'bg-blue-600'
          }`}
        >
          <FileSpreadsheet size={16} color="#fff" />
          <Text className="ml-2 font-medium text-white">
            {loading ? 'Gerando...' : 'Gerar planilha (.xlsx)'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
