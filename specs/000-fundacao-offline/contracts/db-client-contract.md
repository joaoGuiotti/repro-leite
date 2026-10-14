# Contract: Cliente de Banco de Dados Local & Repositórios

**Módulo**: `src/db/`  
**Escopo**: Inicialização do SQLite local (`expo-sqlite`), tipagem de migrações e operações transacionais com registro em fila de sincronização.

---

## 1. Inicialização do Cliente Drizzle

```typescript
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

export const SQLITE_DB_NAME = 'repro_leite.db';

export interface DatabaseConnection {
  db: ReturnType<typeof drizzle>;
  initDatabase: () => Promise<void>;
  resetDatabase: () => Promise<void>;
}
```

---

## 2. Contrato de Transação Atômica com Sync Queue

Qualquer mutação no banco de dados local deve garantir que a alteração da entidade e a entrada correspondente na `sync_queue` sejam executadas dentro da mesma transação SQLite:

```typescript
export interface BaseEntity {
  id: string;
  farmId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface TransactionalWriteOptions<T extends BaseEntity> {
  tableName: string;
  record: T;
  operation: SyncOperation;
}

export interface IBaseRepository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  findAll(farmId: string, includeDeleted?: boolean): Promise<T[]>;
  save(record: T): Promise<void>;
  softDelete(id: string): Promise<void>;
}
```

---

## 3. Contrato do Repositório de Parâmetros (`SettingsRepository`)

```typescript
export interface ISettingsRepository {
  getSetting(farmId: string, key: string, defaultValue?: string): Promise<string | null>;
  setSetting(farmId: string, key: string, value: string): Promise<void>;
  getAllSettings(farmId: string): Promise<Record<string, string>>;
}
```

---

## 4. Contrato da Fila de Sincronização (`SyncQueueRepository`)

```typescript
export interface ISyncQueueRepository {
  getPendingCount(farmId: string): Promise<number>;
  peekBatch(farmId: string, limit: number): Promise<SyncQueueEntry[]>;
  removeBatch(ids: string[]): Promise<void>;
  recordFailure(id: string, errorMessage: string): Promise<void>;
}

export interface SyncQueueEntry {
  id: string;
  farmId: string;
  tableName: string;
  recordId: string;
  operation: SyncOperation;
  payloadJson: string | null;
  attempts: number;
  createdAt: string;
}
```
