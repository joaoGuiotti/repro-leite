import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { formatToDisplay, useManagementDate } from '@core/simulation';
import { DEFAULT_FARM_ID } from '@core/db';
import { Cartao, SeloStatus } from '@/ui';
import {
  AlertsList,
  getAlertsUseCases,
  useAlerts,
  useCompleteAlert,
} from '@features/alerts';
import { DailySummaryCard } from '../components/DailySummaryCard';
import { QuickActionsCard } from '../components/QuickActionsCard';

export interface TodayScreenProps {
  farmId?: string;
}

export function TodayScreen({ farmId = DEFAULT_FARM_ID }: TodayScreenProps) {
  const { activeDateString, isSimulated } = useManagementDate();

  const alertsUseCases = getAlertsUseCases();
  const { alerts, loading, refresh } = useAlerts(
    farmId,
    alertsUseCases.listPendingUseCase,
    activeDateString
  );
  const { completeAlert } = useCompleteAlert(alertsUseCases.completeUseCase);

  return (
    <ScrollView className="flex-1 bg-pasto-50" contentContainerClassName="gap-4 p-4 pb-12">
      {/* 1. Card de Boas-Vindas e Resumo do Dia */}
      <Cartao titulo="Hoje no Curral">
        <View className="flex-row items-center justify-between pb-2">
          <Text className="text-sm text-gray-600">
            Manejo ativo para:{' '}
            <Text className="font-bold text-pasto-900">
              {formatToDisplay(activeDateString)}
            </Text>
          </Text>
          {isSimulated ? (
            <SeloStatus status="aviso" texto="Data Simulada" />
          ) : (
            <SeloStatus status="prenhe" texto="Data Real" />
          )}
        </View>

        <Text className="text-base text-gray-700">
          Bem-vindo ao ReproLeite. O aplicativo está operando 100% offline em Modo Curral
          com o SQLite local protegido.
        </Text>
      </Cartao>

      {/* 2. Ações Rápidas no Curral */}
      <QuickActionsCard />

      {/* 3. Painel Diário com Contadores Vivos */}
      <DailySummaryCard alerts={alerts} loading={loading} />

      {/* 4. Lista de Alertas Ativos e Manejos do Dia */}
      {alerts.length > 0 && (
        <AlertsList
          alerts={alerts}
          loading={loading}
          onCompleteAlert={completeAlert}
          onAlertCompleted={refresh}
          title="Manejos para Realizar Hoje"
          emptyMessage="Nenhum manejo pendente para hoje."
        />
      )}
    </ScrollView>
  );
}
