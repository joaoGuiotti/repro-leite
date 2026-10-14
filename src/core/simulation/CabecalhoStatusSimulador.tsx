import { AlertCircle, CloudOff, RefreshCw, ShieldCheck } from 'lucide-react-native';
import { Pressable, Switch, Text, View } from 'react-native';
import { useSyncStatus } from '@core/sync';
import { CabecalhoDataSimulador } from './CabecalhoDataSimulador';

export interface CabecalhoStatusSimuladorProps {
  compact?: boolean;
}

export function CabecalhoStatusSimulador({ compact = false }: CabecalhoStatusSimuladorProps) {
  const {
    state,
    pendingCount,
    lastSyncedDescription,
    isSimulatedOffline,
    toggleSimulatedOffline,
    triggerSyncNow,
  } = useSyncStatus();

  // Cores e ícones por estado
  const statusBadgeStyle = {
    protected: {
      bg: 'bg-pasto-100',
      text: 'text-pasto-900',
      icon: <ShieldCheck size={14} color="#1b4332" />,
      label: 'Nuvem Protegida',
    },
    pending: {
      bg: 'bg-ambar-100',
      text: 'text-ambar-700',
      icon: <CloudOff size={14} color="#8a5a00" />,
      label: `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`,
    },
    syncing: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: <RefreshCw size={14} color="#1e40af" />,
      label: 'Sincronizando...',
    },
    offline: {
      bg: 'bg-gray-200',
      text: 'text-gray-700',
      icon: <CloudOff size={14} color="#4b5563" />,
      label: 'Curral Offline',
    },
    error: {
      bg: 'bg-alerta-100',
      text: 'text-alerta-700',
      icon: <AlertCircle size={14} color="#9b1c1c" />,
      label: 'Sem Conexão',
    },
  }[state];

  return (
    <View className="bg-pasto-50 shadow-sm">
      {/* 1. Barra de Data de Manejo e Simulador */}
      <CabecalhoDataSimulador />

      {/* 2. Barra de Proteção e Sincronização */}
      <View className="flex-row flex-wrap items-center justify-between border-b border-gray-200 px-4 py-2">
        {/* Selo de Estado com Ícone Lucide */}
        <View className="flex-row items-center gap-2">
          <View className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${statusBadgeStyle.bg}`}>
            {statusBadgeStyle.icon}
            <Text className={`text-xs font-bold ${statusBadgeStyle.text}`}>
              {statusBadgeStyle.label}
            </Text>
          </View>

          {!compact && (
            <Text className="text-xs text-gray-500 max-w-[160px]" numberOfLines={1}>
              {lastSyncedDescription}
            </Text>
          )}
        </View>

        {/* Controles de Ação de Campo */}
        <View className="flex-row items-center gap-3">
          {/* Botão Sincronizar Agora */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sincronizar agora"
            disabled={isSimulatedOffline || state === 'syncing'}
            onPress={triggerSyncNow}
            className={`flex-row items-center gap-1.5 rounded-lg px-2.5 py-1 ${isSimulatedOffline || state === 'syncing'
              ? 'bg-gray-100 opacity-50'
              : 'bg-pasto-900 active:bg-pasto-700'
              }`}
          >
            <RefreshCw
              size={12}
              color={isSimulatedOffline || state === 'syncing' ? '#94a3b8' : '#ffffff'}
            />
            <Text
              className={`text-xs font-bold ${isSimulatedOffline || state === 'syncing' ? 'text-gray-400' : 'text-white'
                }`}
            >
              {state === 'syncing' ? 'Enviando...' : 'Sincronizar'}
            </Text>
          </Pressable>

          {/* Alternador de Modo Curral (Offline Simulado) */}
          <View className="flex-row items-center gap-1">
            <Text className="text-[10px] font-semibold uppercase text-gray-400">
              {isSimulatedOffline ? 'Offline' : 'Online'}
            </Text>
            <Switch
              value={!isSimulatedOffline}
              onValueChange={toggleSimulatedOffline}
              trackColor={{ false: '#e2e8f0', true: '#2d6a4f' }}
              thumbColor={isSimulatedOffline ? '#94a3b8' : '#ffffff'}
              style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
