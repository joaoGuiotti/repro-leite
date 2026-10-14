import { text } from 'drizzle-orm/sqlite-core';

/**
 * Colunas comuns herdadas por todas as tabelas de negócio do ReproLeite.
 * Garantem isolamento multi-tenant, concorrência Last-Write-Wins (LWW) e soft delete.
 */
export const commonColumns = {
  id: text('id').primaryKey(),
  farmId: text('farm_id').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
};

export interface BaseEntity {
  id: string;
  farmId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
