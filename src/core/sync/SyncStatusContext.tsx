import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SyncProtectionState, resolveProtectionStatus, getSyncStateDescription } from './sync-state';
import { OutboxRepository as SyncQueueRepository } from './outbox.repository';
import { DEFAULT_FARM_ID } from '@/db/client';

export interface SyncStatusContextType {
  state: SyncProtectionState;
  pendingCount: number;
  lastSyncedDescription: string;
  isSimulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  triggerSyncNow: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

const SyncStatusContext = createContext<SyncStatusContextType | null>(null);

export function SyncStatusProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [lastSuccessTime, setLastSuccessTime] = useState<string>('Sincronizado agora');

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await SyncQueueRepository.getPendingCount(DEFAULT_FARM_ID);
      setPendingCount(count);
    } catch {
      // Ignora erro se DB não estiver inicializado
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshPendingCount();
    }, 0);
    const interval = setInterval(() => {
      refreshPendingCount();
    }, 4000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [refreshPendingCount]);

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => !prev);
  };

  const triggerSyncNow = async () => {
    if (isSimulatedOffline) {
      return;
    }
    setIsSyncing(true);
    setHasError(false);
    try {
      // Simulação / chamada inicial de envio do lote
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setLastSuccessTime('Sincronizado agora');
      await refreshPendingCount();
    } catch {
      setHasError(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const state = resolveProtectionStatus(pendingCount, isSyncing, hasError);

  const value: SyncStatusContextType = {
    state,
    pendingCount,
    lastSyncedDescription: getSyncStateDescription(state, pendingCount, lastSuccessTime),
    isSimulatedOffline,
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
