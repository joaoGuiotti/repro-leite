import React from 'react';
import { Text, View } from 'react-native';
import { Dna } from 'lucide-react-native';
import { Icon } from '@/ui';

export interface CalfGenealogyCardProps {
  sireName?: string | null;
  damName?: string | null;
  damEarTag?: string | null;
  maternalGranddamName?: string | null;
}

/**
 * Componente que exibe a linhagem e melhoramento genético em 3 níveis (Pai, Mãe, Avó Materna).
 * Fiel ao layout visual aprovado no mockup do bezerreiro.
 */
export function CalfGenealogyCard({
  sireName,
  damName,
  damEarTag,
  maternalGranddamName,
}: CalfGenealogyCardProps) {
  const displayDam = damName
    ? damEarTag
      ? `${damName} (${damEarTag})`
      : damName
    : 'Não informada';

  return (
    <View className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 shadow-2xs">
      {/* Título da Seção com Ícone */}
      <View className="flex-row items-center gap-2 mb-3">
        <Icon icon={Dna} size="md" className="text-pasto-700 dark:text-pasto-400" decorative />
        <Text className="text-xs font-bold tracking-wider uppercase text-gray-700 dark:text-gray-300">
          Linhagem e Melhoramento Genético
        </Text>
      </View>

      {/* 3 Caixas em Linha Horizontal */}
      <View className="flex-row gap-2.5">
        {/* Pai (Touro IA) */}
        <View className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2.5 items-center justify-center">
          <Text
            className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400 mb-1"
            numberOfLines={1}
          >
            Pai (Touro IA)
          </Text>
          <Text
            className="text-xs font-bold text-gray-900 dark:text-gray-100 text-center"
            numberOfLines={2}
          >
            {sireName || 'Não informado'}
          </Text>
        </View>

        {/* Mãe (Vaca) */}
        <View className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2.5 items-center justify-center">
          <Text
            className="text-[10px] font-bold uppercase text-red-700 dark:text-red-400 mb-1"
            numberOfLines={1}
          >
            Mãe (Vaca)
          </Text>
          <Text
            className="text-xs font-bold text-gray-900 dark:text-gray-100 text-center"
            numberOfLines={2}
          >
            {displayDam}
          </Text>
        </View>

        {/* Avó Materna */}
        <View className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2.5 items-center justify-center">
          <Text
            className="text-[10px] font-bold uppercase text-purple-700 dark:text-purple-400 mb-1"
            numberOfLines={1}
          >
            Avó Materna
          </Text>
          <Text
            className="text-xs font-bold text-gray-900 dark:text-gray-100 text-center"
            numberOfLines={2}
          >
            {maternalGranddamName || 'Não informada'}
          </Text>
        </View>
      </View>
    </View>
  );
}
