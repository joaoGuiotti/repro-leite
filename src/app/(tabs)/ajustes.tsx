import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Share2, FileSpreadsheet, RotateCcw, Cloud, Sliders } from 'lucide-react-native';
import { Cartao, Botao, SeloStatus } from '@/ui';
import { useSyncStatus } from '@/context/SyncStatusContext';

export default function TelaAjustes() {
  const { state, pendingCount, lastSyncedDescription, triggerSyncNow, isSimulatedOffline } = useSyncStatus();

  return (
    <ScrollView className="flex-1 bg-pasto-50" contentContainerClassName="gap-4 p-4 pb-12">
      {/* Backup em 1 Clique e WhatsApp */}
      <Cartao titulo="Backup & Segurança dos Dados">
        <Text className="mb-4 text-sm text-gray-600">
          Seus dados estão protegidos no banco SQLite local. Exporte cópias extras a qualquer momento para abrir no Excel ou enviar por WhatsApp.
        </Text>

        <View className="gap-2.5">
          <Botao
            titulo="Exportar Backup para WhatsApp (JSON)"
            icone={<Share2 size={20} color="#ffffff" />}
            onPress={() => {}}
            variante="primario"
            principal
          />
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <Botao
                titulo="CSV Rebanho"
                icone={<FileSpreadsheet size={16} color="#1b4332" />}
                onPress={() => {}}
                variante="secundario"
              />
            </View>
            <View className="flex-1">
              <Botao
                titulo="CSV Bezerras"
                icone={<FileSpreadsheet size={16} color="#1b4332" />}
                onPress={() => {}}
                variante="secundario"
              />
            </View>
          </View>
          <Botao
            titulo="Restaurar Dados de Arquivo JSON"
            icone={<RotateCcw size={18} color="#8a5a00" />}
            onPress={() => {}}
            variante="aviso"
          />
        </View>
      </Cartao>

      {/* Conta & Sincronização em Nuvem */}
      <Cartao titulo="Conta & Sincronização em Nuvem">
        <View className="flex-row items-center justify-between pb-3">
          <View>
            <Text className="text-xs uppercase font-bold text-gray-500">Status da Nuvem</Text>
            <Text className="text-sm font-bold text-gray-900">{lastSyncedDescription}</Text>
          </View>
          <SeloStatus
            status={state === 'protected' ? 'prenhe' : state === 'pending' ? 'aviso' : 'alerta'}
            texto={state === 'protected' ? 'Conectado' : `${pendingCount} Pendentes`}
          />
        </View>

        <Text className="mb-4 text-xs text-gray-500">
          {isSimulatedOffline
            ? 'Modo Curral Offline Simulado ativo no cabeçalho.'
            : 'Sincronização assíncrona automática ativa quando houver sinal de internet.'}
        </Text>

        <View className="gap-2.5">
          <Botao
            titulo="Sincronizar Agora com a Nuvem"
            icone={<Cloud size={18} color="#1b4332" />}
            onPress={triggerSyncNow}
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

      {/* Parâmetros Zootécnicos */}
      <Cartao titulo="Parâmetros da Fazenda">
        <View className="gap-2 pb-4">
          <View className="flex-row justify-between border-b border-gray-100 pb-1.5">
            <Text className="text-sm text-gray-600">Janela de Retorno de Cio:</Text>
            <Text className="font-bold text-pasto-900">21 dias</Text>
          </View>
          <View className="flex-row justify-between border-b border-gray-100 pb-1.5">
            <Text className="text-sm text-gray-600">Diagnóstico de Toque:</Text>
            <Text className="font-bold text-pasto-900">45 dias</Text>
          </View>
          <View className="flex-row justify-between border-b border-gray-100 pb-1.5">
            <Text className="text-sm text-gray-600">Duração da Gestação:</Text>
            <Text className="font-bold text-pasto-900">282 dias (~9 meses)</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Secagem da Vaca:</Text>
            <Text className="font-bold text-pasto-900">60 dias antes do parto</Text>
          </View>
        </View>

        <Botao
          titulo="Editar Metas e Prazos"
          icone={<Sliders size={18} color="#1b4332" />}
          onPress={() => {}}
          variante="secundario"
        />
      </Cartao>
    </ScrollView>
  );
}
