import { AnimalSummary, EarTagEvaluationResult } from '@/types/animal';

/**
 * Normaliza o brinco removendo pontuações/espaços e convertendo para maiúsculo.
 * Exemplo: " a-104 b " -> "A104B"
 */
export function normalizeEarTag(tag: string): string {
  if (!tag) return '';
  return tag
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Avalia a disponibilidade de um brinco conforme a Política de Reuso do ReproLeite (FR-003):
 * 1. Brinco em uso por animal ATIVO: BLOQUEADO (status: 'bloqueado_ativo').
 * 2. Brinco pertencente a animal INATIVO (vendido, descartado, morto) ou EXCLUÍDO:
 *    Permitido com aviso amarelo de confirmação (status: 'alerta_reuso_inativo').
 * 3. Brinco INÉDITO: Liberado (status: 'disponivel').
 */
export function evaluateEarTagAvailability(
  existingAnimals: AnimalSummary[],
  targetTag: string,
  currentAnimalId?: string
): EarTagEvaluationResult {
  const normalized = normalizeEarTag(targetTag);

  if (!normalized) {
    return {
      status: 'disponivel',
      normalizedTag: '',
    };
  }

  // Encontra animais que coincidem com o brinco normalizado, ignorando o próprio animal sendo editado
  const matches = existingAnimals.filter(
    (a) => a.earTagNormalized === normalized && a.id !== currentAnimalId
  );

  if (matches.length === 0) {
    return {
      status: 'disponivel',
      normalizedTag: normalized,
    };
  }

  // 1. Verifica se há algum animal ATIVO (e não excluído logicamente) com esse brinco
  const activeAnimal = matches.find(
    (a) => a.exitStatus === 'ativo' && !a.deletedAt
  );

  if (activeAnimal) {
    const nomeAnimal = activeAnimal.name ? `pela vaca "${activeAnimal.name}"` : 'por outro animal ativo';
    return {
      status: 'bloqueado_ativo',
      normalizedTag: normalized,
      currentAnimal: activeAnimal,
      message: `Brinco ${targetTag.trim()} já está em uso ${nomeAnimal}.`,
    };
  }

  // 2. Pertenceu a animal inativo (saída) ou excluído
  const pastAnimal = matches[0];
  const motivo = pastAnimal.exitStatus !== 'ativo' ? pastAnimal.exitStatus : 'removido';
  const dataSaida = pastAnimal.exitDate ? ` em ${pastAnimal.exitDate}` : '';
  const nomeAntigo = pastAnimal.name ? `"${pastAnimal.name}"` : 'animal anterior';

  return {
    status: 'alerta_reuso_inativo',
    normalizedTag: normalized,
    pastAnimal,
    message: `Brinco ${targetTag.trim()} pertenceu a ${nomeAntigo} (${motivo}${dataSaida}). Deseja reutilizar este número?`,
  };
}
