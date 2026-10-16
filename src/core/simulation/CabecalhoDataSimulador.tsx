import React, { useState } from 'react';
import { Calendar, Clock, RotateCcw } from 'lucide-react-native';
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useManagementDate } from './ManagementDateContext';
import { formatToDisplay, parseFromDisplay } from './date-simulation';

export interface DateSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Modal de Seleção de Data de Manejo no Curral (Overlay do Cabeçalho).
 * Exibido ao clicar na pílula de data no cabeçalho do app.
 */
export function DateSelectionModal({ visible, onClose }: DateSelectionModalProps) {
  const { activeDateString, advanceDays, setDateString, resetToToday } = useManagementDate();
  const [customDateInput, setCustomDateInput] = useState<string | null>(null);

  const displayValue = customDateInput ?? formatToDisplay(activeDateString);

  const handleDateInputChange = (text: string) => {
    // Máscara DD/MM/AAAA
    const cleaned = text.replace(/\D/g, '').slice(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
    setCustomDateInput(formatted);

    if (formatted.length === 10) {
      const parsedIso = parseFromDisplay(formatted);
      if (parsedIso) {
        setDateString(parsedIso);
      }
    }
  };

  const handleReset = () => {
    resetToToday();
    setCustomDateInput(null);
  };

  const handleAdvance = (days: number) => {
    advanceDays(days);
    setCustomDateInput(null);
  };

  const handleClose = () => {
    setCustomDateInput(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/60 items-center justify-center p-4"
      >
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityLabel="Fechar modal"
        />

        <View className="w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 z-10">
          {/* Cabeçalho do Modal */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center gap-2">
              <Clock size={18} color="#065f46" />
              <Text className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Data de Manejo no Curral
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Resetar para hoje real"
              onPress={handleReset}
              className="flex-row items-center gap-1 active:opacity-70 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60"
            >
              <RotateCcw size={13} color="#059669" />
              <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Hoje real
              </Text>
            </Pressable>
          </View>

          {/* Texto Explicativo */}
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-3 mb-4 leading-relaxed">
            Avance o tempo para ver vacas completando 21 dias de cio ou bezerras mudando de fase de leite:
          </Text>

          {/* Atalhos Rápidos */}
          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Avançar 1 dia"
              onPress={() => handleAdvance(1)}
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200 dark:active:bg-slate-700"
            >
              <Text className="text-xs font-bold text-slate-800 dark:text-slate-100">+1 dia</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Avançar 7 dias"
              onPress={() => handleAdvance(7)}
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200 dark:active:bg-slate-700"
            >
              <Text className="text-xs font-bold text-slate-800 dark:text-slate-100">+7 dias</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Avançar 21 dias ciclo de cio"
              onPress={() => handleAdvance(21)}
              className="flex-1 py-3 rounded-xl bg-[#fef3c7] dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 items-center justify-center active:bg-amber-200 dark:active:bg-amber-900"
            >
              <Text className="text-xs font-bold text-[#78350f] dark:text-amber-200">+21d (Cio)</Text>
            </Pressable>
          </View>

          {/* Escolher data específica */}
          <View className="mt-5">
            <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Escolher data específica:
            </Text>
            <View className="flex-row items-center justify-between border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-800">
              <TextInput
                value={displayValue}
                onChangeText={handleDateInputChange}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={10}
                className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex-1 p-0"
              />
              <Calendar size={18} color="#64748b" />
            </View>
          </View>

          {/* Botão Concluir */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Concluir seleção de data"
            onPress={handleClose}
            className="w-full py-3.5 rounded-xl bg-[#064e3b] active:bg-[#065f46] items-center justify-center mt-6 shadow-sm"
          >
            <Text className="text-white font-bold text-sm tracking-wide">
              Concluir
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * Componente legado mantido para compatibilidade.
 */
export function CabecalhoDataSimulador() {
  const [modalVisible, setModalVisible] = useState(false);
  const { activeDateString, isSimulated } = useManagementDate();

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        className="flex-row items-center gap-2 px-3 py-1.5 bg-[#062817] rounded-xl border border-[#d97706]/70"
      >
        <Calendar size={15} color={isSimulated ? '#fbbf24' : '#34d399'} />
        <Text className="text-sm font-bold text-amber-100">
          {formatToDisplay(activeDateString)}
        </Text>
        {isSimulated && (
          <View className="rounded bg-[#ea580c] px-1.5 py-0.5">
            <Text className="text-[10px] font-black text-white">SIMULADO</Text>
          </View>
        )}
      </Pressable>

      <DateSelectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}
