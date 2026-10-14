import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimalFilterOptions, AnimalRecord } from '../../domain/animal.entity';
import { ListAnimalsUseCase } from '../../application/list-animals.usecase';

export function useAnimals(
  farmId: string,
  listUseCase: ListAnimalsUseCase,
  options?: AnimalFilterOptions
) {
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [allAnimals, setAllAnimals] = useState<AnimalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const query = options?.query;
  const reproStatus = options?.reproStatus;
  const showInactive = options?.showInactive;

  const filterOptions = useMemo(
    () => ({ query, reproStatus, showInactive }),
    [query, reproStatus, showInactive]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allResult, filteredResult] = await Promise.all([
        listUseCase.execute(farmId, { showInactive: true }),
        listUseCase.execute(farmId, filterOptions),
      ]);
      if (allResult.ok) {
        setAllAnimals(allResult.value);
      }
      if (filteredResult.ok) {
        setAnimals(filteredResult.value);
      } else {
        setError(filteredResult.error.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao buscar animais';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [farmId, filterOptions, listUseCase]);

  useEffect(() => {
    let ativo = true;

    async function loadInitial() {
      try {
        const [allResult, filteredResult] = await Promise.all([
          listUseCase.execute(farmId, { showInactive: true }),
          listUseCase.execute(farmId, filterOptions),
        ]);
        if (ativo) {
          if (allResult.ok) setAllAnimals(allResult.value);
          if (filteredResult.ok) {
            setAnimals(filteredResult.value);
          } else {
            setError(filteredResult.error.message);
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (ativo) {
          const msg = err instanceof Error ? err.message : 'Erro ao buscar animais';
          setError(msg);
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      ativo = false;
    };
  }, [farmId, filterOptions, listUseCase]);

  const summary = useMemo(() => {
    const ativos = allAnimals.filter((a) => a.exitStatus === 'ativo');
    return {
      total: ativos.length,
      vazias: ativos.filter((a) => a.sex === 'femea' && a.reproStatus === 'vazia').length,
      inseminadas: ativos.filter((a) => a.sex === 'femea' && a.reproStatus === 'inseminada').length,
      prenhes: ativos.filter((a) => a.sex === 'femea' && a.reproStatus === 'prenhe').length,
      secas: ativos.filter((a) => a.sex === 'femea' && a.reproStatus === 'seca').length,
    };
  }, [allAnimals]);

  return {
    animals,
    allAnimals,
    summary,
    loading,
    error,
    refresh,
  };
}
