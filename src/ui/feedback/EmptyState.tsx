import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Icon } from '../primitives/Icon';
import { Botao } from '../primitives/Botao';
import { AppIcons } from '../icons';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
  className?: string;
  testID?: string;
}

/**
 * Estado vazio padronizado com mensagem clara e chamada para ação (CTA).
 */
export function EmptyState({
  icon = AppIcons.search,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className = '',
  testID,
}: EmptyStateProps) {
  return (
    <View
      className={`items-center justify-center py-12 px-6 rounded-2xl bg-surface dark:bg-surface-dark border border-dashed border-gray-300 dark:border-gray-700 ${className}`}
      testID={testID}
      accessibilityRole="text"
    >
      <View className="mb-4 p-4 rounded-full bg-surface-variant dark:bg-gray-800">
        <Icon icon={icon} size="xl" className="text-gray-400 dark:text-gray-500" decorative />
      </View>

      <Text className="text-base font-bold text-gray-800 dark:text-gray-100 text-center mb-1">
        {title}
      </Text>

      <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 max-w-xs">
        {description}
      </Text>

      {actionLabel && onAction && (
        <Botao
          titulo={actionLabel}
          onPress={onAction}
          icone={actionIcon}
          variante="secundario"
          className="self-center"
        />
      )}
    </View>
  );
}
