import React from 'react';
import { Text, View } from 'react-native';

export interface BadgeEstoqueDosesProps {
  saldoDoses: number;
  className?: string;
}

export function BadgeEstoqueDoses({
  saldoDoses,
  className = '',
}: BadgeEstoqueDosesProps) {
  let estilo = 'bg-pasto-100 text-pasto-900 border-pasto-300';
  let rotulo = `${saldoDoses} ${saldoDoses === 1 ? 'dose' : 'doses'}`;

  if (saldoDoses === 0) {
    estilo = 'bg-alerta-100 text-alerta-800 border-alerta-300';
    rotulo = 'Zerado (0 doses)';
  } else if (saldoDoses <= 3) {
    estilo = 'bg-ambar-100 text-ambar-800 border-ambar-300';
    rotulo = `${saldoDoses} ${saldoDoses === 1 ? 'dose' : 'doses'} (Baixo)`;
  }

  return (
    <View className={`rounded-full border px-2.5 py-1 ${estilo.split(' ')[0]} ${estilo.split(' ')[2]} ${className}`}>
      <Text className={`text-xs font-bold ${estilo.split(' ')[1]}`}>
        {rotulo}
      </Text>
    </View>
  );
}
