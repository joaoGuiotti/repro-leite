import React from 'react';
import { Text, View } from 'react-native';
import { Milk, CheckCircle2, Clock } from 'lucide-react-native';
import { Icon } from '@/ui';
import { CalfFeedingPlan, WeaningMilestone } from '../../domain/calves.types';

export interface CalfFeedingTimelineCardProps {
  feedingPlan: CalfFeedingPlan;
  timeline: WeaningMilestone[];
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
 * Card 2: Dieta Líquida e Régua de Desmame.
 * Fiel ao protótipo visual, com banner de destaque de consumo diário
 * e tabela detalhada de degraus de corte com datas civis exatas.
 */
export function CalfFeedingTimelineCard({
  feedingPlan,
  timeline,
}: CalfFeedingTimelineCardProps) {
  return (
    <View className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 shadow-2xs">
      {/* Cabeçalho do Card */}
      <View className="flex-row items-center gap-2 mb-3">
        <Icon icon={Milk} size="md" className="text-pasto-700 dark:text-pasto-400" decorative />
        <Text className="text-xs font-bold tracking-wider uppercase text-gray-700 dark:text-gray-300">
          Dieta Líquida e Régua de Desmame
        </Text>
      </View>

      {/* Banner de Destaque - Quanto mama hoje */}
      <View className="rounded-2xl bg-pasto-50 dark:bg-pasto-950/50 border-2 border-pasto-500 dark:border-pasto-600 p-4 mb-4">
        <View className="flex-row items-center justify-between mb-1.5 flex-wrap gap-2">
          <Text className="text-xs font-black tracking-wider uppercase text-pasto-800 dark:text-pasto-300">
            QUANTO ESTA BEZERRA MAMA HOJE
          </Text>
          <View className="px-2.5 py-1 rounded-full bg-pasto-600 dark:bg-pasto-500">
            <Text className="text-[11px] font-bold text-white uppercase">
              {feedingPlan.phaseName}
            </Text>
          </View>
        </View>

        <Text className="text-xl sm:text-2xl font-black text-pasto-900 dark:text-pasto-100 my-1">
          {feedingPlan.totalDailyLiters > 0
            ? `${feedingPlan.morningLiters}L Cedo + ${feedingPlan.afternoonLiters}L Tarde = Total ${feedingPlan.totalDailyLiters} Litros/dia`
            : 'Desmamada — Dieta 100% de Sólidos (Feno + Ração)'}
        </Text>

        <Text className="text-xs font-semibold text-pasto-700 dark:text-pasto-400 mt-1">
          Idade atual: {feedingPlan.ageInDays} dias ({feedingPlan.ageInMonths} meses)
          {feedingPlan.daysUntilNextChange > 0
            ? ` · Próximo corte de leite em ${feedingPlan.daysUntilNextChange} dias`
            : ' · Fase de aleitamento concluída com sucesso'}
        </Text>
      </View>

      {/* Tabela Cronológica de Desmame */}
      <View className="rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        {/* Cabeçalho da Tabela */}
        <View className="flex-row bg-gray-50 dark:bg-slate-800/90 py-2.5 px-3 border-b border-gray-200 dark:border-slate-800">
          <Text className="w-20 text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">
            Dia / Idade
          </Text>
          <Text className="w-28 text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">
            Data Prevista
          </Text>
          <Text className="flex-1 text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">
            Volume & Degrau
          </Text>
          <Text className="w-20 text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 text-right">
            Status
          </Text>
        </View>

        {/* Linhas de Marcos de Desmame */}
        {timeline.map((item, idx) => {
          const isLast = idx === timeline.length - 1;
          const isCurrent = item.isCurrent;
          const isPast = item.isPast;

          return (
            <View
              key={item.dayNumber}
              className={`flex-row items-center py-2.5 px-3 ${
                !isLast ? 'border-b border-gray-100 dark:border-slate-800/60' : ''
              } ${
                isCurrent
                  ? 'bg-pasto-50/80 dark:bg-pasto-950/40 border-l-4 border-l-pasto-600'
                  : ''
              }`}
            >
              {/* Idade */}
              <View className="w-20">
                <Text
                  className={`text-xs font-bold ${
                    isCurrent
                      ? 'text-pasto-900 dark:text-pasto-200 font-black'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  Dia {item.dayNumber}
                </Text>
              </View>

              {/* Data Prevista */}
              <View className="w-28">
                <Text
                  className={`text-xs ${
                    isCurrent
                      ? 'text-pasto-800 dark:text-pasto-300 font-bold'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {formatDateBr(item.date)}
                </Text>
              </View>

              {/* Título & Volume */}
              <View className="flex-1 pr-2">
                <Text
                  className={`text-xs font-bold ${
                    isCurrent
                      ? 'text-pasto-900 dark:text-pasto-100'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  className="text-[11px] text-gray-500 dark:text-gray-400"
                  numberOfLines={1}
                >
                  {item.litersDescription}
                </Text>
              </View>

              {/* Indicador de Status */}
              <View className="w-20 items-end">
                {isCurrent ? (
                  <View className="flex-row items-center gap-1 bg-pasto-100 dark:bg-pasto-900/60 px-2 py-0.5 rounded-full">
                    <Icon icon={Clock} size="sm" className="text-pasto-700 dark:text-pasto-300" decorative />
                    <Text className="text-[10px] font-bold text-pasto-800 dark:text-pasto-200">
                      Atual
                    </Text>
                  </View>
                ) : isPast ? (
                  <View className="flex-row items-center gap-1">
                    <Icon icon={CheckCircle2} size="sm" className="text-emerald-600 dark:text-emerald-400" decorative />
                    <Text className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                      Passou
                    </Text>
                  </View>
                ) : (
                  <Text className="text-[10px] text-gray-400 dark:text-gray-500">
                    Previsto
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
