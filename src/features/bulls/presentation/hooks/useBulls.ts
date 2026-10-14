import { useCallback, useEffect, useState } from 'react';
import { BullRecord } from '../../domain/bull.entity';
import { ListBullsUseCase } from '../../application/list-bulls.usecase';

export function useBulls(farmId: string, listUseCase: ListBullsUseCase) {
  const [bulls, setBulls] = useState<BullRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listUseCase.execute(farmId);
      if (result.ok) {
        setBulls(result.value);
      } else {
        setError(result.error.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar catálogo de touros';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [farmId, listUseCase]);

  useEffect(() => {
    let ativo = true;

    async function loadInitial() {
      try {
        const result = await listUseCase.execute(farmId);
        if (ativo) {
          if (result.ok) {
            setBulls(result.value);
          } else {
            setError(result.error.message);
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (ativo) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar catálogo de touros';
          setError(msg);
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      ativo = false;
    };
  }, [farmId, listUseCase]);

  return {
    bulls,
    loading,
    error,
    refresh,
  };
}
