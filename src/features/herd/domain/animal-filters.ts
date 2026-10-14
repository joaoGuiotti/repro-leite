import { AnimalFilterOptions, AnimalSummary } from './animal.entity';

/**
 * Filtra e ordena animais do rebanho com base em texto de busca (brinco/nome)
 * e status reprodutivo zootécnico.
 *
 * Regras:
 * 1. Machos (sex === 'macho') são automaticamente excluídos quando um filtro
 *    reprodutivo específico de fêmeas estiver ativo (vazia, inseminada, prenhe, seca).
 * 2. Machos aparecem normalmente sob o filtro geral 'todas'.
 * 3. Animais ativos aparecem primeiro, seguidos por animais inativos (com saída).
 * 4. Animais inativos são ocultados por padrão, exceto se showInactive=true ou
 *    se uma busca direta for realizada.
 */
export function filterAnimals<T extends AnimalSummary>(
  animals: T[],
  options: AnimalFilterOptions = {}
): T[] {
  const { query, reproStatus = 'todas', showInactive = false } = options;

  const normalizedQuery = query?.trim().toLowerCase() ?? '';
  const hasQuery = normalizedQuery.length > 0;

  return animals
    .filter((animal) => {
      // 1. Filtragem por inatividade: se não pediu inativos e não há busca, oculta saídas
      const isInactive = animal.exitStatus !== 'ativo';
      if (isInactive && !showInactive && !hasQuery) {
        return false;
      }

      // 2. Filtragem por busca textual (brinco, brinco normalizado ou nome)
      if (hasQuery) {
        const matchEarTag = animal.earTag.toLowerCase().includes(normalizedQuery);
        const matchNormalized = animal.earTagNormalized.toLowerCase().includes(normalizedQuery);
        const matchName = animal.name ? animal.name.toLowerCase().includes(normalizedQuery) : false;

        if (!matchEarTag && !matchNormalized && !matchName) {
          return false;
        }
      }

      // 3. Filtragem por status reprodutivo
      if (reproStatus && reproStatus !== 'todas') {
        // Machos nunca passam em filtros reprodutivos específicos de fêmeas
        if (animal.sex === 'macho') {
          return false;
        }

        if (animal.reproStatus !== reproStatus) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // Ativos vêm antes de inativos
      const aInactive = a.exitStatus !== 'ativo';
      const bInactive = b.exitStatus !== 'ativo';

      if (aInactive && !bInactive) return 1;
      if (!aInactive && bInactive) return -1;

      // Ordena por brinco
      return a.earTag.localeCompare(b.earTag, undefined, { numeric: true });
    });
}
