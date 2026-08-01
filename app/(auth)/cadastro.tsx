import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Eye, EyeOff, Lock, Mail, Phone, User, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { router } from 'expo-router';

import { signUpCadastro } from '../../lib/cadastros';
import { mapAuthErrorToPtBr } from '../../lib/authErrors';
import { isPasswordStrong, isValidEmail } from '../../lib/validation';

export default function CadastroScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canSubmit =
    name.trim().length > 0 && email.trim().length > 0 && password.length > 0 && !loading;

  const handleCadastro = async () => {
    if (!canSubmit) return;

    setError('');
    setSuccess('');

    if (!isValidEmail(email)) {
      setError('Informe um email válido.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Senha e confirmação não conferem.');
      return;
    }
    if (!isPasswordStrong(password)) {
      setError('A senha deve ter 6+ caracteres, uma maiúscula, uma minúscula e um caractere especial.');
      return;
    }

    setLoading(true);
    try {
      const { hasSession } = await signUpCadastro({
        name,
        phone,
        email,
        password,
      });

      if (hasSession) {
        router.replace('/ponto');
        return;
      }

      setSuccess('Cadastro criado! Verifique seu email para confirmar a conta antes de entrar.');
    } catch (err) {
      setError(mapAuthErrorToPtBr(err instanceof Error ? err.message : undefined));
    } finally {
      setLoading(false);
    }
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
          <View className="items-center mb-6">
            <View className="mb-4 rounded-full bg-blue-100 p-3">
              <UserPlus size={28} color="#2563eb" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 text-center">Criar conta</Text>
            <Text className="mt-1 text-slate-600 text-center">
              Cadastre-se para bater ponto pelo app
            </Text>
          </View>

          {!!error && (
            <View className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-700">{error}</Text>
            </View>
          )}
          {!!success && (
            <View className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <Text className="text-sm text-green-700">{success}</Text>
            </View>
          )}

          <View className="mb-4">
            <Text className="mb-1 text-sm font-medium text-slate-700">Nome</Text>
            <View className="flex-row items-center rounded-lg border border-slate-300 px-3">
              <User size={18} color="#94a3b8" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Seu nome completo"
                placeholderTextColor="#94a3b8"
                editable={!loading}
                className="ml-2 flex-1 py-3 text-slate-900"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="mb-1 text-sm font-medium text-slate-700">Telefone (opcional)</Text>
            <View className="flex-row items-center rounded-lg border border-slate-300 px-3">
              <Phone size={18} color="#94a3b8" />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="(11) 99999-9999"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                editable={!loading}
                className="ml-2 flex-1 py-3 text-slate-900"
              />
            </View>
          </View>

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

          <View className="mb-4">
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
                autoComplete="new-password"
                editable={!loading}
                className="ml-2 flex-1 py-3 text-slate-900"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                {showPassword ? (
                  <EyeOff size={18} color="#94a3b8" />
                ) : (
                  <Eye size={18} color="#94a3b8" />
                )}
              </Pressable>
            </View>
            <Text className="mt-1 text-xs text-slate-400">
              6+ caracteres, uma maiúscula, uma minúscula e um caractere especial.
            </Text>
          </View>

          <View className="mb-6">
            <Text className="mb-1 text-sm font-medium text-slate-700">Confirmar senha</Text>
            <View className="flex-row items-center rounded-lg border border-slate-300 px-3">
              <Lock size={18} color="#94a3b8" />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repita a senha"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!loading}
                className="ml-2 flex-1 py-3 text-slate-900"
                onSubmitEditing={handleCadastro}
              />
            </View>
          </View>

          <Pressable
            onPress={handleCadastro}
            disabled={!canSubmit}
            className={`items-center rounded-lg py-3 ${canSubmit ? 'bg-blue-600' : 'bg-blue-300'}`}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="font-semibold text-white">Criar conta</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.replace('/login')} className="mt-4 items-center">
            <Text className="text-sm text-slate-600">
              Já tem conta? <Text className="font-medium text-blue-600">Entrar</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
