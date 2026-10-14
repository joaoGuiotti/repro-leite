import { AppIcons, hapticFeedback, Icon, Screen } from '@/ui';
import { DEFAULT_FARM_ID } from '@core/db';
import { BullsScreen } from '@features/bulls';
import { AnimalRecord, HerdScreen } from '@features/herd';
import { InseminationScreen } from '@features/insemination';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export interface ReproductionScreenProps {
  farmId?: string;
  initialTab?: 'rebanho' | 'inseminar' | 'touros';
}

/**
 * Tela principal de Reprodução & Curral, orquestrando as abas de Rebanho, Inseminar e Touros.
 */
export function ReproductionScreen({
  farmId = DEFAULT_FARM_ID,
  initialTab = 'rebanho',
}: ReproductionScreenProps) {
  const [secaoAtiva, setSecaoAtiva] = useState<'rebanho' | 'inseminar' | 'touros'>(initialTab);
  const [totalRebanho, setTotalRebanho] = useState<number>(0);
  const [totalTouros, setTotalTouros] = useState<number>(0);
  const [vacaPreSelecionada, setVacaPreSelecionada] = useState<AnimalRecord | null>(null);

  const menuOptions = [
    {
      id: 'rebanho',
      label: 'Rebanho',
      icon: AppIcons.herdGroup,
      count: totalRebanho,
    },
    {
      id: 'inseminar',
      label: 'Inseminar',
      icon: AppIcons.insemination,
      count: 0,
    },
    {
      id: 'touros',
      label: 'Touros',
      icon: AppIcons.bulls,
      count: totalTouros,
    },
  ];

  const handleTabChange = async (
    tab: 'rebanho' | 'inseminar' | 'touros',
    preselectedAnimal?: AnimalRecord | null
  ) => {
    await hapticFeedback.selection();
    if (tab === 'inseminar') {
      setVacaPreSelecionada(preselectedAnimal ?? null);
    }
    setSecaoAtiva(tab);
  };

  return (
    <Screen edges={['top', 'left', 'right']} className="flex-1">
      {/* Seletor Segmentado Superior com Acessibilidade e Alvos de Toque Adequados */}
      <View className="px-4 pt-1 pb-2 bg-surface dark:bg-surface-dark border-b border-gray-200 dark:border-slate-800">
        <View className="flex-row rounded-2xl bg-gray-100 dark:bg-slate-800 p-1.5">
          {menuOptions.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: secaoAtiva === option.id }}
              accessibilityLabel={`${option.label} (${option.count} animais)`}
              onPress={() => handleTabChange(option.id as 'rebanho' | 'inseminar' | 'touros')}
              className={`flex-1 flex-row items-center justify-center rounded-xl py-3 min-h-[48px] ${secaoAtiva === option.id
                ? 'bg-pasto-700 shadow-xs'
                : 'bg-transparent active:bg-gray-200 dark:active:bg-slate-700'
                }`}
            >
              <Icon
                icon={option.icon}
                size="sm"
                decorative
                className={
                  secaoAtiva === option.id
                    ? 'text-white mr-1.5'
                    : 'text-gray-700 dark:text-slate-200 mr-1.5'
                }
              />
              <Text
                className={`font-black text-xs ${secaoAtiva === option.id ? 'text-white' : 'text-gray-700 dark:text-slate-200'
                  }`}
              >
                {option.label} ({option.count})
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Conteúdo Dinâmico por Aba */}
      <View className="flex-1 bg-surface-variant dark:bg-surface-dark">
        {secaoAtiva === 'rebanho' ? (
          <HerdScreen
            farmId={farmId}
            onInseminateAnimal={(animal) => {
              void handleTabChange('inseminar', animal);
            }}
            onCountChange={setTotalRebanho}
          />
        ) : secaoAtiva === 'inseminar' ? (
          <InseminationScreen
            farmId={farmId}
            vacaPreSelecionada={vacaPreSelecionada}
          />
        ) : (
          <BullsScreen
            farmId={farmId}
            onCountChange={setTotalTouros}
          />
        )}
      </View>
    </Screen>
  );
}
