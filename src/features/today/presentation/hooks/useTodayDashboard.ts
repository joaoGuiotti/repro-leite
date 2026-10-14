import { useCallback, useEffect, useState } from 'react';
import { TodayDashboardData } from '../../domain/today.types';
import { GetTodayDashboardUseCase } from '../../application/get-today-dashboard.usecase';

export function useTodayDashboard(
  farmId: string,
  referenceDate: string,
  useCase: GetTodayDashboardUseCase
) {
  const [data, setData] = useState<TodayDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await useCase.execute({ farmId, referenceDate });
      if (res.ok) {
        setData(res.value);
      } else {
        setError(res.error.message);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao carregar o painel.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [farmId, referenceDate, useCase]);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const res = await useCase.execute({ farmId, referenceDate });
        if (ativo) {
          if (res.ok) {
            setData(res.value);
          } else {
            setError(res.error.message);
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (ativo) {
          const msg =
            err instanceof Error ? err.message : 'Erro ao carregar o painel.';
          setError(msg);
          setLoading(false);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [farmId, referenceDate, useCase]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}
