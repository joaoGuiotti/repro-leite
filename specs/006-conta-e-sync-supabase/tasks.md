# Tasks: 006-conta-e-sync-supabase

**Feature**: `006-conta-e-sync-supabase`  
**Date**: 2026-10-16  
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)  
**Status**: Ready for Implementation  

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Instalação de dependências e configuração básica de infraestrutura para autenticação segura e comunicação remota.

- [X] T001 Instalar dependências `@supabase/supabase-js` e `expo-secure-store` via `npx expo install` em `package.json`
- [X] T002 [P] Configurar cliente Supabase seguro e variáveis de ambiente em `src/features/account/infra/supabase-client.ts`
- [X] T003 [P] Implementar adaptador de armazenamento seguro `SecureStorageAdapter` para o Supabase em `src/features/account/infra/secure-storage.adapter.ts`
- [X] T004 [P] Criar migration Drizzle local adicionando coluna `ear_tag_conflict` na tabela `animals` em `src/core/db/schema.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Estruturas de domínio, portas de arquitetura limpa e gateways centrais que bloqueiam todas as histórias de usuário.

**⚠️ CRITICAL**: Nenhuma história de usuário pode ser finalizada antes da conclusão desta fase.

- [X] T005 [P] Definir entidades e tipos de conta (`UserAccount`, `UserSession`) em `src/features/account/domain/account.entity.ts`
- [X] T006 [P] Definir interface port `AuthGateway` em `src/features/account/domain/auth.repository.ts`
- [X] T007 Implementar repositório `SupabaseAuthRepository` implementando `AuthGateway` em `src/features/account/infra/supabase-auth.repository.ts`
- [X] T008 [P] Criar container de injeção de dependências e fábrica de use cases em `src/features/account/factory.ts`
- [X] T009 [P] Configurar ponto de entrada e barrel público da feature account em `src/features/account/index.ts`
- [X] T010 Implementar gateway remoto `SupabaseRemoteSyncGateway` implementando `RemoteSyncGateway` em `src/core/network/supabase-remote-gateway.ts`

**Checkpoint**: Fundação técnica estabelecida — implementação das histórias de usuário desbloqueada.

---

## Phase 3: User Story 1 - Acesso Imediato no Curral & Entrada Opcional por Código OTP (Priority: P1) 🎯 MVP

**Goal**: Permitir operação offline imediata sem bloqueio de login e possibilitar entrada por e-mail com código OTP de 6 dígitos na aba Ajustes com sessão persistente segura.

**Independent Test**: Abrir o app em modo avião (verificar livre navegação e cadastro), navegar até Ajustes após conectar, solicitar código de 6 dígitos para e-mail válido, submeter código e confirmar persistência segura sem perda de sessão após reinício.

### Tests for User Story 1
- [X] T011 [P] [US1] Criar testes unitários para `RequestOtpUseCase` e `VerifyOtpUseCase` em `src/features/account/application/__tests__/auth-usecases.test.ts`

### Implementation for User Story 1
- [X] T012 [US1] Implementar use case `RequestOtpUseCase` com controle de intervalo mínimo de 60s em `src/features/account/application/request-otp.usecase.ts`
- [X] T013 [US1] Implementar use case `VerifyOtpUseCase` com gravação de sessão criptografada em `src/features/account/application/verify-otp.usecase.ts`
- [X] T014 [P] [US1] Implementar use cases `GetSessionUseCase` e `SignOutUseCase` em `src/features/account/application/get-session.usecase.ts` e `src/features/account/application/sign-out.usecase.ts`
- [X] T015 [US1] Criar hook reativo `useAccount` para gestão de estado e sessão em `src/features/account/presentation/hooks/useAccount.ts`
- [X] T016 [P] [US1] Criar componente modal `LoginOtpModal` com teclado numérico nativo e contagem regressiva em `src/features/account/presentation/components/LoginOtpModal.tsx`
- [X] T017 [US1] Integrar acionamento do `LoginOtpModal` e exibição da conta conectada na tela `SettingsScreen` em `src/features/settings/presentation/screens/SettingsScreen.tsx`

**Checkpoint**: User Story 1 funcional — produtor consegue operar offline e conectar sua conta por OTP de 6 dígitos.

---

## Phase 4: User Story 2 - Criação Automática e Vinculação da Fazenda à Conta (Priority: P1) 🎯 MVP

**Goal**: Associar os dados locais existentes à conta do usuário ou provisionar a fazenda remota de forma transparente no primeiro login.

**Independent Test**: Cadastrar animais offline, efetuar o primeiro login por e-mail e confirmar que todos os registros são associados à nova fazenda vinculada ao usuário sem duplicidades.

### Tests for User Story 2
- [X] T018 [P] [US2] Criar teste unitário para fluxo de vinculação e bootstrap de fazenda em `src/features/account/application/__tests__/farm-bootstrap.test.ts`

### Implementation for User Story 2
- [X] T019 [US2] Implementar chamada da RPC `sync_bootstrap_farm` em `src/features/account/infra/supabase-auth.repository.ts`
- [X] T020 [US2] Integrar atualização de `farmId` ativo e transição de dados anônimos no `VerifyOtpUseCase` em `src/features/account/application/verify-otp.usecase.ts`

**Checkpoint**: User Story 2 funcional — onboarding silencioso de fazenda operando sem atrito para o usuário.

---

## Phase 5: User Story 3 - Sincronização Remota Bidirecional Automática e Resiliente (Priority: P1) 🎯 MVP

**Goal**: Transmitir mutações locais da outbox em lotes (`push`) e buscar alterações incrementais (`pull`) no Supabase de forma resiliente e automática com base em eventos de rede e primeiro plano.

**Independent Test**: Cadastrar uma inseminação em modo avião, reconectar à internet e verificar envio idempotente para a tabela remota e atualização reativa do estado de sync.

### Tests for User Story 3
- [X] T021 [P] [US3] Criar testes unitários para `pushBatch` e `pullChanges` do gateway Supabase em `src/core/network/__tests__/supabase-remote-gateway.test.ts`

### Implementation for User Story 3
- [X] T022 [US3] Implementar envio de mutações locais da outbox em lotes idempotentes por `operationId` em `src/core/network/supabase-remote-gateway.ts`
- [X] T023 [US3] Implementar busca e paginação incremental de alterações por cursor `updated_at`/`server_rev` em `src/core/network/supabase-remote-gateway.ts`
- [X] T024 [US3] Conectar `SupabaseRemoteSyncGateway` como gateway ativo no `SyncEngine` ao detectar sessão autenticada em `src/core/sync/sync-engine.ts`
- [X] T025 [US3] Conectar gatilhos de sincronização automática com `AppState` ('active') e listener de reconexão de rede em `src/core/sync/scheduler.ts`

**Checkpoint**: User Story 3 funcional — sincronização bidirecional em segundo plano ativa e testada.

---

## Phase 6: User Story 4 - Indicador Visual de Status de Sincronização e Validação Temporal (Priority: P2)

**Goal**: Exibir permanentemente o status da sincronização no cabeçalho e na aba Ajustes, com horário do último sync e alerta para relógio do aparelho desregulado (> 5 minutos).

**Independent Test**: Alternar modos de conectividade e simular relógio adiantado/atrasado, verificando selos "Sincronizado", "Pendente", "Modo Offline" e alerta visual de horário desajustado.

### Tests for User Story 4
- [X] T026 [P] [US4] Criar testes unitários para cálculo e tolerância de defasagem de relógio em `src/core/sync/__tests__/clock-drift.test.ts`

### Implementation for User Story 4
- [X] T027 [US4] Implementar método `checkServerTimeDrift` comparando carimbo local com resposta do servidor em `src/core/network/supabase-remote-gateway.ts`
- [X] T028 [US4] Integrar verificação periódica de relógio e emissão de alerta no `SyncStatusContext` em `src/core/sync/SyncStatusContext.tsx`
- [X] T029 [US4] Atualizar apresentação de status da nuvem, contadores pendentes e botão de sincronização manual em `src/features/settings/presentation/screens/SettingsScreen.tsx`

**Checkpoint**: User Story 4 funcional — visibilidade total do estado de sincronização e integridade temporal.

---

## Phase 7: User Story 5 - Detecção de Conflitos e Tratamento Inteligente de Brinco Duplicado (Priority: P2)

**Goal**: Manter resolução determinística LWW e sinalizar duplicidade de brincos gerada em aparelhos offline sem exclusão de nenhum animal.

**Independent Test**: Simular pull de animal com brinco já existente localmente em outro ID e confirmar persistência de ambos com etiqueta de "Conflito de Brinco".

### Tests for User Story 5
- [X] T030 [P] [US5] Criar teste unitário para detecção e marcação de brinco conflitante em `src/core/sync/__tests__/ear-tag-conflict.test.ts`

### Implementation for User Story 5
- [X] T031 [US5] Implementar validação de brinco duplicado no `PullEngine` e `ConflictResolver` em `src/core/sync/conflict-resolver.ts`
- [X] T032 [US5] Exibir selo de alerta "Conflito de Brinco" com `SeloStatus` no card do animal em `src/features/herd/presentation/components/AnimalCard.tsx`

**Checkpoint**: User Story 5 funcional — segurança zootécnica garantida em operações offline concorrentes.

---

## Phase 8: User Story 6 - Restauração Inicial em Novo Aparelho com Progresso Visual (Priority: P3)

**Goal**: Exibir tela de carga inicial com contadores e barra de progresso durante o primeiro download de rebanho existente em um aparelho limpo.

**Independent Test**: Efetuar login com conta existente em base local vazia e verificar apresentação de tela de progresso até a liberação do painel principal.

### Tests for User Story 6
- [X] T033 [P] [US6] Criar teste unitário para rotina `initialPull` com progressão por tabela em `src/core/network/__tests__/initial-pull.test.ts`

### Implementation for User Story 6
- [X] T034 [US6] Implementar rotina `initialPull` com contadores e callbacks de progresso em `src/core/network/supabase-remote-gateway.ts`
- [X] T035 [P] [US6] Criar componente modal `InitialSyncModal` com barra de progresso em `src/features/account/presentation/components/InitialSyncModal.tsx`
- [X] T036 [US6] Acionar `InitialSyncModal` automaticamente no login quando a base local for vazia em `src/features/account/presentation/hooks/useAccount.ts`

**Checkpoint**: User Story 6 funcional — experiência de configuração de novo aparelho amigável e transparente.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Migrations finais, atualização do roadmap e garantia de todos os quality gates do projeto.

- [X] T037 [P] Criar migration SQL para Supabase com RLS e triggers em `supabase/migrations/20261016_006_conta_sync_supabase.sql`
- [X] T038 Atualizar status da feature 006 no roadmap do projeto em `docs/features_roadmap.md`
- [X] T039 Executar validação completa de qualidade: `npx tsc --noEmit`, `npm test` e `npx eslint .`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — execução imediata.
- **Foundational (Phase 2)**: Depende da conclusão da Fase 1 — BLOQUEIA todas as histórias de usuário.
- **User Stories (Phase 3+)**: Todas dependem da Fase 2 concluída.
  - US1 (Acesso/OTP) e US2 (Bootstrap Fazenda) formam a base de autenticação.
  - US3 (Sync Remoto) conecta a infraestrutura à nuvem.
  - US4 (Indicador/Relógio), US5 (Conflito Brinco) e US6 (Carga Inicial) podem rodar em paralelo ou sequencialmente.
- **Polish (Phase 9)**: Executada após as histórias desejadas.

### Parallel Opportunities

- **Fase 1**: `T002`, `T003` e `T004` podem rodar em paralelo após `T001`.
- **Fase 2**: `T005`, `T006`, `T008` e `T009` podem rodar em paralelo.
- **Fase 3**: `T011` (testes), `T014` (sign out) e `T016` (modal UI) podem rodar em paralelo com as implementações de use case.
- **Fases 4 a 8**: Testes unitários de cada história marcados com `[P]` podem ser escritos e executados em paralelo.

---

## Parallel Example: User Story 1

```bash
# Execução paralela de testes e componentes visuais da User Story 1:
Task: "[US1] Criar testes unitários para RequestOtpUseCase e VerifyOtpUseCase em src/features/account/application/__tests__/auth-usecases.test.ts"
Task: "[US1] Implementar use cases GetSessionUseCase e SignOutUseCase em src/features/account/application/get-session.usecase.ts"
Task: "[US1] Criar componente modal LoginOtpModal em src/features/account/presentation/components/LoginOtpModal.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2 e 3)
1. Completar **Fase 1 (Setup)** e **Fase 2 (Foundational)**.
2. Implementar **User Story 1 (Acesso Curral & Login OTP)**.
3. Implementar **User Story 2 (Vinculação de Fazenda)**.
4. Implementar **User Story 3 (Push/Pull Bidirecional com Supabase)**.
5. **VALIDAR MVP**: Testar entrada de conta, envio de registros offline e retorno da nuvem.

### Entrega Incremental
1. MVP entregue com sync funcional e sessão segura.
2. Adicionar **User Story 4** (feedback visual aprimorado e checagem de relógio).
3. Adicionar **User Story 5** (proteção contra conflito zootécnico de brinco).
4. Adicionar **User Story 6** (tela de restauração com progresso para troca de celular).
5. Executar **Fase 9** com migrations e validações finais de qualidade.
