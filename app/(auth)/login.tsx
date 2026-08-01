import { ActivityIndicator,  KeyboardAvoidingView,  Platform,  Pressable,  ScrollView,  Text,  TextInput,  View } from 'react-native';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { router   } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { mapAuthErrorToPtBr } from '../../lib/authErrors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  const handleLogin = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    setLoading(false);

    if (authError || !data.session) {
      setError(mapAuthErrorToPtBr(authError?.message));
      return;
    }

    // useSession (no layout protegido) detecta a sessão automaticamente,
    // aqui só navegamos para a tela principal.
    router.replace('/ponto');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-50"
    >
      <ScrollView
        contentContainerClassName="flex-1 items-center justify-center px-6 py-10"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
          {/* Header */}
          <View className="items-center mb-6">
            <View className="mb-4 rounded-full bg-blue-100 p-3">
              <ShieldCheck size={28} color="#2563eb" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 text-center">
              Folha de Ponto Titãs
            </Text>
            <Text className="mt-1 text-slate-600 text-center">
              Faça login para continuar
            </Text>
          </View>

          {/* Erro */}
          {!!error && (
            <View className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-700">{error}</Text>
            </View>
          )}

          {/* Email */}
          <View className="mb-4">
            <Text className="mb-1 text-sm font-medium text-slate-700">Email</Text>
            <View className="flex-row items-center rounded-lg border border-slate-300 px-3">
              <Mail size={18} color="#94a3b8" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                editable={!loading}
                className="ml-2 flex-1 py-3 text-slate-900"
              />
            </View>
          </View>

          {/* Senha */}
          <View className="mb-6">
            <Text className="mb-1 text-sm font-medium text-slate-700">Senha</Text>
            <View className="flex-row items-center rounded-lg border border-slate-300 px-3">
              <Lock size={18} color="#94a3b8" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Sua senha"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
                className="ml-2 flex-1 py-3 text-slate-900"
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                {showPassword ? (
                  <EyeOff size={18} color="#94a3b8" />
                ) : (
                  <Eye size={18} color="#94a3b8" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Botão entrar */}
          <Pressable
            onPress={handleLogin}
            disabled={!canSubmit}
            className={`items-center rounded-lg py-3 ${
              canSubmit ? 'bg-blue-600' : 'bg-blue-300'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="font-semibold text-white">Entrar</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.push('/cadastro')} className="mt-4 items-center">
            <Text className="text-sm text-slate-600">
              Não tem conta? <Text className="font-medium text-blue-600">Criar conta</Text>
            </Text>
          </Pressable>

          <Text className="mt-6 text-center text-xs text-slate-400">
            © 2026 Folha de Ponto Titãs. Todos os direitos reservados.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

