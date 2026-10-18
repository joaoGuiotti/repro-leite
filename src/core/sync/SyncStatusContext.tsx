import { useNetInfo } from '@react-native-community/netinfo';
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { networkMonitor } from '../network/network-monitor';
import { getSupabaseClient, isSupabaseConfigured } from '../network/supabase-client';
import { supabaseRemoteGateway } from '../network/supabase-remote-gateway';
import { OutboxRepository } from './outbox.repository';
import { syncScheduler } from './scheduler';
import { SyncEngineStatus, syncEngine } from './sync-engine';
import { SyncProtectionState, getSyncStateDescription, resolveProtectionStatus } from './sync-state';

export interface SyncStatusContextType {
  state: SyncProtectionState;
  pendingCount: number;
  pendingRecordIds: string[];
  isRecordPending: (recordId: string) => boolean;
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
    if (netInfo && netInfo.isConnected !== null) {
      networkMonitor.updateNetworkState({
        isConnected: netInfo.isConnected,
        isInternetReachable: netInfo.isInternetReachable,
        type: netInfo.type,
      });
    }
  }, [netInfo]);

  useEffect(() => {
    // Inicializa o engine para carregar a contagem de pendências da outbox local
    void syncEngine.initialize();

    // Ouve atualizações do engine
    const unsubscribeEngine = syncEngine.addListener((status) => {
      setEngineStatus({ ...status });
    });

    // Ouve atualizações manuais no monitor de rede
    const unsubscribeNetwork = networkMonitor.addListener(() => {
      setIsSimulatedOffline(networkMonitor.isSimulatedOffline());
      setEngineStatus({ ...syncEngine.getStatus() });
    });

    return () => {
      unsubscribeEngine();
      unsubscribeNetwork();
    };
  }, []);

  // Ativa o agendador automático e o debounce pós-escrita apenas quando autenticado na nuvem
  useEffect(() => {
    if (!userEmail) {
      syncScheduler.stop();
      return;
    }

    syncScheduler.start();
    const unsubscribeOutbox = OutboxRepository.addChangeListener(({ isEnqueue }) => {
      if (isEnqueue && networkMonitor.isOnline()) {
        syncScheduler.triggerPostWriteSync();
      }
    });

    return () => {
      unsubscribeOutbox();
      syncScheduler.stop();
    };
  }, [userEmail]);

  const toggleSimulatedOffline = useCallback(() => {
    const nextState = !networkMonitor.isSimulatedOffline();
    networkMonitor.simulateOffline(nextState);
    setIsSimulatedOffline(nextState);
    setEngineStatus({ ...syncEngine.getStatus() });
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

  const pendingSet = useMemo(
    () => new Set(engineStatus.pendingRecordIds ?? []),
    [engineStatus.pendingRecordIds]
  );

  const isRecordPending = useCallback(
    (recordId: string) => pendingSet.has(recordId),
    [pendingSet]
  );

  // Conectividade física em tempo real (assume true durante estado transitório inicial se isConnected for null)
  const isPhysicalOnline =
    netInfo.isConnected === null
      ? networkMonitor.isConnected() !== false
      : Boolean(netInfo.isConnected && netInfo.isInternetReachable !== false);
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
    pendingRecordIds: engineStatus.pendingRecordIds ?? [],
    isRecordPending,
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
    const status = syncEngine.getStatus();
    const pendingSet = new Set(status.pendingRecordIds ?? []);
    const state = resolveProtectionStatus(
      status.pendingCount,
      status.isSyncing,
      Boolean(status.lastError),
      status.isOnline
    );
    return {
      state,
      pendingCount: status.pendingCount,
      pendingRecordIds: status.pendingRecordIds ?? [],
      isRecordPending: (recordId: string) => pendingSet.has(recordId),
      lastSyncedDescription: getSyncStateDescription(state, status.pendingCount),
      isSimulatedOffline: networkMonitor.isSimulatedOffline(),
      isOnline: status.isOnline,
      isEffectiveOnline: status.isOnline,
      networkType: 'unknown',
      isInternetReachable: status.isOnline,
      clockDriftExceeded: false,
      lastError: status.lastError,
      userEmail: null,
      toggleSimulatedOffline: () => {},
      triggerSyncNow: async () => {},
      refreshPendingCount: async () => {
        await syncEngine.refreshPendingCount();
      },
    };
  }
  return context;
}


