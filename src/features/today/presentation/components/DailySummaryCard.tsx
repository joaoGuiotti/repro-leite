import React from 'react';
import { Text, View } from 'react-native';
import { Cartao, SeloStatus } from '@/ui';
import { AlertWithAnimalSummary } from '@features/alerts';
import { TodayDashboardCounts } from '../../domain/today.types';

export interface DailySummaryCardProps {
  alerts?: AlertWithAnimalSummary[];
  counts?: TodayDashboardCounts;
  loading?: boolean;
}

export function DailySummaryCard({
  alerts = [],
  counts,
  loading = false,
}: DailySummaryCardProps) {
  const pendingHeat = counts
    ? counts.pendingHeat
    : alerts.filter((a) => a.type === 'heat_check_21d').length;

  const pendingPregnancy = counts
    ? counts.pendingPregnancy
    : alerts.filter((a) => a.type === 'pregnancy_check_45d').length;

  const morningLiters = counts ? counts.totalMorningLiters : 0;
  const afternoonLiters = counts ? counts.totalAfternoonLiters : 0;
  const activeCalves = counts ? counts.activeCalves : 0;

  return (
    <Cartao titulo="Painel Diário">
      <View className="gap-3">
        {/* 1. Cios para vigiar */}
        <View className="flex-row items-center justify-between rounded-xl bg-pasto-100 dark:bg-pasto-900/40 border border-transparent dark:border-pasto-700/60 p-3.5">
          <View>
            <Text className="text-xs uppercase font-bold text-pasto-700 dark:text-pasto-300">
              Cios para Vigiar (21d)
            </Text>
            <Text className="text-lg font-extrabold text-pasto-900 dark:text-pasto-100">
              {loading ? '...' : `${pendingHeat} ${pendingHeat === 1 ? 'vaca' : 'vacas'}`}
            </Text>
          </View>
          {pendingHeat > 0 ? (
            <SeloStatus status="aviso" texto={`${pendingHeat} pendente(s)`} />
          ) : (
            <SeloStatus status="prenhe" texto="Tudo em dia" />
          )}
        </View>

        {/* 2. Toques veterinários */}
        <View className="flex-row items-center justify-between rounded-xl bg-amber-100 dark:bg-amber-950/40 border border-transparent dark:border-amber-800/60 p-3.5">
          <View>
            <Text className="text-xs uppercase font-bold text-amber-700 dark:text-amber-300">
              Toques Veterinários (45d)
            </Text>
            <Text className="text-lg font-extrabold text-amber-900 dark:text-amber-200">
              {loading ? '...' : `${pendingPregnancy} ${pendingPregnancy === 1 ? 'vaca' : 'vacas'}`}
            </Text>
          </View>
          {pendingPregnancy > 0 ? (
            <SeloStatus status="alerta" texto={`${pendingPregnancy} pendente(s)`} />
          ) : (
            <SeloStatus status="prenhe" texto="Em dia" />
          )}
        </View>

        {/* 3. Trato do bezerreiro */}
        <View className="flex-row items-center justify-between rounded-xl bg-white dark:bg-slate-900 p-3.5 border border-gray-200 dark:border-slate-800">
          <View>
            <Text className="text-xs uppercase font-bold text-gray-500 dark:text-slate-400">
              Trato do Bezerreiro
            </Text>
            <Text className="text-lg font-extrabold text-pasto-900 dark:text-pasto-200">
              {loading ? '...' : `${morningLiters} L Manhã · ${afternoonLiters} L Tarde`}
            </Text>
          </View>
          <SeloStatus
            status={activeCalves > 0 ? 'prenhe' : 'secada'}
            texto={`${activeCalves} ${activeCalves === 1 ? 'bezerra' : 'bezerras'}`}
          />
        </View>
      </View>
    </Cartao>
  );
}
