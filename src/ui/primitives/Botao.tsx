import React, { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

const VARIANTES = {
  primario: { caixa: 'bg-pasto-900 active:bg-pasto-700', texto: 'text-white' },
  secundario: { caixa: 'bg-pasto-100 active:bg-pasto-200', texto: 'text-pasto-900' },
  aviso: { caixa: 'bg-ambar-100 active:bg-ambar-500', texto: 'text-ambar-700' },
  perigo: { caixa: 'bg-alerta-100', texto: 'text-alerta-700' },
} as const;

export interface BotaoProps {
  titulo: string;
  onPress: () => void;
  variante?: keyof typeof VARIANTES;
  /** Ícone opcional (ex: Lucide) renderizado antes do texto */
  icone?: ReactNode;
  /** Botões principais têm altura mínima de 56 px (min-h-14); os demais 48 px (min-h-12). */
  principal?: boolean;
  desabilitado?: boolean;
  className?: string;
  accessibilityLabel?: string;
}

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  icone,
  principal = false,
  desabilitado = false,
  className = '',
  accessibilityLabel,
}: BotaoProps) {
  const v = VARIANTES[variante];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || titulo}
      disabled={desabilitado}
      onPress={onPress}
      className={`flex-row items-center justify-center gap-1.5 rounded-xl px-3 ${
        principal ? 'min-h-14' : 'min-h-12'
      } ${v.caixa} ${desabilitado ? 'opacity-50' : ''} ${className}`}
    >
      {icone}
      <Text className={`text-sm font-extrabold ${v.texto}`} numberOfLines={1}>
        {titulo}
      </Text>
    </Pressable>
  );
}
