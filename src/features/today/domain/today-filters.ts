/**
 * Adiciona ou subtrai dias de uma string ISO YYYY-MM-DD de forma puramente determinística em UTC.
 */
export function addDaysToIsoDate(isoDate: string, days: number): string {
  if (!isoDate || isoDate.length < 10) return isoDate;
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/**
 * Calcula a diferença em dias entre duas datas ISO (targetDate - baseDate).
 */
export function differenceInDays(targetDate: string, baseDate: string): number {
  if (!targetDate || !baseDate) return 0;
  const [y1, m1, d1] = targetDate.split('-').map(Number);
  const [y2, m2, d2] = baseDate.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((utc1 - utc2) / msPerDay);
}

/**
 * Retorna true se a data de vencimento é estritamente anterior à data de referência.
 */
export function isOverdueDate(dueDate: string, referenceDate: string): boolean {
  if (!dueDate || !referenceDate) return false;
  return dueDate < referenceDate;
}

/**
 * Verifica se um alerta de retorno de cio (21 dias pós-IA) está na janela zootécnica de observação.
 * A janela biológica é de 18 a 24 dias pós-IA.
 * Como o alerta tem dueDate = IA + 21d:
 * - No dia 18 pós-IA, referenceDate é (dueDate - 3), ou seja, dueDate <= referenceDate + 3 dias.
 * - Tarefas em atraso (dueDate < referenceDate) permanecem visíveis até a baixa.
 */
export function isHeatCheckInZootecnicWindow(
  dueDate: string,
  referenceDate: string,
  advanceDaysWindow = 3
): boolean {
  if (!dueDate || !referenceDate) return false;
  const maxWindowDate = addDaysToIsoDate(referenceDate, advanceDaysWindow);
  return dueDate <= maxWindowDate;
}

/**
 * Verifica se um alerta de toque veterinário (45 dias pós-IA) está na janela zootécnica.
 * O diagnóstico normalmente ocorre entre 45 e 60 dias pós-IA (ou seja, a partir de dueDate = IA + 45d).
 * Tarefas com dueDate <= referenceDate já atingiram o prazo de toque e são candidatas imediatas.
 * Permite também antecipação leve (ex.: 5 dias antes de 45d para lotes pré-agendados).
 */
export function isPregnancyCheckInZootecnicWindow(
  dueDate: string,
  referenceDate: string,
  advanceDaysWindow = 5
): boolean {
  if (!dueDate || !referenceDate) return false;
  const maxWindowDate = addDaysToIsoDate(referenceDate, advanceDaysWindow);
  return dueDate <= maxWindowDate;
}
