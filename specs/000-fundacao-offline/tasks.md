# Tasks: Fundação Offline & Infraestrutura Core

**Feature**: `000-fundacao-offline` | **Branch**: `000-fundacao-offline` | **Spec**: [spec.md](file:///c:/DEV/github/repro-leite/specs/000-fundacao-offline/spec.md) | **Plan**: [plan.md](file:///c:/DEV/github/repro-leite/specs/000-fundacao-offline/plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Instalação de dependências essenciais do core, configuração de tema rural e estrutura base de diretórios.

- [X] T001 [P] Instalar pacotes de banco de dados e utilitários de data (`drizzle-orm`, `expo-sqlite`, `date-fns`) via `npx expo install` no arquivo package.json
- [X] T002 [P] Configurar tokens do tema rural de alto contraste (verde pasto `#1b4332`, terra, âmbar de alerta, alvos `min-h-14` de 56px e `min-h-12` de 48px) no arquivo tailwind.config.js
- [X] T003 [P] Criar a árvore de diretórios base da aplicação (`src/db/schema`, `src/db/repositories`, `src/domain`, `src/context`, `src/ui`, `__tests__/domain`, `__tests__/db`)
- [X] T004 Configurar estilos globais do Tailwind e NativeWind em global.css e importar no layout raiz src/app/_layout.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura de banco de dados SQLite local, tipagem Drizzle com UUID v4, soft delete e repositórios base.

> **CRITICAL**: Nenhuma user story pode ser finalizada antes da conclusão desta fundação.

- [X] T005 [P] Criar definição de colunas comuns (`id` TEXT UUID v4 not null, `farm_id` TEXT UUID v4 not null, `created_at` TEXT ISO UTC not null, `updated_at` TEXT ISO UTC not null, `deleted_at` TEXT ISO UTC nullable) no arquivo src/db/schema/common.ts
- [X] T006 [P] Criar schema Drizzle da tabela `farms` (`id` primary key, `name` text not null, `owner_user_id` text nullable) herdando colunas comuns no arquivo src/db/schema/farms.ts
- [X] T007 [P] Criar schema Drizzle da tabela `settings` (`id` primary key, `farm_id` text not null references farms.id, `key` text not null, `value` text not null, índice único `settings_farm_key_idx` em `farm_id` e `key`) no arquivo src/db/schema/settings.ts
- [X] T008 [P] Criar schema Drizzle das tabelas de sincronização `sync_queue` (`id` primary key, `farm_id` text not null, `table_name` text not null, `record_id` text not null, `operation` text not null 'INSERT'|'UPDATE'|'DELETE', `payload_json` text, `attempts` integer default 0, `last_error` text) e `sync_state` no arquivo src/db/schema/sync.ts
- [X] T009 Configurar cliente SQLite em src/db/client.ts com abertura via `openDatabaseSync('repro_leite.db')`, inicialização de tabelas e injeção do Drizzle ORM
- [X] T010 Implementar repositório `SettingsRepository` com métodos `getSetting`, `setSetting` e `getAllSettings` no arquivo src/db/repositories/settingsRepository.ts
- [X] T011 Implementar repositório `SyncQueueRepository` com métodos `getPendingCount`, `peekBatch`, `removeBatch` e `recordFailure` no arquivo src/db/repositories/syncQueueRepository.ts
- [X] T012 Implementar função `ensureDefaultFarm` em src/db/client.ts para inicializar automaticamente a fazenda padrão local caso nenhuma exista

---

## Phase 3: User Story 1 - Operação Confiável em Modo Curral (Priority: P1) 🎯 MVP

**Goal**: Permitir que o aplicativo inicialize e execute leitura/escrita 100% no SQLite local sem qualquer dependência de rede, com garantia de persistência ao fechar o app.

**Independent Test**: Ativar o modo avião no dispositivo, abrir o app, verificar que a fazenda padrão é carregada do banco local e que não há erros de rede.

### Tests for User Story 1
- [X] T013 [P] [US1] Criar teste unitário de inicialização do schema SQLite e persistência da fazenda padrão no arquivo __tests__/db/schema.test.ts

### Implementation for User Story 1
- [X] T014 [US1] Implementar utilitário de transação atômica que grava o registro de dados e enfileira a operação na `sync_queue` no arquivo src/db/client.ts
- [X] T015 [US1] Configurar layout com as 4 abas no Expo Router (Hoje, Bezerras, Reprodução, Ajustes) com carregamento offline imediato no arquivo src/app/(tabs)/_layout.tsx
- [X] T016 [US1] Criar tela inicial da aba Hoje em src/app/(tabs)/hoje.tsx consumindo os dados da fazenda ativa localmente

**Checkpoint**: Modo Curral operacional. O app abre e opera offline com SQLite local.

---

## Phase 4: User Story 2 - Simulação Temporal da Data de Manejo no Cabeçalho (Priority: P1)

**Goal**: Permitir que o usuário visualize a data de trabalho ativa e avance o tempo facilmente com atalhos (+1d, +7d, +21d de retorno de cio e reset para hoje).

**Independent Test**: Tocar nos atalhos `+1d`, `+7d` e `+21d` no cabeçalho e verificar se a data ativa reflete o avanço imediatamente, e se o botão "Resetar Hoje" restaura a data real.

### Tests for User Story 2
- [X] T017 [P] [US2] Criar testes unitários para as funções puras de cálculo de datas de manejo (`advanceDays`, `formatToDateString`, `parseDateString`, `isSimulatedDate`) no arquivo __tests__/domain/dateSimulation.test.ts

### Implementation for User Story 2
- [X] T018 [P] [US2] Implementar motor puro de cálculo de datas e máscaras `YYYY-MM-DD` com `date-fns` no arquivo src/domain/dateSimulation.ts
- [X] T019 [US2] Implementar contexto `ManagementDateContext` e hook `useManagementDate` (com estado de data ativa, `advanceDays`, `setDateString`, `resetToToday` e persistência na tabela `settings`) no arquivo src/context/ManagementDateContext.tsx
- [X] T020 [US2] Criar componente de controle de data de manejo com atalhos rápidos (`+1d`, `+7d`, `+21d (Cio)`, `Resetar Hoje`) no arquivo src/ui/CabecalhoDataSimulador.tsx

**Checkpoint**: Simulador temporal de manejo funcional e reativo em toda a aplicação.

---

## Phase 5: User Story 3 - Visibilidade da Proteção dos Dados e Estado de Sincronização (Priority: P2)

**Goal**: Exibir no topo da tela o indicador transparente do estado de proteção dos dados (verde, amarelo e azul), botão "Sincronizar Agora" e switch para simular modo sem internet em campo.

**Independent Test**: Inserir alterações na fila local e conferir a transição do selo verde para amarelo com a contagem exata de pendências, e azul ao disparar sincronização.

### Implementation for User Story 3
- [X] T021 [P] [US3] Implementar funções puras de consolidação do estado visual de sincronização (`getSyncStateDescription`, `resolveProtectionStatus`) no arquivo src/domain/syncState.ts
- [X] T022 [US3] Implementar contexto `SyncStatusContext` e hook `useSyncStatus` (monitorando contagem da `sync_queue`, flag `isSimulatedOffline`, `toggleSimulatedOffline` e `triggerSyncNow`) no arquivo src/context/SyncStatusContext.tsx
- [X] T023 [US3] Construir componente integrado do cabeçalho `CabecalhoStatusSimulador` (unindo data, selo 🟢/🟡/🔵, botão "Sincronizar Agora" e alternador "Sem Internet") no arquivo src/ui/CabecalhoStatusSimulador.tsx conforme contrato [management-header-contract.md](file:///c:/DEV/github/repro-leite/specs/000-fundacao-offline/contracts/management-header-contract.md)
- [X] T024 [US3] Integrar o `CabecalhoStatusSimulador` no topo do layout principal em src/app/_layout.tsx para persistir visível em todas as telas

**Checkpoint**: Cabeçalho de proteção e simulador de conectividade operacional.

---

## Phase 6: User Story 4 - Ergonomia e Acessibilidade Sob Sol Forte (Priority: P2)

**Goal**: Garantir que todos os componentes base respeitem as diretrizes de ergonomia rural (botões de 56px, controles de 48px, alto contraste legível sob sol intenso).

**Independent Test**: Inspecionar os componentes em tela cheia e verificar que os botões têm altura de toque mínima de 56px e contraste superior a 4.5:1.

### Implementation for User Story 4
- [X] T025 [P] [US4] Implementar componente primitivo `Botao` com variantes primária (`min-h-14` / 56px, verde pasto `#1b4332`), secundária (`min-h-12` / 48px) e texto escuro em src/ui/Botao.tsx
- [X] T026 [P] [US4] Implementar componente primitivo `CampoNumerico` com teclado numérico por padrão e altura mínima de 48px em src/ui/CampoNumerico.tsx
- [X] T027 [P] [US4] Implementar componente primitivo `Cartao` com borda nítida e fundo de alto contraste em src/ui/Cartao.tsx
- [X] T028 [P] [US4] Implementar componente primitivo `SeloStatus` com cores temáticas estáticas para status reprodutivo e de proteção em src/ui/SeloStatus.tsx

**Checkpoint**: Design system rural primitivo pronto para uso em todas as telas de negócio.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificações finais de qualidade de código, tipagem estrita e execução do roteiro de validação.

- [X] T029 Executar bateria de testes unitários com `npm test` garantindo 100% de aprovação dos testes de domínio e banco
- [X] T030 Executar verificação estrita de tipagem TypeScript com `npx tsc --noEmit`
- [X] T031 Executar verificação de linting com `npx expo lint`
- [X] T032 Executar roteiro completo de validação do arquivo [quickstart.md](file:///c:/DEV/github/repro-leite/specs/000-fundacao-offline/quickstart.md) em emulador ou dispositivo físico

---

## Dependencies & Execution Order

### Phase Dependencies
1. **Setup (Phase 1)**: Sem dependências — execução imediata.
2. **Foundational (Phase 2)**: Depende da Setup — **BLOQUEIA** todas as user stories.
3. **User Story 1 (Phase 3)**: Depende da Foundational (Phase 2) — Entrega o MVP base.
4. **User Story 2 (Phase 4)**: Depende da Foundational (Phase 2) — Pode rodar em paralelo ou após US1.
5. **User Story 3 (Phase 5)**: Depende de US1 e US2 (integração do cabeçalho completo).
6. **User Story 4 (Phase 6)**: Componentes primitivos ergonômicos — Pode rodar em paralelo com US2/US3.
7. **Polish (Phase 7)**: Depende de todas as stories concluídas.

---

## Implementation Strategy

### MVP First (User Story 1 & 2)
1. Concluir Phase 1 (Setup) e Phase 2 (Foundational).
2. Concluir User Story 1 (Modo Curral Offline).
3. Concluir User Story 2 (Simulador Temporal no Cabeçalho).
4. **Validar no dispositivo**: Verificar app abrindo em modo avião com a data simulável no topo.
5. Concluir User Story 3 e 4 (Indicador de Sync e Componentes Ergonômicos).
6. Rodar Polish e quickstart.
