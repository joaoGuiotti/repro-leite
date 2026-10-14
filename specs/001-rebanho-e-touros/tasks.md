# Tasks: Rebanho & Catálogo de Touros com Estoque de Doses e Política de Brinco

**Branch**: `001-rebanho-e-touros`  
**Feature Spec**: [spec.md](file:///c:/DEV/github/repro-leite/specs/001-rebanho-e-touros/spec.md)  
**Implementation Plan**: [plan.md](file:///c:/DEV/github/repro-leite/specs/001-rebanho-e-touros/plan.md)  
**Data Model**: [data-model.md](file:///c:/DEV/github/repro-leite/specs/001-rebanho-e-touros/data-model.md)  
**Quickstart**: [quickstart.md](file:///c:/DEV/github/repro-leite/specs/001-rebanho-e-touros/quickstart.md)  

---

## Phase 1: Setup (Shared Types & Infrastructure)

**Purpose**: Definição dos tipos TypeScript compartilhados para o Rebanho e Catálogo de Touros.

- [x] T001 Define animal TypeScript types and enums (`AnimalSex`, `AnimalLifeStage`, `AnimalReproStatus`, `AnimalExitStatus`, `AnimalRecord`) in `src/types/animal.ts`
- [x] T002 [P] Define bull TypeScript types and interfaces (`BullRecord`, `CreateBullDTO`, `UpdateBullDTO`) in `src/types/bull.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Esquemas SQLite locais, restrições de unicidade parcial de brinco e integração com o cliente de banco de dados.

**⚠️ CRITICAL**: Nenhuma tarefa de interface ou repositório pode iniciar antes da conclusão desta fase.

- [x] T003 Create Drizzle SQLite schema for `animals` with partial unique index on `(farm_id, ear_tag_normalized)` where `deleted_at IS NULL AND exit_status = 'ativo'` in `src/db/schema/animals.ts`
- [x] T004 [P] Create Drizzle SQLite schema for `bulls` in `src/db/schema/bulls.ts`
- [x] T005 Export all new schemas in `src/db/schema/index.ts` and register tables in `src/db/client.ts`
- [x] T006 [P] Update schema integrity unit test in `__tests__/db/schema.test.ts` to validate table creation and column definitions for `animals` and `bulls`

**Checkpoint**: Fundação pronta - esquemas e tipos compilando sem erros.

---

## Phase 3: User Story 1 - Busca Instantânea e Filtragem do Rebanho no Curral (Priority: P1) 🎯 MVP Core

**Goal**: Permitir que o vaqueiro consulte o rebanho, pesquise rapidamente por número de brinco ou nome e filtre por status reprodutivo (*Todas, Vazias, Inseminadas, Prenhes, Secas*), excluindo machos de filtros específicos de fêmeas.

**Independent Test**: Pode ser validado digitando um número de brinco no campo de busca e alternando as pílulas de filtro; a lista deve responder instantaneamente (< 200ms) sem erros.

### Tests for User Story 1
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Create unit tests for herd filtering (`filterAnimals`) covering ear tag query, name query, repro status filtering, and male exclusion in `__tests__/domain/animalFilters.test.ts`

### Implementation for User Story 1

- [x] T008 [US1] Implement pure domain filter engine `filterAnimals` in `src/domain/animalFilters.ts`
- [x] T009 [US1] Implement `AnimalRepository.listByFarm` with active/inactive sorting in `src/db/repositories/animalRepository.ts`
- [x] T010 [US1] Implement herd listing, quick search bar (`CampoNumerico`) and status filter pills in `src/app/(tabs)/reproducao/index.tsx`

**Checkpoint**: Listagem e filtros de rebanho funcionando e testáveis de forma independente.

---

## Phase 4: User Story 2 - Cadastro Ágil de Animal com Política de Reuso de Brinco (Priority: P1) 🎯 MVP

**Goal**: Cadastrar novos animais no curral em menos de 45 segundos, aplicando a política de brinco: bloqueio imediato para brincos ativos e alerta amarelo com confirmação para brincos inativos/excluídos.

**Independent Test**: Validado tentando cadastrar brinco já ativo (bloqueio), brinco inativo (alerta e permissão com "Usar mesmo assim") e brinco inédito (cadastro direto), verificando gravação no SQLite e na `sync_queue`.

### Tests for User Story 2
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T011 [P] [US2] Create unit tests for ear tag normalization and reuse policy (`normalizeEarTag`, `evaluateEarTagAvailability`) in `__tests__/domain/earTag.test.ts`

### Implementation for User Story 2

- [x] T012 [US2] Implement pure domain functions `normalizeEarTag` and `evaluateEarTagAvailability` in `src/domain/earTag.ts`
- [x] T013 [US2] Implement `AnimalRepository.create` with atomic mutation enqueueing in `sync_queue` in `src/db/repositories/animalRepository.ts`
- [x] T014 [US2] Implement animal registration modal with real-time ear tag availability validation, initial repro status selection, 56px buttons and numeric keypad in `src/components/rebanho/ModalCadastroAnimal.tsx`

**Checkpoint**: Cadastro de animais e política de reuso de brinco 100% funcionais e validados.

---

## Phase 5: User Story 3 - Gestão de Saída e Inativação de Animais (Priority: P2)

**Goal**: Registrar a saída de animais do rebanho (*Vendido, Descartado, Morto*), liberando o brinco para reuso futuro sem perder o histórico do animal, além de permitir reativação quando o brinco estiver livre.

**Independent Test**: Abrir ficha de um animal ativo, registrar saída como "Vendido" e verificar que ele passa para a lista de inativos com ano de saída e libera o número do brinco para novos cadastros.

### Implementation for User Story 3

- [x] T015 [US3] Implement `AnimalRepository.registerExit`, `AnimalRepository.reactivate`, and `AnimalRepository.softDelete` with `sync_queue` logging in `src/db/repositories/animalRepository.ts`
- [x] T016 [US3] Implement herd exit registration modal (*Vendido, Descartado, Morto*) with date, reason and confirmation in `src/components/rebanho/ModalSaidaAnimal.tsx`
- [x] T017 [US3] Integrate animal card selection, detail display and exit action into `src/app/(tabs)/reproducao/index.tsx`

**Checkpoint**: Ciclo de vida completo do animal (ativo, saída, reativação, exclusão) testável e funcional.

---

## Phase 6: User Story 4 - Catálogo de Touros e Controle de Estoque de Palhetas de Sêmen (Priority: P2)

**Goal**: Cadastrar reprodutores e gerenciar o saldo físico de palhetas de sêmen com controles rápidos (+ / -), impedindo estoque negativo e alertando quando o saldo estiver zerado.

**Independent Test**: Cadastrar touro com 5 doses, ajustar estoque rapidamente via botões `+` e `-`, validar bloqueio de estoque negativo e alerta de estoque zerado.

### Tests for User Story 4
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T018 [P] [US4] Create unit tests for semen straw stock adjustments (`adjustBullStock`, `hasAvailableStraws`) in `__tests__/domain/bullStock.test.ts`

### Implementation for User Story 4

- [x] T019 [US4] Implement pure domain functions in `src/domain/bullStock.ts`
- [x] T020 [US4] Implement `BullRepository` (`listByFarm`, `create`, `update`, `adjustStraws`, `softDelete`) with `sync_queue` enqueueing in `src/db/repositories/bullRepository.ts`
- [x] T021 [US4] Implement Touros view with catalog listing, quick straw adjustments, zero-stock badge and registration modal in `src/components/touros/CatalogoTouros.tsx` and integrate into `src/app/(tabs)/reproducao/index.tsx`

**Checkpoint**: Catálogo de touros e controle de doses operacionais e integrados na aba Reprodução.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificação de qualidade, testes integrados, linting e conformidade geral.

- [x] T022 [P] Execute all unit tests with `npm test` and verify 100% pass across all domain engines and schemas
- [x] T023 Run TypeScript typecheck with `npx tsc --noEmit` and verify 0 errors
- [x] T024 Run Expo linter with `npx expo lint` and verify 0 warnings or errors
- [x] T025 Execute end-to-end quickstart validation scenarios documented in `specs/001-rebanho-e-touros/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: Sem dependências - inicia imediatamente.
- **Phase 2 (Foundational)**: Depende da Fase 1 - BLOQUEIA todas as histórias de usuário.
- **Phase 3 (User Story 1 - P1)**: Depende da Fase 2.
- **Phase 4 (User Story 2 - P1)**: Depende da Fase 2 (pode rodar em paralelo ou após US1).
- **Phase 5 (User Story 3 - P2)**: Depende da Fase 4 (necessita de animais cadastrados para saída).
- **Phase 6 (User Story 4 - P2)**: Depende da Fase 2 (independente de US1/US2/US3).
- **Phase 7 (Polish)**: Depende da conclusão de todas as histórias de usuário.

---

## Implementation Strategy

### MVP First (User Story 1 & User Story 2)
1. Concluir Fase 1 e Fase 2 (Tipos, Schemas e Banco).
2. Concluir Fase 3 (Listagem e Busca Instantânea).
3. Concluir Fase 4 (Cadastro Ágil e Política de Reuso de Brinco).
4. **Validar MVP**: Cadastrar e buscar vacas no curral com validação de brinco.
5. Em seguida, avançar para Fase 5 (Saídas) e Fase 6 (Catálogo de Touros).
