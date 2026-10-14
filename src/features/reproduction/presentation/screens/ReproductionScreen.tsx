import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Shield, Sparkles, Users } from 'lucide-react-native';
import { DEFAULT_FARM_ID } from '@core/db';
import { AnimalRecord, HerdScreen } from '@features/herd';
import { BullsScreen } from '@features/bulls';
import { InseminationScreen } from '@features/insemination';

export interface ReproductionScreenProps {
  farmId?: string;
  initialTab?: 'rebanho' | 'inseminar' | 'touros';
}

export function ReproductionScreen({
  farmId = DEFAULT_FARM_ID,
  initialTab = 'rebanho',
}: ReproductionScreenProps) {
  const [secaoAtiva, setSecaoAtiva] = useState<'rebanho' | 'inseminar' | 'touros'>(initialTab);

  // Contadores para o cabeçalho segmentado
  const [totalRebanho, setTotalRebanho] = useState<number>(0);
  const [totalTouros, setTotalTouros] = useState<number>(0);

  // Inseminação
  const [vacaPreSelecionada, setVacaPreSelecionada] = useState<AnimalRecord | null>(null);

  return (
    <ScrollView className="flex-1 bg-pasto-50" contentContainerClassName="gap-4 p-4 pb-16">
      {/* Seletor Segmentado Superior: Rebanho vs Inseminar vs Touros */}
      <View className="flex-row rounded-2xl bg-gray-200 p-1.5">
        <TouchableOpacity
          onPress={() => setSecaoAtiva('rebanho')}
          className={
            secaoAtiva === 'rebanho'
              ? 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-pasto-700'
              : 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-transparent'
          }
        >
          <Users
            size={16}
            color={secaoAtiva === 'rebanho' ? '#ffffff' : '#4b5563'}
            className="mr-1.5"
          />
          <Text
            className={
              secaoAtiva === 'rebanho'
                ? 'font-black text-xs text-white'
                : 'font-black text-xs text-gray-700'
            }
          >
            Rebanho ({totalRebanho})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setVacaPreSelecionada(null);
            setSecaoAtiva('inseminar');
          }}
          className={
            secaoAtiva === 'inseminar'
              ? 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-pasto-700'
              : 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-transparent'
          }
        >
          <Sparkles
            size={16}
            color={secaoAtiva === 'inseminar' ? '#ffffff' : '#4b5563'}
            className="mr-1.5"
          />
          <Text
            className={
              secaoAtiva === 'inseminar'
                ? 'font-black text-xs text-white'
                : 'font-black text-xs text-gray-700'
            }
          >
            Inseminar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSecaoAtiva('touros')}
          className={
            secaoAtiva === 'touros'
              ? 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-pasto-700'
              : 'flex-1 flex-row items-center justify-center rounded-xl py-3 bg-transparent'
          }
        >
          <Shield
            size={16}
            color={secaoAtiva === 'touros' ? '#ffffff' : '#4b5563'}
            className="mr-1.5"
          />
          <Text
            className={
              secaoAtiva === 'touros'
                ? 'font-black text-xs text-white'
                : 'font-black text-xs text-gray-700'
            }
          >
            Touros ({totalTouros})
          </Text>
        </TouchableOpacity>
      </View>

      {secaoAtiva === 'rebanho' ? (
        /* Seção Rebanho gerenciada pelo módulo isolado @features/herd */
        <HerdScreen
          farmId={farmId}
          onInseminateAnimal={(animal) => {
            setVacaPreSelecionada(animal);
            setSecaoAtiva('inseminar');
          }}
          onCountChange={setTotalRebanho}
        />
      ) : secaoAtiva === 'inseminar' ? (
        /* Seção: Lançamento de Inseminação Rápida & Histórico Recente */
        <InseminationScreen
          farmId={farmId}
          vacaPreSelecionada={vacaPreSelecionada}
        />
      ) : (
        /* Seção: Catálogo de Touros e Estoque de Sêmen gerenciada por @features/bulls */
        <BullsScreen
          farmId={farmId}
          onCountChange={setTotalTouros}
        />
      )}
    </ScrollView>
  );
}
