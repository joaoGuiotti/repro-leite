import { Calendar } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useManagementDate } from './ManagementDateContext';
import { formatToDisplay } from './date-simulation';

export function CabecalhoDataSimulador() {
  const { activeDateString, isSimulated, advanceDays, resetToToday } = useManagementDate();

  return (
    <View className="flex-row flex-wrap items-center justify-between gap-2 border-b border-pasto-200 dark:border-slate-800 bg-pasto-700 dark:bg-slate-900 px-4 py-3">
      {/* Indicador da Data Ativa */}
      <View className="flex-row items-center gap-2">
        <Calendar size={16} color="#fff" />
        <Text className="text-xs font-semibold uppercase tracking-wider text-white">
          Data de Manejo:
        </Text>
        <View
          className={`rounded-lg p-1 ${isSimulated ? 'bg-ambar-500' : 'bg-pasto-700'
            }`}
        >
          <Text className="text-sm font-bold text-white">
            {formatToDisplay(activeDateString)}
            {isSimulated ? ' (Simulada)' : ''}
          </Text>
        </View>
      </View>

      {/* Atalhos Rápidos */}
      <View className="flex-row items-center gap-1.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Avançar um dia"
          onPress={() => advanceDays(1)}
          className="rounded-lg bg-white dark:bg-slate-800 px-2.5 py-1.5 shadow-sm active:bg-pasto-100 dark:active:bg-slate-700"
        >
          <Text className="text-xs font-bold text-pasto-900 dark:text-slate-100">+1d</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Avançar uma semana"
          onPress={() => advanceDays(7)}
          className="rounded-lg bg-white dark:bg-slate-800 px-2.5 py-1.5 shadow-sm active:bg-pasto-100 dark:active:bg-slate-700"
        >
          <Text className="text-xs font-bold text-pasto-900 dark:text-slate-100">+7d</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Avançar vinte e um dias ciclo de cio"
          onPress={() => advanceDays(21)}
          className="rounded-lg bg-pasto-200 dark:bg-pasto-800 px-2.5 py-1.5 shadow-sm active:bg-pasto-500 dark:active:bg-pasto-700"
        >
          <Text className="text-xs font-bold text-pasto-900 dark:text-pasto-100">+21d (Cio)</Text>
        </Pressable>

        {isSimulated && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Resetar para data real de hoje"
            onPress={resetToToday}
            className="rounded-lg bg-alerta-100 dark:bg-red-950/60 px-2.5 py-1.5 active:bg-alerta-700 dark:active:bg-red-900"
          >
            <Text className="text-xs font-bold text-alerta-700 dark:text-red-300">Hoje</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
