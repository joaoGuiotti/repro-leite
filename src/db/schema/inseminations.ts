import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { animals } from './animals';
import { bulls } from './bulls';
import { farms } from './farms';

/**
 * Tabela de inseminações artificiais realizadas no rebanho.
 */
export const inseminations = sqliteTable(
  'inseminations',
  {
    id: text('id').primaryKey(),
    farmId: text('farm_id')
      .notNull()
      .references(() => farms.id),
    animalId: text('animal_id')
      .notNull()
      .references(() => animals.id),
    bullId: text('bull_id').references(() => bulls.id),
    bullName: text('bull_name').notNull(),
    date: text('date').notNull(),
    inseminator: text('inseminator').notNull(),
    expectedHeatDate: text('expected_heat_date').notNull(),
    pregnancyCheckDate: text('pregnancy_check_date').notNull(),
    expectedCalvingDate: text('expected_calving_date').notNull(),
    dryOffDate: text('dry_off_date').notNull(),
    result: text('result').notNull().default('pendente'),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deletedAt: text('deleted_at'),
  },
  (table) => [
    index('idx_inseminations_farm').on(table.farmId, table.deletedAt),
    index('idx_inseminations_animal').on(
      table.animalId,
      table.date,
      table.deletedAt
    ),
  ]
);

export type Insemination = typeof inseminations.$inferSelect;
export type NewInsemination = typeof inseminations.$inferInsert;
