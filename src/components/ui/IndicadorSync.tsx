import { Text, View } from 'react-native';
import type { SyncStatus } from '../../sync/types';

const ESTILOS: Record<SyncStatus, { caixa: string; texto: string }> = {
  ok: { caixa: 'bg-pasto-100', texto: 'text-pasto-900' },
  pendente: { caixa: 'bg-ambar-100', texto: 'text-ambar-700' },
  atrasado: { caixa: 'bg-alerta-100', texto: 'text-alerta-700' },
  erro: { caixa: 'bg-alerta-100', texto: 'text-alerta-700' },
};

/** Sempre visível, em todas as abas. Ex.: "Salvo na nuvem há 2 horas". */
export function IndicadorSync({ status, mensagem }: { status: SyncStatus; mensagem: string }) {
  const e = ESTILOS[status];
  return (
    <View className={`min-h-12 justify-center px-4 py-2 ${e.caixa}`}>
      <Text accessibilityRole="text" className={`text-base font-semibold ${e.texto}`}>
        {mensagem}
      </Text>
    </View>
  );
}
