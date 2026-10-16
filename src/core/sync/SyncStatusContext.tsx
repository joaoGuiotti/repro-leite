import { useNetInfo } from '@react-native-community/netinfo';
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { networkMonitor } from '../network/network-monitor';
import { getSupabaseClient, isSupabaseConfigured } from '../network/supabase-client';
import { supabaseRemoteGateway } from '../network/supabase-remote-gateway';
import { syncScheduler } from './scheduler';
import { SyncEngineStatus, syncEngine } from './sync-engine';
import { SyncProtectionState, getSyncStateDescription, resolveProtectionStatus } from './sync-state';

export interface SyncStatusContextType {
  state: SyncProtectionState;
  pendingCount: number;
  lastSyncedDescription: string;
  isSimulatedOffline: boolean;
  isOnline: boolean;
  isEffectiveOnline: boolean;
  networkType: string;
  isInternetReachable: boolean | null;
  clockDriftExceeded: boolean;
  lastError: string | null;
  userEmail: string | null;
  toggleSimulatedOffline: () => void;
  triggerSyncNow: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

const SyncStatusContext = createContext<SyncStatusContextType | null>(null);

export function SyncStatusProvider({ children }: { children: ReactNode }) {
  const netInfo = useNetInfo();
  const [engineStatus, setEngineStatus] = useState<SyncEngineStatus>(syncEngine.getStatus());
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(networkMonitor.isSimulatedOffline());
  const [clockDriftExceeded, setClockDriftExceeded] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase.auth.getSession().then(({ data }) => {
        setUserEmail(data.session?.user?.email || null);
      });

      const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserEmail(session?.user?.email || null);
      });

      return () => {
        authSub.subscription.unsubscribe();
      };
    }
  }, []);

  // Sincroniza em tempo real as alterações detectadas pelo hook nativo useNetInfo com o NetworkMonitor global
  useEffect(() => {
    if (netInfo) {
      networkMonitor.updateNetworkState({
        isConnected: netInfo.isConnected,
        isInternetReachable: netInfo.isInternetReachable,
        type: netInfo.type,
      });
    }
  }, [netInfo]);

  useEffect(() => {
    // Inicializa o engine e o agendador de sincronização
    syncEngine.initialize();
    syncScheduler.start();

    // Ouve atualizações do engine
    const unsubscribeEngine = syncEngine.addListener((status) => {
      setEngineStatus(status);
    });

    // Ouve atualizações manuais no monitor de rede
    const unsubscribeNetwork = networkMonitor.addListener(() => {
      setIsSimulatedOffline(networkMonitor.isSimulatedOffline());
      setEngineStatus(syncEngine.getStatus());
    });

    return () => {
      unsubscribeEngine();
      unsubscribeNetwork();
      syncScheduler.stop();
    };
  }, []);

  const toggleSimulatedOffline = useCallback(() => {
    const nextState = !networkMonitor.isSimulatedOffline();
    networkMonitor.simulateOffline(nextState);
    setIsSimulatedOffline(nextState);
    setEngineStatus(syncEngine.getStatus());
  }, []);

  const triggerSyncNow = useCallback(async () => {
    if (networkMonitor.isSimulatedOffline()) {
      return;
    }
    try {
      const drift = await supabaseRemoteGateway.checkServerTimeDrift();
      setClockDriftExceeded(drift.isClockDriftExceeded);
      await syncEngine.sync({ force: true });
    } catch (e) {
      console.error('[triggerSyncNow Error]:', e);
    }
  }, []);

  const refreshPendingCount = useCallback(async () => {
    await syncEngine.refreshPendingCount();
  }, []);

  // Conectividade física em tempo real
  const isPhysicalOnline = Boolean(
    netInfo.isConnected && netInfo.isInternetReachable !== false
  );
  const isEffectiveOnline = isPhysicalOnline && !isSimulatedOffline;

  const hasError = Boolean(engineStatus.lastError);
  const state = resolveProtectionStatus(
    engineStatus.pendingCount,
    engineStatus.isSyncing,
    hasError,
    isEffectiveOnline
  );

  const value: SyncStatusContextType = {
    state,
    pendingCount: engineStatus.pendingCount,
    lastSyncedDescription: getSyncStateDescription(
      state,
      engineStatus.pendingCount,
      engineStatus.lastSuccessAt
        ? new Date(engineStatus.lastSuccessAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : undefined
    ),
    isSimulatedOffline,
    isOnline: isPhysicalOnline,
    isEffectiveOnline,
    networkType: netInfo.type || 'unknown',
    isInternetReachable: netInfo.isInternetReachable,
    clockDriftExceeded,
    lastError: engineStatus.lastError,
    userEmail,
    toggleSimulatedOffline,
    triggerSyncNow,
    refreshPendingCount,
  };

  return (
    <SyncStatusContext.Provider value={value}>
      {children}
    </SyncStatusContext.Provider>
  );
}

export function useSyncStatus(): SyncStatusContextType {
  const context = useContext(SyncStatusContext);
  if (!context) {
    throw new Error('useSyncStatus must be used within a SyncStatusProvider');
  }
  return context;
}
