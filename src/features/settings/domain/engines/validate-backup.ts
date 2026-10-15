import { Result, ok, err } from '@/core/result';
import { BackupPayload } from '../backup.types';

/**
 * Validador puro de integridade e compatibilidade de schema para arquivos de backup JSON.
 */
export function validateBackupPayload(
  rawInput: unknown,
  expectedFarmId?: string
): Result<BackupPayload, string> {
  let parsed: any = rawInput;

  if (typeof rawInput === 'string') {
    try {
      parsed = JSON.parse(rawInput);
    } catch {
      return err('Arquivo com formato JSON inválido ou corrompido.');
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return err('Conteúdo do arquivo não é um objeto JSON válido.');
  }

  if (!parsed.metadata || typeof parsed.metadata !== 'object') {
    return err('Arquivo não contém cabeçalho de metadados obrigatório.');
  }

  if (parsed.metadata.app !== 'repro-leite') {
    return err('O arquivo selecionado não pertence ao ReproLeite.');
  }

  if (parsed.metadata.version !== 1) {
    return err(`Versão de backup não suportada: ${parsed.metadata.version}. O aplicativo requer a versão 1.`);
  }

  if (!parsed.metadata.farm_id || typeof parsed.metadata.farm_id !== 'string') {
    return err('Identificador de fazenda (farm_id) ausente no cabeçalho do backup.');
  }

  if (expectedFarmId && parsed.metadata.farm_id !== expectedFarmId) {
    // Permitir restauração mesmo com farm_id diferente caso o usuário esteja migrando,
    // mas os registros de data devem ser compatíveis.
  }

  if (!parsed.data || typeof parsed.data !== 'object') {
    return err('Coleção de dados (data) ausente no arquivo de backup.');
  }

  const requiredCollections = ['settings', 'bulls', 'animals', 'inseminations', 'weighings', 'alerts'];
  for (const col of requiredCollections) {
    if (!Array.isArray(parsed.data[col])) {
      return err(`Coleção obrigatória '${col}' ausente ou inválida no backup.`);
    }
  }

  const payload: BackupPayload = {
    metadata: {
      version: parsed.metadata.version,
      app: 'repro-leite',
      farm_id: parsed.metadata.farm_id,
      exported_at: parsed.metadata.exported_at || new Date().toISOString(),
      app_version: parsed.metadata.app_version,
    },
    summary: {
      animals_count: Array.isArray(parsed.data.animals) ? parsed.data.animals.length : 0,
      inseminations_count: Array.isArray(parsed.data.inseminations) ? parsed.data.inseminations.length : 0,
      bulls_count: Array.isArray(parsed.data.bulls) ? parsed.data.bulls.length : 0,
      weighings_count: Array.isArray(parsed.data.weighings) ? parsed.data.weighings.length : 0,
      settings_count: Array.isArray(parsed.data.settings) ? parsed.data.settings.length : 0,
    },
    data: {
      settings: parsed.data.settings,
      bulls: parsed.data.bulls,
      animals: parsed.data.animals,
      inseminations: parsed.data.inseminations,
      weighings: parsed.data.weighings,
      alerts: parsed.data.alerts,
    },
  };

  return ok(payload);
}
