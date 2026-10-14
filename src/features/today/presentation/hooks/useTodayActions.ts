import { useState } from 'react';
import { Alert } from 'react-native';
import { hapticFeedback } from '@/ui';
import { ConfirmHeatObservationUseCase } from '../../application/confirm-heat-choice.usecase';
import { RecordPregnancyDiagnosisUseCase } from '../../application/record-pregnancy-touch.usecase';
import {
  AlertWithReproDetails,
  HeatObservationChoice,
  PregnancyDiagnosis,
} from '../../domain/today.types';

export interface UseTodayActionsProps {
  farmId: string;
  referenceDate: string;
  confirmHeatUseCase: ConfirmHeatObservationUseCase;
  recordPregnancyUseCase: RecordPregnancyDiagnosisUseCase;
  onSuccess?: () => void;
  onRebreedSelected?: (animalId: string) => void;
}

export function useTodayActions({
  farmId,
  referenceDate,
  confirmHeatUseCase,
  recordPregnancyUseCase,
  onSuccess,
  onRebreedSelected,
}: UseTodayActionsProps) {
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleHeatChoice = async (
    alertItem: AlertWithReproDetails,
    choice: HeatObservationChoice
  ) => {
    try {
      setActionLoadingId(alertItem.id);
      const res = await confirmHeatUseCase.execute({
        farmId,
        alertId: alertItem.id,
        animalId: alertItem.targetAnimalId,
        inseminationId: alertItem.sourceId,
        choice,
        referenceDate,
      });

      if (res.ok) {
        await hapticFeedback.success();
        if (res.value.redirectToRebreed && res.value.animalId) {
          onRebreedSelected?.(res.value.animalId);
        } else {
          Alert.alert(
            'Manejo Registrado',
            choice === 'held'
              ? `Vaca #${alertItem.animalEarTag} confirmada sem repetição de cio. Exame de toque aos 45 dias agendado.`
              : `Repetição de cio da vaca #${alertItem.animalEarTag} registrada. Animal apto para nova cobertura.`
          );
        }
        onSuccess?.();
      } else {
        await hapticFeedback.error();
        Alert.alert('Erro', res.error.message);
      }
    } catch {
      await hapticFeedback.error();
      Alert.alert('Erro', 'Ocorreu uma falha ao registrar o manejo de cio.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePregnancyDiagnosis = async (
    alertItem: AlertWithReproDetails,
    diagnosis: PregnancyDiagnosis
  ) => {
    try {
      setActionLoadingId(alertItem.id);
      const res = await recordPregnancyUseCase.execute({
        farmId,
        alertId: alertItem.id,
        animalId: alertItem.targetAnimalId,
        inseminationId: alertItem.sourceId,
        diagnosis,
        referenceDate,
      });

      if (res.ok) {
        await hapticFeedback.success();
        Alert.alert(
          'Diagnóstico Confirmado',
          diagnosis === 'pregnant'
            ? `Vaca #${alertItem.animalEarTag} confirmada PRENHE! Prazos de parto e secagem confirmados.`
            : `Vaca #${alertItem.animalEarTag} marcada como VAZIA. Alertas cancelados e vaca apta para nova IA.`
        );
        onSuccess?.();
      } else {
        await hapticFeedback.error();
        Alert.alert('Erro', res.error.message);
      }
    } catch {
      await hapticFeedback.error();
      Alert.alert('Erro', 'Ocorreu uma falha ao registrar o diagnóstico gestacional.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return {
    actionLoadingId,
    handleHeatChoice,
    handlePregnancyDiagnosis,
  };
}
