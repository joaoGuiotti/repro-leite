import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Cartao, Botao, SeloStatus, CampoNumerico } from '@/ui';

export default function TelaReproducao() {
  const [buscaBrinco, setBuscaBrinco] = useState('');

  return (
    <ScrollView className="flex-1 bg-pasto-50" contentContainerClassName="gap-4 p-4 pb-12">
      {/* Ação Principal: Lançamento Rápido no Curral */}
      <Cartao titulo="Inseminação Artificial (IA em 3 Toques)">
        <Text className="mb-4 text-sm text-gray-600">
          Registre coberturas diretamente no curral com cálculo automático de retorno de cio (21d), toque (45d) e previsão de parto (282d).
        </Text>

        <View className="mb-4">
          <CampoNumerico
            rotulo="Localizar Vaca pelo Brinco"
            valor={buscaBrinco}
            onChange={setBuscaBrinco}
            placeholder="Ex: 104"
          />
        </View>

        <View className="gap-2.5">
          <Botao
            titulo="Lançar Nova Inseminação"
            onPress={() => {}}
            variante="primario"
            principal
          />
          <Botao
            titulo="Consultar Catálogo de Touros"
            onPress={() => {}}
            variante="secundario"
          />
        </View>
      </Cartao>

      {/* Visão do Rebanho por Status */}
      <Cartao titulo="Status Reprodutivo do Rebanho">
        <View className="flex-row flex-wrap gap-2 pt-1">
          <View className="flex-1 min-w-[140px] rounded-xl bg-gray-50 border border-gray-200 p-3">
            <SeloStatus status="vazia" texto="Vazias" />
            <Text className="mt-2 text-2xl font-black text-gray-900">0</Text>
            <Text className="text-xs text-gray-500">Aguardando cio</Text>
          </View>

          <View className="flex-1 min-w-[140px] rounded-xl bg-blue-50 border border-blue-200 p-3">
            <SeloStatus status="inseminada" texto="Inseminadas" />
            <Text className="mt-2 text-2xl font-black text-blue-900">0</Text>
            <Text className="text-xs text-blue-600">Vigiar aos 21 dias</Text>
          </View>

          <View className="flex-1 min-w-[140px] rounded-xl bg-pasto-50 border border-pasto-200 p-3">
            <SeloStatus status="prenhe" texto="Prenhes" />
            <Text className="mt-2 text-2xl font-black text-pasto-900">0</Text>
            <Text className="text-xs text-pasto-700">Confirmadas no toque</Text>
          </View>

          <View className="flex-1 min-w-[140px] rounded-xl bg-terra-50 border border-terra-200 p-3">
            <SeloStatus status="secada" texto="Secas" />
            <Text className="mt-2 text-2xl font-black text-terra-700">0</Text>
            <Text className="text-xs text-terra-500">Próximas ao parto</Text>
          </View>
        </View>
      </Cartao>

      {/* Catálogo de Touros e Sêmen */}
      <Cartao titulo="Estoque de Doses de Sêmen">
        <View className="flex-row items-center justify-between pb-3">
          <Text className="text-sm font-semibold text-gray-700">Touros cadastrados:</Text>
          <SeloStatus status="vazia" texto="0 cadastrados" />
        </View>
        <Botao
          titulo="Cadastrar Touro / Doses"
          onPress={() => {}}
          variante="secundario"
        />
      </Cartao>
    </ScrollView>
  );
}
