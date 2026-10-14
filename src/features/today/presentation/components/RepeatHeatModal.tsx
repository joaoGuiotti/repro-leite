import React from 'react';
import { Text, View } from 'react-native';
import { Flame, PlusCircle, CalendarX } from 'lucide-react-native';
import { Botao, Icon, ModalPadrao } from '@/ui';
import { BadgeBrinco } from '@features/herd';
import { AlertWithReproDetails } from '../../domain/today.types';

export interface RepeatHeatModalProps {
  visible: boolean;
  alert: AlertWithReproDetails | null;
  onClose: () => void;
  onRebreedNow: (alert: AlertWithReproDetails) => Promise<void>;
  onMarkEmptyOnly: (alert: AlertWithReproDetails) => Promise<void>;
  loading?: boolean;
}

export function RepeatHeatModal({
  visible,
  alert,
  onClose,
  onRebreedNow,
  onMarkEmptyOnly,
  loading = false,
}: RepeatHeatModalProps) {
  if (!alert) return null;

  return (
    <ModalPadrao
      visivel={visible}
      onFechar={onClose}
      titulo="Repetiu o Cio"
      subtitulo="Decisão reprodutiva aos 21 dias"
      iconeTitulo={<Icon icon={Flame} size="md" className="text-amber-500" decorative />}
    >
      <View className="gap-4 py-2">
        {/* Identificação do Animal */}
        <View className="flex-row items-center gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <BadgeBrinco numero={alert.animalEarTag} tamanho="md" />
          <View className="flex-1 min-w-0">
            <Text className="text-base font-black text-gray-900 dark:text-gray-100" numberOfLines={1}>
              {alert.animalName || `Vaca #${alert.animalEarTag}`}
            </Text>
            {alert.bullName ? (
              <Text className="text-xs text-gray-600 dark:text-gray-300">
                Última IA com: <Text className="font-bold">{alert.bullName}</Text>
              </Text>
            ) : null}
          </View>
        </View>

        <Text className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          A tentativa anterior de inseminação será registrada como <Text className="font-bold text-red-600 dark:text-red-400">vazia</Text>. Como deseja proceder agora?
        </Text>

        {/* Ações em 56px de altura */}
        <View className="gap-2.5 pt-2">
          <Botao
            titulo={loading ? 'Carregando...' : 'Re-inseminar Agora'}
            icone={<Icon icon={PlusCircle} size="md" className="text-white" decorative />}
            onPress={() => onRebreedNow(alert)}
            variante="primario"
            principal
            desabilitado={loading}
            accessibilityLabel={`Re-inseminar vaca ${alert.animalEarTag} imediatamente`}
          />

          <Botao
            titulo={loading ? 'Gravando...' : 'Apenas Marcar Cio / Vazia'}
            icone={<Icon icon={CalendarX} size="sm" className="text-gray-700 dark:text-gray-300" decorative />}
            onPress={() => onMarkEmptyOnly(alert)}
            variante="secundario"
            desabilitado={loading}
            accessibilityLabel={`Marcar vaca ${alert.animalEarTag} como vazia para cobrir depois`}
          />
        </View>
      </View>
    </ModalPadrao>
  );
}
