import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Cartao, Botao, SeloStatus, CampoNumerico } from '@/ui';

export default function TelaBezerras() {
  const [idadeSimulada, setIdadeSimulada] = useState('20');

  // Cálculo demonstrativo do plano de leite
  const dias = parseInt(idadeSimulada, 10) || 0;
  let faseTexto = 'Inicial';
  let litrosDia = '4 L/dia (2L manhã + 2L tarde)';
  let statusBadge: 'prenhe' | 'inseminada' | 'aviso' | 'secada' = 'inseminada';

  if (dias >= 16 && dias <= 100) {
    faseTexto = 'Pico de Aleitamento';
    litrosDia = '8 L/dia (4L manhã + 4L tarde)';
    statusBadge = 'prenhe';
  } else if (dias >= 101 && dias <= 121) {
    faseTexto = 'Desmame Gradual (Corte)';
    litrosDia = 'Corte semanal progressivo';
    statusBadge = 'aviso';
  } else if (dias >= 122) {
    faseTexto = 'Desmamada';
    litrosDia = '0 L (Apenas pasto/ração)';
    statusBadge = 'secada';
  }

  return (
    <ScrollView className="flex-1 bg-pasto-50" contentContainerClassName="gap-4 p-4 pb-12">
      {/* Cadastro de Bezerra */}
      <Cartao titulo="Módulo de Bezerras & Genealogia">
        <Text className="mb-4 text-sm text-gray-600">
          Acompanhamento individual desde o nascimento, genealogia em 3 níveis (Bezerra ➔ Mãe ➔ Pai ➔ Avó) e cálculo automático da curva de leite.
        </Text>
        <Botao
          titulo="Cadastrar Nova Bezerra"
          onPress={() => {}}
          variante="primario"
          principal
        />
      </Cartao>

      {/* Calculadora Interativa de Aleitamento */}
      <Cartao titulo="Calculadora de Leite por Idade">
        <Text className="mb-3 text-sm text-gray-600">
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

        <View className="rounded-xl border border-pasto-200 bg-pasto-50 p-4">
          <View className="flex-row items-center justify-between pb-2">
            <Text className="text-xs uppercase font-bold text-pasto-700">Fase Atual</Text>
            <SeloStatus status={statusBadge} texto={faseTexto} />
          </View>
          <Text className="text-lg font-black text-pasto-900">{litrosDia}</Text>
        </View>
      </Cartao>

      {/* Recria & Ganho Médio Diário */}
      <Cartao titulo="Recria & Peso-Alvo para 1ª IA">
        <View className="flex-row items-center justify-between pb-2">
          <Text className="text-sm font-semibold text-gray-700">Meta de peso para 1ª Inseminação:</Text>
          <Text className="font-extrabold text-pasto-900">~360 kg</Text>
        </View>
        <Text className="mb-4 text-xs text-gray-500">
          Acompanhe pesagens mensais e cálculo automático do GMD (g/dia) até a novilha estar apta.
        </Text>
        <Botao
          titulo="Lançar Pesagem Mensal (GMD)"
          onPress={() => {}}
          variante="secundario"
        />
      </Cartao>
    </ScrollView>
  );
}
