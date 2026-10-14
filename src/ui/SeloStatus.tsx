import React from 'react';
import { Text, View } from 'react-native';

const STATUS_CORES = {
  vazia: { bg: 'bg-gray-100', text: 'text-gray-800' },
  inseminada: { bg: 'bg-blue-100', text: 'text-blue-900' },
  prenhe: { bg: 'bg-pasto-100', text: 'text-pasto-900' },
  secada: { bg: 'bg-terra-100', text: 'text-terra-700' },
  aviso: { bg: 'bg-ambar-100', text: 'text-ambar-700' },
  alerta: { bg: 'bg-alerta-100', text: 'text-alerta-700' },
} as const;

export interface SeloStatusProps {
  status: keyof typeof STATUS_CORES;
  texto: string;
}

export function SeloStatus({ status, texto }: SeloStatusProps) {
  const c = STATUS_CORES[status] ?? STATUS_CORES.vazia;
  return (
    <View className={`self-start rounded-full px-3 py-1 ${c.bg}`}>
      <Text className={`text-xs font-bold uppercase tracking-wide ${c.text}`}>{texto}</Text>
    </View>
  );
}
