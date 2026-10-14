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
  if (saldoDoses === 0) {
    return (
      <View
        className={`rounded-full border border-alerta-300 dark:border-red-800 bg-alerta-100 dark:bg-red-950/40 px-2.5 py-1 ${className}`}
        accessibilityRole="text"
        accessibilityLabel="Estoque zerado, zero doses"
      >
        <Text className="text-xs font-bold text-alerta-700 dark:text-red-300">
          Zerado (0 doses)
        </Text>
      </View>
    );
  }

  if (saldoDoses <= 3) {
    return (
      <View
        className={`rounded-full border border-ambar-300 dark:border-amber-800 bg-ambar-100 dark:bg-amber-950/40 px-2.5 py-1 ${className}`}
        accessibilityRole="text"
        accessibilityLabel={`Estoque baixo, ${saldoDoses} doses`}
      >
        <Text className="text-xs font-bold text-ambar-700 dark:text-amber-300">
          {saldoDoses} {saldoDoses === 1 ? 'dose' : 'doses'} (Baixo)
        </Text>
      </View>
    );
  }

  return (
    <View
      className={`rounded-full border border-pasto-300 dark:border-pasto-800 bg-pasto-100 dark:bg-pasto-950/40 px-2.5 py-1 ${className}`}
      accessibilityRole="text"
      accessibilityLabel={`Estoque normal, ${saldoDoses} doses`}
    >
      <Text className="text-xs font-bold text-pasto-900 dark:text-pasto-200">
        {saldoDoses} {saldoDoses === 1 ? 'dose' : 'doses'}
      </Text>
    </View>
  );
}
