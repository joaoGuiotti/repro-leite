import React from 'react';
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';

export interface CampoTextoProps extends Omit<TextInputProps, 'onChange'> {
  rotulo?: string;
  valor: string;
  onChange: (v: string) => void;
  iconeEsquerda?: React.ReactNode;
  iconeDireita?: React.ReactNode;
  limpavel?: boolean;
  sufixo?: string;
  placeholder?: string;
  classNameContainer?: string;
}

/** Componente de campo de texto e busca alfanumérico com suporte a tema escuro. */
export function CampoTexto({
  rotulo,
  valor,
  onChange,
  iconeEsquerda,
  iconeDireita,
  limpavel = false,
  sufixo,
  placeholder,
  classNameContainer = '',
  ...props
}: CampoTextoProps) {
  return (
    <View className={`gap-1 ${classNameContainer}`}>
      {rotulo && (
        <Text className="text-sm font-bold text-gray-800 dark:text-gray-200">{rotulo}</Text>
      )}
      <View className="min-h-14 flex-row items-center rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4">
        {iconeEsquerda && <View className="mr-2.5">{iconeEsquerda}</View>}
        <TextInput
          accessibilityLabel={rotulo || placeholder}
          className="flex-1 text-base font-semibold text-gray-900 dark:text-slate-100"
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={valor}
          onChangeText={onChange}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {limpavel && valor.length > 0 && (
          <TouchableOpacity
            onPress={() => onChange('')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="p-1 rounded-full bg-gray-100 dark:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700"
            accessibilityLabel="Limpar texto"
          >
            <X size={16} color="#64748b" />
          </TouchableOpacity>
        )}
        {sufixo ? <Text className="ml-2 text-sm font-bold text-terra-700 dark:text-amber-400">{sufixo}</Text> : null}
        {iconeDireita && <View className="ml-2.5">{iconeDireita}</View>}
      </View>
    </View>
  );
}
