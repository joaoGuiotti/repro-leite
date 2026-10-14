import React from 'react';
import { Text, View } from 'react-native';
import { Icon } from '../primitives/Icon';
import { AppIcons } from '../icons';
import { i18n } from '@/i18n';

export interface PendingSyncBadgeProps {
  className?: string;
  compact?: boolean;
}

/**
 * Indicador discreto exibido em itens com mutação ainda não sincronizada com o servidor remoto.
 */
export function PendingSyncBadge({
  className = '',
  compact = false,
}: PendingSyncBadgeProps) {
  return (
    <View
      className={`flex-row items-center gap-1 bg-amber-100 dark:bg-amber-950/40 rounded-full px-2 py-0.5 border border-amber-200 dark:border-amber-800/40 ${className}`}
      accessibilityRole="text"
      accessibilityLabel={i18n.common.pendingSync}
    >
      <Icon
        icon={AppIcons.clock}
        size="sm"
        className="text-amber-700 dark:text-amber-400"
        decorative
      />
      {!compact && (
        <Text className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-tight">
          {i18n.common.pendingSync}
        </Text>
      )}
    </View>
  );
}
