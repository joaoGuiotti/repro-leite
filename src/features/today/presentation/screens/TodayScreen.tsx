import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { i18n } from '@/i18n';
import { Cartao, ErrorState, ListLoadingState, Screen, SeloStatus } from '@/ui';
import { DEFAULT_FARM_ID } from '@core/db';
import { formatToDisplay, useManagementDate } from '@core/simulation';
import { AlertWithReproDetails } from '../../domain/today.types';
import { getTodayUseCases } from '../../factory';
import { CalfFeedingCard } from '../components/CalfFeedingCard';
import { DailySummaryCard } from '../components/DailySummaryCard';
import { HeatCheckListCard } from '../components/HeatCheckListCard';
import { PregnancyCheckListCard } from '../components/PregnancyCheckListCard';
import { QuickActionsCard } from '../components/QuickActionsCard';
import { RepeatHeatModal } from '../components/RepeatHeatModal';
import { useTodayActions } from '../hooks/useTodayActions';
import { useTodayDashboard } from '../hooks/useTodayDashboard';

export interface TodayScreenProps {
  farmId?: string;
}

export function TodayScreen({ farmId = DEFAULT_FARM_ID }: TodayScreenProps) {
  const router = useRouter();
  const { activeDateString, isSimulated } = useManagementDate();
  const [selectedRepeatAlert, setSelectedRepeatAlert] =
    useState<AlertWithReproDetails | null>(null);

  const todayUseCases = useMemo(() => getTodayUseCases(), []);

  const { data, loading, error, refresh } = useTodayDashboard(
    farmId,
    activeDateString,
    todayUseCases.getDashboardUseCase
  );

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const { actionLoadingId, handleHeatChoice, handlePregnancyDiagnosis } =
    useTodayActions({
      farmId,
      referenceDate: activeDateString,
      confirmHeatUseCase: todayUseCases.confirmHeatUseCase,
      recordPregnancyUseCase: todayUseCases.recordPregnancyUseCase,
      onSuccess: refresh,
      onRebreedSelected: (animalId) => {
        setSelectedRepeatAlert(null);
        router.push(
          `/(tabs)/reproducao?action=inseminate&animalId=${animalId}` as any
        );
      },
    });

  const emptyFeedingSummary = {
    totalMorningLiters: 0,
    totalAfternoonLiters: 0,
    totalDailyLiters: 0,
    activeCalvesCount: 0,
    weaningCount: 0,
    transitioningCalves: [],
  };

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} />
      }
      contentContainerClassName="gap-4 p-4 pb-16"
    >
      {/* 1. Card de Boas-Vindas e Resumo do Dia */}
      <Cartao titulo={i18n.today.title}>
        <View className="flex-row items-center justify-between pb-2">
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            {i18n.today.activeDate}{' '}
            <Text className="font-bold text-pasto-900 dark:text-pasto-200">
              {formatToDisplay(activeDateString)}
            </Text>
          </Text>
          {isSimulated ? (
            <SeloStatus status="aviso" texto={i18n.today.simulatedDate} />
          ) : (
            <SeloStatus status="prenhe" texto={i18n.today.realDate} />
          )}
        </View>

        <Text className="text-base text-gray-700 dark:text-gray-200">
          {i18n.today.curralModeNotice}
        </Text>
      </Cartao>

      {/* 2. Ações Rápidas no Curral */}
      <QuickActionsCard />

      {/* 3. Painel Diário com Contadores Vivos */}
      <DailySummaryCard counts={data?.counts} loading={loading} />

      {error && !data ? (
        <View className="py-4">
          <ErrorState message={error} onRetry={refresh} />
        </View>
      ) : loading && !data ? (
        <View className="py-4">
          <ListLoadingState count={3} />
        </View>
      ) : (
        <>
          {/* 4. Quadro de Cios para Vigiar (Janela de 21 dias) */}
          <HeatCheckListCard
            alerts={data?.heatAlerts ?? []}
            loading={loading}
            actionLoadingId={actionLoadingId}
            onHeld={(alert) => handleHeatChoice(alert, 'held')}
            onRepeated={(alert) => setSelectedRepeatAlert(alert)}
          />

          {/* 5. Quadro de Toques Veterinários (45 a 60 dias) */}
          <PregnancyCheckListCard
            alerts={data?.pregnancyAlerts ?? []}
            loading={loading}
            actionLoadingId={actionLoadingId}
            onConfirmPregnant={(alert) =>
              handlePregnancyDiagnosis(alert, 'pregnant')
            }
            onConfirmEmpty={(alert) =>
              handlePregnancyDiagnosis(alert, 'empty')
            }
          />

          {/* 6. Quadro do Bezerreiro (Trato de Hoje) */}
          <CalfFeedingCard
            summary={data?.feedingSummary ?? emptyFeedingSummary}
            loading={loading}
          />
        </>
      )}

      {/* Modal de Decisão Rápida para Repetição de Cio */}
      <RepeatHeatModal
        visible={!!selectedRepeatAlert}
        alert={selectedRepeatAlert}
        loading={!!actionLoadingId}
        onClose={() => setSelectedRepeatAlert(null)}
        onRebreedNow={async (alert) => {
          await handleHeatChoice(alert, 'repeated_rebreed');
        }}
        onMarkEmptyOnly={async (alert) => {
          await handleHeatChoice(alert, 'repeated_empty_only');
          setSelectedRepeatAlert(null);
        }}
      />
    </Screen>
  );
}
