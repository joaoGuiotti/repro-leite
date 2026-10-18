import { getDatabase } from './client';

export interface TransactionRunner {
  run<T>(fn: () => Promise<T>): Promise<T>;
}

let transactionDepth = 0;
const postCommitListeners = new Set<() => void>();

export function onTransactionCommitted(listener: () => void): () => void {
  postCommitListeners.add(listener);
  return () => {
    postCommitListeners.delete(listener);
  };
}

function notifyTransactionCommitted(): void {
  for (const listener of postCommitListeners) {
    try {
      listener();
    } catch {
      // Ignora erro de listener individual
    }
  }
}

/**
 * Runs an atomic SQLite transaction using Drizzle ORM.
 * Evita abertura de transações aninhadas no SQLite e notifica listeners após o commit raiz.
 */
export async function withTransaction<T>(fn: (tx?: any) => Promise<T>): Promise<T> {
  if (transactionDepth > 0) {
    return await fn();
  }

  const db = getDatabase();
  transactionDepth++;
  try {
    let result: T;
    if (typeof db.transaction === 'function') {
      result = await db.transaction(async (tx) => {
        return await fn(tx);
      });
    } else {
      result = await fn();
    }
    return result;
  } finally {
    transactionDepth--;
    if (transactionDepth === 0) {
      notifyTransactionCommitted();
    }
  }
}

export class DrizzleTransactionRunner implements TransactionRunner {
  async run<T>(fn: () => Promise<T>): Promise<T> {
    return withTransaction(fn);
  }
}

