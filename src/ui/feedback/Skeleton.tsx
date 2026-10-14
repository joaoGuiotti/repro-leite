import React, { useEffect, useState } from 'react';
import { Animated, View, ViewStyle } from 'react-native';

export interface SkeletonProps {
  className?: string;
  style?: ViewStyle;
  height?: number;
  width?: number | `${number}%`;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

/**
 * Componente básico de Skeleton animado (efeito pulsar suave).
 */
export function Skeleton({
  className = '',
  style,
  height,
  width,
  rounded = 'md',
}: SkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(0.3));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacity]);

  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <Animated.View
      style={[{ opacity, height, width }, style]}
      className={`bg-gray-200 dark:bg-gray-800 ${roundedClasses} ${className}`}
    />
  );
}

/**
 * Skeleton pronto para listas (card com linhas).
 */
export function CardSkeleton() {
  return (
    <View className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-gray-100 dark:border-gray-800 gap-3 mb-3">
      <View className="flex-row items-center justify-between">
        <Skeleton height={20} width="40%" rounded="md" />
        <Skeleton height={24} width={70} rounded="full" />
      </View>
      <Skeleton height={14} width="75%" rounded="sm" />
      <Skeleton height={14} width="50%" rounded="sm" />
    </View>
  );
}

export function ListLoadingState({ count = 3 }: { count?: number }) {
  return (
    <View className="gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}
