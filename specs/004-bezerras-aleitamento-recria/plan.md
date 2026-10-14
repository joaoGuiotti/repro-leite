# Implementation Plan: 004-bezerras-aleitamento-recria

**Branch**: `feature/004-bezerras-aleitamento-recria` | **Date**: 2026-10-14 | **Spec**: [spec.md](file:///c:/DEV/github/repro-leite/specs/004-bezerras-aleitamento-recria/spec.md)

**Input**: Feature specification from `specs/004-bezerras-aleitamento-recria/spec.md` e mockup visual de alta fidelidade da tela de Bezerras, Genealogia & Desmame.

---

## Summary

Implementar a aba "Bezerras" (`CalvesScreen`) com fidelidade visual ao layout solicitado pelo usuário (Master-Detail com lista lateral e ficha detalhada completa):
1. **Cadastro com Genealogia em 3 Níveis**: Bezerra $\rightarrow$ Mãe (vaca cadastrada do rebanho), Pai (touro do catálogo) e Avó Materna (opcional via texto livre ou herdada da mãe).
2. **Dieta Líquida e Régua de Desmame**: Protocolo zootécnico com 6 fases (0-15d 4L, 16-100d 8L, 101-107d 4L, 108-114d 2L, 115-121d 1L, 122+d 0L) com destaque para o volume diário ("Quanto esta bezerra mama hoje") e datas civis exatas para cada marco de corte no calendário.
3. **Recria & GMD**: Tabela `weighings` para registro de pesagens periódicas, cálculo automático do Ganho Médio Diário em g/dia e barra de progresso até a meta de 360 kg para a 1ª Inseminação Artificial.
4. **Ação Rápida no Curral**: Ao atingir 360 kg, o sistema sinaliza a novilha como "Apta para 1ª IA" com botão tátil de 56 px redirecionando para a aba Reprodução com o animal pré-selecionado.
5. **Clean Architecture e Offline-First**: Operações 100% no SQLite local via Drizzle, com outbox transacional para sincronização futura em nuvem.

---

## Technical Context

**Language/Version**: TypeScript 5.3+ (Strict Mode)  
**Primary Dependencies**: React Native (Expo SDK), Expo Router, NativeWind (Tailwind CSS), Lucide React Native (`lucide-react-native`), Drizzle ORM  
**Storage**: SQLite local via `expo-sqlite` (Drizzle ORM), tabela `weighings` e tabela `animals` com índices e outbox (`sync_queue`)  
**Testing**: Jest + React Native Testing Library (testes unitários puros no domínio, testes de casos de uso na aplicação com mocks, testes de integração/contrato no repositório)  
**Target Platform**: Mobile (iOS & Android) via Expo CNG e Web/Tablet responsivo  
**Project Type**: Mobile Application (Clean Architecture + Feature-First)  
**Performance Goals**: Tempo de cálculo de aleitamento e GMD $< 50\text{ ms}$; renderização fluida em listas de até centenas de animais com FlashList/FlatList; persistência de pesagem $< 100\text{ ms}$  
**Constraints**: 100% offline-first (zero dependência de rede em campo); alvos de toque $\ge 48\text{ px}$ (56 px nas ações principais); alto contraste legível sob luz solar  
**Scale/Scope**: Gestão individual de centenas de bezerras/novilhas por fazenda; suporte a simulação temporal reativa  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Offline-First & Local-First Architecture**: Todas as leituras e escritas (cadastro de bezerra, pesagens, deleções) ocorrem exclusivamente no SQLite local. O sync com nuvem é assíncrono via outbox transacional na mesma transação (`withTransaction`).
- [x] **II. Pure TypeScript Domain Engines**: Motores de cálculo de aleitamento (`calf-feeding.ts`) e cálculo de GMD e metas (`calf-weight.ts`) são funções puras determinísticas sem dependências de UI, React ou banco.
- [x] **III. Rural Ergonomics & Accessibility**: Botões principais com altura mínima de 56 px (`min-h-14`) e secundários $\ge 48\text{ px}$. Cores semânticas de alto contraste (`bg-surface`, `bg-pasto-900`, `text-pasto-900`, `bg-danger`). Teclado numérico padrão para brinco e pesos.
- [x] **IV. Strict Data Integrity & Multi-Tenant Partitioning**: IDs UUID gerados no cliente, `farm_id` obrigatório em todas as tabelas, datas biológicas em ISO `YYYY-MM-DD`, soft delete (`deleted_at`), outbox transacional.
- [x] **V. Continuous Native Generation (CNG) & Modern Expo Discipline**: Nenhuma alteração manual em `ios/` ou `android/`. Rotas finas no Expo Router (`src/app/(tabs)/bezerras.tsx`). Código da feature isolado em `src/features/calves/`.

---

## Project Structure

### Documentation (this feature)

```text
specs/004-bezerras-aleitamento-recria/
├── plan.md              # Este documento de arquitetura
├── research.md          # Decisões de UI e motores zootécnicos
├── data-model.md        # Esquema SQLite (weighings) e entidades
├── quickstart.md        # Guia de validação ponta a ponta
├── contracts/
│   └── calves-actions-contract.md # Contratos de repositório, use cases e UI
└── tasks.md             # Tarefas ordenadas para implementação (/speckit-tasks)
```

### Source Code Layout

```text
src/
├── app/
│   └── (tabs)/
│       └── bezerras.tsx                  # Rota fina que renderiza <CalvesScreen />
├── features/calves/
│   ├── domain/
│   │   ├── calves.types.ts               # Contratos, DTOs e View Models
│   │   ├── calf-feeding.ts               # Motor puro: 6 fases e linha do tempo de desmame
│   │   ├── calf-weight.ts                # Motor puro: GMD, progresso e meta de 360 kg
│   │   ├── calves.repository.ts          # Port de persistência
│   │   └── __tests__/
│   │       ├── calf-feeding.test.ts
│   │       └── calf-weight.test.ts
│   ├── application/
│   │   ├── register-calf.usecase.ts      # Cadastro com genealogia e outbox
│   │   ├── record-weighing.usecase.ts    # Lançamento de pesagem e outbox
│   │   ├── get-calves-dashboard.usecase.ts # Lista de animais e contadores
│   │   ├── get-calf-details.usecase.ts   # Detalhes, dieta líquida e métricas
│   │   ├── delete-calf.usecase.ts        # Soft delete com outbox
│   │   └── __tests__/
│   │       ├── register-calf.usecase.test.ts
│   │       ├── record-weighing.usecase.test.ts
│   │       └── calves-outbox-sync.test.ts
│   ├── infra/
│   │   ├── weighings.schema.ts           # Schema SQLite via Drizzle
│   │   ├── calves.queries.ts             # Queries enriquecidas
│   │   ├── calves.repository.impl.ts     # Implementação concreta do port
│   │   └── __tests__/
│   ├── presentation/
│   │   ├── components/
│   │   │   ├── CalfListCard.tsx          # Card de bezerra na lista esquerda
│   │   │   ├── CalfDetailPane.tsx        # Painel detalhado (ficha completa)
│   │   │   ├── CalfGenealogyCard.tsx     # Bloco de genealogia em 3 níveis
│   │   │   ├── CalfFeedingTimelineCard.tsx # Bloco de dieta líquida e régua
│   │   │   ├── CalfWeightGrowthCard.tsx  # Bloco de recria, métricas e pesagens
│   │   │   ├── RegisterCalfModal.tsx     # Modal de cadastro de bezerra
│   │   │   └── AddWeighingModal.tsx      # Modal de lançamento de pesagem
│   │   ├── hooks/
│   │   │   ├── useCalvesList.ts          # Hook reativo da lista e filtros
│   │   │   ├── useCalfDetails.ts         # Hook da ficha do animal selecionado
│   │   │   └── useCalfActions.ts         # Ações com outbox e haptics
│   │   └── screens/
│   │       └── CalvesScreen.tsx          # Tela principal (layout fiel ao print)
│   ├── factory.ts                        # Composition root da feature
│   └── index.ts                          # API pública da feature
├── core/
│   └── db/
│       └── schema/
│           ├── weighings.ts              # Re-export central do schema weighings
│           └── index.ts
```

---

## Complexity Tracking

*Nenhuma violação aos princípios da Constituição.* A arquitetura segue exatamente o padrão de isolamento por feature, motores puros de domínio, repositório em infraestrutura e injeção de dependências via Composition Root.
