import { format, parse, addDays } from 'date-fns';

export const DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Retorna a data real do dispositivo formatada como YYYY-MM-DD.
 */
export function getRealTodayDateString(): string {
  return format(new Date(), DATE_FORMAT);
}

/**
 * Converte um objeto Date para string YYYY-MM-DD.
 */
export function formatToDateString(date: Date): string {
  return format(date, DATE_FORMAT);
}

/**
 * Converte uma string YYYY-MM-DD para objeto Date (no meio-dia para evitar desvios de fuso horário).
 */
export function parseDateString(dateStr: string): Date {
  const parsed = parse(dateStr, DATE_FORMAT, new Date());
  parsed.setHours(12, 0, 0, 0);
  return parsed;
}

/**
 * Adiciona N dias a uma data de calendário YYYY-MM-DD e retorna a nova data YYYY-MM-DD.
 */
export function advanceDays(dateStr: string, days: number): string {
  const baseDate = parseDateString(dateStr);
  const resultDate = addDays(baseDate, days);
  return formatToDateString(resultDate);
}

/**
 * Verifica se a data fornecida é diferente da data real de hoje (isto é, está simulada).
 */
export function isSimulatedDate(dateStr: string): boolean {
  return dateStr !== getRealTodayDateString();
}

/**
 * Formata para exibição em português (ex: "13/10/2026").
 */
export function formatToDisplay(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Converte data em exibição DD/MM/AAAA para YYYY-MM-DD se válida.
 */
export function parseFromDisplay(displayStr: string): string | null {
  const parts = displayStr.trim().split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    if (day.length === 2 && month.length === 2 && year.length === 4) {
      const numDay = parseInt(day, 10);
      const numMonth = parseInt(month, 10);
      const numYear = parseInt(year, 10);
      if (numMonth >= 1 && numMonth <= 12 && numDay >= 1 && numDay <= 31 && numYear >= 2000 && numYear <= 2100) {
        return `${year}-${month}-${day}`;
      }
    }
  }
  return null;
}

