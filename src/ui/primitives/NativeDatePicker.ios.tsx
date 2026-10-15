import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { View } from 'react-native';
import { ModalPadrao } from '../overlays/ModalPadrao';
import type { NativeDatePickerProps } from './NativeDatePicker.types';

/** iOS: DatePicker gráfico do SwiftUI dentro de um ModalPadrao. */
export function NativeDatePicker({
  visivel,
  onFechar,
  dataSelecionada,
  onSelecionar,
  title = 'Selecionar data',
  scheme,
}: NativeDatePickerProps) {
  return (
    <ModalPadrao
      visivel={visivel}
      onFechar={onFechar}
      larguraMaxima="max-w-sm"
      mostrarBotaoFechar={false}
    >
      <View className="h-80 w-full overflow-hidden my-2">
        <Host style={{ flex: 1 }} colorScheme={scheme} seedColor="#1b4332">
          <DatePicker
            modifiers={[datePickerStyle('graphical'), tint('#1b4332')]}
            title={title}
            selection={dataSelecionada}
            displayedComponents={['date']}
            onDateChange={onSelecionar}
          />
        </Host>
      </View>
    </ModalPadrao>
  );
}
