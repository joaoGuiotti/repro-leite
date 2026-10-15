import { DrizzleTransactionRunner } from '@core/db/transaction';
import { OutboxRepository } from '@core/sync/outbox.repository';
import { SettingSqliteRepository } from './infra/setting.sqlite.repository';
import { BackupSqliteRepository } from './infra/backup.sqlite.repository';
import { ExpoFileShareService } from './infra/expo-file-share.service';
import { GetSettingsUseCase } from './application/get-settings.usecase';
import { UpdateSettingUseCase } from './application/update-setting.usecase';
import { ExportHerdCsvUseCase } from './application/export-herd-csv.usecase';
import { ExportCalvesCsvUseCase } from './application/export-calves-csv.usecase';
import { ExportWhatsAppBackupUseCase } from './application/export-whatsapp-backup.usecase';
import { CopyBackupToClipboardUseCase } from './application/copy-backup.usecase';
import { RestoreBackupUseCase } from './application/restore-backup.usecase';

export interface SettingsUseCases {
  repo: SettingSqliteRepository;
  getUseCase: GetSettingsUseCase;
  updateUseCase: UpdateSettingUseCase;
  backupRepo: BackupSqliteRepository;
  fileShareService: ExpoFileShareService;
  exportHerdCsvUseCase: ExportHerdCsvUseCase;
  exportCalvesCsvUseCase: ExportCalvesCsvUseCase;
  exportWhatsAppBackupUseCase: ExportWhatsAppBackupUseCase;
  copyBackupUseCase: CopyBackupToClipboardUseCase;
  restoreBackupUseCase: RestoreBackupUseCase;
}

let cachedUseCases: SettingsUseCases | null = null;

export function getSettingsUseCases(): SettingsUseCases {
  if (!cachedUseCases) {
    const repo = new SettingSqliteRepository();
    const backupRepo = new BackupSqliteRepository();
    const fileShareService = new ExpoFileShareService();
    const tx = new DrizzleTransactionRunner();
    const outbox = {
      enqueue: OutboxRepository.enqueue,
    };

    cachedUseCases = {
      repo,
      getUseCase: new GetSettingsUseCase(repo),
      updateUseCase: new UpdateSettingUseCase(repo, outbox, tx),
      backupRepo,
      fileShareService,
      exportHerdCsvUseCase: new ExportHerdCsvUseCase(backupRepo, fileShareService),
      exportCalvesCsvUseCase: new ExportCalvesCsvUseCase(backupRepo, fileShareService),
      exportWhatsAppBackupUseCase: new ExportWhatsAppBackupUseCase(backupRepo, fileShareService),
      copyBackupUseCase: new CopyBackupToClipboardUseCase(backupRepo, fileShareService),
      restoreBackupUseCase: new RestoreBackupUseCase(backupRepo),
    };
  }

  return cachedUseCases;
}
