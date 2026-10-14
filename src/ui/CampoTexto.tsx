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

/** Componente de campo de texto e busca alfanumérico (aceita números e letras). */
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
        <Text className="text-sm font-bold text-gray-800">{rotulo}</Text>
      )}
      <View className="min-h-14 flex-row items-center rounded-xl border border-gray-300 bg-white px-4">
        {iconeEsquerda && <View className="mr-2.5">{iconeEsquerda}</View>}
        <TextInput
          accessibilityLabel={rotulo || placeholder}
          className="flex-1 text-base font-semibold text-gray-900"
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
            className="p-1 rounded-full bg-gray-100 active:bg-gray-200"
            accessibilityLabel="Limpar texto"
          >
            <X size={14} color="#6b7280" />
          </TouchableOpacity>
        )}
        {sufixo ? (
          <Text className="ml-2 text-sm font-bold text-terra-700">{sufixo}</Text>
        ) : null}
        {iconeDireita && <View className="ml-2">{iconeDireita}</View>}
      </View>
    </View>
  );
}

export const CampoBusca = CampoTexto;
export default CampoTexto;
