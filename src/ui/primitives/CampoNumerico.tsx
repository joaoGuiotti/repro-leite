import React from 'react';
import { Text, TextInput, View } from 'react-native';

export interface CampoNumericoProps {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  sufixo?: string;
  placeholder?: string;
}

/** Teclado numérico ergonômico para brinco, litros e pesos sob sol forte. */
export function CampoNumerico({ rotulo, valor, onChange, sufixo, placeholder }: CampoNumericoProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-bold text-gray-800">{rotulo}</Text>
      <View className="min-h-14 flex-row items-center rounded-xl border-2 border-pasto-500 bg-white px-4">
        <TextInput
          accessibilityLabel={rotulo}
          className="flex-1 text-xl font-bold text-gray-900"
          keyboardType="numeric"
          inputMode="numeric"
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={valor}
          onChangeText={onChange}
        />
        {sufixo ? <Text className="ml-2 text-base font-bold text-terra-700">{sufixo}</Text> : null}
      </View>
    </View>
  );
}
