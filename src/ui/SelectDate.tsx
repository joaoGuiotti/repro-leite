import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ModalPadrao } from './ModalPadrao';

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
    onDateChange?.(date);
    if (onChange) {
      const ano = date.getFullYear();
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const dia = String(date.getDate()).padStart(2, '0');
      onChange(`${ano}-${mes}-${dia}`);
      setModalAberto(false);
    }
  };

  return (
    <View className={`gap-1 ${className}`}>
      {rotuloFinal && (
        <Text className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
          {rotuloFinal} {isRequired && '*'}
        </Text>
      )}

      {/* Visual de Input */}
      <TouchableOpacity
        onPress={() => setModalAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={`${rotuloFinal || 'Data'}: ${textoFormatado}`}
        className="h-12 flex-row items-center justify-between rounded-2xl border border-gray-300 bg-white px-4 active:bg-gray-50"
      >
        <Text
          className={`text-base font-bold ${dataString ? 'text-gray-900' : 'text-gray-400'
            }`}
        >
          {textoFormatado}
        </Text>
        <CalendarIcon size={20} color="#1b4332" />
      </TouchableOpacity>

      {/* Modal com DatePicker Graphical */}
      <ModalPadrao
        visivel={modalAberto}
        onFechar={() => setModalAberto(false)}
        larguraMaxima="max-w-sm"
        mostrarBotaoFechar={false}
      >
        <View className="h-80 w-full overflow-hidden my-2">
          <Host style={{ flex: 1 }} colorScheme="light" seedColor="#1b4332">
            <DatePicker
              modifiers={[datePickerStyle('graphical'), tint('#1b4332')]}
              title={title}
              selection={selectedDate}
              displayedComponents={['date']}
              onDateChange={handleDateSelected}
            />
          </Host>
        </View>
      </ModalPadrao>
    </View>
  );
}

export default SelectDate;
