import { Botao, Icon } from '@/ui';
import { useRouter } from 'expo-router';
import { Plus, Scale, Sparkles, Syringe, TrendingUp } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { GrowthMetrics, WeighingRecord } from '../../domain/calves.types';

export interface CalfWeightGrowthCardProps {
  animalId: string;
  earTag: string;
  sex: 'femea' | 'macho';
  growthMetrics?: GrowthMetrics;
  weighingsHistory: WeighingRecord[];
  onAdicionarPesagem: () => void;
}

function formatDateBr(isoDate: string): string {
  if (!isoDate) return '--/--/----';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

/**
 * Card 3: Recria & Pesagens Mensais até a 1ª Cria.
 * 4 Caixas de Métricas (Peso Atual, GMD, Meta 360kg, Progresso %),
 * Tabela histórica de pesagens e botão de ação rápida para 1ª IA.
 */
export function CalfWeightGrowthCard({
  animalId,
  earTag,
  sex,
  growthMetrics,
  weighingsHistory,
  onAdicionarPesagem,
}: CalfWeightGrowthCardProps) {
  const router = useRouter();

  const currentWeight = growthMetrics?.currentWeightKg ?? 40;
  const gmd = growthMetrics?.dailyGainGramsPerDay ?? 0;
  const progressPercent = growthMetrics?.progressPercentToTarget ?? 0;
  const remainingKg = growthMetrics?.remainingKgToTarget ?? 320;
  const isReady = growthMetrics?.isReadyForBreeding && sex === 'femea';
  const isFemale = sex === 'femea';

  const handleIrParaInseminacao = () => {
    router.push(`/(tabs)/reproducao?action=inseminate&animalId=${animalId}` as any);
  };

  return (
    <View className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 shadow-2xs">
      {/* Cabeçalho do Card */}
      <View className="flex-row items-center justify-between mb-3 flex-wrap gap-2">
        <View className="flex-row items-center gap-2">
          <Icon icon={Scale} size="md" className="text-pasto-700 dark:text-pasto-400" decorative />
          <Text className="text-xs font-bold tracking-wider uppercase text-gray-700 dark:text-gray-300">
            {isFemale
              ? 'Recria & Pesagens Mensais até a 1ª Cria'
              : 'Recria & Histórico de Pesagens'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onAdicionarPesagem}
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pasto-100 active:bg-pasto-200 dark:bg-slate-800 dark:active:bg-slate-700 border border-pasto-200 dark:border-slate-700"
          accessibilityLabel="Adicionar pesagem mensal"
        >
          <Icon icon={Plus} size="sm" className="text-pasto-900 dark:text-pasto-200" decorative />
          <Text className="text-xs font-bold text-pasto-900 dark:text-pasto-200">
            Adicionar Pesagem
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4 Caixas de Métricas */}
      <View className="flex-row flex-wrap gap-2.5 mb-4">
        {/* Caixa 1: Peso Atual */}
        <View className="flex-1 min-w-[130px] rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Peso Atual
          </Text>
          <Text className="text-xl font-black text-gray-900 dark:text-gray-100">
            {currentWeight.toFixed(1)} <Text className="text-xs font-normal">kg</Text>
          </Text>
          <Text className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Nasc: {growthMetrics?.birthWeightKg ?? 40} kg
          </Text>
        </View>

        {/* Caixa 2: GMD em g/dia */}
        <View className="flex-1 min-w-[130px] rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            GMD Recente
          </Text>
          <View className="flex-row items-center gap-1">
            <Icon icon={TrendingUp} size="sm" className="text-emerald-600 dark:text-emerald-400" decorative />
            <Text className="text-xl font-black text-emerald-700 dark:text-emerald-400">
              {gmd > 0 ? `+${gmd}` : `${gmd}`}
            </Text>
            <Text className="text-xs font-normal text-gray-500">g/dia</Text>
          </View>
          <Text className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {weighingsHistory.length > 0 ? 'Último período' : 'Aguardando 2ª pesagem'}
          </Text>
        </View>

        {/* Caixa 3: Meta 1ª IA (ou Peso Desejado) */}
        {isFemale ? (
          <View className="flex-1 min-w-[130px] rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Meta 1ª IA
            </Text>
            <Text className="text-xl font-black text-blue-700 dark:text-blue-400">
              360.0 <Text className="text-xs font-normal">kg</Text>
            </Text>
            <Text className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-1">
              {remainingKg <= 0 ? 'Meta atingida!' : `Faltam ${remainingKg.toFixed(1)} kg`}
            </Text>
          </View>
        ) : (
          <View className="flex-1 min-w-[130px] rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Ganho Total
            </Text>
            <Text className="text-xl font-black text-blue-700 dark:text-blue-400">
              +{(growthMetrics?.totalWeightGainKg ?? 0).toFixed(1)}{' '}
              <Text className="text-xs font-normal">kg</Text>
            </Text>
            <Text className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Desde o nascimento
            </Text>
          </View>
        )}

        {/* Caixa 4: Progresso % */}
        {isFemale && (
          <View className="flex-1 min-w-[130px] rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Progresso 1ª IA
            </Text>
            <Text className="text-xl font-black text-pasto-900 dark:text-pasto-100">
              {progressPercent.toFixed(1)}%
            </Text>
            {/* Barra de Progresso */}
            <View className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 mt-2 overflow-hidden">
              <View
                className="h-full bg-pasto-600 dark:bg-pasto-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
              />
            </View>
          </View>
        )}
      </View>

      {/* Banner de Apta para 1ª IA com Ação Rápida de 56px */}
      {isReady && (
        <View className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500 dark:border-emerald-600 p-4 mb-4 gap-3">
          <View className="flex-row items-center gap-2">
            <Icon icon={Sparkles} size="md" className="text-emerald-700 dark:text-emerald-400" decorative />
            <Text className="text-sm font-black text-emerald-900 dark:text-emerald-100">
              🎉 Apta para 1ª Inseminação! ({currentWeight.toFixed(1)} kg ≥ 360 kg)
            </Text>
          </View>
          <Text className="text-xs text-emerald-800 dark:text-emerald-300">
            Esta novilha atingiu o peso corporal ideal para reprodução sem risco de distocia.
          </Text>

          <Botao
            titulo="Lançar 1ª Inseminação"
            principal
            variante="sucesso"
            icone={<Icon icon={Syringe} size="md" className="text-white" decorative />}
            onPress={handleIrParaInseminacao}
          />
        </View>
      )}

      {/* Tabela de Histórico de Pesagens */}
      <View className="rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        <View className="flex-row bg-gray-50 dark:bg-slate-800/90 py-2.5 px-3 border-b border-gray-200 dark:border-slate-800">
          <Text className="w-24 text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">
            Data
          </Text>
          <Text className="w-24 text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">
            Peso
          </Text>
          <Text className="flex-1 text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">
            Anotações
          </Text>
        </View>

        {weighingsHistory.length === 0 ? (
          <View className="py-6 px-4 items-center justify-center">
            <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Nenhuma pesagem mensal registrada ainda. O peso atual reflete o nascimento ({growthMetrics?.birthWeightKg ?? 40} kg).
            </Text>
          </View>
        ) : (
          weighingsHistory.map((item, idx) => (
            <View
              key={item.id}
              className={`flex-row items-center py-2.5 px-3 ${idx !== weighingsHistory.length - 1
                ? 'border-b border-gray-100 dark:border-slate-800/60'
                : ''
                }`}
            >
              <Text className="w-24 text-xs font-semibold text-gray-900 dark:text-gray-100">
                {formatDateBr(item.date)}
              </Text>
              <Text className="w-24 text-xs font-black text-pasto-900 dark:text-pasto-200">
                {item.weightKg.toFixed(1)} kg
              </Text>
              <Text
                className="flex-1 text-xs text-gray-600 dark:text-gray-400"
                numberOfLines={1}
              >
                {item.notes || '—'}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
