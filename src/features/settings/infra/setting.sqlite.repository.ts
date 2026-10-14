import { and, eq, isNull } from 'drizzle-orm';
import { getDatabase } from '@core/db/client';
import { generateId } from '@core/utils/id';
import { SettingRepository } from '../domain/setting.repository';
import { settings } from './setting.schema';

export class SettingSqliteRepository implements SettingRepository {
  async get(farmId: string, key: string): Promise<string | null> {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.farmId, farmId),
          eq(settings.key, key),
          isNull(settings.deletedAt)
        )
      )
      .limit(1);

    if (rows.length === 0) return null;
    return rows[0].value;
  }

  async getAll(farmId: string): Promise<Record<string, string>> {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(settings)
      .where(and(eq(settings.farmId, farmId), isNull(settings.deletedAt)));

    const result: Record<string, string> = {};
    for (const r of rows) {
      result[r.key] = r.value;
    }
    return result;
  }

  async set(farmId: string, key: string, value: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    const existing = await db
      .select()
      .from(settings)
      .where(and(eq(settings.farmId, farmId), eq(settings.key, key)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(settings)
        .set({
          value,
          updatedAt: now,
          deletedAt: null,
        })
        .where(eq(settings.id, existing[0].id));
    } else {
      await db.insert(settings).values({
        id: generateId(),
        farmId,
        key,
        value,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    }
  }
}
