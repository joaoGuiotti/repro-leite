import {
  InseminationRepository,
  InseminationWithAnimalSummary,
} from '@/db/repositories/inseminationRepository';
import { Botao, Cartao, ModalPadrao } from '@/ui';
import { BadgeBrinco } from '@features/herd';
import { History, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface HistoricoInseminacoesRecentesProps {
  farmId: string;
  refreshTrigger?: number;
  onAtualizar?: () => void;
}

function formatarDataBR(isoDate: string): string {
  if (!isoDate) return '--/--/----';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function obterFaseZootecnica(ia: InseminationWithAnimalSummary): {
  texto: string;
  badgeClasse: string;
  textoClasse: string;
} {
  if (ia.result === 'prenhe') {
    return {
      texto: 'Gestação Confirmada',
      badgeClasse: 'bg-pasto-100/80 border-pasto-300/70',
      textoClasse: 'text-pasto-900',
    };
  }

  const hoje = new Date().toISOString().split('T')[0];

  if (ia.expectedHeatDate && hoje <= ia.expectedHeatDate) {
    return {
      texto: 'Aguardando Cio (Dia 21)',
      badgeClasse: 'bg-amber-100/80 border-amber-300/70',
      textoClasse: 'text-amber-900',
    };
  }

  if (ia.pregnancyCheckDate && hoje <= ia.pregnancyCheckDate) {
    return {
      texto: 'Aguardando Toque (Dia 45)',
      badgeClasse: 'bg-celeste-100/80 border-celeste-300/70',
      textoClasse: 'text-celeste-900',
    };
  }

  return {
    texto: 'Aguardando Diagnóstico',
    badgeClasse: 'bg-amber-100/80 border-amber-300/70',
    textoClasse: 'text-amber-900',
  };
}

export function HistoricoInseminacoesRecentes({
  farmId,
  refreshTrigger,
  onAtualizar,
}: HistoricoInseminacoesRecentesProps) {
  const [lista, setLista] = useState<InseminationWithAnimalSummary[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [iaParaExcluir, setIaParaExcluir] =
    useState<InseminationWithAnimalSummary | null>(null);
  const [devolverDose, setDevolverDose] = useState(true);
  const [excluindo, setExcluindo] = useState(false);

  const carregarHistorico = useCallback(async () => {
    try {
      setCarregando(true);
      const recentes = await InseminationRepository.listRecentByFarm(farmId, 25);
      setLista(recentes);
    } catch (err) {
      console.error('Erro ao listar histórico de IAs:', err);
    } finally {
      setCarregando(false);
    }
  }, [farmId]);

  useEffect(() => {
    let ativo = true;

    async function buscar() {
      try {
        setCarregando(true);
        const recentes = await InseminationRepository.listRecentByFarm(farmId, 25);
        if (ativo) {
          setLista(recentes);
        }
      } catch (err) {
        console.error('Erro ao listar histórico de IAs:', err);
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void buscar();

    return () => {
      ativo = false;
    };
  }, [farmId, refreshTrigger]);

  const confirmarExclusao = async () => {
    if (!iaParaExcluir) return;

    try {
      setExcluindo(true);
      await InseminationRepository.deleteInsemination(iaParaExcluir.id, {
        restoreStrawStock: devolverDose && !!iaParaExcluir.bullId,
      });

      Alert.alert(
        'Inseminação Excluída',
        'O registro foi cancelado e o status do animal foi recalculado com sucesso.'
      );
      setIaParaExcluir(null);
      void carregarHistorico();
      onAtualizar?.();
    } catch {
      Alert.alert('Erro ao Excluir', 'Não foi possível cancelar a inseminação.');
    } finally {
      setExcluindo(false);
    }
  };

  if (carregando) {
    return (
      <View className="py-6 items-center justify-center">
        <ActivityIndicator size="small" color="#1b4332" />
        <Text className="text-xs text-gray-500 mt-2 font-medium">
          Carregando histórico recente...
        </Text>
      </View>
    );
  }

  if (lista.length === 0) {
    return (
      <Cartao className="p-4 items-center justify-center bg-gray-50 my-2">
        <Text className="text-sm font-semibold text-gray-500">
          Nenhuma inseminação registrada recentemente.
        </Text>
      </Cartao>
    );
  }

  return (
    <View className="gap-2.5 my-2">
      {/* Cabeçalho da Seção */}
      <View className="flex-row items-center justify-between mb-0.5 px-1">
        <View className="flex-row items-center gap-1.5">
          <History size={16} color="#4b5563" />
          <Text className="text-xs font-black uppercase tracking-wider text-gray-700">
            Últimas Inseminações Realizadas
          </Text>
        </View>
        <Text className="text-xs font-bold text-gray-400">
          {lista.length} {lista.length === 1 ? 'registro' : 'registros'}
        </Text>
      </View>

      {lista.map((ia) => {
        const fase = obterFaseZootecnica(ia);

        return (
          <View
            key={ia.id}
            className="p-3 bg-white border border-gray-200/90 rounded-2xl shadow-xs flex-row items-center gap-3"
          >
            {/* 1. Badge do Brinco à esquerda */}
            <BadgeBrinco numero={ia.animalEarTag} tamanho="md" className="self-center" />

            {/* 2. Informações no centro */}
            <View className="flex-1 min-w-0 justify-center">
              {/* Linha 1: Nome do animal e Pílula de Fase (sem estado 'inseminada' redundante) */}
              <View className="flex-row items-center gap-2 flex-wrap">
                <Text className="text-base font-black text-gray-950" numberOfLines={1}>
                  {ia.animalName || `Animal #${ia.animalEarTag}`}
                </Text>
                <View className={`px-2 py-0.5 rounded-full border ${fase.badgeClasse}`}>
                  <Text className={`text-[11px] font-bold ${fase.textoClasse}`}>
                    {fase.texto}
                  </Text>
                </View>
              </View>

              {/* Linha 2: Touro e Data da IA */}
              <View className="flex-row items-center flex-wrap gap-x-1.5 mt-0.5">
                <Text className="text-xs text-gray-600" numberOfLines={1}>
                  Touro: <Text className="font-bold text-gray-900">{ia.bullName}</Text>
                </Text>
                <Text className="text-xs text-gray-300">·</Text>
                <Text className="text-xs text-gray-600">
                  IA em <Text className="font-bold text-gray-900">{formatarDataBR(ia.date)}</Text>
                </Text>
                {ia.inseminator ? (
                  <>
                    <Text className="text-xs text-gray-300">·</Text>
                    <Text className="text-xs text-gray-500" numberOfLines={1}>
                      {ia.inseminator}
                    </Text>
                  </>
                ) : null}
              </View>

              {/* Linha 3: Projeções Zootécnicas inline compactas */}
              <View className="flex-row items-center flex-wrap gap-x-1.5 gap-y-0.5 mt-1">
                <Text className="text-xs text-gray-500">
                  Cio 21d: <Text className="font-bold text-gray-800">{formatarDataBR(ia.expectedHeatDate)}</Text>
                </Text>
                <Text className="text-xs text-gray-300">·</Text>
                <Text className="text-xs text-gray-500">
                  Toque 45d: <Text className="font-bold text-gray-800">{formatarDataBR(ia.pregnancyCheckDate)}</Text>
                </Text>
                <Text className="text-xs text-gray-300">·</Text>
                <Text className="text-xs text-gray-500">
                  Parto: <Text className="font-bold text-gray-800">{formatarDataBR(ia.expectedCalvingDate)}</Text>
                </Text>
              </View>

              {/* Observação opcional */}
              {ia.notes ? (
                <Text className="text-xs text-gray-500 italic mt-1" numberOfLines={1}>
                  &ldquo;{ia.notes}&rdquo;
                </Text>
              ) : null}
            </View>

            {/* 3. Botão de Cancelar/Estornar Inseminação à direita */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Cancelar inseminação da vaca ${ia.animalEarTag}`}
              onPress={() => {
                setDevolverDose(!!ia.bullId);
                setIaParaExcluir(ia);
              }}
              className="h-9 w-9 items-center justify-center rounded-xl bg-gray-50 border border-gray-200 active:bg-alerta-100 self-center"
            >
              <Trash2 size={16} color="#991b1b" />
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Modal de Confirmação de Exclusão */}
      <ModalPadrao
        visivel={!!iaParaExcluir}
        onFechar={() => setIaParaExcluir(null)}
        titulo="Cancelar Inseminação"
        subtitulo={
          iaParaExcluir
            ? `Vaca Brinco ${iaParaExcluir.animalEarTag} com Touro ${iaParaExcluir.bullName}`
            : ''
        }
        larguraMaxima="max-w-md"
        rodape={
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Botao
                titulo="Voltar"
                variante="secundario"
                onPress={() => setIaParaExcluir(null)}
              />
            </View>
            <View className="flex-1">
              <Botao
                titulo={excluindo ? 'Cancelando...' : 'Excluir'}
                variante="perigo"
                principal
                desabilitado={excluindo}
                onPress={confirmarExclusao}
              />
            </View>
          </View>
        }
      >
        <View className="py-2">
          <Text className="text-sm text-gray-700 leading-5">
            Tem certeza de que deseja cancelar este registro de inseminação?
          </Text>
          <Text className="text-xs text-gray-500 mt-2 leading-4">
            • Os alertas gerados (+21d cio e +45d toque) serão cancelados.{'\n'}
            • O status reprodutivo da fêmea será recalculado automaticamente para refletir o histórico ativo remanescente.
          </Text>

          {iaParaExcluir?.bullId && (
            <Pressable
              onPress={() => setDevolverDose(!devolverDose)}
              className="mt-4 flex-row items-center gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50 active:bg-gray-100"
            >
              <View
                className={`h-5 w-5 rounded border items-center justify-center ${
                  devolverDose
                    ? 'bg-pasto-900 border-pasto-900'
                    : 'bg-white border-gray-400'
                }`}
              >
                {devolverDose && <Text className="text-white text-xs font-bold">✓</Text>}
              </View>
              <Text className="text-xs font-bold text-gray-800 flex-1">
                Devolver 1 dose de sêmen ao estoque do touro {iaParaExcluir.bullName}
              </Text>
            </Pressable>
          )}
        </View>
      </ModalPadrao>
    </View>
  );
}
