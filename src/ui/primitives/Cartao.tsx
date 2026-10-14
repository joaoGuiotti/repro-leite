import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';

export interface CartaoProps {
  titulo?: string;
  className?: string;
  children: ReactNode;
}

export function Cartao({ titulo, className = '', children }: CartaoProps) {
  return (
    <View className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
      {titulo ? <Text className="mb-3 text-lg font-bold text-pasto-900">{titulo}</Text> : null}
      {children}
    </View>
  );
}
