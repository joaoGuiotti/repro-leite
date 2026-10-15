import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { i18n } from '@/i18n';
import { Botao, Cartao, Icon, Screen, SeloStatus, hapticFeedback } from '@/ui';
import { DEFAULT_FARM_ID } from '@core/db';
import { useSyncStatus } from '@core/sync';
import { Cloud, Copy, FileSpreadsheet, RotateCcw, Share2, Sliders } from 'lucide-react-native';
import { getSettingsUseCases } from '../../factory';
import { useSettings } from '../hooks/useSettings';
import { BackupPayload } from '../../domain/backup.types';
import { validateBackupPayload } from '../../domain/engines/validate-backup';
import { RestoreConfirmModal } from '../components/RestoreConfirmModal';
import { EditSettingsModal } from '../components/EditSettingsModal';
import { FarmParameters } from '../../domain/setting.entity';

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
  const { parameters, refresh, saveParameters } = useSettings(
    farmId,
    useCases.getUseCase,
    useCases.updateUseCase
  );

  const [exportingWhatsApp, setExportingWhatsApp] = useState(false);
  const [exportingHerdCsv, setExportingHerdCsv] = useState(false);
  const [exportingCalvesCsv, setExportingCalvesCsv] = useState(false);
  const [copyingBackup, setCopyingBackup] = useState(false);

  const [restoring, setRestoring] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [restorePayload, setRestorePayload] = useState<BackupPayload | null>(null);
  const [restoreRawContent, setRestoreRawContent] = useState<string | null>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);

  const isBusy = exportingWhatsApp || exportingHerdCsv || exportingCalvesCsv || copyingBackup;

  const handleSync = async () => {
    await hapticFeedback.selection();
    triggerSyncNow();
  };

  const handleExportWhatsApp = async () => {
    try {
      await hapticFeedback.selection();
      setExportingWhatsApp(true);
      const res = await useCases.exportWhatsAppBackupUseCase.execute({ farmId });
      if (!res.ok) {
        Alert.alert('Erro ao Exportar', res.error.message);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar o backup.');
    } finally {
      setExportingWhatsApp(false);
    }
  };

  const handleCopyBackup = async () => {
    try {
      await hapticFeedback.selection();
      setCopyingBackup(true);
      const res = await useCases.copyBackupUseCase.execute({ farmId });
      if (res.ok) {
        await hapticFeedback.success();
        Alert.alert('Copiado!', 'O backup JSON compacto foi copiado para sua área de transferência.');
      } else {
        Alert.alert('Erro', res.error.message);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível copiar o backup.');
    } finally {
      setCopyingBackup(false);
    }
  };

  const handleExportHerdCsv = async () => {
    try {
      await hapticFeedback.selection();
      setExportingHerdCsv(true);
      const res = await useCases.exportHerdCsvUseCase.execute({ farmId });
      if (!res.ok) {
        Alert.alert('Erro ao Exportar CSV', res.error.message);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível exportar a planilha do rebanho.');
    } finally {
      setExportingHerdCsv(false);
    }
  };

  const handleExportCalvesCsv = async () => {
    try {
      await hapticFeedback.selection();
      setExportingCalvesCsv(true);
      const res = await useCases.exportCalvesCsvUseCase.execute({ farmId });
      if (!res.ok) {
        Alert.alert('Erro ao Exportar CSV', res.error.message);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível exportar a planilha das bezerras.');
    } finally {
      setExportingCalvesCsv(false);
    }
  };

  const handlePickRestoreFile = async () => {
    try {
      await hapticFeedback.selection();
      const content = await useCases.fileShareService.pickJsonFile();
      if (!content) return;

      const validation = validateBackupPayload(content, farmId);
      if (!validation.ok) {
        Alert.alert('Backup Inválido', validation.error);
        return;
      }

      setRestorePayload(validation.value);
      setRestoreRawContent(content);
      setRestoreModalVisible(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao ler o arquivo.';
      Alert.alert('Erro ao Carregar Arquivo', msg);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoreRawContent) return;

    try {
      setRestoring(true);
      const res = await useCases.restoreBackupUseCase.execute({
        jsonContent: restoreRawContent,
        targetFarmId: farmId,
      });

      if (res.ok) {
        await refresh();
        setRestoreModalVisible(false);
        setRestorePayload(null);
        setRestoreRawContent(null);
        Alert.alert('Restauração Concluída', 'Todos os dados foram restaurados com sucesso no banco local.');
      } else {
        Alert.alert('Falha na Restauração', res.error.message);
      }
    } catch {
      Alert.alert('Erro', 'Ocorreu um erro inesperado durante a restauração.');
    } finally {
      setRestoring(false);
    }
  };

  const handleSaveParameters = async (newParams: FarmParameters): Promise<boolean> => {
    return await saveParameters(newParams);
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
            titulo={exportingWhatsApp ? 'Gerando Backup...' : 'Exportar Backup para WhatsApp (JSON)'}
            icone={<Icon icon={Share2} size="md" className="text-white" decorative />}
            onPress={handleExportWhatsApp}
            variante="primario"
            principal
            desabilitado={isBusy}
          />
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <Botao
                titulo={exportingHerdCsv ? 'Exportando...' : 'CSV Rebanho'}
                icone={<Icon icon={FileSpreadsheet} size="sm" className="text-pasto-900 dark:text-pasto-200" decorative />}
                onPress={handleExportHerdCsv}
                variante="secundario"
                desabilitado={isBusy}
              />
            </View>
            <View className="flex-1">
              <Botao
                titulo={exportingCalvesCsv ? 'Exportando...' : 'CSV Bezerras'}
                icone={<Icon icon={FileSpreadsheet} size="sm" className="text-pasto-900 dark:text-pasto-200" decorative />}
                onPress={handleExportCalvesCsv}
                variante="secundario"
                desabilitado={isBusy}
              />
            </View>
          </View>
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <Botao
                titulo={copyingBackup ? 'Copiando...' : 'Copiar JSON'}
                icone={<Icon icon={Copy} size="sm" className="text-pasto-900 dark:text-pasto-200" decorative />}
                onPress={handleCopyBackup}
                variante="secundario"
                desabilitado={isBusy}
              />
            </View>
            <View className="flex-1">
              <Botao
                titulo="Restaurar JSON"
                icone={<Icon icon={RotateCcw} size="sm" className="text-amber-800 dark:text-amber-300" decorative />}
                onPress={handlePickRestoreFile}
                variante="aviso"
                desabilitado={isBusy}
              />
            </View>
          </View>
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
            onPress={() => { }}
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
          <View className="flex-row justify-between border-b border-gray-100 dark:border-slate-800 pb-1.5">
            <Text className="text-sm text-gray-600 dark:text-gray-400">Secagem da Vaca:</Text>
            <Text className="font-bold text-pasto-900 dark:text-pasto-300">{parameters.dryOffDays} dias antes do parto</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600 dark:text-gray-400">Meta Peso 1ª IA Novilhas:</Text>
            <Text className="font-bold text-pasto-900 dark:text-pasto-300">{parameters.heiferBreedingWeightKg || 360} kg</Text>
          </View>
        </View>

        <Botao
          titulo="Editar Metas e Prazos"
          icone={<Icon icon={Sliders} size="sm" className="text-pasto-900 dark:text-pasto-200" decorative />}
          onPress={() => setEditModalVisible(true)}
          variante="secundario"
        />
      </Cartao>

      {/* Modal de Confirmação de Restauração */}
      <RestoreConfirmModal
        visivel={restoreModalVisible}
        onFechar={() => {
          setRestoreModalVisible(false);
          setRestorePayload(null);
          setRestoreRawContent(null);
        }}
        onConfirmar={handleConfirmRestore}
        payload={restorePayload}
        carregando={restoring}
      />

      {/* Modal de Edição de Parâmetros */}
      <EditSettingsModal
        visivel={editModalVisible}
        onFechar={() => setEditModalVisible(false)}
        onSalvar={handleSaveParameters}
        parametrosAtuais={parameters}
      />
    </Screen>
  );
}
