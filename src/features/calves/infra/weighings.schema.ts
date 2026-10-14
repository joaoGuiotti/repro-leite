import { index, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { farms } from '@core/db/schema/farms';
import { animals } from '@core/db/schema/animals';

/**
 * Tabela de pesagens periódicas de bezerras e novilhas.
 * Registra a data, peso em kg e notas para cálculo do Ganho Médio Diário (GMD).
 */
export const weighings = sqliteTable(
  'weighings',
  {
    id: text('id').primaryKey(),
    farmId: text('farm_id')
      .notNull()
      .references(() => farms.id),
    animalId: text('animal_id')
      .notNull()
      .references(() => animals.id),
    date: text('date').notNull(), // ISO YYYY-MM-DD
    weightKg: real('weight_kg').notNull(),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deletedAt: text('deleted_at'),
  },
  (table) => [
    index('idx_weighings_animal_date').on(table.animalId, table.date),
    index('idx_weighings_farm_deleted').on(table.farmId, table.deletedAt),
  ]
);

export type Weighing = typeof weighings.$inferSelect;
export type NewWeighing = typeof weighings.$inferInsert;
