import { i18n } from '@/i18n';
import { Cartao, Screen, SeloStatus } from '@/ui';
import { DEFAULT_FARM_ID } from '@core/db';
import { formatToDisplay, useManagementDate } from '@core/simulation';
import {
  AlertsList,
  getAlertsUseCases,
  useAlerts,
  useCompleteAlert,
} from '@features/alerts';
import { Text, View } from 'react-native';
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
    <Screen scroll contentContainerClassName="gap-4 p-4 pb-16">
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
      <DailySummaryCard alerts={alerts} loading={loading} />

      {/* 4. Lista de Alertas Ativos e Manejos do Dia */}
      <AlertsList
        alerts={alerts}
        loading={loading}
        onCompleteAlert={completeAlert}
        onAlertCompleted={refresh}
        title="Manejos para Realizar Hoje"
        emptyMessage="Nenhum manejo pendente para hoje."
      />
    </Screen>
  );
}
