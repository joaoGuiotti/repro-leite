# Interface & Application Contracts: 003-hoje-no-curral

**Feature**: Hoje no Curral (Painel Diário de Decisões, Monitoramento de Cios, Toques Veterinários e Trato de Bezerras)  
**Date**: 2026-10-14  
**Status**: Completed (Phase 1)

---

## 1. Application Use Cases (`src/features/today/application/`)

### 1.1 `GetTodayDashboardUseCase`
Carrega e agrega todas as pendências e dados de curral para a data de manejo ativa.

```typescript
export interface GetTodayDashboardInput {
  farmId: string;
  referenceDate: string; // ISO YYYY-MM-DD
}

export interface TodayDashboardData {
  referenceDate: string;
  isSimulated: boolean;
  heatAlerts: AlertWithReproDetails[];
  pregnancyAlerts: AlertWithReproDetails[];
  feedingSummary: CalfFeedingSummary;
  counts: {
    pendingHeat: number;
    pendingPregnancy: number;
    totalMorningLiters: number;
    totalAfternoonLiters: number;
    activeCalves: number;
  };
}

export interface GetTodayDashboardUseCase {
  execute(input: GetTodayDashboardInput): Promise<Result<TodayDashboardData, AppError>>;
}
```

### 1.2 `ConfirmHeatObservationUseCase`
Processa a decisão de 1 toque do quadro de Cios para Vigiar (21 dias).

```typescript
export type HeatObservationChoice =
  | 'held'                 // "Não Repetiu": segurou o cio provisoriamente
  | 'repeated_empty_only'  // "Repetiu o Cio": apenas marcar como vazia
  | 'repeated_rebreed';    // "Repetiu o Cio": marcar vazia e abrir re-inseminação

export interface ConfirmHeatObservationInput {
  farmId: string;
  alertId: string;
  animalId: string;
  inseminationId?: string | null;
  choice: HeatObservationChoice;
  referenceDate: string;
}

export interface ConfirmHeatObservationResult {
  success: boolean;
  redirectToRebreed?: boolean;
  animalId?: string;
}

export interface ConfirmHeatObservationUseCase {
  execute(input: ConfirmHeatObservationInput): Promise<Result<ConfirmHeatObservationResult, AppError>>;
}
```

### 1.3 `RecordPregnancyDiagnosisUseCase`
Processa o resultado do diagnóstico gestacional (45 a 60 dias).

```typescript
export type PregnancyDiagnosis = 'pregnant' | 'empty';

export interface RecordPregnancyDiagnosisInput {
  farmId: string;
  alertId: string;
  animalId: string;
  inseminationId?: string | null;
  diagnosis: PregnancyDiagnosis;
  referenceDate: string;
  notes?: string | null;
}

export interface RecordPregnancyDiagnosisResult {
  success: boolean;
  newStatus: 'prenhe' | 'vazia';
}

export interface RecordPregnancyDiagnosisUseCase {
  execute(input: RecordPregnancyDiagnosisInput): Promise<Result<RecordPregnancyDiagnosisResult, AppError>>;
}
```

---

## 2. Motores Puros de Domínio (`src/features/today/domain/` ou `@features/calves`)

### 2.1 `calculateDailyFeedingSummary`
Função determinística que calcula os totais de leite e bezerras em transição:

```typescript
export function calculateDailyFeedingSummary(
  calves: AnimalRecord[],
  referenceDate: string
): CalfFeedingSummary;
```

### 2.2 `isHeatCheckInZootecnicWindow`
Valida se um alerta de 21 dias está na janela de observação zootécnica (18 a 24 dias pós-IA ou atrasado):

```typescript
export function isHeatCheckInZootecnicWindow(
  dueDate: string,
  referenceDate: string
): boolean;
```

---

## 3. Contratos de Componentes de Apresentação (`src/features/today/presentation/`)

### 3.1 `HeatCheckListCard`
Renderiza o quadro de Cios para Vigiar com botões "Não Repetiu" e "Repetiu o Cio":

```typescript
export interface HeatCheckListCardProps {
  alerts: AlertWithReproDetails[];
  loading?: boolean;
  onHeld: (alert: AlertWithReproDetails) => Promise<void>;
  onRepeated: (alert: AlertWithReproDetails) => void; // Abre o modal de decisão
}
```

### 3.2 `PregnancyCheckListCard`
Renderiza o quadro de Toques Veterinários com botões "Confirmar Prenhez" e "Vazia":

```typescript
export interface PregnancyCheckListCardProps {
  alerts: AlertWithReproDetails[];
  loading?: boolean;
  onConfirmPregnant: (alert: AlertWithReproDetails) => Promise<void>;
  onConfirmEmpty: (alert: AlertWithReproDetails) => Promise<void>;
}
```

### 3.3 `CalfFeedingCard`
Renderiza o quadro do Bezerreiro com indicador de litros manhã/tarde e gaveta expansível:

```typescript
export interface CalfFeedingCardProps {
  summary: CalfFeedingSummary;
  loading?: boolean;
}
```

### 3.4 `RepeatHeatModal`
Modal tátil com as 2 opções de repetição de cio:

```typescript
export interface RepeatHeatModalProps {
  visible: boolean;
  alert: AlertWithReproDetails | null;
  onClose: () => void;
  onRebreedNow: (alert: AlertWithReproDetails) => Promise<void>;
  onMarkEmptyOnly: (alert: AlertWithReproDetails) => Promise<void>;
  loading?: boolean;
}
```
