import { eq, and } from 'drizzle-orm';
import { getDatabase, generateUUID } from '../client';
import * as schema from '../schema';

export class SettingsRepository {
  /**
   * Obtém o valor de um parâmetro da fazenda.
   */
  static async getSetting(farmId: string, key: string, defaultValue?: string): Promise<string | null> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(schema.settings)
      .where(and(eq(schema.settings.farmId, farmId), eq(schema.settings.key, key)))
      .limit(1);

    if (result.length > 0 && result[0].deletedAt === null) {
      return result[0].value;
    }

    return defaultValue ?? null;
  }

  /**
   * Salva ou atualiza um parâmetro da fazenda (upsert local).
   */
  static async setSetting(farmId: string, key: string, value: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const existing = await db
      .select()
      .from(schema.settings)
      .where(and(eq(schema.settings.farmId, farmId), eq(schema.settings.key, key)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.settings)
        .set({
          value,
          updatedAt: now,
          deletedAt: null,
        })
        .where(eq(schema.settings.id, existing[0].id));
    } else {
      await db.insert(schema.settings).values({
        id: generateUUID(),
        farmId,
        key,
        value,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    }
  }

  /**
   * Retorna todos os parâmetros ativos da fazenda como um dicionário chave-valor.
   */
  static async getAllSettings(farmId: string): Promise<Record<string, string>> {
    const db = getDatabase();
    const results = await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.farmId, farmId));

    const map: Record<string, string> = {};
    for (const item of results) {
      if (item.deletedAt === null) {
        map[item.key] = item.value;
      }
    }
    return map;
  }
}
