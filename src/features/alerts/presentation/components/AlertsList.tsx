import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { Bell, CheckCircle2 } from 'lucide-react-native';
import { Cartao } from '@/ui';
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
        Alert.alert('Alerta Concluído', 'O manejo foi registrado como concluído.');
        onAlertCompleted?.();
      } else {
        Alert.alert('Erro', 'Não foi possível concluir o alerta.');
      }
    } catch {
      Alert.alert('Erro', 'Ocorreu uma falha ao concluir o alerta.');
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <View className="py-6 items-center justify-center">
        <ActivityIndicator size="small" color="#1b4332" />
        <Text className="text-xs text-gray-500 mt-2 font-medium">
          Carregando alertas do rebanho...
        </Text>
      </View>
    );
  }

  if (alerts.length === 0) {
    return (
      <Cartao className="p-4 items-center justify-center bg-gray-50 my-2">
        <CheckCircle2 size={24} color="#15803d" />
        <Text className="text-sm font-semibold text-gray-600 mt-2 text-center">
          {emptyMessage}
        </Text>
      </Cartao>
    );
  }

  return (
    <View className="gap-2.5 my-2">
      {/* Cabeçalho da Lista */}
      <View className="flex-row items-center justify-between mb-0.5 px-1">
        <View className="flex-row items-center gap-1.5">
          <Bell size={16} color="#4b5563" />
          <Text className="text-xs font-black uppercase tracking-wider text-gray-700">
            {title}
          </Text>
        </View>
        <Text className="text-xs font-bold text-gray-400">
          {alerts.length} {alerts.length === 1 ? 'pendência' : 'pendências'}
        </Text>
      </View>

      {/* Itens */}
      {alerts.map((item) => (
        <AlertItemCard
          key={item.id}
          alert={item}
          onComplete={onCompleteAlert ? handleComplete : undefined}
          completing={completingId === item.id}
        />
      ))}
    </View>
  );
}
