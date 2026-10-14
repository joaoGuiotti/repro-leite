import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export function Cartao({ titulo, children }: { titulo?: string; children?: ReactNode }) {
  return (
    <View className="rounded-2xl border border-terra-100 bg-white p-4">
      {titulo ? <Text className="mb-2 text-xl font-bold text-black">{titulo}</Text> : null}
      {children}
    </View>
  );
}
