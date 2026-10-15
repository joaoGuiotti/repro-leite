import { DatePickerDialog, Host } from '@expo/ui/jetpack-compose';
import type { NativeDatePickerProps } from './NativeDatePicker.types';

/**
 * Android: Material 3 DatePickerDialog (Jetpack Compose). O módulo `@expo/ui/swift-ui`
 * não existe no Android, por isso o seletor é separado por plataforma.
 */
export function NativeDatePicker({
  visivel,
  onFechar,
  dataSelecionada,
  onSelecionar,
}: NativeDatePickerProps) {
  if (!visivel) return null;

  return (
    <Host matchContents>
      <DatePickerDialog
        initialDate={dataSelecionada.toISOString()}
        onDateSelected={onSelecionar}
        onDismissRequest={onFechar}
        color="#1b4332"
      />
    </Host>
  );
}
