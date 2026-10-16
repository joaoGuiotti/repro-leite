import React, { useState } from 'react';
import { Alert, Text, View, Modal, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { i18n } from '@/i18n';
import { Botao, Cartao, Icon, Screen, SeloStatus, hapticFeedback } from '@/ui';
import { DEFAULT_FARM_ID } from '@core/db';
import { useSyncStatus } from '@core/sync';
import { useFarm } from '@core/farm';
import { Cloud, Copy, FileSpreadsheet, RotateCcw, Share2, Sliders, LogOut, UserCheck, Home } from 'lucide-react-native';
import { useAccount, LoginOtpModal, InitialSyncModal } from '@features/account';
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
    clockDriftExceeded,
    lastError,
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
  const {
    session,
    isAuthenticated,
    signOut,
    initialSyncVisible,
    initialSyncProgress,
    initialSyncTable,
    initialSyncTotal,
    initialSyncError,
    performInitialSync,
  } = useAccount();
  const { farmName, updateFarmName } = useFarm();
  const [farmNameModalVisible, setFarmNameModalVisible] = useState(false);
  const [tempFarmNameInput, setTempFarmNameInput] = useState(farmName);
  const [isSavingFarmName, setIsSavingFarmName] = useState(false);

  const [loginModalVisible, setLoginModalVisible] = useState(false);

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

      {/* 2. Propriedade Rural (Fazenda) */}
      <Cartao titulo="Propriedade Rural (Fazenda)">
        <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
          <View className="flex-1 mr-3">
            <Text className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400">
              Nome da Propriedade
            </Text>
            <Text className="text-base font-extrabold text-pasto-900 dark:text-pasto-100 mt-0.5">
              {farmName}
            </Text>
          </View>
          <Botao
            titulo="Alterar Nome"
            variante="secundario"
            icone={<Icon icon={Home} size="sm" className="text-pasto-900 dark:text-pasto-200" decorative />}
            onPress={() => {
              setTempFarmNameInput(farmName);
              setFarmNameModalVisible(true);
            }}
          />
        </View>
        <View className="pt-2.5">
          <Text className="text-xs text-gray-400 dark:text-gray-500">Identificador da Fazenda (UUID):</Text>
          <Text className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-0.5" numberOfLines={1}>
            {farmId}
          </Text>
        </View>
      </Cartao>

      {/* 3. Conta & Sincronização em Nuvem */}
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

        {clockDriftExceeded && (
          <View className="bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl p-3 mb-3">
            <Text className="text-xs font-bold text-amber-800 dark:text-amber-200">Relógio do aparelho desregulado</Text>
            <Text className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              A hora do seu aparelho está com mais de 5 minutos de diferença em relação à nuvem. Ajuste a data e hora para evitar erros em projeções reprodutivas.
            </Text>
          </View>
        )}

        {lastError && (
          <View className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded-xl p-3 mb-3">
            <Text className="text-xs font-bold text-red-800 dark:text-red-200">Detalhe do Erro:</Text>
            <Text className="text-xs text-red-700 dark:text-red-300 mt-0.5">{lastError}</Text>
          </View>
        )}

        <View className="gap-2.5">
          <Botao
            titulo={i18n.settings.forceSync}
            icone={<Icon icon={Cloud} size="sm" className="text-pasto-900 dark:text-pasto-200" decorative />}
            onPress={handleSync}
            variante="secundario"
            desabilitado={isSimulatedOffline || state === 'syncing'}
          />
          {isAuthenticated ? (
            <View className="gap-2 border-t border-gray-100 dark:border-slate-800 pt-2.5 mt-1">
              <View className="flex-row items-center gap-2">
                <Icon icon={UserCheck} size="sm" className="text-pasto-700 dark:text-pasto-300" decorative />
                <Text className="text-xs text-gray-700 dark:text-gray-300 flex-1" numberOfLines={1}>
                  Conectado como: <Text className="font-bold">{session?.email}</Text>
                </Text>
              </View>
              <Botao
                titulo="Desconectar Conta"
                icone={<Icon icon={LogOut} size="sm" className="text-red-700 dark:text-red-300" decorative />}
                onPress={() => {
                  Alert.alert(
                    'Desconectar Conta',
                    'Deseja realmente sair? Seus dados locais permanecerão salvos neste aparelho.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Sair',
                        style: 'destructive',
                        onPress: async () => {
                          await signOut();
                        },
                      },
                    ]
                  );
                }}
                variante="secundario"
              />
            </View>
          ) : (
            <Botao
              titulo="Entrar com Conta (E-mail OTP)"
              onPress={() => setLoginModalVisible(true)}
              variante="primario"
            />
          )}
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

      {/* Modal de Entrada com Conta OTP */}
      <LoginOtpModal
        visivel={loginModalVisible}
        onFechar={() => setLoginModalVisible(false)}
        farmId={farmId}
        onSucesso={() => {
          triggerSyncNow();
        }}
      />

      {/* Modal de Carga Inicial para Novo Aparelho */}
      <InitialSyncModal
        visivel={initialSyncVisible}
        carregando={initialSyncProgress < 100 && !initialSyncError}
        tabelaAtual={initialSyncTable}
        progressoPercentual={initialSyncProgress}
        totalRegistros={initialSyncTotal}
        erro={initialSyncError}
        onTentarNovamente={() => {
          if (session?.farmId) {
            void performInitialSync(session.farmId);
          }
        }}
      />

      {/* Modal de Alteração de Nome da Fazenda */}
      <Modal
        visible={farmNameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFarmNameModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 bg-black/60 items-center justify-center p-4"
        >
          <Pressable
            className="absolute inset-0"
            onPress={() => setFarmNameModalVisible(false)}
          />
          <View className="w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 z-10">
            <View className="flex-row items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Text className="text-xl">🏡</Text>
              <Text className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Nome da Fazenda
              </Text>
            </View>

            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 mb-4 leading-relaxed">
              Defina o nome da sua propriedade leiteira para identificação no aplicativo e na sincronização com a nuvem:
            </Text>

            <View className="border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-800">
              <TextInput
                value={tempFarmNameInput}
                onChangeText={setTempFarmNameInput}
                placeholder="Ex: Fazenda Boa Vista"
                placeholderTextColor="#94a3b8"
                autoFocus
                className="text-sm font-semibold text-slate-800 dark:text-slate-100 p-0"
              />
            </View>

            <View className="flex-row gap-2 mt-5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancelar alteração"
                onPress={() => setFarmNameModalVisible(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200"
              >
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Salvar nome da fazenda"
                disabled={isSavingFarmName || !tempFarmNameInput.trim()}
                onPress={async () => {
                  if (!tempFarmNameInput.trim()) return;
                  setIsSavingFarmName(true);
                  try {
                    await updateFarmName(tempFarmNameInput.trim());
                    setFarmNameModalVisible(false);
                    Alert.alert('Sucesso', 'Nome da fazenda atualizado com sucesso!');
                  } finally {
                    setIsSavingFarmName(false);
                  }
                }}
                className={`flex-1 py-3 rounded-xl items-center justify-center ${
                  isSavingFarmName || !tempFarmNameInput.trim()
                    ? 'bg-slate-300 dark:bg-slate-700'
                    : 'bg-[#064e3b] active:bg-[#065f46]'
                }`}
              >
                <Text className="text-xs font-bold text-white">
                  {isSavingFarmName ? 'Salvando...' : 'Salvar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
