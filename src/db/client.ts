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
 * Inicializa as tabelas do banco local e garante a existência da fazenda padrão.
 */
export async function initDatabase(): Promise<void> {
  const rawDb = getExpoDatabase();

  // Criação idempotente das tabelas da fundação core
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

    CREATE UNIQUE INDEX IF NOT EXISTS settings_farm_key_idx ON settings(farm_id, key);

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      farm_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload_json TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      id TEXT PRIMARY KEY NOT NULL,
      farm_id TEXT NOT NULL,
      last_pulled_at TEXT,
      last_pushed_at TEXT,
      last_success_at TEXT,
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
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_animals_farm_ear_tag_active 
    ON animals (farm_id, ear_tag_normalized) 
    WHERE deleted_at IS NULL AND exit_status = 'ativo';

    CREATE INDEX IF NOT EXISTS idx_animals_farm_status 
    ON animals (farm_id, exit_status, repro_status, deleted_at);

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

    CREATE INDEX IF NOT EXISTS idx_bulls_farm 
    ON bulls (farm_id, deleted_at);
  `);

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

  // Executa transação SQLite
  rawDb.execSync('BEGIN TRANSACTION;');
  try {
    await mutationFn();

    // Enfileira na sync_queue
    await db.insert(schema.syncQueue).values({
      id: generateUUID(),
      farmId: syncInfo.farmId,
      tableName: syncInfo.tableName,
      recordId: syncInfo.recordId,
      operation: syncInfo.operation,
      payloadJson: syncInfo.payloadJson ? JSON.stringify(syncInfo.payloadJson) : null,
      attempts: 0,
      lastError: null,
      createdAt: now,
    });

    rawDb.execSync('COMMIT;');
  } catch (error) {
    rawDb.execSync('ROLLBACK;');
    throw error;
  }
}

