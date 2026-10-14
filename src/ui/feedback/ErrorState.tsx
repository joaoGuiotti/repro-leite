import React from 'react';
import { Text, View } from 'react-native';
import { Icon } from '../primitives/Icon';
import { Botao } from '../primitives/Botao';
import { AppIcons } from '../icons';
import { i18n } from '@/i18n';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  testID?: string;
}

/**
 * Estado de erro padronizado com botão de retry.
 */
export function ErrorState({
  title = i18n.common.errorTitle,
  message = i18n.common.errorMessage,
  onRetry,
  className = '',
  testID,
}: ErrorStateProps) {
  return (
    <View
      className={`items-center justify-center py-10 px-6 rounded-2xl bg-danger-light/20 dark:bg-danger-dark/10 border border-danger/30 ${className}`}
      testID={testID}
      accessibilityRole="alert"
    >
      <View className="mb-3 p-3 rounded-full bg-danger-light dark:bg-danger-dark/20">
        <Icon icon={AppIcons.error} size="lg" className="text-danger" decorative />
      </View>

      <Text className="text-base font-bold text-danger dark:text-danger-dark text-center mb-1">
        {title}
      </Text>

      <Text className="text-sm text-gray-600 dark:text-gray-300 text-center mb-5 max-w-xs">
        {message}
      </Text>

      {onRetry && (
        <Botao
          titulo={i18n.common.retry}
          onPress={onRetry}
          variante="aviso"
          icone={<Icon icon={AppIcons.sync} size="sm" className="text-ambar-700" decorative />}
          className="self-center"
        />
      )}
    </View>
  );
}
