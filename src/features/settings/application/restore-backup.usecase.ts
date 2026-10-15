import { Result, err } from '@/core/result';
import { BackupRepository } from '../domain/backup.repository';
import { validateBackupPayload } from '../domain/engines/validate-backup';

export interface RestoreBackupInput {
  jsonContent: string;
  targetFarmId: string;
}

export class RestoreBackupUseCase {
  constructor(private backupRepo: BackupRepository) {}

  async execute(input: RestoreBackupInput): Promise<Result<void, Error>> {
    const validationResult = validateBackupPayload(input.jsonContent, input.targetFarmId);
    if (!validationResult.ok) {
      return err(new Error(validationResult.error));
    }

    const payload = validationResult.value;
    // Assegurar que os dados sejam restaurados associados à fazenda ativa
    payload.metadata.farm_id = input.targetFarmId;

    return await this.backupRepo.restoreBackup(payload);
  }
}
