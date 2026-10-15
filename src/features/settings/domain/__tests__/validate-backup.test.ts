import { validateBackupPayload } from '../engines/validate-backup';

describe('validateBackupPayload', () => {
  const validPayload = {
    metadata: {
      version: 1,
      app: 'repro-leite',
      farm_id: 'farm-123',
      exported_at: '2026-10-15T10:00:00.000Z',
    },
    summary: {
      animals_count: 1,
      inseminations_count: 0,
      bulls_count: 0,
      weighings_count: 0,
      settings_count: 0,
    },
    data: {
      settings: [],
      bulls: [],
      animals: [
        {
          id: 'anim-1',
          farm_id: 'farm-123',
          ear_tag: '101',
          sex: 'female',
          status: 'lactating',
          lactation_status: 'in_milk',
          created_at: '2026-10-15T10:00:00.000Z',
          updated_at: '2026-10-15T10:00:00.000Z',
        },
      ],
      inseminations: [],
      weighings: [],
      alerts: [],
    },
  };

  it('should accept valid backup payload structure', () => {
    const result = validateBackupPayload(validPayload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.metadata.farm_id).toBe('farm-123');
      expect(result.value.data.animals.length).toBe(1);
    }
  });

  it('should accept valid JSON string input', () => {
    const result = validateBackupPayload(JSON.stringify(validPayload));
    expect(result.ok).toBe(true);
  });

  it('should reject invalid JSON string', () => {
    const result = validateBackupPayload('{ invalid json');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('JSON inválido');
    }
  });

  it('should reject payload with wrong app identifier', () => {
    const invalid = { ...validPayload, metadata: { ...validPayload.metadata, app: 'other-app' } };
    const result = validateBackupPayload(invalid);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('não pertence ao ReproLeite');
    }
  });

  it('should reject payload with unsupported version', () => {
    const invalid = { ...validPayload, metadata: { ...validPayload.metadata, version: 99 } };
    const result = validateBackupPayload(invalid);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Versão de backup não suportada');
    }
  });

  it('should reject payload missing data collections', () => {
    const invalid = { ...validPayload, data: null };
    const result = validateBackupPayload(invalid);
    expect(result.ok).toBe(false);
  });
});
