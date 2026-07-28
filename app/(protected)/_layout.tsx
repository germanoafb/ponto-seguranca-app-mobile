import { Clock, Settings, ShieldCheck } from 'lucide-react-native';
import { ActivityIndicator, View      } from 'react-native';
import { useEffect, useState          } from 'react';
import { Redirect, Tabs               } from 'expo-router';
import { useSession    } from '../../hooks/useSession';
import { fetchCadastro } from '../../lib/cadastros';

export default function ProtectedLayout() {
  const { session, isLoading } = useSession();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email) {
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    fetchCadastro(email)
      .then((cadastro) => setRole(cadastro?.role ?? null))
      .catch(() => setRole(null))
      .finally(() => setRoleLoading(false));
  }, [session?.user?.email]);

  if (isLoading || (session && roleLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  const isAdmin = role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tabs.Screen
        name="ponto"
        options={{
          title: 'Ponto',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: 'Configurações',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
