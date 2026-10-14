import React from 'react';
import { Text, View } from 'react-native';
import { Botao, Cartao, Screen } from '@/ui';
import { i18n } from '@/i18n';
import { TARGET_FIRST_BREEDING_WEIGHT_KG } from '../../domain/calves.entity';
import { FeedingCalculatorCard } from '../components/FeedingCalculatorCard';

export interface CalvesScreenProps {
  onRegisterCalf?: () => void;
  onLogWeight?: () => void;
}

export function CalvesScreen({
  onRegisterCalf = () => {},
  onLogWeight = () => {},
}: CalvesScreenProps) {
  return (
    <Screen scroll contentContainerClassName="gap-4 p-4 pb-16">
      {/* 1. Cadastro de Bezerra */}
      <Cartao titulo={i18n.calves.title}>
        <Text className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          Acompanhamento individual desde o nascimento, genealogia em 3 níveis (Bezerra ➔ Mãe
          ➔ Pai ➔ Avó) e cálculo automático da curva de leite.
        </Text>
        <Botao
          titulo="Cadastrar Nova Bezerra"
          onPress={onRegisterCalf}
          variante="primario"
          principal
        />
      </Cartao>

      {/* 2. Calculadora Interativa de Aleitamento */}
      <FeedingCalculatorCard />

      {/* 3. Recria & Ganho Médio Diário */}
      <Cartao titulo="Recria & Peso-Alvo para 1ª IA">
        <View className="flex-row items-center justify-between pb-2">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Meta de peso para 1ª Inseminação:
          </Text>
          <Text className="font-extrabold text-pasto-900 dark:text-pasto-300">
            ~{TARGET_FIRST_BREEDING_WEIGHT_KG} kg
          </Text>
        </View>
        <Text className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          Acompanhe pesagens mensais e cálculo automático do GMD (g/dia) até a novilha estar apta.
        </Text>
        <Botao
          titulo="Lançar Pesagem Mensal (GMD)"
          onPress={onLogWeight}
          variante="secundario"
        />
      </Cartao>
    </Screen>
  );
}
