import { v7 as uuidv7 } from 'uuid';

/**
 * Generates a time-ordered UUID v7
 */
export function generateId(): string {
  return uuidv7();
}
