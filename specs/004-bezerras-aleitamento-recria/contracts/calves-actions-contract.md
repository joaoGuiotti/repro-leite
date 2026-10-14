# Contracts: 004-bezerras-aleitamento-recria

**Feature Branch**: `feature/004-bezerras-aleitamento-recria`  
**Date**: 2026-10-14  
**Context**: Contratos de portas de domínio, casos de uso da aplicação e props de componentes para a feature Bezerras e Recria.

---

## 1. Contrato do Repositório (Port de Domínio)

```ts
import {
  CalfFeedingPlan,
  GrowthMetrics,
  WeaningMilestone,
  WeighingRecord,
} from './calves.types';

export interface CalvesRepository {
  // Leitura de Animais
  listCalvesByFarm(
    farmId: string,
    includeInactive?: boolean
  ): Promise<CalfListItemDTO[]>;

  findCalfById(id: string): Promise<CalfRecordDTO | null>;

  // Escrita de Animais
  saveCalf(calf: CreateCalfDTO): Promise<void>;
  updateCalf(id: string, updates: Partial<UpdateCalfDTO>): Promise<void>;
  softDeleteCalf(id: string): Promise<void>;

  // Pesagens
  listWeighingsByAnimal(animalId: string): Promise<WeighingRecord[]>;
  saveWeighing(weighing: CreateWeighingDTO): Promise<void>;
  softDeleteWeighing(id: string): Promise<void>;
}
```

---

## 2. Contratos dos Casos de Uso (Camada de Aplicação)

### `RegisterCalfUseCase`
```ts
export interface RegisterCalfInput {
  farmId: string;
  earTag: string;
  name?: string | null;
  sex: 'femea' | 'macho';
  breed?: string;
  birthDate: string; // YYYY-MM-DD
  birthWeightKg?: number; // Padrão: 40.0 kg
  sireId?: string | null;
  sireName?: string | null;
  damId?: string | null;
  damName?: string | null;
  maternalGranddamName?: string | null;
  notes?: string | null;
}

export interface RegisterCalfResult {
  id: string;
  earTag: string;
}
```

### `RecordWeighingUseCase`
```ts
export interface RecordWeighingInput {
  farmId: string;
  animalId: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  notes?: string | null;
}

export interface RecordWeighingResult {
  id: string;
  animalId: string;
  weightKg: number;
  calculatedGmd: number;
  isReadyForBreeding: boolean;
}
```

### `GetCalfDetailsUseCase`
```ts
export interface GetCalfDetailsInput {
  calfId: string;
  referenceDate: string; // Data ativa do simulador/sistema
}

export interface GetCalfDetailsResult {
  calf: CalfWithDetails;
}
```

### `ListCalvesUseCase`
```ts
export interface ListCalvesInput {
  farmId: string;
  referenceDate: string;
  filterStage?: 'todos' | 'aleitamento' | 'desmame' | 'recria' | 'apta_ia';
  filterSex?: 'todos' | 'femeas' | 'machos';
  searchQuery?: string;
}

export interface ListCalvesResult {
  calves: CalfListItem[];
  counts: {
    total: number;
    inFeeding: number;
    inWeaning: number;
    inHeiferGrowth: number;
    readyForBreeding: number;
  };
}
```

---

## 3. Contratos dos Componentes Visuais (Apresentação)

### `CalfListCardProps` (Cartão na Lista Esquerda)
```ts
export interface CalfListCardProps {
  item: CalfListItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
}
```

### `CalfDetailPaneProps` (Painel Completo à Direita)
```ts
export interface CalfDetailPaneProps {
  calf: CalfWithDetails;
  loading?: boolean;
  onAddWeighing: (calf: CalfWithDetails) => void;
  onDeleteCalf: (calfId: string) => void;
  onNavigateToBreeding: (calfId: string) => void;
}
```

### `CalfGenealogyCardProps` (Bloco de Linhagem em 3 Níveis)
```ts
export interface CalfGenealogyCardProps {
  sireName?: string | null;
  damName?: string | null;
  damEarTag?: string | null;
  maternalGranddamName?: string | null;
}
```

### `CalfFeedingTimelineCardProps` (Card de Dieta Líquida e Régua de Desmame)
```ts
export interface CalfFeedingTimelineCardProps {
  feedingPlan: CalfFeedingPlan;
  timeline: WeaningMilestone[];
}
```

### `CalfWeightGrowthCardProps` (Card de Recria, GMD e Pesagens)
```ts
export interface CalfWeightGrowthCardProps {
  metrics?: GrowthMetrics;
  history: WeighingRecord[];
  isMale: boolean;
  onAddWeighing: () => void;
  onNavigateToBreeding?: () => void;
}
```

### `RegisterCalfModalProps` (Modal de Cadastro de Bezerra)
```ts
export interface RegisterCalfModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: RegisterCalfInput) => Promise<void>;
  loading?: boolean;
  availableCows: Array<{ id: string; earTag: string; name?: string | null; damName?: string | null }>;
  availableBulls: Array<{ id: string; name: string; breed: string }>;
}
```

### `AddWeighingModalProps` (Modal de Registro de Pesagem)
```ts
export interface AddWeighingModalProps {
  visible: boolean;
  calf?: CalfWithDetails | null;
  referenceDate: string;
  onClose: () => void;
  onSubmit: (data: RecordWeighingInput) => Promise<void>;
  loading?: boolean;
}
```
