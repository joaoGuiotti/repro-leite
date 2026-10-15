import { Result } from '@/core/result';
import { BackupPayload } from './backup.types';
import { HerdExportRow, CalvesExportRow } from './export.types';

export interface BackupRepository {
  /**
   * Compila todas as entidades locais pertencentes à fazenda em um payload estruturado.
   */
  exportBackup(farmId: string): Promise<BackupPayload>;

  /**
   * Restaura o estado da fazenda substituindo os dados em transação atômica.
   */
  restoreBackup(payload: BackupPayload): Promise<Result<void, Error>>;

  /**
   * Coleta e formata os dados do rebanho para geração do CSV.
   */
  getHerdExportData(farmId: string): Promise<HerdExportRow[]>;

  /**
   * Coleta e formata os dados das bezerras e recria para geração do CSV.
   */
  getCalvesExportData(farmId: string): Promise<CalvesExportRow[]>;
}
