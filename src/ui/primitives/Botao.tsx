import { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import { hapticFeedback } from '../feedback/haptics';

const VARIANTES = {
  primario: {
    caixa: 'bg-pasto-900 active:bg-pasto-700 dark:bg-pasto-700 dark:active:bg-pasto-600 border border-pasto-900 dark:border-pasto-600',
    texto: 'text-white',
  },
  secundario: {
    caixa: 'bg-pasto-100 active:bg-pasto-200 dark:bg-slate-800 dark:active:bg-slate-700 border border-pasto-200 dark:border-slate-700',
    texto: 'text-pasto-900 dark:text-pasto-200',
  },
  aviso: {
    caixa: 'bg-ambar-100 active:bg-ambar-200 dark:bg-amber-950/40 dark:active:bg-amber-900/60 border border-ambar-200 dark:border-amber-800/50',
    texto: 'text-ambar-800 dark:text-amber-300',
  },
  perigo: {
    caixa: 'bg-alerta-100 active:bg-alerta-200 dark:bg-red-950/40 dark:active:bg-red-900/60 border border-alerta-200 dark:border-red-800/50',
    texto: 'text-alerta-700 dark:text-red-300',
  },
  sucesso: {
    caixa: 'bg-emerald-600 active:bg-emerald-700 dark:bg-emerald-700 dark:active:bg-emerald-600 border border-emerald-600 dark:border-emerald-500',
    texto: 'text-white',
  },
  contorno: {
    caixa: 'bg-transparent active:bg-gray-100 dark:active:bg-slate-800 border border-gray-300 dark:border-slate-700',
    texto: 'text-gray-700 dark:text-gray-200',
  },
  fantasma: {
    caixa: 'bg-transparent active:bg-gray-100 dark:active:bg-slate-800/60 border border-transparent',
    texto: 'text-pasto-900 dark:text-pasto-200',
  },
} as const;

export interface BotaoProps {
  titulo: string;
  onPress: () => void;
  variante?: keyof typeof VARIANTES;
  /** Ícone opcional (ex: Lucide) renderizado antes do texto */
  icone?: ReactNode;
  /** Botões principais têm altura mínima de 56 px (min-h-14); os demais 48 px (min-h-12). */
  principal?: boolean;
  /** Tamanho customizado opcional */
  tamanho?: 'sm' | 'md' | 'lg';
  /** Se deve vibrar ao pressionar (padrão: true) */
  haptic?: boolean;
  desabilitado?: boolean;
  className?: string;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Componente de botão padronizado do Design System.
 * Garante alvos de toque >= 48dp, acessibilidade, feedback tátil e suporte completo a dark mode.
 */
export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  icone,
  principal = false,
  tamanho,
  haptic = true,
  desabilitado = false,
  className = '',
  accessibilityLabel,
  testID,
}: BotaoProps) {
  const v = VARIANTES[variante] ?? VARIANTES.primario;

  const alturaClass = tamanho
    ? { sm: 'min-h-[40px]', md: 'min-h-12', lg: 'min-h-14' }[tamanho]
    : principal
      ? 'min-h-14'
      : 'min-h-12';

  const handlePress = () => {
    if (desabilitado) return;
    if (haptic) {
      void (principal ? hapticFeedback.impact() : hapticFeedback.selection());
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || titulo}
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={handlePress}
      testID={testID}
      className={`flex-row items-center justify-center gap-2 rounded-xl px-4 ${alturaClass} ${v.caixa} ${desabilitado ? 'opacity-40' : ''
        } ${className}`}
    >
      {icone}
      <Text className={`text-sm font-extrabold ${v.texto}`} numberOfLines={1}>
        {titulo}
      </Text>
    </Pressable>
  );
}

