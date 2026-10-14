import { IndicadorSync } from '@/components/ui';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

export default function TabsLayout() {
  return (
    <View className="flex-1 bg-pasto-50">
      {/* TODO Sprint 2: ligar ao estado real do sync */}
      <IndicadorSync status="pendente" mensagem="Sync ainda não configurado" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: '#1b4332' },
          headerTintColor: '#ffffff',
          tabBarActiveTintColor: '#1b4332',
          tabBarLabelStyle: { fontSize: 14, fontWeight: '700' },
          tabBarStyle: { height: 64, paddingBottom: 8 },
        }}
      >
        <Tabs.Screen name="hoje" options={{ title: 'Hoje' }} />
        <Tabs.Screen name="bezerras" options={{ title: 'Bezerras' }} />
        <Tabs.Screen name="reproducao" options={{ title: 'Reprodução' }} />
        <Tabs.Screen name="ajustes" options={{ title: 'Ajustes' }} />
      </Tabs>
    </View>
  );
}
