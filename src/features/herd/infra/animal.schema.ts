import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { farms } from '@core/db/schema/farms';

/**
 * Tabela de animais do rebanho (vacas, novilhas, bezerras e touros da fazenda).
 * Possui índice único parcial garantindo que o brinco seja exclusivo apenas entre animais ativos.
 */
export const animals = sqliteTable(
  'animals',
  {
    id: text('id').primaryKey(),
    farmId: text('farm_id')
      .notNull()
      .references(() => farms.id),
    earTag: text('ear_tag').notNull(),
    earTagNormalized: text('ear_tag_normalized').notNull(),
    name: text('name'),
    breed: text('breed').notNull(),
    sex: text('sex').notNull().default('femea'),
    birthDate: text('birth_date').notNull(),
    birthWeightKg: real('birth_weight_kg').notNull().default(40.0),
    lifeStage: text('life_stage').notNull().default('adulta'),
    reproStatus: text('repro_status').notNull().default('vazia'),
    exitStatus: text('exit_status').notNull().default('ativo'),
    exitDate: text('exit_date'),
    exitReason: text('exit_reason'),
    sireId: text('sire_id'),
    sireName: text('sire_name'),
    damId: text('dam_id'),
    damName: text('dam_name'),
    maternalGrandsireName: text('maternal_grandsire_name'),
    paternalGrandsireName: text('paternal_grandsire_name'),
    notes: text('notes'),
    earTagConflict: integer('ear_tag_conflict').notNull().default(0),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deletedAt: text('deleted_at'),
  },
  (table) => [
    uniqueIndex('idx_animals_farm_ear_tag_active')
      .on(table.farmId, table.earTagNormalized)
      .where(sql`deleted_at IS NULL AND exit_status = 'ativo'`),
    index('idx_animals_farm_status').on(
      table.farmId,
      table.exitStatus,
      table.reproStatus,
      table.deletedAt
    ),
  ]
);

export type Animal = typeof animals.$inferSelect;
export type NewAnimal = typeof animals.$inferInsert;
