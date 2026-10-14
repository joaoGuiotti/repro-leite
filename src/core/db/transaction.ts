import { getDatabase } from './client';

export interface TransactionRunner {
  run<T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * Runs an atomic SQLite transaction using Drizzle ORM.
 */
export async function withTransaction<T>(fn: (tx?: any) => Promise<T>): Promise<T> {
  const db = getDatabase();
  if (typeof db.transaction === 'function') {
    return await db.transaction(async (tx) => {
      return await fn(tx);
    });
  }
  return await fn();
}

export class DrizzleTransactionRunner implements TransactionRunner {
  async run<T>(fn: () => Promise<T>): Promise<T> {
    return withTransaction(fn);
  }
}
