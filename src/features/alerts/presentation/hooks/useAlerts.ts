import { useCallback, useEffect, useState } from 'react';
import { AlertWithAnimalSummary } from '../../domain/alert.entity';
import { ListPendingAlertsUseCase } from '../../application/list-pending-alerts.usecase';

export function useAlerts(
  farmId: string,
  listUseCase: ListPendingAlertsUseCase,
  upToDate?: string
) {
  const [alerts, setAlerts] = useState<AlertWithAnimalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listUseCase.execute(farmId, upToDate);
      if (res.ok) {
        setAlerts(res.value);
      } else {
        setError(res.error.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao listar alertas';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [farmId, listUseCase, upToDate]);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const res = await listUseCase.execute(farmId, upToDate);
        if (ativo) {
          if (res.ok) {
            setAlerts(res.value);
          } else {
            setError(res.error.message);
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (ativo) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar alertas';
          setError(msg);
          setLoading(false);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [farmId, listUseCase, upToDate]);

  return {
    alerts,
    loading,
    error,
    refresh,
  };
}
