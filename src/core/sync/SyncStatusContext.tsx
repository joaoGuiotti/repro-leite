import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SyncProtectionState, resolveProtectionStatus, getSyncStateDescription } from './sync-state';
import { syncEngine, SyncEngineStatus } from './sync-engine';
import { syncScheduler } from './scheduler';
import { networkMonitor } from '../network/network-monitor';

export interface SyncStatusContextType {
  state: SyncProtectionState;
  pendingCount: number;
  lastSyncedDescription: string;
  isSimulatedOffline: boolean;
  isOnline: boolean;
  toggleSimulatedOffline: () => void;
  triggerSyncNow: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

const SyncStatusContext = createContext<SyncStatusContextType | null>(null);

export function SyncStatusProvider({ children }: { children: ReactNode }) {
  const [engineStatus, setEngineStatus] = useState<SyncEngineStatus>(syncEngine.getStatus());
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(networkMonitor.isSimulatedOffline());

  useEffect(() => {
    // Inicializa o engine e o agendador de sincronização
    syncEngine.initialize();
    syncScheduler.start();

    // Ouve atualizações do engine
    const unsubscribeEngine = syncEngine.addListener((status) => {
      setEngineStatus(status);
    });

    // Ouve atualizações de rede
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
      await syncEngine.sync();
    } catch {
      // Estado de erro já capturado e emitido pelo syncEngine
    }
  }, []);

  const refreshPendingCount = useCallback(async () => {
    await syncEngine.refreshPendingCount();
  }, []);

  const hasError = Boolean(engineStatus.lastError);
  const state = resolveProtectionStatus(
    engineStatus.pendingCount,
    engineStatus.isSyncing,
    hasError,
    engineStatus.isOnline
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
    isOnline: engineStatus.isOnline,
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
