import '../global.css';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ManagementDateProvider } from '../context/ManagementDateContext';
import { SyncStatusProvider } from '../context/SyncStatusContext';
import { CabecalhoStatusSimulador } from '../ui/CabecalhoStatusSimulador';
import { initDatabase } from '../db/client';

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
      } catch (err: any) {
        console.error('Falha ao inicializar banco SQLite local:', err);
      } finally {
        setIsDbReady(true);
      }
    }
    setup();
  }, []);

  if (!isDbReady) {
    return (
      <View className="flex-1 items-center justify-center bg-pasto-50 p-6">
        <ActivityIndicator size="large" color="#1b4332" />
        <Text className="mt-4 text-base font-semibold text-pasto-900">
          Carregando ReproLeite...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ManagementDateProvider>
        <SyncStatusProvider>
          <SafeAreaView edges={['top']} className="flex-1 bg-white">
            <StatusBar style="dark" />
            <CabecalhoStatusSimulador />
            <Stack screenOptions={{ headerShown: false }} />
          </SafeAreaView>
        </SyncStatusProvider>
      </ManagementDateProvider>
    </SafeAreaProvider>
  );
}
