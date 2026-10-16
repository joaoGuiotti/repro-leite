import { Icon } from '@/ui';
import { BadgeBrinco } from '@features/herd';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { CalfWithDetails } from '../../domain/calves.types';
import { CalfFeedingTimelineCard } from './CalfFeedingTimelineCard';
import { CalfGenealogyCard } from './CalfGenealogyCard';
import { CalfWeightGrowthCard } from './CalfWeightGrowthCard';

export interface CalfDetailPaneProps {
  calf: CalfWithDetails;
  onAdicionarPesagem: () => void;
  onExcluirBezerra: (id: string) => Promise<void>;
}

function formatDateBr(isoDate: string): string {
  if (!isoDate) return '--/--/----';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

export function CalfDetailPane({
  calf,
  onAdicionarPesagem,
  onExcluirBezerra,
}: CalfDetailPaneProps) {
  const [excluindo, setExcluindo] = useState(false);

  const handleConfirmarExclusao = () => {
    Alert.alert(
      'Excluir Bezerra',
      `Tem certeza de que deseja excluir a bezerra de brinco ${calf.earTag}? O histórico de pesagens será desativado.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setExcluindo(true);
              await onExcluirBezerra(calf.id);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Falha ao excluir.';
              Alert.alert('Erro', msg);
            } finally {
              setExcluindo(false);
            }
          },
        },
      ]
    );
  };

  return (

    <View className="gap-4">
      {/* Cabeçalho Detalhado da Ficha */}
      <View className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 shadow-2xs">
        <View className="flex-row items-center justify-between flex-wrap gap-3">
          {/* Lado Esquerdo: Brinco Grande + Dados */}
          <View className="flex-row items-center gap-3.5 flex-1 min-w-[240px]">
            <BadgeBrinco
              numero={calf.earTag}
              tamanho="lg"
              variante="destaque"
            />

            <View className="flex-1">
              <Text
                className="text-xl font-black text-gray-950 dark:text-gray-100"
                numberOfLines={1}
              >
                {calf.name || `Bezerra #${calf.earTag}`}
              </Text>

              <View className="flex-row items-center gap-2 flex-wrap mt-1">
                <View className="px-2 py-0.5 rounded-md bg-pasto-100 dark:bg-pasto-950/60">
                  <Text className="text-xs font-bold text-pasto-900 dark:text-pasto-200">
                    {calf.feedingPlan.ageInDays} dias de vida
                  </Text>
                </View>

                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  Nasc: {formatDateBr(calf.birthDate)}
                </Text>

                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  · Peso nasc: {calf.birthWeightKg} kg
                </Text>

                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  · {calf.breed}
                </Text>
              </View>
            </View>
          </View>

          {/* Lado Direito: Ação Excluir */}
          <TouchableOpacity
            onPress={handleConfirmarExclusao}
            disabled={excluindo}
            accessibilityLabel="Excluir bezerra"
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 active:bg-red-100 dark:bg-red-950/40 dark:active:bg-red-900/60 border border-red-200 dark:border-red-800"
          >
            <Icon icon={Trash2} size="sm" className="text-red-700 dark:text-red-400" decorative />
            <Text className="text-xs font-bold text-red-700 dark:text-red-300">
              {excluindo ? 'Excluindo...' : 'Excluir Bezerra'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card 1: Linhagem e Melhoramento Genético */}
      <CalfGenealogyCard
        sireName={calf.sireName}
        damName={calf.damName}
        damEarTag={calf.damEarTag}
        maternalGranddamName={calf.maternalGranddamName}
      />

      {/* Card 2: Dieta Líquida e Régua de Desmame */}
      <CalfFeedingTimelineCard
        feedingPlan={calf.feedingPlan}
        timeline={calf.weaningTimeline}
      />

      {/* Card 3: Recria & Pesagens Mensais até a 1ª Cria */}
      <CalfWeightGrowthCard
        animalId={calf.id}
        earTag={calf.earTag}
        sex={calf.sex}
        growthMetrics={calf.growthMetrics}
        weighingsHistory={calf.weighingsHistory}
        onAdicionarPesagem={onAdicionarPesagem}
      />
    </View>
  );
}
