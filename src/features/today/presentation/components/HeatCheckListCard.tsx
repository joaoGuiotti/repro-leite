import React from 'react';
import { Text, View } from 'react-native';
import { Check, Flame, Clock } from 'lucide-react-native';
import { Botao, Cartao, Icon, SeloStatus } from '@/ui';
import { BadgeBrinco } from '@features/herd';
import { AlertWithReproDetails } from '../../domain/today.types';

export interface HeatCheckListCardProps {
  alerts: AlertWithReproDetails[];
  loading?: boolean;
  actionLoadingId?: string | null;
  onHeld: (alert: AlertWithReproDetails) => Promise<void>;
  onRepeated: (alert: AlertWithReproDetails) => void;
}

export function HeatCheckListCard({
  alerts,
  loading = false,
  actionLoadingId,
  onHeld,
  onRepeated,
}: HeatCheckListCardProps) {
  return (
    <Cartao titulo="Cios para Vigiar (21 dias)">
      <View className="gap-3">
        {alerts.length === 0 ? (
          <View className="py-3 items-center justify-center">
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Nenhuma fêmea na janela de retorno de cio para esta data.
            </Text>
          </View>
        ) : (
          alerts.map((item) => {
            const isItemLoading = actionLoadingId === item.id;

            return (
              <View
                key={item.id}
                className="p-3.5 rounded-2xl bg-surface dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 gap-3 shadow-xs"
              >
                {/* Cabeçalho do Cartão da Vaca */}
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
                      <SeloStatus status="aviso" texto="Vigiar" />
                    )}
                  </View>
                </View>

                {/* Detalhes de Dias */}
                <View className="flex-row items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Icon icon={Clock} size="sm" className="text-gray-400" decorative />
                  <Text className="text-xs text-gray-600 dark:text-gray-300">
                    {item.daysSinceInsemination !== undefined
                      ? `${item.daysSinceInsemination} dias desde a IA`
                      : 'Prazo de retorno de 21 dias'}
                  </Text>
                </View>

                {/* Ações em 1 Toque (Alvos >= 48dp) */}
                <View className="flex-row gap-2 pt-1">
                  <View className="flex-1">
                    <Botao
                      titulo={isItemLoading ? 'Gravando...' : 'Não Repetiu'}
                      icone={<Icon icon={Check} size="sm" className="text-pasto-800 dark:text-pasto-200" decorative />}
                      onPress={() => onHeld(item)}
                      variante="secundario"
                      desabilitado={loading || !!actionLoadingId}
                      accessibilityLabel={`Confirmar que vaca ${item.animalEarTag} não repetiu o cio`}
                    />
                  </View>
                  <View className="flex-1">
                    <Botao
                      titulo="Repetiu o Cio"
                      icone={<Icon icon={Flame} size="sm" className="text-amber-800 dark:text-amber-200" decorative />}
                      onPress={() => onRepeated(item)}
                      variante="aviso"
                      desabilitado={loading || !!actionLoadingId}
                      accessibilityLabel={`Registrar repetição de cio para a vaca ${item.animalEarTag}`}
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
