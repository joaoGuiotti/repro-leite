import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { farms } from '@core/db/schema/farms';
import { animals } from '@features/herd/infra/animal.schema';

/**
 * Tabela de alertas reprodutivos e zootécnicos do rebanho.
 */
export const alerts = sqliteTable(
  'alerts',
  {
    id: text('id').primaryKey(),
    farmId: text('farm_id')
      .notNull()
      .references(() => farms.id),
    targetAnimalId: text('target_animal_id')
      .notNull()
      .references(() => animals.id),
    type: text('type').notNull(), // 'heat_check_21d' | 'pregnancy_check_45d' | 'calving_due' | 'dry_off'
    dueDate: text('due_date').notNull(),
    completedAt: text('completed_at'),
    sourceId: text('source_id'), // Referência ao id de inseminação ou outro manejo
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deletedAt: text('deleted_at'),
  },
  (table) => [
    index('idx_alerts_farm_due').on(
      table.farmId,
      table.dueDate,
      table.completedAt,
      table.deletedAt
    ),
    index('idx_alerts_source').on(table.sourceId, table.deletedAt),
  ]
);

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
