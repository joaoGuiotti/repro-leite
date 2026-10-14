import { useCallback, useEffect, useState } from 'react';
import { useManagementDate } from '@core/simulation';
import { CalfWithDetails } from '../../domain/calves.types';
import { GetCalfDetailsUseCase } from '../../application/get-calf-details.usecase';
import { getCalvesUseCases } from '../../factory';

export interface UseCalfDetailsReturn {
  calf: CalfWithDetails | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCalfDetails(
  calfId: string | null,
  customUseCase?: GetCalfDetailsUseCase
): UseCalfDetailsReturn {
  const [calf, setCalf] = useState<CalfWithDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Hook de simulação de data para recálculo reativo da idade e régua
  let activeDateString = new Date().toISOString().split('T')[0];
  try {
    const dateCtx = useManagementDate();
    activeDateString = dateCtx.activeDateString;
  } catch {
    // Contexto de simulação não presente (fallback para hoje)
  }

  const useCase = customUseCase ?? getCalvesUseCases().getCalfDetailsUseCase;

  const carregarDetalhes = useCallback(async () => {
    if (!calfId) {
      setCalf(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await useCase.execute({
        calfId,
        referenceDate: activeDateString,
      });

      if (res.ok) {
        setCalf(res.value);
      } else {
        setError(res.error.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao buscar detalhes do animal.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [calfId, activeDateString, useCase]);

  useEffect(() => {
    let ativo = true;

    async function carregarInicial() {
      if (!calfId) {
        if (ativo) {
          setCalf(null);
          setLoading(false);
          setError(null);
        }
        return;
      }

      try {
        if (ativo) setLoading(true);
        const res = await useCase.execute({
          calfId,
          referenceDate: activeDateString,
        });

        if (ativo) {
          if (res.ok) {
            setCalf(res.value);
            setError(null);
          } else {
            setError(res.error.message);
          }
        }
      } catch (err: unknown) {
        if (ativo) {
          const msg = err instanceof Error ? err.message : 'Falha ao buscar detalhes do animal.';
          setError(msg);
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarInicial();

    return () => {
      ativo = false;
    };
  }, [calfId, activeDateString, useCase]);

  return {
    calf,
    loading,
    error,
    refresh: carregarDetalhes,
  };
}
