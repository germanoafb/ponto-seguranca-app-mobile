import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useSession } from '../hooks/useSession';

export default function Index() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  return <Redirect href={session ? '/ponto' : '/login'} />;
}
