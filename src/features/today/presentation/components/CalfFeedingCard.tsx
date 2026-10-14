import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native';
import { Cartao, Icon, SeloStatus } from '@/ui';
import { BadgeBrinco } from '@features/herd';
import { CalfFeedingSummary } from '../../domain/today.types';

export interface CalfFeedingCardProps {
  summary: CalfFeedingSummary;
  loading?: boolean;
}

export function CalfFeedingCard({
  summary,
  loading = false,
}: CalfFeedingCardProps) {
  const [expandido, setExpandido] = useState(false);

  return (
    <Cartao titulo="Trato do Bezerreiro">
      <View className="gap-3.5">
        {/* Indicador Numérico Principal (Manhã e Tarde) */}
        <View className="flex-row gap-3">
          {/* Manhã */}
          <View className="flex-1 rounded-2xl bg-pasto-50/80 dark:bg-pasto-950/40 border border-pasto-200 dark:border-pasto-800 p-3.5 items-center justify-center">
            <Text className="text-xs uppercase font-extrabold text-pasto-700 dark:text-pasto-300 tracking-wider">
              Manhã
            </Text>
            <Text className="text-2xl font-black text-pasto-950 dark:text-pasto-100 my-0.5">
              {loading ? '...' : `${summary.totalMorningLiters} L`}
            </Text>
            <Text className="text-[11px] text-gray-500 dark:text-gray-400">
              1º trato do dia
            </Text>
          </View>

          {/* Tarde */}
          <View className="flex-1 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3.5 items-center justify-center">
            <Text className="text-xs uppercase font-extrabold text-amber-700 dark:text-amber-300 tracking-wider">
              Tarde
            </Text>
            <Text className="text-2xl font-black text-amber-950 dark:text-amber-100 my-0.5">
              {loading ? '...' : `${summary.totalAfternoonLiters} L`}
            </Text>
            <Text className="text-[11px] text-gray-500 dark:text-gray-400">
              2º trato do dia
            </Text>
          </View>
        </View>

        {/* Resumo Consolidado e Badge */}
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-xs font-bold text-gray-600 dark:text-gray-300">
            Total:{' '}
            <Text className="font-extrabold text-pasto-900 dark:text-pasto-200">
              {summary.totalDailyLiters} L/dia
            </Text>
          </Text>

          <SeloStatus
            status={summary.activeCalvesCount > 0 ? 'prenhe' : 'secada'}
            texto={`${summary.activeCalvesCount} ${summary.activeCalvesCount === 1 ? 'bezerra' : 'bezerras'} em leite`}
          />
        </View>

        {/* Gatilho da Gaveta Expansível de Transições / Desmame */}
        <Pressable
          onPress={() => setExpandido(!expandido)}
          accessibilityRole="button"
          accessibilityLabel="Expandir lista de bezerras em transição de aleitamento"
          className="flex-row items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-800 active:bg-gray-100 min-h-[48px]"
        >
          <View className="flex-row items-center gap-2 flex-1 min-w-0 mr-2">
            <Icon icon={Sparkles} size="sm" className="text-amber-500" decorative />
            <Text className="text-xs font-bold text-gray-800 dark:text-gray-200" numberOfLines={1}>
              {summary.transitioningCalves.length > 0
                ? `${summary.transitioningCalves.length} em corte gradual ou transição na semana`
                : 'Sem bezerras em corte de leite na semana'}
            </Text>
          </View>

          <Icon
            icon={expandido ? ChevronUp : ChevronDown}
            size="sm"
            className="text-gray-500"
            decorative
          />
        </Pressable>

        {/* Gaveta Expansível */}
        {expandido ? (
          <View className="gap-2.5 pt-1 border-t border-gray-100 dark:border-slate-800">
            {summary.transitioningCalves.length === 0 ? (
              <Text className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                Todas as bezerras em aleitamento estão em fase estável.
              </Text>
            ) : (
              summary.transitioningCalves.map((bezerra) => (
                <View
                  key={bezerra.animalId}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex-row items-center justify-between gap-2.5"
                >
                  <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
                    <BadgeBrinco numero={bezerra.earTag} tamanho="sm" />
                    <View className="flex-1 min-w-0">
                      <Text
                        className="text-xs font-black text-gray-900 dark:text-gray-100"
                        numberOfLines={1}
                      >
                        {bezerra.name || `Bezerra #${bezerra.earTag}`}
                      </Text>
                      <Text className="text-[11px] text-gray-500 dark:text-gray-400">
                        {bezerra.ageInDays} dias · {bezerra.phaseName}
                      </Text>
                      {bezerra.nextStepDescription ? (
                        <Text className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                          {bezerra.nextStepDescription}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-xs font-black text-pasto-900 dark:text-pasto-200">
                      {bezerra.morningLiters}L + {bezerra.afternoonLiters}L
                    </Text>
                    <Text className="text-[10px] text-gray-400">por trato</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}
      </View>
    </Cartao>
  );
}
