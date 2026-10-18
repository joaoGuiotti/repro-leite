import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { PendingSyncBadge } from '@/ui';
import { useSyncStatus } from '@core/sync';
import { BadgeBrinco } from '@features/herd';
import { CalfListItem } from '../../domain/calves.types';

export interface CalfListCardProps {
  item: CalfListItem;
  isSelected?: boolean;
  onPress: () => void;
}

export function CalfListCard({ item, isSelected = false, onPress }: CalfListCardProps) {
  const { isRecordPending } = useSyncStatus();
  const isFemale = item.sex === 'femea';
  const displayParents = [
    item.sireName ? `P: ${item.sireName}` : null,
    item.damName ? `M: ${item.damName}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Bezerra brinco ${item.earTag}, ${item.name || ''}, ${item.dailyLiters} litros por dia`}
      className={`p-3 rounded-2xl mb-2.5 transition-all border ${
        isSelected
          ? 'bg-pasto-50/90 dark:bg-pasto-950/60 border-pasto-600 dark:border-pasto-500 shadow-sm'
          : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'
      }`}
    >
      <View className="flex-row items-center gap-3">
        {/* Brinco em Destaque */}
        <BadgeBrinco
          numero={item.earTag}
          tamanho="md"
          variante={isSelected ? 'destaque' : 'padrao'}
        />

        {/* Informações Principais */}
        <View className="flex-1 justify-center">
          <View className="flex-row items-center justify-between gap-1 mb-0.5">
            <View className="flex-row items-center gap-1.5 flex-1">
              <Text
                className="text-sm font-black text-gray-950 dark:text-gray-100 shrink"
                numberOfLines={1}
              >
                {item.name || `Bezerra #${item.earTag}`}
              </Text>
              {isRecordPending(item.id) && <PendingSyncBadge compact />}
            </View>

            {/* Badge de Volume Diário ou Peso */}
            {item.dailyLiters > 0 ? (
              <View className="px-2 py-0.5 rounded-full bg-pasto-100 dark:bg-pasto-900/60 border border-pasto-300 dark:border-pasto-800">
                <Text className="text-[11px] font-black text-pasto-800 dark:text-pasto-300">
                  {item.dailyLiters}L/dia
                </Text>
              </View>
            ) : (
              <View className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                <Text className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  {item.lastWeightKg ? `${item.lastWeightKg} kg` : 'Desmamada'}
                </Text>
              </View>
            )}
          </View>

          {/* Idade e Fase */}
          <View className="flex-row items-center gap-1.5 flex-wrap">
            <Text className="text-xs font-bold text-gray-600 dark:text-gray-400">
              {item.ageInDays} dias ({item.ageInMonths}m)
            </Text>
            <Text className="text-xs text-gray-400">·</Text>
            <Text className="text-xs font-semibold text-pasto-700 dark:text-pasto-400" numberOfLines={1}>
              {item.phaseName}
            </Text>
            {!isFemale && (
              <View className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/50">
                <Text className="text-[9px] font-bold text-blue-700 dark:text-blue-300">Macho</Text>
              </View>
            )}
          </View>

          {/* Genealogia resumida */}
          {displayParents ? (
            <Text
              className="text-[11px] text-gray-400 dark:text-gray-500 mt-1"
              numberOfLines={1}
            >
              {displayParents}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
