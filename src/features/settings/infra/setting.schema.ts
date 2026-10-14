import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { farms } from '@core/db/schema/farms';

/**
 * Tabela de configurações e parâmetros da fazenda (settings).
 * Armazena prazos zootécnicos, data simulada e preferências locais.
 */
export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  farmId: text('farm_id').notNull().references(() => farms.id),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
}, (table) => ({
  farmKeyUnique: uniqueIndex('settings_farm_key_idx').on(table.farmId, table.key),
}));

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
