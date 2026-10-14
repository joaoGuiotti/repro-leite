# REFACTOR_PLAN.md — Reestruturação feature-first + Clean Architecture (Offline-First)

> **Projeto:** `repro-leite` (Expo + React Native + expo-sqlite + NativeWind)
> **Objetivo:** migrar de organização por camada para **feature-first**, aplicar **Clean Architecture**, consolidar o padrão **offline-first** e padronizar a UI.
> **Como usar:** execute **uma fase por vez**. Ao fim de cada fase, rode os critérios de aceite e só então avance.

---

## 0. Instruções para o agente (LEIA PRIMEIRO)

### Regras de execução
1. **Não quebre o app.** Após cada passo de movimentação: `npx tsc --noEmit` e `npm test` devem passar.
2. **Mova com `git mv`** para preservar histórico. Faça commits pequenos, um por passo (`refactor(herd): move domain files`).
3. **Não altere comportamento** durante movimentações. Mudança estrutural e mudança funcional ficam em commits separados.
4. **Não apague nada** fora da lista da seção 6 (limpeza). Em caso de dúvida, pergunte.
5. **Não invente colunas ou regras.** Antes de alterar schema, leia `src/db/schema/*` e `specs/*/data-model.md` e proponha a migration para revisão.
6. Atualize imports usando os aliases (seção 3.1). Nada de `../../../`.
7. Ao terminar cada fase, gere um resumo: arquivos movidos, pendências, riscos.

### Premissa de arquitetura
**Offline-first**: o SQLite local é a fonte da verdade. A UI **só lê do SQLite**. O servidor é sincronizado em segundo plano (push da outbox + pull por cursor).
(Se o projeto for de fato *online-first*, pare e avise: a seção 2 muda.)

### Convenções
- **Idioma do código:** inglês (`Herd`, `Bull`, `Insemination`, `Animal`). **Idioma da interface:** pt-BR.
  Exceção aceita temporariamente: componentes existentes em português mantêm o nome até a fase 5 (renomear depois, em commit isolado).
- Arquivos em `kebab-case` (`register-animal.usecase.ts`); componentes React em `PascalCase.tsx`.
- Sufixos: `.entity.ts`, `.repository.ts` (port), `.sqlite.repository.ts` (implementação), `.usecase.ts`, `.mapper.ts`, `.schema.ts`.

---

## 1. Diagnóstico da estrutura atual

### Pontos fortes
- `domain/` com funções puras e testes (`reproduction`, `consanguinity`, `earTag`, `bullStock`...).
- Repositórios separados do schema; já existem `syncQueueRepository` e schema `sync`.
- Kit de UI com barrel (`ui/index.ts`) e tema em `constants/theme.ts`.
- Specs por feature (`000-fundacao-offline`, `001-rebanho-e-touros`, `002-inseminacao-rapida`).

### Problemas
| # | Problema | Impacto |
|---|---|---|
| 1 | Organização por camada na raiz (`components/`, `db/`, `domain/`, `types/`) | Mexer em uma feature toca ~6 pastas |
| 2 | `domain/` plano, misturando features e itens transversais | Sem fronteiras |
| 3 | `types/` separado do domínio | Entidades longe das regras |
| 4 | Sem camada de aplicação (use cases) | Orquestração provavelmente nas telas/modais |
| 5 | Repositórios concretos sem interface (port) | UI/domínio acoplados ao SQLite |
| 6 | `sync/` só tem `README.md` e `types.ts` | Motor de sync inexistente |
| 7 | `ui/` mistura design system com componentes de domínio (`PainelProjecaoZootecnica`, `BadgeEstoqueDoses`, `BadgeBrinco`, `CabecalhoStatusSimulador`) | Dependência circular com features |
| 8 | Testes só de domínio e schema, em `__tests__/` na raiz | Sem testes de use case/repositório/UI |
| 9 | Sobras do template Expo | Ruído |
| 10 | Idioma misto (db/types em inglês; UI em português) | Linguagem ubíqua inconsistente |
| 11 | Docs duplicadas (`_docs/` e `specs/`) | Fonte de verdade confusa |
| 12 | Contextos globais soltos em `context/` | Deveriam estar em `core/` |

---

## 2. Princípios offline-first (obrigatórios)

1. **A UI só lê do SQLite local.** Nunca de chamada de rede direta.
2. **Toda escrita = dado + outbox na mesma transação.** Se uma falha, ambas falham.
3. **Sync é processo separado da UI**: *push* (drena a outbox) e *pull* (busca mudanças desde um cursor).
4. **Operações idempotentes**: `operation_id` único por item da outbox.
5. **Política de conflito explícita**: *last-write-wins por campo* para dados simples; *server-wins* para dados críticos. **Estoque de doses: registrar movimentações e calcular saldo**, nunca sobrescrever um número.
6. **Gatilhos de sync**: foreground (`AppState`), reconexão (`NetInfo`), pós-escrita (debounce) e periódico.
7. **Retry com backoff exponencial**; estado de erro visível ao usuário.
8. **Queries reativas** (`useLiveQuery` do Drizzle ou observer próprio) para a UI refletir o pull.

### Checklist de colunas por tabela sincronizável
- [ ] `id` **UUID gerado no cliente** (v7 preferido). Sem autoincrement.
- [ ] `farm_id` (escopo multi-tenant)
- [ ] `created_at`, `updated_at`
- [ ] `deleted_at` (soft delete / tombstone)
- [ ] `version` ou `server_rev` (controle de conflito)
- [ ] Índices em `farm_id`, `updated_at`, `deleted_at` e colunas de filtro

> **Tarefa do agente:** auditar `src/db/schema/*` contra este checklist e produzir um relatório de lacunas **antes** de criar migrations.

---

## 3. Estrutura alvo

```
src/
├── app/                              # SOMENTE rotas Expo Router (finas)
│   ├── _layout.tsx
│   ├── index.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── hoje.tsx                  # → <TodayScreen />
│       ├── reproducao.tsx            # → <ReproductionScreen />
│       ├── bezerras.tsx              # → <CalvesScreen />
│       └── ajustes.tsx               # → <SettingsScreen />
│
├── features/
│   ├── herd/                         # rebanho
│   │   ├── domain/
│   │   │   ├── animal.entity.ts
│   │   │   ├── ear-tag.ts
│   │   │   ├── animal-filters.ts
│   │   │   └── animal.repository.ts          # PORT
│   │   ├── application/
│   │   │   ├── register-animal.usecase.ts
│   │   │   ├── remove-animal.usecase.ts
│   │   │   └── list-animals.usecase.ts
│   │   ├── infra/
│   │   │   ├── animal.schema.ts
│   │   │   ├── animal.sqlite.repository.ts
│   │   │   ├── animal.mapper.ts
│   │   │   └── animal.remote.ts              # DTOs p/ sync
│   │   ├── presentation/
│   │   │   ├── screens/
│   │   │   ├── components/                   # ModalCadastroAnimal, ModalSaidaAnimal, BadgeBrinco
│   │   │   └── hooks/
│   │   ├── __tests__/
│   │   └── index.ts                          # API pública
│   │
│   ├── bulls/                        # touros
│   │   ├── domain/        (bull.entity, bull-stock, consanguinity, bull.repository)
│   │   ├── application/   (supply-doses, list-bulls)
│   │   ├── infra/
│   │   ├── presentation/  (CatalogoTouros, BadgeEstoqueDoses)
│   │   └── index.ts
│   │
│   ├── insemination/
│   │   ├── domain/
│   │   ├── application/   (register-insemination.usecase)
│   │   ├── infra/
│   │   ├── presentation/  (FormularioInseminacaoRapida, HistoricoInseminacoesRecentes, ModalAbastecimentoDoses)
│   │   └── index.ts
│   │
│   ├── reproduction/                 # regras e projeções
│   │   ├── domain/        (reproduction.ts)
│   │   └── presentation/  (PainelProjecaoZootecnica)
│   │
│   ├── alerts/                       # alert.entity, repository, BannerAlerta de domínio
│   ├── calves/                       # bezerras (nova)
│   ├── today/                        # composição de dados de outras features
│   └── settings/
│
├── core/                             # transversal; NÃO importa features
│   ├── db/
│   │   ├── client.ts
│   │   ├── migrations/
│   │   ├── schema/        (common, farms, sync, index)   # só tabelas compartilhadas
│   │   └── transaction.ts                                  # withTransaction
│   ├── sync/
│   │   ├── outbox.repository.ts          # ← syncQueueRepository
│   │   ├── sync-engine.ts
│   │   ├── push.ts
│   │   ├── pull.ts
│   │   ├── conflict-resolver.ts
│   │   ├── scheduler.ts                  # AppState + NetInfo + backoff
│   │   ├── sync-state.ts                 # ← domain/syncState.ts
│   │   ├── types.ts
│   │   └── SyncStatusContext.tsx
│   ├── network/                          # api-client, wrapper NetInfo
│   ├── simulation/                       # dateSimulation + ManagementDateContext
│   ├── di/                               # composition root
│   ├── result.ts                         # Result<T, E> / AppError
│   └── utils/                            # id.ts (uuid v7), dates.ts
│
├── ui/                               # Design System GENÉRICO (sem regra de negócio)
│   ├── tokens/        (colors, spacing, typography, radius)
│   ├── primitives/    (Botao, CampoTexto, CampoNumerico, SelectDate, Cartao, SeloStatus)
│   ├── feedback/      (BannerAlerta, EmptyState, ErrorState, Skeleton, OfflineBadge)
│   ├── overlays/      (ModalPadrao, SeletorItemModal, BottomSheet)
│   ├── layout/        (Screen, Header, Section)
│   ├── theme/         (use-theme, use-color-scheme)
│   └── index.ts
│
└── i18n/                             # strings pt-BR
```

### 3.1 Aliases (tsconfig + babel/metro)
```
@/*          → src/*
@features/*  → src/features/*
@core/*      → src/core/*
@ui/*        → src/ui/*
```

### 3.2 Regra de dependência

```
presentation  →  application  →  domain  ←  infra
                                   ▲
                       (infra implementa os ports)
```

| Camada | Pode importar | NÃO pode importar |
|---|---|---|
| `domain` | apenas `domain` da mesma feature e `core/result`, `core/utils` | React, Drizzle, expo-*, outras camadas |
| `application` | `domain` (ports), `core/result` | `infra`, `presentation`, SQLite |
| `infra` | `domain`, `core/db`, `core/sync` | `presentation`, `application` |
| `presentation` | `application`, `domain` (tipos), `ui`, `core` | `infra` diretamente |
| `features/A` → `features/B` | **apenas** `features/B/index.ts` | caminhos internos de B |
| `core` | outros módulos `core`, `utils` | `features`, `ui` |
| `ui` | `ui`, `core/utils` | `features`, `core/db`, `core/sync` |

**Enforçar por lint:** configurar `eslint-plugin-boundaries` (ou `dependency-cruiser`) com essas regras e rodar no CI.

---

## 4. Padrões de código

### 4.1 Port + Use Case
```ts
// features/insemination/domain/insemination.repository.ts
export interface InseminationRepository {
  save(i: Insemination): Promise<void>;
  listRecent(farmId: string, limit: number): Promise<Insemination[]>;
}

// features/insemination/application/register-insemination.usecase.ts
export class RegisterInseminationUseCase {
  constructor(
    private repo: InseminationRepository,
    private outbox: Outbox,
    private tx: TransactionRunner,
  ) {}

  async execute(input: RegisterInseminationInput): Promise<Result<Insemination, AppError>> {
    const entity = Insemination.create(input);          // valida no domínio
    if (!entity.ok) return entity;
    await this.tx.run(async () => {
      await this.repo.save(entity.value);
      await this.outbox.enqueue(toOutboxOp('insemination.create', entity.value));
    });
    return entity;
  }
}
```

### 4.2 Fluxo de escrita
```
Form → useRegisterInsemination() → UseCase.execute
         ├─ valida regras de domínio (intervalo, consanguinidade)
         └─ withTransaction:
              repo.save(entity)
              bullRepo.registerDoseUsage(...)   // movimentação, não sobrescrita
              outbox.enqueue({ opId, type, payload })
UI atualiza via query reativa.
SyncEngine (online): push outbox → pull por cursor → aplica no SQLite.
```

### 4.3 Composition root
`core/di/` instancia repositórios, outbox e use cases e os expõe via Context/hooks. Telas e hooks **nunca** fazem `new XSqliteRepository()`.

---

## 5. Padrões de UI

### Arquitetura
- Rotas em `app/` são finas: só renderizam `<XScreen />`.
- Separar **apresentação** (props → JSX) de **hook/container** (dados e ações).
- Variantes via `tailwind-variants` ou `cva` (`Botao`: `variant`, `size`, `loading`).
- Um componente `Screen` único (SafeArea + KeyboardAvoidingView + scroll).

### Estados obrigatórios em toda tela
- [ ] Loading (skeleton, não spinner de tela cheia)
- [ ] Vazio (`EmptyState` com ação)
- [ ] Erro (`ErrorState` com retry)
- [ ] Offline / sincronizando (indicador global no header)
- [ ] Indicador **por item** de "pendente de envio" (registros na outbox)

### Formulários
- `react-hook-form` + `zod` (schemas reaproveitáveis nos DTOs de sync).
- `inputMode`/`keyboardType`, `returnKeyType`, foco encadeado, erros inline.
- Modais com muitos campos → **rotas modais do Expo Router** ou bottom sheet.

### Listas e performance
- `FlashList` para rebanho e touros; `keyExtractor` com UUID.
- `React.memo` nos itens; callbacks estáveis.
- Paginação por cursor direto no SQLite.

### Acessibilidade e uso em campo
- Alvo de toque **≥ 48 dp** (56 dp nas ações principais; uso com luva/sol forte).
- `accessibilityRole`, `accessibilityLabel`, `accessibilityState` nos primitivos.
- Contraste alto; suporte a fonte dinâmica; dark mode via tokens.
- **Nunca só cor** para status: sempre ícone ou texto (`SeloStatus`).
- Feedback tátil (`expo-haptics`) em confirmações.

### Tokens
- `constants/theme.ts` → `ui/tokens/`: cores semânticas (`surface`, `onSurface`, `danger`, `warning`, `success`, `syncPending`), escala de espaçamento, tipografia.
- `tailwind.config.js` deve consumir os **mesmos tokens** (sem valores soltos).

---

## 6. Mapeamento arquivo atual → destino

| Atual | Destino |
|---|---|
| `domain/earTag.ts`, `animalFilters.ts` | `features/herd/domain/` |
| `domain/bullStock.ts`, `consanguinity.ts` | `features/bulls/domain/` |
| `domain/reproduction.ts` | `features/reproduction/domain/` |
| `domain/syncState.ts` | `core/sync/sync-state.ts` |
| `domain/dateSimulation.ts` + `context/ManagementDateContext.tsx` | `core/simulation/` |
| `context/SyncStatusContext.tsx` | `core/sync/` |
| `sync/README.md`, `sync/types.ts` | `core/sync/` |
| `db/client.ts` | `core/db/client.ts` |
| `db/schema/{common,farms,sync,index}.ts` | `core/db/schema/` |
| `db/schema/{animals,bulls,inseminations,alerts,settings}.ts` | `features/*/infra/*.schema.ts` (reexportados por índice em `core/db`) |
| `db/repositories/*Repository.ts` | `features/*/infra/*.sqlite.repository.ts` (+ port em `domain/`) |
| `db/repositories/syncQueueRepository.ts` | `core/sync/outbox.repository.ts` |
| `types/{animal,bull,insemination,alert}.ts` | `features/*/domain/*.entity.ts` |
| `types/declarations.d.ts` | `src/declarations.d.ts` |
| `components/rebanho/*` | `features/herd/presentation/components/` |
| `components/touros/*` | `features/bulls/presentation/components/` |
| `components/inseminacao/*` | `features/insemination/presentation/components/` |
| `ui/PainelProjecaoZootecnica.tsx` | `features/reproduction/presentation/` |
| `ui/BadgeEstoqueDoses.tsx` | `features/bulls/presentation/` |
| `ui/BadgeBrinco.tsx` | `features/herd/presentation/` |
| `ui/CabecalhoDataSimulador.tsx`, `CabecalhoStatusSimulador.tsx` | `core/simulation/` (ou `ui/layout/` se forem genéricos) |
| `ui/{Botao,CampoTexto,CampoNumerico,SelectDate,Cartao,SeloStatus}.tsx` | `ui/primitives/` |
| `ui/BannerAlerta.tsx` | `ui/feedback/` |
| `ui/{ModalPadrao,SeletorItemModal}.tsx` | `ui/overlays/` |
| `hooks/use-theme.ts`, `use-color-scheme*.ts` | `ui/theme/` |
| `constants/theme.ts` | `ui/tokens/` |
| `__tests__/domain/*.test.ts` | ao lado do código: `features/*/domain/__tests__/` |
| `__tests__/db/schema.test.ts` | `core/db/__tests__/` |
| `__mocks__/expo-sqlite.ts` | manter na raiz (convenção do Jest) |
| `_docs/*` | `docs/` (unificar com `specs/` ou referenciar) |

### Remover (confirmar antes)
- `assets/images/react-logo*.png`, `expo-badge*.png`, `tutorial-web.png`, `expo-logo.png`, `logo-glow.png`
- `assets/expo.icon/` (se não for usado no `app.json`)
- `scripts/reset-project.js`

---

## 7. Plano de execução por fases

### Fase 0 — Higiene
- [ ] Remover sobras do template (lista acima, após confirmar referências com grep).
- [ ] Configurar aliases em `tsconfig.json`, `babel.config.js`, `jest.config.js`.
- [ ] Instalar e configurar `eslint-plugin-boundaries` (regras da seção 3.2, inicialmente como `warn`).
- [ ] Criar `src/core/` e `src/features/` vazios com `index.ts` quando aplicável.
- [ ] Atualizar `AGENTS.md` com a regra de dependência e as convenções deste documento.

**Aceite:** `tsc`, `jest` e `eslint` passam; app abre normalmente.

### Fase 1 — Core
- [ ] Mover `db/client.ts` e schemas compartilhados para `core/db/`.
- [ ] Criar `core/result.ts` (`Result<T,E>`, `AppError`), `core/utils/id.ts` (UUID v7), `core/db/transaction.ts` (`withTransaction`).
- [ ] Mover `syncState`, `SyncStatusContext`, `syncQueueRepository` → `core/sync/` (renomear para `outbox.repository.ts`).
- [ ] Mover `dateSimulation` + `ManagementDateContext` → `core/simulation/`.
- [ ] **Auditar schema** contra o checklist da seção 2 e entregar relatório de lacunas. Só então propor migration (para revisão humana).
- [ ] Criar `ui/tokens`, reorganizar primitivos em `ui/primitives|feedback|overlays` e mover o que é de domínio para fora de `ui/`.

**Aceite:** `ui/` não importa nada de `features/` nem `core/db`; testes de schema passam.

### Fase 2 — Fatia piloto: `herd`
- [ ] Mover `earTag`, `animalFilters`, entidade `animal` → `features/herd/domain/`.
- [ ] Criar port `AnimalRepository`; adaptar `animalRepository` para `animal.sqlite.repository.ts` + `animal.mapper.ts`.
- [ ] Criar use cases: `register-animal`, `remove-animal`, `list-animals` (escrita com outbox na mesma transação).
- [ ] Mover componentes (`ModalCadastroAnimal`, `ModalSaidaAnimal`, `BadgeBrinco`) e criar hooks (`useAnimals`, `useRegisterAnimal`).
- [ ] Criar `HerdScreen` e deixar a rota em `app/` fina.
- [ ] Testes de use case com repositório **in-memory**.
- [ ] Expor API pública em `features/herd/index.ts`.

**Aceite:** nenhuma tela de `herd` importa `infra` diretamente; testes de use case passam; esta fatia serve de **template** para as demais.

### Fase 3 — Demais features (nesta ordem)
`bulls` → `insemination` → `alerts` → `reproduction` → `today` → `settings` → `calves`

Para cada uma, repetir o molde da fase 2. Regras específicas:
- `insemination` consome `herd` e `bulls` **apenas via `index.ts`**.
- Estoque de doses: migrar para **movimentações** (`dose_movements`) com saldo derivado; propor migration para revisão.
- `today` apenas compõe dados; sem regra de negócio própria.

**Aceite:** `eslint-plugin-boundaries` sem violações (promover regras para `error`).

### Fase 4 — Motor de sync
- [ ] Outbox com `operation_id`, `type`, `payload`, `status`, `attempts`, `next_retry_at`, `last_error`.
- [ ] `push.ts` em lote e idempotente; `pull.ts` por cursor (`updated_at`/`server_rev`) aplicando em transação.
- [ ] `conflict-resolver.ts` com política explícita por entidade (documentar em `docs/sync-conflicts.md`).
- [ ] `scheduler.ts`: `AppState` + `NetInfo` + debounce pós-escrita + backoff exponencial com jitter.
- [ ] `SyncStatusContext` alimentado pelo engine (idle / syncing / offline / error + contagem de pendentes).
- [ ] Testes: offline total, reenvio duplicado, conflito, falha parcial, retomada após crash.

**Aceite:** simulação de offline → escrita → reconexão sincroniza sem duplicar nem perder dados.

### Fase 5 — Polimento de UI
- [ ] Estados loading/vazio/erro/offline em todas as telas.
- [ ] `FlashList` em rebanho e touros.
- [ ] Acessibilidade (alvos, labels, contraste) e feedback tátil.
- [ ] i18n pt-BR; dark mode via tokens.
- [ ] Padronizar idioma dos nomes (renomear componentes em português, em commit isolado).

### Fase 6 — Qualidade contínua
- [ ] CI: `tsc --noEmit`, `eslint` (com boundaries), `jest --coverage`.
- [ ] Cobertura mínima: `domain` ≥ 90%, `application` ≥ 80%.
- [ ] Unificar `_docs/` e `specs/` em `docs/`.

---

## 8. Dependências

**Já esperadas/verificar:** `expo-sqlite`, `drizzle-orm` (com `useLiveQuery`).

**Adicionar:**
```bash
npx expo install @react-native-community/netinfo expo-background-task expo-crypto expo-haptics
npm i zod react-hook-form @hookform/resolvers @shopify/flash-list tailwind-variants uuid
npm i -D eslint-plugin-boundaries
```
Opcional: `@tanstack/react-query` **somente** para o lado remoto (push/pull). A UI continua lendo do SQLite.

---

## 9. Definição de pronto (DoD) global

- [ ] `src/app/` contém apenas rotas finas.
- [ ] Nenhuma violação de `eslint-plugin-boundaries`.
- [ ] Toda escrita sincronizável passa por use case + transação + outbox.
- [ ] Toda tabela sincronizável cumpre o checklist da seção 2.
- [ ] `ui/` é genérico (zero import de `features`).
- [ ] Todas as telas têm estados loading/vazio/erro/offline.
- [ ] Testes de domínio, use cases e sync passando no CI.
- [ ] `AGENTS.md` atualizado com arquitetura e convenções.

---

## 10. Prompt sugerido para iniciar no Antigravity

```
Leia REFACTOR_PLAN.md por completo. Execute SOMENTE a Fase 0.
Siga as regras da seção 0 (git mv, commits pequenos, sem mudar comportamento).
Antes de remover qualquer arquivo, rode grep para confirmar que não é referenciado.
Ao final, rode tsc, jest e eslint, e me entregue um resumo com:
arquivos movidos/removidos, pendências e riscos. Não avance para a Fase 1 sem minha aprovação.
```