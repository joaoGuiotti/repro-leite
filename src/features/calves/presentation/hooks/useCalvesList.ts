import { useCallback, useEffect, useMemo, useState } from 'react';
import { useManagementDate } from '@core/simulation';
import { DEFAULT_FARM_ID } from '@core/db';
import {
  CalfListItem,
  CalfWithDetails,
  BullOption,
  CowOption,
} from '../../domain/calves.types';
import { RegisterCalfInput } from '../../application/register-calf.usecase';
import { CalvesUseCases, getCalvesUseCases } from '../../factory';

export interface UseCalvesListParams {
  farmId?: string;
  useCases?: CalvesUseCases;
}

export interface UseCalvesListReturn {
  calves: CalfListItem[];
  activeCalf: CalfWithDetails | null;
  activeCalfId: string | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  sexFilter: 'todos' | 'femeas' | 'machos';
  totalCalvesCount: number;
  totalHeifersCount: number;
  totalLitersToday: number;
  brincosExistentes: string[];
  tourosDisponiveis: BullOption[];
  vacasDisponiveis: CowOption[];
  setSearchQuery: (q: string) => void;
  setSexFilter: (f: 'todos' | 'femeas' | 'machos') => void;
  setActiveCalfId: (id: string | null) => void;
  refresh: () => Promise<void>;
  cadastrarBezerra: (dados: RegisterCalfInput) => Promise<void>;
  registrarPesagem: (dados: { weightKg: number; date: string; notes?: string }) => Promise<void>;
  excluirBezerra: (id: string) => Promise<void>;
}

export function useCalvesList({
  farmId = DEFAULT_FARM_ID,
  useCases: customUseCases,
}: UseCalvesListParams = {}): UseCalvesListReturn {
  const [calves, setCalves] = useState<CalfListItem[]>([]);
  const [activeCalfId, setActiveCalfId] = useState<string | null>(null);
  const [activeCalf, setActiveCalf] = useState<CalfWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sexFilter, setSexFilter] = useState<'todos' | 'femeas' | 'machos'>('todos');

  const [totalCalvesCount, setTotalCalvesCount] = useState(0);
  const [totalHeifersCount, setTotalHeifersCount] = useState(0);
  const [totalLitersToday, setTotalLitersToday] = useState(0);

  const [tourosDisponiveis, setTourosDisponiveis] = useState<BullOption[]>([]);
  const [vacasDisponiveis, setVacasDisponiveis] = useState<CowOption[]>([]);

  // Simulação de data
  let activeDateString = new Date().toISOString().split('T')[0];
  try {
    const dateCtx = useManagementDate();
    activeDateString = dateCtx.activeDateString;
  } catch {
    // fallback
  }

  const useCases = useMemo(() => customUseCases ?? getCalvesUseCases(), [customUseCases]);

  const {
    listCalvesUseCase,
    getCalfDetailsUseCase,
    registerCalfUseCase,
    recordWeighingUseCase,
    deleteCalfUseCase,
    getBreedingOptionsUseCase,
  } = useCases;

  // Carrega lista principal de bezerras (imperativo para refresh manual)
  const carregarLista = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await listCalvesUseCase.execute({
        farmId,
        referenceDate: activeDateString,
        sexFilter,
        searchQuery,
      });

      if (res.ok) {
        setCalves(res.value.items);
        setTotalCalvesCount(res.value.totalCalvesCount);
        setTotalHeifersCount(res.value.totalHeifersCount);
        setTotalLitersToday(res.value.totalLitersToday);

        setActiveCalfId((prev) => {
          if (prev && res.value.items.some((c) => c.id === prev)) {
            return prev;
          }
          return res.value.items.length > 0 ? res.value.items[0].id : null;
        });
      } else {
        setError(res.error.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao buscar bezerras.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [farmId, activeDateString, sexFilter, searchQuery, listCalvesUseCase]);

  // Carrega detalhes do animal ativo (imperativo)
  const carregarDetalhesAtivo = useCallback(async () => {
    if (!activeCalfId) {
      setActiveCalf(null);
      return;
    }

    try {
      const res = await getCalfDetailsUseCase.execute({
        calfId: activeCalfId,
        referenceDate: activeDateString,
      });

      if (res.ok) {
        setActiveCalf(res.value);
      } else {
        setActiveCalf(null);
      }
    } catch {
      setActiveCalf(null);
    }
  }, [activeCalfId, activeDateString, getCalfDetailsUseCase]);

  // Efeito para carregar catálogo de opções para paternidade/maternidade
  useEffect(() => {
    let ativo = true;

    async function buscarOpcoes() {
      try {
        const res = await getBreedingOptionsUseCase.execute(farmId);
        if (ativo && res.ok) {
          setTourosDisponiveis(res.value.bulls);
          setVacasDisponiveis(res.value.cows);
        }
      } catch {
        // silencioso
      }
    }

    buscarOpcoes();

    return () => {
      ativo = false;
    };
  }, [farmId, getBreedingOptionsUseCase]);

  // Efeito reativo para carregar a lista de bezerras
  useEffect(() => {
    let ativo = true;

    async function buscarLista() {
      try {
        if (ativo) setLoading(true);
        const res = await listCalvesUseCase.execute({
          farmId,
          referenceDate: activeDateString,
          sexFilter,
          searchQuery,
        });

        if (ativo) {
          if (res.ok) {
            setCalves(res.value.items);
            setTotalCalvesCount(res.value.totalCalvesCount);
            setTotalHeifersCount(res.value.totalHeifersCount);
            setTotalLitersToday(res.value.totalLitersToday);

            setActiveCalfId((prev) => {
              if (prev && res.value.items.some((c) => c.id === prev)) {
                return prev;
              }
              return res.value.items.length > 0 ? res.value.items[0].id : null;
            });
            setError(null);
          } else {
            setError(res.error.message);
          }
        }
      } catch (err: unknown) {
        if (ativo) {
          const msg = err instanceof Error ? err.message : 'Falha ao buscar bezerras.';
          setError(msg);
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }

    buscarLista();

    return () => {
      ativo = false;
    };
  }, [farmId, activeDateString, sexFilter, searchQuery, listCalvesUseCase]);

  // Efeito reativo para carregar detalhes do animal ativo
  useEffect(() => {
    let ativo = true;

    async function buscarDetalhes() {
      if (!activeCalfId) {
        if (ativo) setActiveCalf(null);
        return;
      }

      try {
        const res = await getCalfDetailsUseCase.execute({
          calfId: activeCalfId,
          referenceDate: activeDateString,
        });

        if (ativo) {
          if (res.ok) {
            setActiveCalf(res.value);
          } else {
            setActiveCalf(null);
          }
        }
      } catch {
        if (ativo) setActiveCalf(null);
      }
    }

    buscarDetalhes();

    return () => {
      ativo = false;
    };
  }, [activeCalfId, activeDateString, getCalfDetailsUseCase]);

  // Lista de brincos existentes para validação de unicidade
  const brincosExistentes = useMemo(() => {
    return calves.map((c) => c.earTag);
  }, [calves]);

  // Cadastrar Bezerra
  const cadastrarBezerra = useCallback(
    async (dados: RegisterCalfInput) => {
      const res = await registerCalfUseCase.execute(dados);
      if (!res.ok) {
        throw new Error(res.error.message);
      }
      setActiveCalfId(res.value.id);
      await carregarLista();
    },
    [registerCalfUseCase, carregarLista]
  );

  // Registrar Pesagem Mensal
  const registrarPesagem = useCallback(
    async (dados: { weightKg: number; date: string; notes?: string }) => {
      if (!activeCalfId) throw new Error('Nenhum animal selecionado.');

      const res = await recordWeighingUseCase.execute({
        farmId,
        animalId: activeCalfId,
        weightKg: dados.weightKg,
        date: dados.date,
        notes: dados.notes,
      });

      if (!res.ok) {
        throw new Error(res.error.message);
      }

      await Promise.all([carregarLista(), carregarDetalhesAtivo()]);
    },
    [activeCalfId, farmId, recordWeighingUseCase, carregarLista, carregarDetalhesAtivo]
  );

  // Excluir Bezerra
  const excluirBezerra = useCallback(
    async (id: string) => {
      const res = await deleteCalfUseCase.execute({
        farmId,
        calfId: id,
      });

      if (!res.ok) {
        throw new Error(res.error.message);
      }

      await carregarLista();
    },
    [deleteCalfUseCase, farmId, carregarLista]
  );

  return {
    calves,
    activeCalf,
    activeCalfId,
    loading,
    error,
    searchQuery,
    sexFilter,
    totalCalvesCount,
    totalHeifersCount,
    totalLitersToday,
    brincosExistentes,
    tourosDisponiveis,
    vacasDisponiveis,
    setSearchQuery,
    setSexFilter,
    setActiveCalfId,
    refresh: carregarLista,
    cadastrarBezerra,
    registrarPesagem,
    excluirBezerra,
  };
}
