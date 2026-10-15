export interface NativeDatePickerProps {
  visivel: boolean;
  onFechar: () => void;
  /** Data atual (meio-dia local, sem desvio de timezone). */
  dataSelecionada: Date;
  onSelecionar: (data: Date) => void;
  title?: string;
  scheme: 'light' | 'dark';
}
