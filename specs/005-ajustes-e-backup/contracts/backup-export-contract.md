# Contratos de Interfaces & Use Cases: 005-ajustes-e-backup

**Feature**: `005-ajustes-e-backup`  
**Date**: 2026-10-15  
**Context**: Contratos TypeScript das portas de persistência, serviços de compartilhamento e casos de uso da camada Application.

---

## 1. Portas de Domínio (Repository & Service Ports)

### 1.1 `BackupRepository` (`src/features/settings/domain/backup.repository.ts`)
Porta para leitura dos dados consolidados e restauração transacional atômica no banco SQLite local:

```typescript
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
```

### 1.2 `FileShareService` (`src/features/settings/domain/file-share.service.ts`)
Porta para abstração de escrita em disco, compartilhamento nativo e manipulação de arquivos:

```typescript
export interface FileShareService {
  /**
   * Grava temporariamente e aciona a folha de compartilhamento nativa (WhatsApp, Drive, etc).
   */
  shareFile(options: {
    filename: string;
    content: string;
    mimeType: string;
    dialogTitle: string;
  }): Promise<boolean>;

  /**
   * Abre o seletor nativo de documentos para escolher arquivo de backup (.json).
   */
  pickJsonFile(): Promise<string | null>;

  /**
   * Copia o texto para a área de transferência do dispositivo.
   */
  copyToClipboard(text: string): Promise<void>;
}
```

---

## 2. Casos de Uso (Application Layer)

### 2.1 `ExportHerdCsvUseCase`
```typescript
export interface ExportHerdCsvInput {
  farmId: string;
}

export class ExportHerdCsvUseCase {
  constructor(
    private backupRepo: BackupRepository,
    private shareService: FileShareService
  ) {}

  async execute(input: ExportHerdCsvInput): Promise<Result<boolean, Error>>;
}
```

### 2.2 `ExportCalvesCsvUseCase`
```typescript
export interface ExportCalvesCsvInput {
  farmId: string;
}

export class ExportCalvesCsvUseCase {
  constructor(
    private backupRepo: BackupRepository,
    private shareService: FileShareService
  ) {}

  async execute(input: ExportCalvesCsvInput): Promise<Result<boolean, Error>>;
}
```

### 2.3 `ExportWhatsAppBackupUseCase`
```typescript
export interface ExportWhatsAppBackupInput {
  farmId: string;
}

export class ExportWhatsAppBackupUseCase {
  constructor(
    private backupRepo: BackupRepository,
    private shareService: FileShareService
  ) {}

  async execute(input: ExportWhatsAppBackupInput): Promise<Result<boolean, Error>>;
}
```

### 2.4 `CopyBackupToClipboardUseCase`
```typescript
export interface CopyBackupInput {
  farmId: string;
}

export class CopyBackupToClipboardUseCase {
  constructor(
    private backupRepo: BackupRepository,
    private shareService: FileShareService
  ) {}

  async execute(input: CopyBackupInput): Promise<Result<void, Error>>;
}
```

### 2.5 `RestoreBackupUseCase`
```typescript
export interface RestoreBackupInput {
  jsonContent: string;
  targetFarmId: string;
}

export class RestoreBackupUseCase {
  constructor(private backupRepo: BackupRepository) {}

  async execute(input: RestoreBackupInput): Promise<Result<void, Error>>;
}
```

---

## 3. Contratos de Formatação Pura (Domain Engines)

### 3.1 `formatCsvContent(rows: Record<string, string>[], columns: { key: string; label: string }[]): string`
- Adiciona `\uFEFF` (BOM).
- Cria linha de cabeçalho unida por `;`.
- Trata aspas e quebras de linha com delimitadores `"`.
- Retorna a string pronta para escrita.

### 3.2 `validateBackupPayload(parsedJson: unknown, expectedFarmId?: string): Result<BackupPayload, string>`
- Valida se `version === 1`.
- Valida se `app === 'repro-leite'`.
- Valida presença das propriedades em `data`.
- Retorna o payload tipado ou erro explicativo.
