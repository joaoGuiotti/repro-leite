import {
  advanceDays,
  formatToDateString,
  parseDateString,
  isSimulatedDate,
  getRealTodayDateString,
} from '@core/simulation';

describe('Domain: dateSimulation (Motor Puro de Cálculo de Datas)', () => {
  test('formatToDateString deve formatar data como YYYY-MM-DD', () => {
    const d = new Date(2026, 9, 13, 12, 0, 0); // Outubro = mês 9 (0-indexed)
    expect(formatToDateString(d)).toBe('2026-10-13');
  });

  test('parseDateString deve converter string YYYY-MM-DD em objeto Date no meio-dia local', () => {
    const date = parseDateString('2026-10-13');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(13);
  });

  test('advanceDays deve adicionar dias corretamente sem distorção de fuso', () => {
    expect(advanceDays('2026-10-13', 1)).toBe('2026-10-14');
    expect(advanceDays('2026-10-13', 7)).toBe('2026-10-20');
    // Janela de cio (21 dias)
    expect(advanceDays('2026-10-13', 21)).toBe('2026-11-03');
    // Virada de ano
    expect(advanceDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  test('isSimulatedDate deve retornar false se a data for hoje, e true se for data futura/passada', () => {
    const today = getRealTodayDateString();
    expect(isSimulatedDate(today)).toBe(false);
    expect(isSimulatedDate('2025-01-01')).toBe(true);
    expect(isSimulatedDate('2030-12-31')).toBe(true);
  });
});
