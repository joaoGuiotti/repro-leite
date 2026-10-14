# Insemination Domain & Repository Contracts

**Feature**: `002-inseminacao-rapida`  
**Date**: 2026-10-14  

---

## 1. Tipos e DTOs (`src/types/insemination.ts`)

```typescript
export type InseminationResult = 'pendente' | 'prenhe' | 'vazia';

export interface InseminationRecord {
  id: string;
  farmId: string;
  animalId: string;
  bullId: string | null;
  bullName: string;
  date: string; // ISO YYYY-MM-DD
  inseminator: string;
  expectedHeatDate: string; // YYYY-MM-DD (date + 21d)
  pregnancyCheckDate: string; // YYYY-MM-DD (date + 45d)
  expectedCalvingDate: string; // YYYY-MM-DD (date + 282d)
  dryOffDate: string; // YYYY-MM-DD (calving - 60d)
  result: InseminationResult;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateInseminationDTO {
  animalId: string;
  bullId?: string | null;
  bullName: string;
  date: string; // ISO YYYY-MM-DD
  inseminator: string;
  notes?: string | null;
}

export interface InseminationMilestones {
  expectedHeatDate: string; // date + 21d
  pregnancyCheckDate: string; // date + 45d
  expectedCalvingDate: string; // date + 282d
  dryOffDate: string; // date + 222d
  heatDaysOffset: number; // 21
  pregnancyCheckDaysOffset: number; // 45
  calvingDaysOffset: number; // 282
  dryOffDaysOffset: number; // 222
}

export interface ConsanguinityCheckResult {
  isConsanguineous: boolean;
  degree?: '1st_degree' | '2nd_degree';
  relation?: 'pai' | 'avo_materno' | 'avo_paterno';
  warningMessage?: string;
}
```

---

## 2. Contrato do Motor de Domínio (`src/domain/reproduction.ts`)

```typescript
/**
 * Calcula os 4 marcos reprodutivos deterministicamente a partir da data da IA.
 * Não utiliza timezones; opera estritamente com manipulação canônica de datas YYYY-MM-DD.
 */
export function calculateReproductiveMilestones(inseminationDate: string): InseminationMilestones;

/**
 * Determina o novo status reprodutivo de um animal após o cancelamento/exclusão de uma IA.
 * Se houver outra IA anterior ativa (sem desfecho negativo), retorna 'inseminada'.
 * Caso contrário, retorna 'vazia'.
 */
export function resolveAnimalReproStatusAfterCancellation(
  activeHistory: InseminationRecord[]
): 'vazia' | 'inseminada';
```

---

## 3. Contrato do Motor de Consanguinidade (`src/domain/consanguinity.ts`)

```typescript
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

/**
 * Avalia parentesco de 1º grau (pai) e 2º grau (avô) entre fêmea e reprodutor.
 */
export function checkConsanguinity(
  female: AnimalPedigreeInfo,
  bull: BullPedigreeTarget
): ConsanguinityCheckResult;
```

---

## 4. Contrato do Repositório (`src/db/repositories/inseminationRepository.ts`)

```typescript
export class InseminationRepository {
  /**
   * Grava uma nova inseminação, atualiza status da fêmea, debita estoque do touro
   * (se catalogado), agenda alertas de 21d e 45d e enfileira na sync_queue.
   */
  static async createInsemination(
    farmId: string,
    dto: CreateInseminationDTO
  ): Promise<InseminationRecord>;

  /**
   * Lista as últimas inseminações da fazenda ordenadas por data decrescente.
   */
  static async listRecentByFarm(
    farmId: string,
    limit?: number
  ): Promise<(InseminationRecord & { animalEarTag: string; animalName?: string | null })[]>;

  /**
   * Exclui logicamente a inseminação, cancela alertas atrelados, estorna dose (opcional)
   * e recalcula status da vaca via motor de reprodução.
   */
  static async deleteInsemination(
    inseminationId: string,
    options: { restoreStrawStock: boolean }
  ): Promise<void>;

  /**
   * Busca histórico ativo de inseminações de um animal específico.
   */
  static async listByAnimal(
    animalId: string
  ): Promise<InseminationRecord[]>;
}
```
