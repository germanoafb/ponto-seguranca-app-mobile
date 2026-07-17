import { Redirect, Stack } from 'expo-router';
import { Text, View } from 'react-native';

import { useSession } from '../../hooks/useSession';

export default function ProtectedLayout() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
