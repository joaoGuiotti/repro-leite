import { LucideIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | number;

export const ICON_SIZE_MAP: Record<'sm' | 'md' | 'lg' | 'xl', number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const interoppedIcons = new WeakSet<object>();

/**
 * Registra cssInterop no componente Lucide para aceitar className (classes text-*).
 * Suporta tanto funções normais quanto objetos forwardRef retornados por createLucideIcon.
 */
export function registerIconInterop(icon: LucideIcon): LucideIcon {
  if (
    icon &&
    (typeof icon === 'function' || typeof icon === 'object') &&
    !interoppedIcons.has(icon)
  ) {
    try {
      cssInterop(icon, {
        className: {
          target: 'style',
          nativeStyleToProp: {
            color: true,
            opacity: true,
          },
        },
      });
      interoppedIcons.add(icon);
    } catch {
      // Fallback seguro em ambientes de teste
    }
  }
  return icon;
}

export interface IconProps {
  /** Componente de ícone do lucide-react-native */
  icon: LucideIcon;
  /** Tamanho padronizado: sm (16), md (20), lg (24), xl (32) ou valor em dp */
  size?: IconSize;
  /** Cor semântica via Tailwind (ex: text-white, text-on-surface, text-danger, text-pasto-700) */
  className?: string;
  /** Cor direta opcional para fallbacks */
  color?: string;
  /** Rótulo de acessibilidade (obrigatório se não decorativo) */
  accessibilityLabel?: string;
  /** Define se o ícone é puramente decorativo */
  decorative?: boolean;
  /** Ação ao tocar (garante alvo de toque mínimo de 48 dp) */
  onPress?: () => void;
  /** Estilo adicional para o container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Identificador para testes */
  testID?: string;
}

/**
 * Wrapper padronizado do Design System para ícones Lucide.
 * Cumpre regras de acessibilidade, tamanhos padronizados e cores semânticas via className.
 */
export function Icon({
  icon: IconComponent,
  size = 'md',
  className = 'text-on-surface',
  color,
  accessibilityLabel,
  decorative,
  onPress,
  containerStyle,
  testID,
}: IconProps) {
  registerIconInterop(IconComponent);

  const numericSize = typeof size === 'number' ? size : ICON_SIZE_MAP[size] ?? 20;
  const isDecorative = decorative ?? !accessibilityLabel;

  const renderedIcon = (
    <IconComponent
      size={numericSize}
      {...(color !== undefined ? { color } : {})}
      className={className}
      accessibilityElementsHidden={isDecorative}
      importantForAccessibility={isDecorative ? 'no' : 'yes'}
    />
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className="min-h-[48px] min-w-[48px] items-center justify-center active:opacity-70"
        style={containerStyle}
        testID={testID}
      >
        {renderedIcon}
      </Pressable>
    );
  }

  if (!isDecorative && accessibilityLabel) {
    return (
      <View
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        style={containerStyle}
        testID={testID}
      >
        {renderedIcon}
      </View>
    );
  }

  return renderedIcon;
}

