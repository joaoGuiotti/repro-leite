import { useState, useEffect, useCallback } from 'react';
import { UserSession } from '../../domain/account.entity';
import { getAccountUseCases } from '../../factory';
import { supabaseRemoteGateway } from '@/core/network/supabase-remote-gateway';
import { syncEngine } from '@core/sync';

export function useAccount() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de carga inicial para novos aparelhos (User Story 6)
  const [initialSyncVisible, setInitialSyncVisible] = useState(false);
  const [initialSyncProgress, setInitialSyncProgress] = useState(0);
  const [initialSyncTable, setInitialSyncTable] = useState('');
  const [initialSyncTotal, setInitialSyncTotal] = useState(0);
  const [initialSyncError, setInitialSyncError] = useState<string | null>(null);

  const useCases = getAccountUseCases();

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const current = await useCases.getSessionUseCase.execute();
      setSession(current);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [useCases]);

  useEffect(() => {
    let isMounted = true;

    useCases.getSessionUseCase
      .execute()
      .then((current) => {
        if (isMounted) {
          setSession(current);
          if (current?.farmId) {
            syncEngine.useSupabaseGateway();
            syncEngine.setFarmId(current.farmId);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setSession(null);
        }
      });

    const unsubscribe = useCases.authGateway.onAuthStateChange((newSession) => {
      if (isMounted) {
        setSession(newSession);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [useCases]);

  const performInitialSync = async (farmId: string): Promise<boolean> => {
    setInitialSyncVisible(true);
    setInitialSyncProgress(5);
    setInitialSyncError(null);

    try {
      await supabaseRemoteGateway.initialPull(farmId, (prog) => {
        setInitialSyncTable(prog.table);
        setInitialSyncProgress(prog.percentage);
        setInitialSyncTotal(prog.processedCount);
      });
      setInitialSyncProgress(100);
      setTimeout(() => {
        setInitialSyncVisible(false);
      }, 800);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na carga inicial';
      setInitialSyncError(msg);
      return false;
    }
  };

  const requestOtp = async (email: string): Promise<boolean> => {
    setError(null);
    const res = await useCases.requestOtpUseCase.execute({ email });
    if (!res.ok) {
      setError(res.error.message);
      return false;
    }
    return true;
  };

  const verifyOtp = async (email: string, token: string, localFarmId: string): Promise<boolean> => {
    setError(null);
    const res = await useCases.verifyOtpUseCase.execute({ email, token, localFarmId });
    if (!res.ok) {
      setError(res.error.message);
      return false;
    }
    setSession(res.value.session);
    syncEngine.useSupabaseGateway();
    if (res.value.assignedFarmId) {
      syncEngine.setFarmId(res.value.assignedFarmId);
    }

    // Se a fazenda já existia na nuvem em outro aparelho, aciona carga inicial com progresso
    if (!res.value.isNewFarm && res.value.assignedFarmId) {
      void performInitialSync(res.value.assignedFarmId);
    } else {
      void syncEngine.sync({ force: true });
    }

    return true;
  };

  const signOut = async (): Promise<boolean> => {
    setError(null);
    const res = await useCases.signOutUseCase.execute();
    if (res.ok) {
      setSession(null);
      return true;
    } else {
      setError(res.error.message);
      return false;
    }
  };

  return {
    session,
    isAuthenticated: Boolean(session && session.userId),
    loading,
    error,
    requestOtp,
    verifyOtp,
    signOut,
    refreshSession,
    // Carga inicial (US6)
    initialSyncVisible,
    initialSyncProgress,
    initialSyncTable,
    initialSyncTotal,
    initialSyncError,
    performInitialSync,
    dismissInitialSync: () => setInitialSyncVisible(false),
  };
}
