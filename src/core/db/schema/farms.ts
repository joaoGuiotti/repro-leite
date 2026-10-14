import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Tabela de propriedades rurais (farms).
 * Define o escopo multi-tenant local e na nuvem.
 */
export const farms = sqliteTable('farms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerUserId: text('owner_user_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

export type Farm = typeof farms.$inferSelect;
export type NewFarm = typeof farms.$inferInsert;
