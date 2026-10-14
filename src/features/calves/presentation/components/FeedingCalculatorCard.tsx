import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { CampoNumerico, Cartao, SeloStatus } from '@/ui';
import { calculateFeedingPlan } from '../../domain/calves.entity';

export function FeedingCalculatorCard() {
  const [idadeSimulada, setIdadeSimulada] = useState('20');

  const dias = parseInt(idadeSimulada, 10) || 0;
  const plano = calculateFeedingPlan(dias);

  return (
    <Cartao titulo="Calculadora de Leite por Idade">
      <Text className="mb-3 text-sm text-gray-600 dark:text-gray-300">
        Digite a idade em dias para ver o volume correto que a bezerra deve receber hoje:
      </Text>

      <View className="mb-4">
        <CampoNumerico
          rotulo="Idade da Bezerra"
          valor={idadeSimulada}
          onChange={setIdadeSimulada}
          sufixo="dias"
          placeholder="Ex: 25"
        />
      </View>

      <View className="rounded-xl border border-pasto-200 dark:border-pasto-800/60 bg-pasto-50 dark:bg-pasto-950/40 p-4">
        <View className="flex-row items-center justify-between pb-2">
          <Text className="text-xs uppercase font-bold text-pasto-700 dark:text-pasto-300">Fase Atual</Text>
          <SeloStatus status={plano.statusBadge} texto={plano.phaseName} />
        </View>
        <Text className="text-lg font-black text-pasto-900 dark:text-pasto-100">
          {plano.litersPerDayDescription}
        </Text>
      </View>
    </Cartao>
  );
}
