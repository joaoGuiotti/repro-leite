import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { farms } from '@core/db/schema/farms';

/**
 * Tabela de catálogo de touros e estoque de doses de sêmen.
 */
export const bulls = sqliteTable(
  'bulls',
  {
    id: text('id').primaryKey(),
    farmId: text('farm_id')
      .notNull()
      .references(() => farms.id),
    name: text('name').notNull(),
    breed: text('breed').notNull(),
    code: text('code'),
    strawsInStock: integer('straws_in_stock').notNull().default(0),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deletedAt: text('deleted_at'),
  },
  (table) => [
    index('idx_bulls_farm').on(table.farmId, table.deletedAt),
  ]
);

export type Bull = typeof bulls.$inferSelect;
export type NewBull = typeof bulls.$inferInsert;
