import React from 'react';
import { Text, View } from 'react-native';
import { CheckCheck, Clock, XCircle } from 'lucide-react-native';
import { Botao, Cartao, Icon, SeloStatus } from '@/ui';
import { BadgeBrinco } from '@features/herd';
import { AlertWithReproDetails } from '../../domain/today.types';

export interface PregnancyCheckListCardProps {
  alerts: AlertWithReproDetails[];
  loading?: boolean;
  actionLoadingId?: string | null;
  onConfirmPregnant: (alert: AlertWithReproDetails) => Promise<void>;
  onConfirmEmpty: (alert: AlertWithReproDetails) => Promise<void>;
}

export function PregnancyCheckListCard({
  alerts,
  loading = false,
  actionLoadingId,
  onConfirmPregnant,
  onConfirmEmpty,
}: PregnancyCheckListCardProps) {
  return (
    <Cartao titulo="Toques Veterinários (45 a 60 dias)">
      <View className="gap-3">
        {alerts.length === 0 ? (
          <View className="py-3 items-center justify-center">
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Nenhuma fêmea aguardando toque veterinário para esta data.
            </Text>
          </View>
        ) : (
          alerts.map((item) => {
            const isItemLoading = actionLoadingId === item.id;

            return (
              <View
                key={item.id}
                className="p-3.5 rounded-2xl bg-surface dark:bg-slate-900 border border-pasto-200/80 dark:border-pasto-900/40 gap-3 shadow-xs"
              >
                {/* Cabeçalho do Cartão */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2.5 flex-1 min-w-0 mr-2">
                    <BadgeBrinco numero={item.animalEarTag} tamanho="sm" />
                    <View className="flex-1 min-w-0">
                      <Text
                        className="text-sm font-black text-gray-950 dark:text-gray-100"
                        numberOfLines={1}
                      >
                        {item.animalName || `Vaca #${item.animalEarTag}`}
                      </Text>
                      {item.bullName ? (
                        <Text
                          className="text-xs text-gray-600 dark:text-gray-400"
                          numberOfLines={1}
                        >
                          IA com {item.bullName}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View className="flex-row items-center gap-1.5">
                    {item.isOverdue ? (
                      <SeloStatus status="alerta" texto="Atrasado" />
                    ) : (
                      <SeloStatus status="prenhe" texto="45 dias" />
                    )}
                  </View>
                </View>

                {/* Detalhes de Dias */}
                <View className="flex-row items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Icon icon={Clock} size="sm" className="text-gray-400" decorative />
                  <Text className="text-xs text-gray-600 dark:text-gray-300">
                    {item.daysSinceInsemination !== undefined
                      ? `${item.daysSinceInsemination} dias decorridos da IA`
                      : 'Diagnóstico gestacional programado'}
                  </Text>
                </View>

                {/* Ações em 1 Toque (Alvos >= 48dp) */}
                <View className="flex-row gap-2 pt-1">
                  <View className="flex-1">
                    <Botao
                      titulo={isItemLoading ? 'Gravando...' : 'Confirmar Prenhez'}
                      icone={<Icon icon={CheckCheck} size="sm" className="text-white" decorative />}
                      onPress={() => onConfirmPregnant(item)}
                      variante="primario"
                      desabilitado={loading || !!actionLoadingId}
                      accessibilityLabel={`Confirmar prenhez da vaca ${item.animalEarTag}`}
                    />
                  </View>
                  <View className="flex-1">
                    <Botao
                      titulo="Vazia"
                      icone={<Icon icon={XCircle} size="sm" className="text-red-700 dark:text-red-300" decorative />}
                      onPress={() => onConfirmEmpty(item)}
                      variante="perigo"
                      desabilitado={loading || !!actionLoadingId}
                      accessibilityLabel={`Marcar vaca ${item.animalEarTag} como vazia`}
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    </Cartao>
  );
}
