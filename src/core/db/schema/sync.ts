import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Tabela de fila de sincronização (sync_queue / outbox).
 * Registra todas as mutações locais pendentes para envio em lote e idempotente.
 */
export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(),
  operationId: text('operation_id'),
  farmId: text('farm_id').notNull(),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  operation: text('operation').notNull(), // 'INSERT' | 'UPDATE' | 'DELETE'
  payloadJson: text('payload_json'),
  status: text('status').notNull().default('pending'), // 'pending' | 'in_flight' | 'failed' | 'completed'
  attempts: integer('attempts').notNull().default(0),
  nextRetryAt: text('next_retry_at'),
  lastError: text('last_error'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at'),
});

export type SyncQueueEntry = typeof syncQueue.$inferSelect;
export type NewSyncQueueEntry = typeof syncQueue.$inferInsert;

/**
 * Tabela de controle de progresso e cursores de sincronização (sync_state).
 */
export const syncState = sqliteTable('sync_state', {
  id: text('id').primaryKey(),
  farmId: text('farm_id').notNull(),
  lastPulledAt: text('last_pulled_at'),
  lastPushedAt: text('last_pushed_at'),
  lastSuccessAt: text('last_success_at'),
  serverRev: integer('server_rev').default(0),
  updatedAt: text('updated_at').notNull(),
});

export type SyncState = typeof syncState.$inferSelect;
export type NewSyncState = typeof syncState.$inferInsert;
