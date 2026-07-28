import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { fetchCadastro, updateCadastroActive, updateMeuNome, type Cadastro      } from '../../lib/cadastros';
import { useEffect, useState } from 'react';
import { router              } from 'expo-router';
import { supabase            } from '../../lib/supabase';
import { useSession          } from '../../hooks/useSession';

function isPasswordStrong(password: string): boolean {
  return (
    password.length >= 6 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[!@#$%^&*()_+\-=[\]{};:'",.<>?/\\|`~]/.test(password)
  );
}

export default function ConfiguracoesScreen() {
  const { session } = useSession();
  const email = session?.user?.email ?? null;

  const [cadastro, setCadastro] = useState<Cadastro | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!email) return;
    fetchCadastro(email).then((data) => {
      setCadastro(data);
      setName(data?.name ?? '');
    });
  }, [email]);

  const salvarPerfil = async () => {
    if (!email) return;
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      setError('Senha e confirmação não conferem.');
      return;
    }
    if (password && !isPasswordStrong(password)) {
      setError('A senha deve ter 6+ caracteres, uma maiúscula, uma minúscula e um caractere especial.');
      return;
    }

    setLoading(true);
    try {
      if (name.trim() && name.trim() !== cadastro?.name) {
        await updateMeuNome(email, name.trim());
      }

      if (password) {
        const { error: passwordError } = await supabase.auth.updateUser({ password });
        if (passwordError) throw new Error(passwordError.message);
      }

      setCadastro((prev) => (prev ? { ...prev, name: name.trim() } : prev));
      setPassword('');
      setConfirmPassword('');
      setSuccess('Perfil atualizado com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const sair = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const desativarConta = () => {
    Alert.alert(
      'Desativar conta',
      'Sua conta será desativada e você não conseguirá mais fazer login. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            if (!cadastro) return;
            try {
              await updateCadastroActive(cadastro.id, false);
              await sair();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Erro ao desativar conta.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 pt-16 gap-4">
      <Text className="text-2xl font-bold text-slate-900">Configurações</Text>

      <View className="rounded-xl border border-slate-200 bg-white p-5 gap-3">
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

        <View>
          <Text className="mb-1 text-sm font-medium text-slate-700">Nome</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </View>

        <View>
          <Text className="mb-1 text-sm font-medium text-slate-700">Email</Text>
          <TextInput
            value={email ?? ''}
            editable={false}
            className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500"
          />
        </View>

        <View>
          <Text className="mb-1 text-sm font-medium text-slate-700">Nova senha (opcional)</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </View>

        <View>
          <Text className="mb-1 text-sm font-medium text-slate-700">Confirmar nova senha</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </View>

        <Pressable
          onPress={salvarPerfil}
          disabled={loading}
          className="items-center rounded-lg bg-blue-600 py-3"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-semibold text-white">Salvar perfil</Text>
          )}
        </Pressable>

        <Pressable onPress={sair} className="items-center rounded-lg border border-slate-300 py-3">
          <Text className="font-medium text-slate-700">Sair</Text>
        </Pressable>

        <Pressable onPress={desativarConta} className="items-center rounded-lg bg-red-600 py-3">
          <Text className="font-semibold text-white">Desativar conta</Text>
        </Pressable>

        <Text className="text-xs text-slate-400">
          Exclusão definitiva da conta (remoção do login) ainda precisa ser feita por um admin
          pelo painel web.
        </Text>
      </View>
    </ScrollView>
  );
}
