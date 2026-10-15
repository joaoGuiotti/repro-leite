import React from 'react';
import { View, Text } from 'react-native';
import { Botao, Icon, ModalPadrao, hapticFeedback } from '@/ui';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import { BackupPayload } from '../../domain/backup.types';

export interface RestoreConfirmModalProps {
  visivel: boolean;
  onFechar: () => void;
  onConfirmar: () => Promise<void>;
  payload: BackupPayload | null;
  carregando?: boolean;
}

export function RestoreConfirmModal({
  visivel,
  onFechar,
  onConfirmar,
  payload,
  carregando = false,
}: RestoreConfirmModalProps) {
  if (!payload) return null;

  const handleConfirm = async () => {
    await hapticFeedback.success();
    await onConfirmar();
  };

  const formattedDate = payload.metadata.exported_at
    ? new Date(payload.metadata.exported_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

  return (
    <ModalPadrao
      visivel={visivel}
      onFechar={onFechar}
      titulo="Restaurar Backup"
      subtitulo="Confirmação de substituição dos dados locais"
    >
      <View className="gap-4">
        {/* Banner de Aviso */}
        <View className="flex-row items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 dark:border-amber-700 dark:bg-amber-950/40">
          <Icon icon={AlertTriangle} size="md" className="text-amber-800 dark:text-amber-300" decorative />
          <View className="flex-1">
            <Text className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Atenção: Substituição de Dados
            </Text>
            <Text className="mt-1 text-xs text-amber-800 dark:text-amber-300">
              Os dados locais atuais serão substituídos pelo conteúdo deste arquivo de backup.
              Esta operação não pode ser desfeita.
            </Text>
          </View>
        </View>

        {/* Resumo do Backup */}
        <View className="rounded-xl border border-gray-100 bg-gray-50 p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <Text className="mb-2 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
            Resumo do Arquivo
          </Text>

          <View className="gap-1.5">
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600 dark:text-gray-400">Data de Geração:</Text>
              <Text className="text-xs font-bold text-gray-900 dark:text-gray-200">{formattedDate}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600 dark:text-gray-400">Animais:</Text>
              <Text className="text-xs font-bold text-gray-900 dark:text-gray-200">
                {payload.summary.animals_count} cabeças
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600 dark:text-gray-400">Inseminações:</Text>
              <Text className="text-xs font-bold text-gray-900 dark:text-gray-200">
                {payload.summary.inseminations_count} registros
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600 dark:text-gray-400">Touros no Catálogo:</Text>
              <Text className="text-xs font-bold text-gray-900 dark:text-gray-200">
                {payload.summary.bulls_count} touros
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600 dark:text-gray-400">Pesagens:</Text>
              <Text className="text-xs font-bold text-gray-900 dark:text-gray-200">
                {payload.summary.weighings_count} pesagens
              </Text>
            </View>
          </View>
        </View>

        {/* Ações */}
        <View className="gap-2.5 pt-2">
          <Botao
            titulo={carregando ? 'Restaurando...' : 'Confirmar e Restaurar Dados'}
            icone={<Icon icon={RotateCcw} size="sm" className="text-white" decorative />}
            onPress={handleConfirm}
            variante="perigo"
            principal
            desabilitado={carregando}
          />
          <Botao
            titulo="Cancelar"
            onPress={onFechar}
            variante="secundario"
            desabilitado={carregando}
          />
        </View>
      </View>
    </ModalPadrao>
  );
}
