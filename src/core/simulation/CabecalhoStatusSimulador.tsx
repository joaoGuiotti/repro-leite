import { Icon } from '@/ui';
import { useFarm } from '@core/farm';
import { useSyncStatus } from '@core/sync';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  Calendar,
  CloudOff,
  Pencil,
  RefreshCw,
  ShieldCheck,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DateSelectionModal } from './CabecalhoDataSimulador';
import { useManagementDate } from './ManagementDateContext';
import { formatToDisplay } from './date-simulation';

export interface CabecalhoStatusSimuladorProps {
  compact?: boolean;
}

export function CabecalhoStatusSimulador({ compact = false }: CabecalhoStatusSimuladorProps) {
  const router = useRouter();
  const {
    state,
    pendingCount,
    lastSyncedDescription,
    isSimulatedOffline,
    isOnline,
    userEmail,
    toggleSimulatedOffline,
    triggerSyncNow,
  } = useSyncStatus();

  // Conectividade efetiva: requer conexão de rede física E modo simulado inativo
  const isConnected = isOnline && !isSimulatedOffline;

  const { activeDateString, isSimulated } = useManagementDate();
  const { farmName, updateFarmName } = useFarm();

  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [editFarmModalVisible, setEditFarmModalVisible] = useState(false);
  const [tempFarmName, setTempFarmName] = useState(farmName);
  const [isSavingFarm, setIsSavingFarm] = useState(false);

  // Status visual para a barra de sincronismo
  const pendingTitle = `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`;
  const syncStatusConfig = {
    protected: {
      icon: <ShieldCheck size={14} color="#34d399" />,
      title: 'Nuvem Protegida',
      subtitle: lastSyncedDescription.replace(/^Nuvem Protegida\s*·?\s*/, '') || 'Sincronizado agora',
      textColor: 'text-[#34d399] dark:text-emerald-400',
    },
    syncing: {
      icon: <RefreshCw size={14} color="#60a5fa" />,
      title: 'Sincronizando',
      subtitle: 'Enviando dados...',
      textColor: 'text-blue-300 dark:text-blue-400',
    },
    pending: {
      icon: <CloudOff size={14} color="#fbbf24" />,
      title: pendingTitle,
      subtitle: 'Modo Curral',
      textColor: 'text-amber-300 dark:text-amber-400',
    },
    offline: {
      icon: <CloudOff size={14} color={pendingCount > 0 ? '#fbbf24' : '#94a3b8'} />,
      title: pendingCount > 0 ? pendingTitle : 'Curral Offline',
      subtitle:
        pendingCount > 0
          ? isSimulatedOffline
            ? 'Curral Offline (Simulado)'
            : 'Curral Offline'
          : isSimulatedOffline
            ? 'Simulado'
            : 'Sem sinal de rede',
      textColor: 'text-amber-300 dark:text-amber-400',
    },
    error: {
      icon: <AlertCircle size={14} color="#f87171" />,
      title: pendingCount > 0 ? pendingTitle : 'Sem Conexão',
      subtitle: 'Falha no envio',
      textColor: 'text-red-300 dark:text-red-400',
    },
  }[state];

  const handleOpenEditFarm = () => {
    setTempFarmName(farmName);
    setEditFarmModalVisible(true);
  };

  const handleSaveFarm = async () => {
    if (!tempFarmName.trim()) return;
    setIsSavingFarm(true);
    try {
      await updateFarmName(tempFarmName.trim());
      setEditFarmModalVisible(false);
    } finally {
      setIsSavingFarm(false);
    }
  };

  const handleUserPress = () => {
    try {
      router.push('/(tabs)/ajustes' as any);
    } catch {
      // Fallback silencioso
    }
  };

  return (
    <View className="bg-[#062417] dark:bg-slate-950 shadow-sm">
      {/* 1. BARRA SUPERIOR: Sincronismo, Alternador de Internet e Perfil (Linha Única) */}
      <View className="flex-row items-center justify-between border-b border-[#0d3b24] dark:border-slate-800 px-3.5 py-1.5 bg-[#062316] dark:bg-slate-950">
        {/* Lado Esquerdo: Status da Nuvem + Sincronizar Agora */}
        <View className="flex-row items-center flex-1 mr-2">
          {syncStatusConfig.icon}
          <Text className={`text-xs font-bold ml-1.5 ${syncStatusConfig.textColor}`}>
            {syncStatusConfig.title}
          </Text>
          <Text className="text-xs text-slate-400 dark:text-slate-500 ml-1.5" numberOfLines={1}>
            · {syncStatusConfig.subtitle}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sincronizar agora"
            disabled={!isConnected || state === 'syncing'}
            onPress={() => triggerSyncNow()}
            className="ml-2.5 active:opacity-70"
          >
            <Text
              className={`text-xs font-black tracking-wider ${!isConnected || state === 'syncing'
                ? 'text-slate-500 line-through'
                : 'text-[#34d399] underline'
                }`}
            >
              SINCRONIZAR
            </Text>
          </Pressable>
        </View>

        {/* Lado Direito: Ícone Internet (ON / OFF) + Ícone de Usuário */}
        <View className="flex-row items-center gap-1.5">
          {/* Botão de Conexão/Internet (ON / OFF) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={!isConnected ? 'Internet Offline (OFF)' : 'Internet Conectada (ON)'}
            onPress={() => {
              if (!isOnline && !isSimulatedOffline) {
                Alert.alert(
                  'Curral Offline',
                  'Seu aparelho está desconectado da internet (Status: OFF).\n\nO ReproLeite continua operando normalmente em modo offline e todos os seus manejos estão protegidos no banco de dados local.'
                );
              } else {
                toggleSimulatedOffline();
              }
            }}
            className={`px-2 py-1 rounded-lg border active:opacity-75 ${!isConnected
              ? 'bg-amber-950/80 border-amber-700/60'
              : 'bg-[#093a23] dark:bg-slate-800 border-[#14532d] dark:border-slate-700'
              }`}
          >
            {!isConnected ? (
              <View className="flex-row items-center gap-1">
                <WifiOff size={13} color="#fbbf24" />
              </View>
            ) : (
              <View className="flex-row items-center gap-1">
                <Wifi size={13} color="#34d399" />
              </View>
            )}
          </Pressable>

          <Text className="text-slate-600 dark:text-slate-600 text-xs">|</Text>

          {/* Usuário (Apenas Ícone de Perfil) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={userEmail ? `Conta conectada: ${userEmail}` : 'Entrar na conta'}
            onPress={handleUserPress}
            className="p-1.5 rounded-lg active:opacity-75 relative"
          >
            <User size={15} color={userEmail ? '#34d399' : '#94a3b8'} />
            {userEmail && (
              <View className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </Pressable>
        </View>
      </View>

      {/* 2. BARRA PRINCIPAL: Logo, Fazenda e Seletor de Data */}
      <View className="flex-row items-center justify-between px-4 py-2.5 bg-[#0a3721] dark:bg-slate-900 border-b border-[#062416] dark:border-slate-800">
        {/* Identidade ReproLeite + Nome da Fazenda */}
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-10 h-10 rounded-2xl bg-[#062416] dark:bg-slate-950 border border-[#165534] dark:border-slate-800 items-center justify-center mr-3 shadow-inner">
            <Text className="text-xl">🐄</Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-base font-extrabold text-white tracking-tight">
                ReproLeite
              </Text>
            </View>

            {/* Nome da Fazenda Editável */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Editar nome da fazenda"
              onPress={handleOpenEditFarm}
              className="flex-row items-center gap-1.5 mt-0.5 active:opacity-75"
            >
              <Text
                className="text-xs font-semibold text-[#a7f3d0] dark:text-emerald-300 max-w-[160px]"
                numberOfLines={1}
              >
                {farmName}
              </Text>
              <Icon icon={Pencil} size="xs" className="text-gray-200 dark:text-gray-300" decorative />
            </Pressable>
          </View>
        </View>

        {/* Pílula de Data de Manejo */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir controle de data de manejo"
          onPress={() => setDateModalVisible(true)}
          className={`rounded-xl px-3 py-1.5 flex-row items-center gap-2 border shadow-sm active:bg-[#072c1a] ${isSimulated
            ? 'bg-[#062817] border-[#d97706]'
            : 'bg-[#062817] dark:bg-slate-950 border-[#165534] dark:border-slate-700'
            }`}
        >
          <Calendar size={15} color={isSimulated ? '#fbbf24' : '#34d399'} />
          <Text className="text-sm font-bold text-amber-100 tracking-wide">
            {formatToDisplay(activeDateString)}
          </Text>
        </Pressable>
      </View>

      {/* Modal de Seleção de Data */}
      <DateSelectionModal
        visible={dateModalVisible}
        onClose={() => setDateModalVisible(false)}
      />

      {/* Modal de Edição de Nome da Fazenda */}
      <Modal
        visible={editFarmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditFarmModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 bg-black/60 items-center justify-center p-4"
        >
          <Pressable
            className="absolute inset-0"
            onPress={() => setEditFarmModalVisible(false)}
          />

          <View className="w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 z-10">
            <View className="flex-row items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Text className="text-xl">🏡</Text>
              <Text className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Nome da Fazenda
              </Text>
            </View>

            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 mb-4 leading-relaxed">
              Defina o nome da sua propriedade leiteira. Este nome será sincronizado com a nuvem e exibido nos relatórios:
            </Text>

            <View className="border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-800">
              <TextInput
                value={tempFarmName}
                onChangeText={setTempFarmName}
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
                onPress={() => setEditFarmModalVisible(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200"
              >
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Salvar nome da fazenda"
                disabled={isSavingFarm || !tempFarmName.trim()}
                onPress={handleSaveFarm}
                className={`flex-1 py-3 rounded-xl items-center justify-center ${isSavingFarm || !tempFarmName.trim()
                  ? 'bg-slate-300 dark:bg-slate-700'
                  : 'bg-[#064e3b] active:bg-[#065f46]'
                  }`}
              >
                <Text className="text-xs font-bold text-white">
                  {isSavingFarm ? 'Salvando...' : 'Salvar Nome'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
