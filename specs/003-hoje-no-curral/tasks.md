# Tasks: Hoje no Curral (Painel Diário de Decisões, Monitoramento de Cios, Toques Veterinários e Trato de Bezerras)

**Branch**: `003-hoje-no-curral`  
**Feature Spec**: [spec.md](file:///c:/DEV/github/repro-leite/specs/003-hoje-no-curral/spec.md)  
**Implementation Plan**: [plan.md](file:///c:/DEV/github/repro-leite/specs/003-hoje-no-curral/plan.md)  
**Research & Decisions**: [research.md](file:///c:/DEV/github/repro-leite/specs/003-hoje-no-curral/research.md)  
**Data Model**: [data-model.md](file:///c:/DEV/github/repro-leite/specs/003-hoje-no-curral/data-model.md)  
**Contracts**: [today-actions-contract.md](file:///c:/DEV/github/repro-leite/specs/003-hoje-no-curral/contracts/today-actions-contract.md)  
**Quickstart**: [quickstart.md](file:///c:/DEV/github/repro-leite/specs/003-hoje-no-curral/quickstart.md)  

---

## Phase 1: Setup (Shared Types & Data Contracts)

**Purpose**: Definição dos tipos TypeScript, interfaces de dados e modelos de agregação em memória para a feature `today`.

- [x] T001 Define today domain interfaces, DTOs, and view models (`AlertWithReproDetails`, `CalfFeedingSummary`, `CalfTransitionItem`, `TodayDashboardData`, `HeatObservationChoice`, `PregnancyDiagnosis`) in `src/features/today/domain/today.types.ts`
- [x] T002 [P] Implement pure zootecnic window helper functions (`isHeatCheckInZootecnicWindow`, `isPregnancyCheckInZootecnicWindow`) with date offset calculations in `src/features/today/domain/today-filters.ts`

---

## Phase 2: Foundational (Blocking Prerequisites: Domain Engines & Data Enrichment)

**Purpose**: Motores puros de cálculo zootécnico e funções de enriquecimento de dados necessárias para todas as histórias de usuário.

**⚠️ CRITICAL**: Nenhuma tarefa de interface ou use case de curral pode ser finalizada antes da conclusão desta fase.

- [x] T003 Create unit tests for pure zootecnic observation filters in `src/features/today/domain/__tests__/today-filters.test.ts`
- [x] T004 [P] Create unit tests for calf feeding aggregation engine (`calculateDailyFeedingSummary`) in `src/features/today/domain/__tests__/feeding-summary.test.ts`
- [x] T005 Implement pure domain calculation function `calculateDailyFeedingSummary` aggregating morning/afternoon liters and weekly weaning transitions in `src/features/today/domain/feeding-summary.ts`
- [x] T006 Implement data query helper to fetch alerts enriched with animal ear tag/name and insemination details (`AlertWithReproDetails`) in `src/features/today/infra/today-queries.ts`

**Checkpoint**: Fundação de domínio e infraestrutura de consulta testada e compilando sem erros.

---

## Phase 3: User Story 1 - Quadro de Cios para Vigiar (Janela de 21 dias) com Decisão em 1 Toque (Priority: P1) 🎯 MVP Core

**Goal**: Permitir ao vaqueiro/inseminador visualizar fêmeas com retorno de cio previsto (janela 18 a 24 dias e atrasadas) e registrar decisões em 1 toque ("Não Repetiu" ou "Repetiu o Cio" com modal de opções).

**Independent Test**: Registrar IA com data há 21 dias; abrir o painel "Hoje"; a vaca surge no quadro "Cios para Vigiar"; tocar em "Não Repetiu" conclui o alerta mantendo a vaca como `inseminada`; tocar em "Repetiu o Cio" abre o modal `RepeatHeatModal` permitindo escolher entre re-inseminar na hora ou marcar como vazia.

### Tests for User Story 1
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Create unit tests for `ConfirmHeatObservationUseCase` covering "held", "repeated_empty_only", and "repeated_rebreed" scenarios in `src/features/today/application/__tests__/confirm-heat-choice.usecase.test.ts`

### Implementation for User Story 1

- [x] T008 [US1] Implement `ConfirmHeatObservationUseCase` with atomic transaction, animal `reproStatus` update, IA `result` update, alert completion, and outbox enqueueing in `src/features/today/application/confirm-heat-choice.usecase.ts`
- [x] T009 [P] [US1] Implement reusable `RepeatHeatModal` component using `ModalPadrao` with 56px touch buttons for "Re-inseminar Agora" and "Apenas Marcar Cio / Vazia" in `src/features/today/presentation/components/RepeatHeatModal.tsx`
- [x] T010 [US1] Implement `HeatCheckListCard` component rendering cards for cows in the 21d heat window with ear tag badge, bull name, and touch action buttons in `src/features/today/presentation/components/HeatCheckListCard.tsx`
- [x] T011 [US1] Integrate `HeatCheckListCard` and `RepeatHeatModal` into `TodayScreen` handling navigation to `/(tabs)/reproducao?action=inseminate&animalId=${animalId}` upon selecting "Re-inseminar Agora" in `src/features/today/presentation/screens/TodayScreen.tsx`

**Checkpoint**: Quadro de Cios para Vigiar 100% funcional e testável de forma independente no curral.

---

## Phase 4: User Story 2 - Quadro de Toques Veterinários (45 a 60 dias) e Diagnóstico de Gestação (Priority: P1)

**Goal**: Permitir ao veterinário/produtor lançar o diagnóstico gestacional no tronco de contenção em 1 toque ("Confirmar Prenhez" ou "Vazia") com atualização atômica de status e marcos futuros.

**Independent Test**: Registrar IA com data há 45 dias; abrir a aba "Hoje"; o animal surge no quadro "Toques Veterinários"; tocar em "Confirmar Prenhez" altera status da vaca para `prenhe`, IA para `prenhe` e conclui o alerta de toque; tocar em "Vazia" altera status da vaca para `vazia`, IA para `vazia`, conclui o alerta e cancela os marcos futuros de parto e secagem daquela IA.

### Tests for User Story 2
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T012 [P] [US2] Create unit tests for `RecordPregnancyDiagnosisUseCase` validating pregnant and empty diagnosis branches and cascade alert cleanup in `src/features/today/application/__tests__/record-pregnancy-touch.usecase.test.ts`

### Implementation for User Story 2

- [x] T013 [US2] Implement `RecordPregnancyDiagnosisUseCase` with atomic transaction, animal `reproStatus` update, IA `result` update, alert completion, milestone cascade cancellation on empty, and outbox enqueueing in `src/features/today/application/record-pregnancy-touch.usecase.ts`
- [x] T014 [US2] Implement `PregnancyCheckListCard` component rendering cows in the 45-60d window with 48/56px touch action buttons ("Confirmar Prenhez" and "Vazia") in `src/features/today/presentation/components/PregnancyCheckListCard.tsx`
- [x] T015 [US2] Connect `PregnancyCheckListCard` to `TodayScreen` with haptic feedback and immediate list update in `src/features/today/presentation/screens/TodayScreen.tsx`

**Checkpoint**: Quadro de Toques Veterinários funcional com confirmação de prenhez e descarte reprodutivo atômicos.

---

## Phase 5: User Story 3 - Quadro do Bezerreiro: Trato Diário de Leite e Previsão de Desmame (Priority: P2)

**Goal**: Exibir ao tratador o total consolidado de leite a preparar na data atual (Litros Manhã e Litros Tarde) e gaveta expansível com bezerras em corte/transição na semana.

**Independent Test**: Cadastrar bezerras em diferentes faixas etárias (inicial, pico, corte e desmamada); abrir o painel "Hoje"; verificar se os litros de leite da manhã e tarde refletem a soma exata; tocar na gaveta do cartão e verificar a lista de bezerras em semana de corte gradual.

### Implementation for User Story 3

- [x] T016 [P] [US3] Implement `CalfFeedingCard` component displaying morning/afternoon liters, total daily liters, active calves badge, and expandable drawer with transitioning calves in `src/features/today/presentation/components/CalfFeedingCard.tsx`
- [x] T017 [US3] Integrate `CalfFeedingCard` into `TodayScreen` receiving dynamic data calculated from `useTodayDashboard` in `src/features/today/presentation/screens/TodayScreen.tsx`

**Checkpoint**: Quadro do Bezerreiro exibindo volumes consolidados e detalhamento expansível de bezerras em corte.

---

## Phase 6: User Story 4 - Painel Diário Executivo e Ações Rápidas de Curral (Priority: P2)

**Goal**: Exibir cabeçalho com data ativa do simulador/sistema, resumo executivo com contadores vivos e atalhos rápidos para lançar IA, cadastrar animal ou consultar rebanho.

**Independent Test**: Alterar a data simulada no cabeçalho; verificar que os contadores vivos de cios, toques e litros recalculam instantaneamente; tocar nos botões de ação rápida e navegar para as abas correspondentes.

### Implementation for User Story 4

- [x] T018 [US4] Implement `GetTodayDashboardUseCase` orchestrating heat alerts, pregnancy check alerts, calf feeding calculations, and summary counters in `src/features/today/application/get-today-dashboard.usecase.ts`
- [x] T019 [US4] Implement `useTodayDashboard` hook reactively fetching dashboard data when `activeDateString` changes in `src/features/today/presentation/hooks/useTodayDashboard.ts`
- [x] T020 [P] [US4] Refine `DailySummaryCard` component to receive dynamic live counters for pending cios, toques, and total milk liters in `src/features/today/presentation/components/DailySummaryCard.tsx`
- [x] T021 [P] [US4] Verify and update `QuickActionsCard` ensuring 56px touch targets, accessibility roles, and seamless navigation in `src/features/today/presentation/components/QuickActionsCard.tsx`
- [x] T022 [US4] Implement dependency injection factory `getTodayUseCases` wiring use cases, repos, transaction runner, and outbox in `src/features/today/factory.ts`

**Checkpoint**: Painel executivo do curral completamente conectado a dados vivos e atalhos rápidos operacionais.

---

## Phase 7: User Story 5 - Resiliência e Operação Offline-First em Campo (Priority: P2)

**Goal**: Garantir que 100% das operações de curral ocorram exclusivamente no SQLite local com registro de outbox transacional, sem travamentos sob ausência de internet.

**Independent Test**: Desconectar o dispositivo de qualquer rede (Modo Avião); executar baixas de cios e toques; verificar que as alterações são persistidas no SQLite em < 100ms e enfileiradas na outbox com o indicador discreto `PendingSyncBadge`.

### Tests for User Story 5

- [x] T023 [P] [US5] Create unit test verifying atomic transaction and outbox enqueueing on today use cases in `src/features/today/application/__tests__/today-outbox-sync.test.ts`

### Implementation for User Story 5

- [x] T024 [US5] Implement `useTodayActions` hook wrapping use cases with loading states, error handling, haptic feedback, and outbox synchronization in `src/features/today/presentation/hooks/useTodayActions.ts`
- [x] T025 [US5] Ensure all cards in `TodayScreen` display `PendingSyncBadge` on items pending background synchronization without blocking interactions in `src/features/today/presentation/screens/TodayScreen.tsx`

**Checkpoint**: Operação 100% offline-first verificada sob condições de campo.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Exportação pública de módulos, conformidade estrita de lint/tipos e validação do quickstart.

- [x] T026 Update public API exports in `src/features/today/index.ts`
- [x] T027 [P] Verify Expo Router integration in `src/app/(tabs)/index.tsx` ensuring thin route rendering `<TodayScreen />`
- [x] T028 Validate strict code quality gates (`npx tsc --noEmit`, `npm test`, `npx eslint .`)
- [x] T029 Execute end-to-end validation scenarios documented in `specs/003-hoje-no-curral/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

```mermaid
graph TD
    Phase1[Phase 1: Setup Types & Contracts] --> Phase2[Phase 2: Foundational Engines & Queries]
    Phase2 --> Phase3[Phase 3: US1 - Quadro de Cios 21d (MVP)]
    Phase2 --> Phase4[Phase 4: US2 - Quadro de Toques 45d]
    Phase2 --> Phase5[Phase 5: US3 - Quadro do Bezerreiro]
    Phase3 --> Phase6[Phase 6: US4 - Painel Executivo & Ações Rápidas]
    Phase4 --> Phase6
    Phase5 --> Phase6
    Phase6 --> Phase7[Phase 7: US5 - Resiliência Offline-First]
    Phase7 --> Phase8[Phase 8: Polish & Validation Gates]
```

### Parallel Opportunities

- **Setup & Foundational**: T001 e T002 podem ser desenvolvidas em paralelo; T003 e T004 (testes) rodam em paralelo.
- **Histórias de Usuário**:
  - Após a Fase 2 (Foundational), US1 (Fase 3), US2 (Fase 4) e US3 (Fase 5) podem ser implementadas em paralelo por diferentes desenvolvedores/agentes.
  - Testes unitários de use cases ([US1] T007, [US2] T012, [US5] T023) podem ser criados em paralelo com as interfaces.
  - Componentes visuais ([US1] T009, [US3] T016, [US4] T020, [US4] T021) podem ser estilizados independentemente em arquivos separados.

---

## Parallel Example: User Story 1

```bash
# 1. Desenvolver testes unitários para a ação de decisão de cio:
Task: "T007 [P] [US1] Create unit tests for ConfirmHeatObservationUseCase in src/features/today/application/__tests__/confirm-heat-choice.usecase.test.ts"

# 2. Em paralelo, criar o componente de modal tátil de repetição:
Task: "T009 [P] [US1] Implement reusable RepeatHeatModal component in src/features/today/presentation/components/RepeatHeatModal.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Concluir **Fase 1 (Setup)** e **Fase 2 (Foundational)**.
2. Implementar **Fase 3 (User Story 1: Quadro de Cios para Vigiar)**.
3. **STOP & VALIDATE**: Executar o fluxo de decisão de cio na tela com a data simulada.

### Incremental Delivery

1. Setup + Foundational $\rightarrow$ Motores puros de zootecnia prontos.
2. + User Story 1 $\rightarrow$ Decisões de retorno de cio em 1 toque (MVP).
3. + User Story 2 $\rightarrow$ Diagnóstico gestacional (prenhe/vazia) no tronco.
4. + User Story 3 $\rightarrow$ Volume diário de leite e controle do bezerreiro.
5. + User Story 4 $\rightarrow$ Painel consolidado com contadores vivos e atalhos rápidos.
6. + User Story 5 $\rightarrow$ Garantia offline-first com outbox transacional.
7. Polish $\rightarrow$ Execução de testes de regressão e validação do quickstart.
