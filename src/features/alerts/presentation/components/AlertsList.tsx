import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { Cartao, ListLoadingState, hapticFeedback } from '@/ui';
import { AlertWithAnimalSummary } from '../../domain/alert.entity';
import { AlertItemCard } from './AlertItemCard';

export interface AlertsListProps {
  alerts: AlertWithAnimalSummary[];
  loading?: boolean;
  onCompleteAlert?: (alertId: string) => Promise<boolean>;
  onAlertCompleted?: () => void;
  title?: string;
  emptyMessage?: string;
}

export function AlertsList({
  alerts,
  loading = false,
  onCompleteAlert,
  onAlertCompleted,
  title = 'Alertas e Manejos Pendentes',
  emptyMessage = 'Nenhum alerta pendente para a data selecionada.',
}: AlertsListProps) {
  const [completingId, setCompletingId] = useState<string | null>(null);

  const handleComplete = async (alertId: string) => {
    if (!onCompleteAlert) return;

    try {
      setCompletingId(alertId);
      const ok = await onCompleteAlert(alertId);
      if (ok) {
        await hapticFeedback.success();
        Alert.alert('Alerta Concluído', 'O manejo foi registrado como concluído.');
        onAlertCompleted?.();
      } else {
        await hapticFeedback.error();
        Alert.alert('Erro', 'Não foi possível concluir o alerta.');
      }
    } catch {
      await hapticFeedback.error();
      Alert.alert('Erro', 'Ocorreu uma falha ao concluir o alerta.');
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <View className="py-2">
        <ListLoadingState count={2} />
      </View>
    );
  }

  if (alerts.length === 0) {
    return (
      <Cartao className="p-5 items-center justify-center bg-pasto-50/60 dark:bg-pasto-950/20 border-pasto-200 dark:border-pasto-900/40 my-2">
        <View className="p-2.5 rounded-full bg-pasto-100 dark:bg-pasto-900/40 mb-2">
          <CheckCircle2 size={24} color="#15803d" />
        </View>
        <Text className="text-sm font-bold text-pasto-900 dark:text-pasto-200 text-center">
          Tudo em dia!
        </Text>
        <Text className="text-xs text-pasto-700 dark:text-pasto-400 text-center mt-0.5">
          {emptyMessage}
        </Text>
      </Cartao>
    );
  }

  return (
    <View className="gap-2.5 my-2">
      <View className="flex-row items-center justify-between mb-0.5 px-1">
        <Text className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
          {title}
        </Text>
        <Text className="text-xs font-bold text-gray-400 dark:text-gray-500">
          {alerts.length} {alerts.length === 1 ? 'tarefa' : 'tarefas'}
        </Text>
      </View>

      {alerts.map((alerta) => (
        <AlertItemCard
          key={alerta.id}
          alert={alerta}
          onComplete={onCompleteAlert ? handleComplete : undefined}
          completing={completingId === alerta.id}
        />
      ))}
    </View>
  );
}
