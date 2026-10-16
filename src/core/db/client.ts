import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

export const SQLITE_DB_NAME = 'repro_leite.db';
export const DEFAULT_FARM_ID = '00000000-0000-4000-a000-000000000001';
export const DEFAULT_FARM_NAME = 'Minha Fazenda';

// Instância SQLite subjacente
let expoDbInstance: ReturnType<typeof openDatabaseSync> | null = null;
let drizzleDbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Retorna a instância do SQLite nativo.
 */
export function getExpoDatabase() {
  if (!expoDbInstance) {
    expoDbInstance = openDatabaseSync(SQLITE_DB_NAME);
  }
  return expoDbInstance;
}

/**
 * Retorna a instância tipada do Drizzle ORM.
 */
export function getDatabase() {
  if (!drizzleDbInstance) {
    const rawDb = getExpoDatabase();
    drizzleDbInstance = drizzle(rawDb, { schema });
  }
  return drizzleDbInstance;
}

/**
 * Gera um UUID v4 compatível com React Native / Expo e ambiente Node.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 simples caso crypto.randomUUID não esteja disponível
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Adiciona uma coluna à tabela caso ela ainda não exista (migração idempotente).
 */
function addColumnIfNotExists(
  rawDb: ReturnType<typeof getExpoDatabase>,
  tableName: string,
  columnName: string,
  columnDef: string
): void {
  try {
    let exists = false;
    if (typeof rawDb.getAllSync === 'function') {
      const tableInfo = rawDb.getAllSync<{ name: string }>(`PRAGMA table_info(${tableName});`);
      if (Array.isArray(tableInfo) && tableInfo.length > 0) {
        exists = tableInfo.some((col) => col.name === columnName);
      }
    }
    if (!exists) {
      rawDb.execSync(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef};`);
    }
  } catch {
    // Se a coluna já existir no SQLite ou falhar por duplicação, ignora com segurança
  }
}

/**
 * Inicializa as tabelas do banco local e garante a existência da fazenda padrão.
 */
export async function initDatabase(): Promise<void> {
  const rawDb = getExpoDatabase();

  // 1. Criação idempotente das tabelas da fundação core (sem índices dependentes de migrações)
  rawDb.execSync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      owner_user_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY NOT NULL,
      farm_id TEXT NOT NULL REFERENCES farms(id),
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      operation_id TEXT,
      farm_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload_json TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      next_retry_at TEXT,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      id TEXT PRIMARY KEY NOT NULL,
      farm_id TEXT NOT NULL,
      last_pulled_at TEXT,
      last_pushed_at TEXT,
      last_success_at TEXT,
      server_rev INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS animals (
      id TEXT PRIMARY KEY NOT NULL,
      farm_id TEXT NOT NULL REFERENCES farms(id),
      ear_tag TEXT NOT NULL,
      ear_tag_normalized TEXT NOT NULL,
      name TEXT,
      breed TEXT NOT NULL,
      sex TEXT NOT NULL DEFAULT 'femea',
      birth_date TEXT NOT NULL,
      birth_weight_kg REAL NOT NULL DEFAULT 40.0,
      life_stage TEXT NOT NULL DEFAULT 'adulta',
      repro_status TEXT NOT NULL DEFAULT 'vazia',
      exit_status TEXT NOT NULL DEFAULT 'ativo',
      exit_date TEXT,
      exit_reason TEXT,
      sire_id TEXT,
      sire_name TEXT,
      dam_id TEXT,
      dam_name TEXT,
      maternal_grandsire_name TEXT,
      paternal_grandsire_name TEXT,
      notes TEXT,
      ear_tag_conflict INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS bulls (
      id TEXT PRIMARY KEY NOT NULL,
      farm_id TEXT NOT NULL REFERENCES farms(id),
      name TEXT NOT NULL,
      breed TEXT NOT NULL,
      code TEXT,
      straws_in_stock INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS inseminations (
      id TEXT PRIMARY KEY NOT NULL,
      farm_id TEXT NOT NULL REFERENCES farms(id),
      animal_id TEXT NOT NULL REFERENCES animals(id),
      bull_id TEXT REFERENCES bulls(id),
      bull_name TEXT NOT NULL,
      date TEXT NOT NULL,
      inseminator TEXT NOT NULL,
      expected_heat_date TEXT NOT NULL,
      pregnancy_check_date TEXT NOT NULL,
      expected_calving_date TEXT NOT NULL,
      dry_off_date TEXT NOT NULL,
      result TEXT NOT NULL DEFAULT 'pendente',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY NOT NULL,
      farm_id TEXT NOT NULL REFERENCES farms(id),
      target_animal_id TEXT NOT NULL REFERENCES animals(id),
      type TEXT NOT NULL,
      due_date TEXT NOT NULL,
      completed_at TEXT,
      source_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS weighings (
      id TEXT PRIMARY KEY NOT NULL,
      farm_id TEXT NOT NULL REFERENCES farms(id),
      animal_id TEXT NOT NULL REFERENCES animals(id),
      date TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
  `);

  // 2. Migrações incrementais para tabelas pré-existentes (executadas ANTES da criação de índices)
  const animalCols = [
    { name: 'sire_id', def: 'sire_id TEXT' },
    { name: 'sire_name', def: 'sire_name TEXT' },
    { name: 'dam_id', def: 'dam_id TEXT' },
    { name: 'dam_name', def: 'dam_name TEXT' },
    { name: 'maternal_grandsire_name', def: 'maternal_grandsire_name TEXT' },
    { name: 'paternal_grandsire_name', def: 'paternal_grandsire_name TEXT' },
    { name: 'ear_tag_conflict', def: 'ear_tag_conflict INTEGER NOT NULL DEFAULT 0' },
  ];
  for (const col of animalCols) {
    addColumnIfNotExists(rawDb, 'animals', col.name, col.def);
  }

  const syncQueueCols = [
    { name: 'operation_id', def: 'operation_id TEXT' },
    { name: 'status', def: "status TEXT NOT NULL DEFAULT 'pending'" },
    { name: 'next_retry_at', def: 'next_retry_at TEXT' },
    { name: 'updated_at', def: 'updated_at TEXT' },
  ];
  for (const col of syncQueueCols) {
    addColumnIfNotExists(rawDb, 'sync_queue', col.name, col.def);
  }

  const syncStateCols = [
    { name: 'server_rev', def: 'server_rev INTEGER DEFAULT 0' },
  ];
  for (const col of syncStateCols) {
    addColumnIfNotExists(rawDb, 'sync_state', col.name, col.def);
  }

  // 3. Criação idempotente dos índices (garantido que todas as colunas existem)
  rawDb.execSync(`
    CREATE UNIQUE INDEX IF NOT EXISTS settings_farm_key_idx ON settings(farm_id, key);

    CREATE INDEX IF NOT EXISTS idx_sync_queue_status_retry 
    ON sync_queue (farm_id, status, next_retry_at);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_animals_farm_ear_tag_active 
    ON animals (farm_id, ear_tag_normalized) 
    WHERE deleted_at IS NULL AND exit_status = 'ativo';

    CREATE INDEX IF NOT EXISTS idx_animals_farm_status 
    ON animals (farm_id, exit_status, repro_status, deleted_at);

    CREATE INDEX IF NOT EXISTS idx_bulls_farm 
    ON bulls (farm_id, deleted_at);

    CREATE INDEX IF NOT EXISTS idx_inseminations_farm 
    ON inseminations (farm_id, deleted_at);

    CREATE INDEX IF NOT EXISTS idx_inseminations_animal 
    ON inseminations (animal_id, date, deleted_at);

    CREATE INDEX IF NOT EXISTS idx_alerts_farm_due 
    ON alerts (farm_id, due_date, completed_at, deleted_at);

    CREATE INDEX IF NOT EXISTS idx_alerts_source 
    ON alerts (source_id, deleted_at);

    CREATE INDEX IF NOT EXISTS idx_weighings_animal_date
    ON weighings (animal_id, date);

    CREATE INDEX IF NOT EXISTS idx_weighings_farm_deleted
    ON weighings (farm_id, deleted_at);
  `);

  // 4. Garante a existência da fazenda padrão para uso offline imediato
  await ensureDefaultFarm();
}

/**
 * Garante que a fazenda padrão local existe para que o usuário possa usar o app imediatamente offline.
 */
export async function ensureDefaultFarm(): Promise<schema.Farm> {
  const db = getDatabase();
  const existingFarms = await db.select().from(schema.farms).where(eq(schema.farms.id, DEFAULT_FARM_ID));

  const now = new Date().toISOString();

  if (existingFarms.length > 0) {
    return existingFarms[0];
  }

  // Se nenhuma fazenda existir, cria a padrão
  const allFarms = await db.select().from(schema.farms);
  if (allFarms.length > 0) {
    return allFarms[0];
  }

  const defaultFarm: schema.NewFarm = {
    id: DEFAULT_FARM_ID,
    name: DEFAULT_FARM_NAME,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await db.insert(schema.farms).values(defaultFarm);
  return defaultFarm as schema.Farm;
}

/**
 * Executa uma mutação no banco de dados e registra a operação na sync_queue dentro da mesma transação.
 */
export async function executeTransactionalMutation(
  mutationFn: () => Promise<void>,
  syncInfo: {
    farmId: string;
    tableName: string;
    recordId: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    payloadJson?: Record<string, unknown> | null;
  }
): Promise<void> {
  const db = getDatabase();
  const rawDb = getExpoDatabase();
  const now = new Date().toISOString();
  const opId = generateUUID();

  // Executa transação SQLite
  rawDb.execSync('BEGIN TRANSACTION;');
  try {
    await mutationFn();

    // Enfileira na sync_queue com status pending e operationId único
    await db.insert(schema.syncQueue).values({
      id: opId,
      operationId: opId,
      farmId: syncInfo.farmId,
      tableName: syncInfo.tableName,
      recordId: syncInfo.recordId,
      operation: syncInfo.operation,
      payloadJson: syncInfo.payloadJson ? JSON.stringify(syncInfo.payloadJson) : null,
      status: 'pending',
      attempts: 0,
      nextRetryAt: null,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    });

    rawDb.execSync('COMMIT;');
  } catch (error) {
    rawDb.execSync('ROLLBACK;');
    throw error;
  }
}

