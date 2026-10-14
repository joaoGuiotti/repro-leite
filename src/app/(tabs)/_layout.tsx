import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Calendar, Milk, Activity, Settings } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <View className="flex-1 bg-pasto-50">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#1b4332',
          tabBarInactiveTintColor: '#64748b',
          tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
          tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 6 },
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
