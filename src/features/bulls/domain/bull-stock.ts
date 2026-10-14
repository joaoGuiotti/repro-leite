/**
 * Ajusta o saldo de doses de palhetas de sêmen de um touro.
 * Impede que o estoque fique negativo ou contenha frações.
 */
export function adjustBullStock(currentStraws: number, delta: number): number {
  if (!Number.isInteger(currentStraws) || !Number.isInteger(delta)) {
    throw new Error('A quantidade de doses deve ser um número inteiro.');
  }

  const newStock = currentStraws + delta;

  if (newStock < 0) {
    throw new Error('O estoque de doses não pode ser inferior a zero.');
  }

  return newStock;
}

/**
 * Valida se um touro possui doses disponíveis para inseminação artificial.
 */
export function hasAvailableStraws(strawsInStock: number): boolean {
  return strawsInStock > 0;
}
