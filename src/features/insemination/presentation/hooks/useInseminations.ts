import { useCallback, useEffect, useState } from 'react';
import { InseminationWithAnimalSummary } from '../../domain/insemination.entity';
import { ListRecentInseminationsUseCase } from '../../application/list-recent-inseminations.usecase';

export function useInseminations(
  farmId: string,
  listUseCase: ListRecentInseminationsUseCase,
  limit: number = 20
) {
  const [history, setHistory] = useState<InseminationWithAnimalSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listUseCase.execute(farmId, limit);
      if (result.ok) {
        setHistory(result.value);
      } else {
        setError(result.error.message);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao buscar histórico de inseminações';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [farmId, limit, listUseCase]);

  useEffect(() => {
    let ativo = true;

    async function loadInitial() {
      try {
        const result = await listUseCase.execute(farmId, limit);
        if (ativo) {
          if (result.ok) {
            setHistory(result.value);
          } else {
            setError(result.error.message);
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (ativo) {
          const msg =
            err instanceof Error ? err.message : 'Erro ao buscar histórico de inseminações';
          setError(msg);
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      ativo = false;
    };
  }, [farmId, limit, listUseCase]);

  return {
    history,
    loading,
    error,
    refresh,
  };
}
