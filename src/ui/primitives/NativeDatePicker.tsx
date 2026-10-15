import { createElement } from 'react';
import { ModalPadrao } from '../overlays/ModalPadrao';
import type { NativeDatePickerProps } from './NativeDatePicker.types';

function toIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Fallback (web): <input type="date"> nativo do navegador dentro do ModalPadrao. */
export function NativeDatePicker({
  visivel,
  onFechar,
  dataSelecionada,
  onSelecionar,
}: NativeDatePickerProps) {
  return (
    <ModalPadrao
      visivel={visivel}
      onFechar={onFechar}
      larguraMaxima="max-w-sm"
      mostrarBotaoFechar={false}
    >
      {createElement('input', {
        type: 'date',
        value: toIso(dataSelecionada),
        style: { height: 48, fontSize: 16, width: '100%' },
        onChange: (e: { target: { value: string } }) => {
          const [y, m, d] = e.target.value.split('-').map(Number);
          if (y && m && d) onSelecionar(new Date(y, m - 1, d, 12, 0, 0));
        },
      })}
    </ModalPadrao>
  );
}
