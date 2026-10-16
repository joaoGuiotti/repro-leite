describe('Clock Drift Calculation (User Story 4)', () => {
  function evaluateClockDrift(clientTimeMs: number, serverTimeMs: number, maxAllowedSeconds = 300) {
    const driftSeconds = Math.round(Math.abs(clientTimeMs - serverTimeMs) / 1000);
    return {
      driftSeconds,
      isExceeded: driftSeconds > maxAllowedSeconds,
    };
  }

  it('deve considerar relógio sincronizado para diferença menor que 5 minutos', () => {
    const now = Date.now();
    const serverTime = now + 60 * 1000; // 1 minuto à frente
    const res = evaluateClockDrift(now, serverTime);
    expect(res.driftSeconds).toBe(60);
    expect(res.isExceeded).toBe(false);
  });

  it('deve alertar se a diferença for maior que 5 minutos (300 segundos)', () => {
    const now = Date.now();
    const serverTime = now - 350 * 1000; // ~6 minutos atrás
    const res = evaluateClockDrift(now, serverTime);
    expect(res.driftSeconds).toBe(350);
    expect(res.isExceeded).toBe(true);
  });
});
