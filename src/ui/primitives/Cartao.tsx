import { ReactNode } from 'react';
import { Text, View } from 'react-native';

export interface CartaoProps {
  titulo?: string;
  className?: string;
  children: ReactNode;
}

export function Cartao({ titulo, className = '', children }: CartaoProps) {
  return (
    <View className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm ${className}`}>
      {titulo ? <Text className="mb-3 text-lg font-bold text-pasto-500">{titulo}</Text> : null}
      {children}
    </View>
  );
}
