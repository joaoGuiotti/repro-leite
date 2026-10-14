import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { BadgeBrinco } from '@features/herd';
import { Check, Clock } from 'lucide-react-native';
import {
  AlertWithAnimalSummary,
  getAlertTypeMeta,
} from '../../domain/alert.entity';

export interface AlertItemCardProps {
  alert: AlertWithAnimalSummary;
  onComplete?: (alertId: string) => void;
  completing?: boolean;
}

function formatarDataBR(isoDate: string): string {
  if (!isoDate) return '--/--/----';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function AlertItemCard({
  alert,
  onComplete,
  completing = false,
}: AlertItemCardProps) {
  const meta = getAlertTypeMeta(alert.type);

  const badgeColorClasses = {
    alerta: 'bg-alerta-100/80 border-alerta-300 text-alerta-900',
    atencao: 'bg-amber-100/80 border-amber-300 text-amber-900',
    sucesso: 'bg-pasto-100/80 border-pasto-300 text-pasto-900',
    info: 'bg-celeste-100/80 border-celeste-300 text-celeste-900',
  }[meta.colorVariant];

  return (
    <View className="p-3 bg-white border border-gray-200/90 rounded-2xl shadow-xs flex-row items-center gap-3">
      {/* 1. Brinco do animal */}
      <BadgeBrinco numero={alert.animalEarTag} tamanho="md" className="self-center" />

      {/* 2. Informações do Alerta */}
      <View className="flex-1 min-w-0 justify-center">
        <View className="flex-row items-center gap-2 flex-wrap">
          <Text className="text-sm font-black text-gray-950" numberOfLines={1}>
            {alert.animalName || `Animal #${alert.animalEarTag}`}
          </Text>
          <View className={`px-2 py-0.5 rounded-full border ${badgeColorClasses}`}>
            <Text className="text-[11px] font-bold">
              {meta.badgeLabel}
            </Text>
          </View>
        </View>

        <Text className="text-xs text-gray-600 mt-0.5" numberOfLines={1}>
          {meta.description}
        </Text>

        <View className="flex-row items-center gap-1.5 mt-1">
          <Clock size={12} color="#6b7280" />
          <Text className="text-xs font-bold text-gray-700">
            Vencimento: {formatarDataBR(alert.dueDate)}
          </Text>
        </View>

        {alert.notes ? (
          <Text className="text-xs text-gray-400 italic mt-0.5" numberOfLines={1}>
            &ldquo;{alert.notes}&rdquo;
          </Text>
        ) : null}
      </View>

      {/* 3. Ação de Concluir */}
      {onComplete ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Concluir alerta da vaca ${alert.animalEarTag}`}
          onPress={() => onComplete(alert.id)}
          disabled={completing}
          className="h-10 w-10 items-center justify-center rounded-xl bg-pasto-50 border border-pasto-200 active:bg-pasto-100 self-center"
        >
          <Check size={18} color="#1b4332" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
