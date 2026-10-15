import { Calendar as CalendarIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Pressable,
  Text,
  View,
} from 'react-native';
import { NativeDatePicker } from './NativeDatePicker';
import { useTheme } from '../theme';
import { hapticFeedback } from '../feedback/haptics';

export interface SelectDateProps {
  rotulo?: string;
  label?: string;
  valor?: string; // Formato YYYY-MM-DD
  value?: string;
  onChange?: (novaData: string) => void;
  onDateChange?: (date: Date) => void;
  obrigatorio?: boolean;
  required?: boolean;
  placeholder?: string;
  title?: string;
  className?: string;
}

export function SelectDate({
  rotulo,
  label,
  valor,
  value,
  onChange,
  onDateChange,
  obrigatorio = false,
  required = false,
  placeholder = 'Selecionar data',
  title = 'Selecionar data',
  className = '',
}: SelectDateProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const { scheme } = useTheme();

  const dataString = valor || value || '';
  const rotuloFinal = rotulo || label;
  const isRequired = obrigatorio || required;

  // Converte dataString (YYYY-MM-DD) para Date sem desvio de timezone
  const selectedDate = useMemo(() => {
    if (!dataString) return new Date();
    const partes = dataString.split('-').map(Number);
    if (partes.length === 3 && !isNaN(partes[0]) && !isNaN(partes[1]) && !isNaN(partes[2])) {
      return new Date(partes[0], partes[1] - 1, partes[2], 12, 0, 0);
    }
    return new Date();
  }, [dataString]);

  // Formatação em DD/MM/AAAA para visual de input
  const textoFormatado = useMemo(() => {
    if (!dataString) return placeholder;
    const partes = dataString.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataString;
  }, [dataString, placeholder]);

  const handleDateSelected = (date: Date) => {
    void hapticFeedback.selection();
    onDateChange?.(date);
    if (onChange) {
      const ano = date.getFullYear();
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const dia = String(date.getDate()).padStart(2, '0');
      onChange(`${ano}-${mes}-${dia}`);
    }
    setModalAberto(false);
  };

  return (
    <View className={`gap-1 ${className}`}>
      {rotuloFinal && (
        <Text className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1">
          {rotuloFinal} {isRequired && '*'}
        </Text>
      )}

      {/* Visual de Input */}
      <Pressable
        onPress={() => {
          void hapticFeedback.selection();
          setModalAberto(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${rotuloFinal || 'Data'}: ${textoFormatado}`}
        className="min-h-[48px] h-12 flex-row items-center justify-between rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 active:bg-gray-50 dark:active:bg-slate-800"
      >
        <Text
          className={`text-base font-bold ${
            dataString ? 'text-gray-900 dark:text-slate-100' : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {textoFormatado}
        </Text>
        <CalendarIcon size={20} color={scheme === 'dark' ? '#52b788' : '#2d6a4f'} />
      </Pressable>

      {/* Seletor nativo por plataforma (iOS: SwiftUI, Android: Material 3, web: input date) */}
      <NativeDatePicker
        visivel={modalAberto}
        onFechar={() => setModalAberto(false)}
        dataSelecionada={selectedDate}
        onSelecionar={handleDateSelected}
        title={title}
        scheme={scheme}
      />
    </View>
  );
}

export default SelectDate;

