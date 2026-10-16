import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Botao, Icon, ModalPadrao } from '@/ui';
import { CloudDownload, RefreshCw } from 'lucide-react-native';

export interface InitialSyncModalProps {
  visivel: boolean;
  carregando: boolean;
  tabelaAtual?: string;
  progressoPercentual: number;
  totalRegistros: number;
  erro?: string | null;
  onTentarNovamente?: () => void;
}

export function InitialSyncModal({
  visivel,
  carregando,
  tabelaAtual,
  progressoPercentual,
  totalRegistros,
  erro,
  onTentarNovamente,
}: InitialSyncModalProps) {
  return (
    <ModalPadrao
      visivel={visivel}
      onFechar={() => {}}
      mostrarBotaoFechar={false}
      fecharAoTocarFundo={false}
      titulo="Baixando Dados da Fazenda"
      subtitulo="Preparando o dispositivo para uso autônomo no curral."
      iconeTitulo={<Icon icon={CloudDownload} size="md" className="text-pasto-700 dark:text-pasto-300" decorative />}
    >
      <View className="gap-4 py-3 items-center">
        {carregando && (
          <ActivityIndicator size="large" color="#1b4332" className="my-2" />
        )}

        {erro ? (
          <View className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl p-3 w-full">
            <Text className="text-sm font-bold text-red-800 dark:text-red-200">Falha na transferência</Text>
            <Text className="text-xs text-red-700 dark:text-red-300 mt-1">{erro}</Text>
          </View>
        ) : (
          <View className="w-full gap-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {tabelaAtual ? `Transferindo: ${tabelaAtual}` : 'Iniciando sincronização...'}
              </Text>
              <Text className="text-xs font-bold text-pasto-800 dark:text-pasto-300">
                {progressoPercentual}%
              </Text>
            </View>

            {/* Barra de progresso */}
            <View className="h-3 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <View
                className="h-full bg-pasto-700 dark:bg-pasto-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(5, progressoPercentual))}%` }}
              />
            </View>

            <Text className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">
              {totalRegistros} registros baixados até o momento
            </Text>
          </View>
        )}

        {erro && onTentarNovamente && (
          <View className="w-full mt-2">
            <Botao
              titulo="Tentar Novamente"
              icone={<Icon icon={RefreshCw} size="sm" className="text-white" decorative />}
              onPress={onTentarNovamente}
              variante="primario"
            />
          </View>
        )}
      </View>
    </ModalPadrao>
  );
}
