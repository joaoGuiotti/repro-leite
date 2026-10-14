import { Text, View } from 'react-native';

const ESTILOS = {
  prenhe: { caixa: 'bg-pasto-100', texto: 'text-pasto-900', rotulo: 'Prenhe' },
  vazia: { caixa: 'bg-ambar-100', texto: 'text-ambar-700', rotulo: 'Vazia' },
  inseminada: { caixa: 'bg-terra-100', texto: 'text-terra-700', rotulo: 'Inseminada' },
  seca: { caixa: 'bg-terra-50', texto: 'text-terra-700', rotulo: 'Seca' },
  inativa: { caixa: 'bg-terra-100', texto: 'text-terra-700', rotulo: 'Inativa' },
} as const;

export type StatusSelo = keyof typeof ESTILOS;

export function SeloStatus({ status }: { status: StatusSelo }) {
  const e = ESTILOS[status];
  return (
    <View className={`self-start rounded-full px-3 py-1 ${e.caixa}`}>
      <Text className={`text-sm font-bold ${e.texto}`}>{e.rotulo}</Text>
    </View>
  );
}
