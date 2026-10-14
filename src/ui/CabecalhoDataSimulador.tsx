import { Calendar } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useManagementDate, formatToDisplay } from '@core/simulation';

export function CabecalhoDataSimulador() {
  const { activeDateString, isSimulated, advanceDays, resetToToday } = useManagementDate();

  return (
    <View className="flex-row flex-wrap items-center justify-between gap-2 border-b border-pasto-200 bg-pasto-700 px-4 py-2">
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
          className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm active:bg-pasto-100"
        >
          <Text className="text-xs font-bold text-pasto-900">+1d</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Avançar uma semana"
          onPress={() => advanceDays(7)}
          className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm active:bg-pasto-100"
        >
          <Text className="text-xs font-bold text-pasto-900">+7d</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Avançar vinte e um dias ciclo de cio"
          onPress={() => advanceDays(21)}
          className="rounded-lg bg-pasto-200 px-2.5 py-1.5 shadow-sm active:bg-pasto-500"
        >
          <Text className="text-xs font-bold text-pasto-900">+21d (Cio)</Text>
        </Pressable>

        {isSimulated && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Resetar para data real de hoje"
            onPress={resetToToday}
            className="rounded-lg bg-alerta-100 px-2.5 py-1.5 active:bg-alerta-700"
          >
            <Text className="text-xs font-bold text-alerta-700">Hoje</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
