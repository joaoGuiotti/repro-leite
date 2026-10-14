import React from 'react';
import { Text, View } from 'react-native';
import { Cartao, SeloStatus } from '@/ui';
import { AlertWithAnimalSummary } from '@features/alerts';

export interface DailySummaryCardProps {
  alerts: AlertWithAnimalSummary[];
  loading?: boolean;
}

export function DailySummaryCard({ alerts, loading = false }: DailySummaryCardProps) {
  const ciosPendentes = alerts.filter((a) => a.type === 'heat_check_21d');
  const toquesPendentes = alerts.filter((a) => a.type === 'pregnancy_check_45d');

  return (
    <Cartao titulo="Painel Diário">
      <View className="gap-3">
        {/* 1. Cios para vigiar */}
        <View className="flex-row items-center justify-between rounded-xl bg-pasto-100 p-3.5">
          <View>
            <Text className="text-xs uppercase font-bold text-pasto-700">
              Cios para Vigiar (21d)
            </Text>
            <Text className="text-lg font-extrabold text-pasto-900">
              {loading ? '...' : `${ciosPendentes.length} ${ciosPendentes.length === 1 ? 'vaca' : 'vacas'}`}
            </Text>
          </View>
          {ciosPendentes.length > 0 ? (
            <SeloStatus status="aviso" texto={`${ciosPendentes.length} pendente(s)`} />
          ) : (
            <SeloStatus status="vazia" texto="Nenhum alerta" />
          )}
        </View>

        {/* 2. Toques veterinários */}
        <View className="flex-row items-center justify-between rounded-xl bg-ambar-100 p-3.5">
          <View>
            <Text className="text-xs uppercase font-bold text-ambar-700">
              Toques Veterinários (45d)
            </Text>
            <Text className="text-lg font-extrabold text-amber-900">
              {loading ? '...' : `${toquesPendentes.length} ${toquesPendentes.length === 1 ? 'vaca' : 'vacas'}`}
            </Text>
          </View>
          {toquesPendentes.length > 0 ? (
            <SeloStatus status="alerta" texto={`${toquesPendentes.length} pendente(s)`} />
          ) : (
            <SeloStatus status="prenhe" texto="Em dia" />
          )}
        </View>

        {/* 3. Trato do bezerreiro */}
        <View className="flex-row items-center justify-between rounded-xl bg-white p-3.5 border border-gray-200">
          <View>
            <Text className="text-xs uppercase font-bold text-gray-500">
              Trato do Bezerreiro
            </Text>
            <Text className="text-lg font-extrabold text-pasto-900">
              0 L Manhã · 0 L Tarde
            </Text>
          </View>
          <SeloStatus status="secada" texto="0 bezerras" />
        </View>
      </View>
    </Cartao>
  );
}
