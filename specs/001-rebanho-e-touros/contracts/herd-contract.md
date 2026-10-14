# Interface Contract: Gestão do Rebanho (`AnimalRepository` & Motores de Regras)

**Feature Branch**: `001-rebanho-e-touros`  
**Date**: 2026-10-14  

---

## 1. Motores de Domínio Puro (`src/domain/`)

### `src/domain/earTag.ts`

```typescript
export interface AnimalSummary {
  id: string;
  earTag: string;
  earTagNormalized: string;
  name?: string | null;
  exitStatus: 'ativo' | 'vendido' | 'descartado' | 'morto';
  exitDate?: string | null;
  deletedAt?: string | null;
}

export type EarTagAvailabilityStatus = 
  | 'disponivel' 
  | 'bloqueado_ativo' 
  | 'alerta_reuso_inativo';

export interface EarTagEvaluationResult {
  status: EarTagAvailabilityStatus;
  normalizedTag: string;
  currentAnimal?: AnimalSummary;
  pastAnimal?: AnimalSummary;
  message?: string;
}

/**
 * Normaliza o brinco removendo pontuações, espaços e convertendo para maiúsculo.
 * Exemplo: " a 104-b " -> "A104B"
 */
export function normalizeEarTag(tag: string): string;

/**
 * Avalia se o brinco está disponível, bloqueado por animal ativo ou se requer confirmação de reuso.
 */
export function evaluateEarTagAvailability(
  existingAnimals: AnimalSummary[],
  targetTag: string,
  currentAnimalId?: string
): EarTagEvaluationResult;
```

---

### `src/domain/animalFilters.ts`

```typescript
export interface AnimalFilterOptions {
  query?: string;
  reproStatus?: 'todas' | 'vazia' | 'inseminada' | 'prenhe' | 'seca';
  showInactive?: boolean;
}

/**
 * Filtra animais por brinco, nome e status reprodutivo.
 * Regras:
 * - Machos são ocultados se um filtro reprodutivo específico (vazia/inseminada/prenhe/seca) estiver ativo.
 * - Animais ativos aparecem primeiro, seguidos pelos inativos quando showInactive=true.
 */
export function filterAnimals<T extends AnimalSummary & { reproStatus?: string; sex?: string }>(
  animals: T[],
  filters: AnimalFilterOptions
): T[];
```

---

## 2. Contrato do Repositório (`AnimalRepository`)

```typescript
export interface CreateAnimalDTO {
  farmId: string;
  earTag: string;
  name?: string | null;
  breed: string;
  sex: 'femea' | 'macho';
  birthDate: string; // YYYY-MM-DD
  birthWeightKg?: number;
  lifeStage?: 'lactante' | 'desmamada' | 'recria' | 'novilha_apta_ia' | 'novilha_prenhe' | 'adulta';
  reproStatus?: 'vazia' | 'inseminada' | 'prenhe' | 'seca' | 'nao_se_aplica';
  notes?: string | null;
}

export interface RegisterExitDTO {
  animalId: string;
  exitStatus: 'vendido' | 'descartado' | 'morto';
  exitDate: string; // YYYY-MM-DD
  exitReason?: string | null;
}

export interface AnimalRepository {
  listByFarm(farmId: string, includeInactive?: boolean): Promise<AnimalRecord[]>;
  findById(id: string): Promise<AnimalRecord | null>;
  create(data: CreateAnimalDTO): Promise<AnimalRecord>;
  update(id: string, data: Partial<CreateAnimalDTO>): Promise<AnimalRecord>;
  registerExit(data: RegisterExitDTO): Promise<AnimalRecord>;
  reactivate(animalId: string): Promise<AnimalRecord>;
  softDelete(id: string): Promise<void>;
}
```
