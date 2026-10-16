import { getDatabase, getExpoDatabase } from '@core/db/client';
import * as schema from '@core/db/schema';
import { eq } from 'drizzle-orm';
import { RemoteSyncGateway, RemoteRecordChange } from '../network/api-client';
import { ConflictResolver } from './conflict-resolver';

export interface PullResult {
  pulledCount: number;
  newRev: number;
  hasMore: boolean;
}

export interface PullOptions {
  rawDb?: ReturnType<typeof getExpoDatabase>;
  db?: ReturnType<typeof getDatabase>;
}

export class PullEngine {
  /**
   * Busca alterações remotas a partir do último cursor (server_rev / last_pulled_at)
   * e as aplica de forma transacional no SQLite local utilizando a política de conflitos.
   */
  static async pull(
    farmId: string,
    gateway: RemoteSyncGateway,
    limit: number = 100,
    options?: PullOptions
  ): Promise<PullResult> {
    const db = options?.db ?? getDatabase();
    const rawDb = options?.rawDb ?? getExpoDatabase();

    // 1. Obtém o estado atual de sincronização do farm
    const stateRecord = await db
      .select()
      .from(schema.syncState)
      .where(eq(schema.syncState.farmId, farmId))
      .limit(1);

    const sinceRev = stateRecord[0]?.serverRev ?? 0;
    const sinceTimestamp = stateRecord[0]?.lastPulledAt ?? null;

    // 2. Consulta mudanças remotas
    const response = await gateway.pullChanges({
      farmId,
      sinceRev,
      sinceTimestamp,
      limit,
    });

    if (response.changes.length === 0) {
      return {
        pulledCount: 0,
        newRev: sinceRev,
        hasMore: false,
      };
    }

    const now = new Date().toISOString();

    // 3. Aplica alterações em lote transacional
    try {
      rawDb.execSync('PRAGMA foreign_keys = OFF;');
    } catch {
      // Ignora em mocks ou ambientes sem PRAGMA
    }

    rawDb.execSync('BEGIN TRANSACTION;');
    try {
      for (const change of response.changes) {
        await this.applyChange(rawDb, change);
      }

      // 4. Atualiza cursor de pull e sucesso
      if (stateRecord.length > 0) {
        await db
          .update(schema.syncState)
          .set({
            lastPulledAt: now,
            lastSuccessAt: now,
            serverRev: response.newRev,
            updatedAt: now,
          })
          .where(eq(schema.syncState.farmId, farmId));
      } else {
        await db.insert(schema.syncState).values({
          id: farmId,
          farmId,
          lastPulledAt: now,
          lastSuccessAt: now,
          serverRev: response.newRev,
          updatedAt: now,
        });
      }

      rawDb.execSync('COMMIT;');
    } catch (error) {
      rawDb.execSync('ROLLBACK;');
      throw error;
    } finally {
      try {
        rawDb.execSync('PRAGMA foreign_keys = ON;');
      } catch {
        // Ignora em mocks ou ambientes sem PRAGMA
      }
    }

    return {
      pulledCount: response.changes.length,
      newRev: response.newRev,
      hasMore: response.hasMore,
    };
  }

  /**
   * Aplica uma alteração remota em uma tabela local, resolvendo conflitos.
   */
  private static async applyChange(
    rawDb: ReturnType<typeof getExpoDatabase>,
    change: RemoteRecordChange
  ): Promise<void> {
    const validTables = ['animals', 'bulls', 'inseminations', 'alerts', 'settings', 'farms'];
    if (!validTables.includes(change.tableName)) {
      return;
    }

    // Busca registro local atual
    let localRecord: Record<string, unknown> | null = null;
    try {
      const row = rawDb.getFirstSync(
        `SELECT * FROM ${change.tableName} WHERE id = ?;`,
        [change.recordId]
      );
      if (row && typeof row === 'object') {
        localRecord = row as Record<string, unknown>;
      }
    } catch {
      localRecord = null;
    }

    // Resolve conflito
    const remoteData = {
      ...change.data,
      id: change.recordId,
      ...(change.tableName !== 'farms' ? { farm_id: change.farmId } : {}),
      updated_at: change.updatedAt,
      deleted_at: change.deletedAt,
    };

    const resolution = ConflictResolver.resolve(change.tableName, localRecord, remoteData);

    if (resolution.action === 'keep_local') {
      return;
    }

    const recordToApply = resolution.resolvedRecord;

    // Se a tabela for farms, substitui qualquer ID local obsoleto pelo ID da nuvem
    if (change.tableName === 'farms') {
      try {
        rawDb.runSync(`DELETE FROM farms WHERE id != ?;`, [change.recordId]);
      } catch {
        // Ignora
      }
    }

    // Se estiver marcado para exclusão suave
    if (recordToApply.deleted_at || recordToApply.deletedAt) {
      const deletedAt = (recordToApply.deleted_at ?? recordToApply.deletedAt) as string;
      const updatedAt = (recordToApply.updated_at ?? recordToApply.updatedAt ?? deletedAt) as string;

      if (localRecord) {
        rawDb.runSync(
          `UPDATE ${change.tableName} SET deleted_at = ?, updated_at = ? WHERE id = ?;`,
          [deletedAt, updatedAt, change.recordId]
        );
      }
      return;
    }

    // Trata conflito de brinco duplicado para a tabela animals (SC-007)
    if (change.tableName === 'animals' && !recordToApply.deleted_at && !recordToApply.deletedAt) {
      const incomingEarTag = (recordToApply.ear_tag ?? recordToApply.earTag) as string;
      const incomingFarmId = (recordToApply.farm_id ?? recordToApply.farmId ?? change.farmId) as string;
      const normTag = incomingEarTag ? String(incomingEarTag).trim().toLowerCase() : '';

      if (normTag) {
        recordToApply.ear_tag_normalized = normTag;

        try {
          const conflictingAnimal = rawDb.getFirstSync(
            `SELECT id, ear_tag FROM animals WHERE farm_id = ? AND ear_tag_normalized = ? AND id != ? AND deleted_at IS NULL AND exit_status = 'ativo' LIMIT 1;`,
            [incomingFarmId, normTag, change.recordId]
          ) as { id: string; ear_tag: string } | null;

          if (conflictingAnimal) {
            // Marca o animal local existente com conflito de brinco
            rawDb.runSync(
              `UPDATE animals SET ear_tag_conflict = 1 WHERE id = ?;`,
              [conflictingAnimal.id]
            );

            // Ajusta o brinco do animal entrante com sufixo identificador para não violar o índice UNIQUE
            const shortId = change.recordId.slice(-4);
            recordToApply.ear_tag = `${incomingEarTag} (dup-${shortId})`;
            recordToApply.ear_tag_normalized = `${normTag}_dup_${shortId}`;
            recordToApply.ear_tag_conflict = 1;
          }
        } catch {
          // Ignora se tabela animals ou colunas ainda não inicializadas
        }
      }
    }

    // Trata chave duplicada na tabela settings (farm_id, key)
    if (change.tableName === 'settings') {
      const incomingKey = recordToApply.key as string;
      const incomingFarmId = (recordToApply.farm_id ?? recordToApply.farmId ?? change.farmId) as string;

      if (incomingKey && incomingFarmId) {
        try {
          const existingSetting = rawDb.getFirstSync(
            `SELECT id FROM settings WHERE farm_id = ? AND key = ? AND id != ? LIMIT 1;`,
            [incomingFarmId, incomingKey, change.recordId]
          ) as { id: string } | null;

          if (existingSetting) {
            rawDb.runSync(`DELETE FROM settings WHERE id = ?;`, [existingSetting.id]);
          }
        } catch {
          // Ignora
        }
      }
    }

    // Upsert no registro local
    this.upsertLocalRecord(rawDb, change.tableName, change.recordId, recordToApply);
  }

  private static upsertLocalRecord(
    rawDb: ReturnType<typeof getExpoDatabase>,
    tableName: string,
    recordId: string,
    data: Record<string, unknown>
  ): void {
    let validColNames: Set<string>;
    try {
      const tableInfo = rawDb.getAllSync(`PRAGMA table_info(${tableName});`) as { name: string }[];
      validColNames = new Set(tableInfo.map((c) => c.name));
    } catch {
      validColNames = new Set();
    }

    const columns: string[] = [];
    const values: unknown[] = [];
    const placeholders: string[] = [];

    for (const [key, val] of Object.entries(data)) {
      const colName = this.toSnakeCase(key);

      // Metadados do servidor como server_rev não existem nas tabelas do SQLite local
      if (colName === 'server_rev') {
        continue;
      }
      if (validColNames.size > 0 && !validColNames.has(colName)) {
        continue;
      }

      // Evita colunas complexas
      if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
        continue;
      }

      columns.push(colName);
      values.push(val ?? null);
      placeholders.push('?');
    }

    if (!columns.includes('id')) {
      columns.push('id');
      values.push(recordId);
      placeholders.push('?');
    }

    const updateClauses = columns
      .filter((col) => col !== 'id')
      .map((col) => `${col} = excluded.${col}`)
      .join(', ');

    const sql =
      updateClauses.length > 0
        ? `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT(id) DO UPDATE SET ${updateClauses};`
        : `INSERT OR IGNORE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')});`;

    rawDb.runSync(sql, values as (string | number | null)[]);
  }

  private static toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}
