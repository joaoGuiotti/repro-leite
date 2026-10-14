import { initDatabase } from '@core/db';
import { CabecalhoStatusSimulador, ManagementDateProvider } from '@core/simulation';
import { SyncStatusProvider } from '@core/sync';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

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

  return (
    <SafeAreaProvider>
      <ManagementDateProvider>
        <SyncStatusProvider>
          <SafeAreaView edges={['top']} className="flex-1 bg-white">
            <StatusBar style="dark" />
            <CabecalhoStatusSimulador />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="index" options={{ headerShown: false }} />
            </Stack>
            {!isDbReady && (
              <View className="absolute inset-0 z-50 items-center justify-center bg-pasto-50 p-6">
                <ActivityIndicator size="large" color="#1b4332" />
                <Text className="mt-4 text-base font-semibold text-pasto-900">
                  Carregando ReproLeite...
                </Text>
              </View>
            )}
          </SafeAreaView>
        </SyncStatusProvider>
      </ManagementDateProvider>
    </SafeAreaProvider>
  );
}
