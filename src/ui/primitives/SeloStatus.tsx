import { Text, View } from 'react-native';

const STATUS_CORES = {
  vazia: {
    bg: 'bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700',
    text: 'text-gray-800 dark:text-gray-200',
  },
  inseminada: {
    bg: 'bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800',
    text: 'text-blue-900 dark:text-blue-200',
  },
  prenhe: {
    bg: 'bg-pasto-100 dark:bg-pasto-700/60 border border-pasto-200 dark:border-pasto-800',
    text: 'text-pasto-900 dark:text-pasto-200',
  },
  secada: {
    bg: 'bg-terra-100 dark:bg-amber-950/40 border border-terra-200 dark:border-amber-900/40',
    text: 'text-terra-700 dark:text-amber-300',
  },
  aviso: {
    bg: 'bg-ambar-100 dark:bg-amber-950/50 border border-ambar-200 dark:border-amber-800',
    text: 'text-ambar-700 dark:text-amber-300',
  },
  alerta: {
    bg: 'bg-alerta-100 dark:bg-red-950/50 border border-alerta-200 dark:border-red-800',
    text: 'text-alerta-700 dark:text-red-300',
  },
} as const;

export interface SeloStatusProps {
  status: keyof typeof STATUS_CORES;
  texto: string;
}

/**
 * Selo de status com suporte completo a tema claro e escuro.
 */
export function SeloStatus({ status, texto }: SeloStatusProps) {
  const c = STATUS_CORES[status] ?? STATUS_CORES.vazia;
  return (
    <View className={`self-start rounded-full px-3 py-1 ${c.bg}`}>
      <Text className={`text-xs font-bold uppercase tracking-wide ${c.text}`}>{texto}</Text>
    </View>
  );
}
