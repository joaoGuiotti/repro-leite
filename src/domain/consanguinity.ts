import { ConsanguinityCheckResult } from '@/types/insemination';

export interface AnimalPedigreeInfo {
  sireId?: string | null;
  sireName?: string | null;
  maternalGrandsireId?: string | null;
  maternalGrandsireName?: string | null;
  paternalGrandsireId?: string | null;
  paternalGrandsireName?: string | null;
}

export interface BullPedigreeTarget {
  id?: string | null;
  name: string;
}

function normalizarNome(nome?: string | null): string {
  if (!nome) return '';
  return nome.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Avalia parentesco de 1º grau (pai) e 2º grau (avô) entre fêmea e reprodutor.
 * Compara tanto IDs únicos quanto nomes normalizados.
 */
export function checkConsanguinity(
  female: AnimalPedigreeInfo,
  bull: BullPedigreeTarget
): ConsanguinityCheckResult {
  const bullNormalizedName = normalizarNome(bull.name);
  const bullId = bull.id?.trim();

  // 1. Checagem de 1º Grau (Pai)
  const isSireIdMatch = bullId && female.sireId && bullId === female.sireId;
  const isSireNameMatch =
    bullNormalizedName &&
    female.sireName &&
    normalizarNome(female.sireName) === bullNormalizedName;

  if (isSireIdMatch || isSireNameMatch) {
    return {
      isConsanguineous: true,
      degree: '1st_degree',
      relation: 'pai',
      warningMessage: `Atenção: Consanguinidade de 1º Grau detectada (${bull.name} é pai desta vaca).`,
    };
  }

  // 2. Checagem de 2º Grau (Avô Materno)
  const isMaternalGrandMatch =
    (bullId && female.maternalGrandsireId && bullId === female.maternalGrandsireId) ||
    (bullNormalizedName &&
      female.maternalGrandsireName &&
      normalizarNome(female.maternalGrandsireName) === bullNormalizedName);

  if (isMaternalGrandMatch) {
    return {
      isConsanguineous: true,
      degree: '2nd_degree',
      relation: 'avo_materno',
      warningMessage: `Atenção: Consanguinidade de 2º Grau detectada (${bull.name} é avô materno desta vaca).`,
    };
  }

  // 3. Checagem de 2º Grau (Avô Paterno)
  const isPaternalGrandMatch =
    (bullId && female.paternalGrandsireId && bullId === female.paternalGrandsireId) ||
    (bullNormalizedName &&
      female.paternalGrandsireName &&
      normalizarNome(female.paternalGrandsireName) === bullNormalizedName);

  if (isPaternalGrandMatch) {
    return {
      isConsanguineous: true,
      degree: '2nd_degree',
      relation: 'avo_paterno',
      warningMessage: `Atenção: Consanguinidade de 2º Grau detectada (${bull.name} é avô paterno desta vaca).`,
    };
  }

  return {
    isConsanguineous: false,
  };
}
