import React from 'react';
import { Text, View } from 'react-native';
import { Cloud, FileSpreadsheet, RotateCcw, Share2, Sliders } from 'lucide-react-native';
import { DEFAULT_FARM_ID } from '@core/db';
import { useSyncStatus } from '@core/sync';
import { Botao, Cartao, Icon, SeloStatus, Screen, hapticFeedback } from '@/ui';
import { i18n } from '@/i18n';
import { getSettingsUseCases } from '../../factory';
import { useSettings } from '../hooks/useSettings';

export interface SettingsScreenProps {
  farmId?: string;
}

export function SettingsScreen({ farmId = DEFAULT_FARM_ID }: SettingsScreenProps) {
  const {
    state,
    pendingCount,
    lastSyncedDescription,
    triggerSyncNow,
    isSimulatedOffline,
  } = useSyncStatus();

  const useCases = getSettingsUseCases();
  const { parameters } = useSettings(
    farmId,
    useCases.getUseCase,
    useCases.updateUseCase
  );

  const handleSync = async () => {
    await hapticFeedback.selection();
    triggerSyncNow();
  };

  return (
    <Screen scroll contentContainerClassName="gap-4 p-4 pb-16">
      {/* 1. Backup em 1 Clique e WhatsApp */}
      <Cartao titulo="Backup & Segurança dos Dados">
        <Text className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          Seus dados estão protegidos no banco SQLite local. Exporte cópias extras a qualquer
          momento para abrir no Excel ou enviar por WhatsApp.
        </Text>

        <View className="gap-2.5">
          <Botao
            titulo="Exportar Backup para WhatsApp (JSON)"
            icone={<Icon icon={Share2} size="md" className="text-white" decorative />}
            onPress={() => {}}
            variante="primario"
            principal
          />
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <Botao
                titulo="CSV Rebanho"
                icone={<Icon icon={FileSpreadsheet} size="sm" className="text-pasto-900 dark:text-pasto-200" decorative />}
                onPress={() => {}}
                variante="secundario"
              />
            </View>
            <View className="flex-1">
              <Botao
                titulo="CSV Bezerras"
                icone={<Icon icon={FileSpreadsheet} size="sm" className="text-pasto-900 dark:text-pasto-200" decorative />}
                onPress={() => {}}
                variante="secundario"
              />
            </View>
          </View>
          <Botao
            titulo="Restaurar Dados de Arquivo JSON"
            icone={<Icon icon={RotateCcw} size="sm" className="text-amber-800 dark:text-amber-300" decorative />}
            onPress={() => {}}
            variante="aviso"
          />
        </View>
      </Cartao>

      {/* 2. Conta & Sincronização em Nuvem */}
      <Cartao titulo={i18n.settings.sync}>
        <View className="flex-row items-center justify-between pb-3">
          <View>
            <Text className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400">Status da Nuvem</Text>
            <Text className="text-sm font-bold text-gray-900 dark:text-gray-100">{lastSyncedDescription}</Text>
          </View>
          <SeloStatus
            status={state === 'protected' ? 'prenhe' : state === 'pending' ? 'aviso' : 'alerta'}
            texto={state === 'protected' ? 'Conectado' : `${pendingCount} Pendentes`}
          />
        </View>

        <Text className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          {isSimulatedOffline
            ? 'Modo Curral Offline Simulado ativo no cabeçalho.'
            : 'Sincronização assíncrona automática ativa quando houver sinal de internet.'}
        </Text>

        <View className="gap-2.5">
          <Botao
            titulo={i18n.settings.forceSync}
            icone={<Icon icon={Cloud} size="sm" className="text-pasto-900 dark:text-pasto-200" decorative />}
            onPress={handleSync}
            variante="secundario"
            desabilitado={isSimulatedOffline || state === 'syncing'}
          />
          <Botao
            titulo="Entrar com Conta (E-mail OTP)"
            onPress={() => {}}
            variante="secundario"
          />
        </View>
      </Cartao>

      {/* 3. Parâmetros Zootécnicos da Fazenda */}
      <Cartao titulo="Parâmetros da Fazenda">
        <View className="gap-2 pb-4">
          <View className="flex-row justify-between border-b border-gray-100 dark:border-slate-800 pb-1.5">
            <Text className="text-sm text-gray-600 dark:text-gray-400">Janela de Retorno de Cio:</Text>
            <Text className="font-bold text-pasto-900 dark:text-pasto-300">{parameters.heatWindowDays} dias</Text>
          </View>
          <View className="flex-row justify-between border-b border-gray-100 dark:border-slate-800 pb-1.5">
            <Text className="text-sm text-gray-600 dark:text-gray-400">Diagnóstico de Toque:</Text>
            <Text className="font-bold text-pasto-900 dark:text-pasto-300">{parameters.pregnancyCheckDays} dias</Text>
          </View>
          <View className="flex-row justify-between border-b border-gray-100 dark:border-slate-800 pb-1.5">
            <Text className="text-sm text-gray-600 dark:text-gray-400">Duração da Gestação:</Text>
            <Text className="font-bold text-pasto-900 dark:text-pasto-300">{parameters.gestationDays} dias (~9 meses)</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600 dark:text-gray-400">Secagem da Vaca:</Text>
            <Text className="font-bold text-pasto-900 dark:text-pasto-300">{parameters.dryOffDays} dias antes do parto</Text>
          </View>
        </View>

        <Botao
          titulo="Editar Metas e Prazos"
          icone={<Icon icon={Sliders} size="sm" className="text-pasto-900 dark:text-pasto-200" decorative />}
          onPress={() => {}}
          variante="secundario"
        />
      </Cartao>
    </Screen>
  );
}
