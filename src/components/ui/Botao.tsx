import { Pressable, Text } from 'react-native';

// Mapas fixos: o Tailwind não detecta classes montadas por concatenação.
const VARIANTES = {
  primario: { caixa: 'bg-pasto-900 active:bg-pasto-700', texto: 'text-white' },
  secundario: { caixa: 'bg-pasto-100 active:bg-pasto-200', texto: 'text-pasto-900' },
  aviso: { caixa: 'bg-ambar-100 active:bg-ambar-500', texto: 'text-ambar-700' },
  perigo: { caixa: 'bg-alerta-100', texto: 'text-alerta-700' },
} as const;

interface BotaoProps {
  titulo: string;
  onPress: () => void;
  variante?: keyof typeof VARIANTES;
  /** Botões principais têm 56 px; os demais 48 px. */
  principal?: boolean;
  desabilitado?: boolean;
}

export function Botao({ titulo, onPress, variante = 'primario', principal = false, desabilitado }: BotaoProps) {
  const v = VARIANTES[variante];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      disabled={desabilitado}
      onPress={onPress}
      className={`items-center justify-center rounded-xl px-5 ${principal ? 'min-h-14' : 'min-h-12'} ${v.caixa} ${desabilitado ? 'opacity-50' : ''}`}
    >
      <Text className={`text-lg font-bold ${v.texto}`}>{titulo}</Text>
    </Pressable>
  );
}
