import React from 'react';
import { Text, View } from 'react-native';
import { Icon } from '../primitives/Icon';
import { AppIcons } from '../icons';
import { i18n } from '@/i18n';

export interface OfflineNoticeProps {
  message?: string;
  className?: string;
}

/**
 * Aviso sutil de operação offline na tela.
 */
export function OfflineNotice({
  message = i18n.common.offlineNotice,
  className = '',
}: OfflineNoticeProps) {
  return (
    <View
      className={`flex-row items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 ${className}`}
      accessibilityRole="text"
    >
      <Icon
        icon={AppIcons.offline}
        size="sm"
        className="text-amber-600 dark:text-amber-400"
        decorative
      />
      <Text className="flex-1 text-xs text-amber-800 dark:text-amber-300 font-medium">
        {message}
      </Text>
    </View>
  );
}
