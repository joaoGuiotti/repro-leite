import { useTheme } from '@/ui';
import { Tabs } from 'expo-router';
import { Activity, Calendar, Milk, Settings } from 'lucide-react-native';
import { View } from 'react-native';

export default function TabsLayout() {
  const { theme } = useTheme();
  return (
    <View className="flex-1 bg-pasto-50 dark:bg-slate-950">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
          tabBarStyle: {
            height: 80,
            paddingBottom: 8,
            paddingTop: 6,
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
          },
        }}
      >
        <Tabs.Screen
          name="hoje"
          options={{
            title: 'Hoje',
            tabBarIcon: ({ color, size }) => <Calendar color={color} size={size ?? 22} />,
          }}
        />
        <Tabs.Screen
          name="bezerras"
          options={{
            title: 'Bezerras',
            tabBarIcon: ({ color, size }) => <Milk color={color} size={size ?? 22} />,
          }}
        />
        <Tabs.Screen
          name="reproducao"
          options={{
            title: 'Reprodução',
            tabBarIcon: ({ color, size }) => <Activity color={color} size={size ?? 22} />,
          }}
        />
        <Tabs.Screen
          name="ajustes"
          options={{
            title: 'Ajustes',
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size ?? 22} />,
          }}
        />
      </Tabs>
    </View>
  );
}
