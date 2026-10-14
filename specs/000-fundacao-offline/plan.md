# Implementation Plan: Fundação Offline & Infraestrutura Core

**Branch**: `000-fundacao-offline` | **Date**: 2026-10-13 | **Spec**: [spec.md](file:///c:/DEV/github/repro-leite/specs/000-fundacao-offline/spec.md)

**Input**: Feature specification from `specs/000-fundacao-offline/spec.md`

## Summary

Esta feature entrega a infraestrutura técnica fundamental do ReproLeite: configuração do banco SQLite local via Drizzle ORM com suporte a UUID v4 e soft delete, tokens rurais de alto contraste no NativeWind v4, componentes primitivos com alvos de toque de 56px/48px, e o componente superior persistente de cabeçalho (`CabecalhoStatusSimulador`) com simulador de avanço de data (+1d, +7d, +21d) e indicador de proteção e sincronização com a nuvem (verde/amarelo/azul e alternador de teste offline).

## Technical Context

**Language/Version**: TypeScript 5.9+ / React 19 / React Native 0.86  
**Primary Dependencies**: Expo SDK 57, Expo Router, NativeWind v4, Tailwind CSS 3.4, Drizzle ORM, `expo-sqlite`, `date-fns`, `lucide-react-native`, `react-native-svg`  
**Storage**: SQLite local (`expo-sqlite` + Drizzle ORM) com persistência offline absoluta  
**Testing**: Jest para testes unitários em `src/domain/` e testes de componentes  
**Target Platform**: Mobile Android prioritário (incluindo aparelhos de entrada 2-3GB RAM) e iOS via Expo CNG  
**Project Type**: Mobile Application (React Native / Expo)  
**Performance Goals**: Recálculo da data ativa e re-renderização em < 100ms; consulta SQLite local em < 10ms; fluidez a 60 fps em Android de entrada  
**Constraints**: 100% Offline-First (Modo Curral sem bloqueios de rede); tema claro fixo de alto contraste (WCAG > 4.5:1, alvo 7:1); botões primários >= 56px; chaves UUID v4 geradas no cliente; LWW (Last-Write-Wins); exclusão lógica via `deleted_at`  
**Scale/Scope**: Rebanhos de ~200 animais por fazenda; suporte nativo a multi-fazenda via `farm_id` obrigatório  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio Constitucional | Verificação de Conformidade | Status |
| :--- | :--- | :---: |
| **I. Offline-First & Local-First** | Toda leitura e escrita da UI ocorre no SQLite local (`expo-sqlite` + Drizzle). Nenhuma chamada de rede bloqueia o app. | ✅ PASS |
| **II. Pure TypeScript Domain Engines** | Regras de data de manejo e avanço temporal isoladas em funções puras com `date-fns`, testadas via Jest sem React/SQLite. | ✅ PASS |
| **III. Rural Ergonomics & Accessibility** | Botões primários com `min-h-14` (56px), controles de `min-h-12` (48px) e cores de alto contraste sob luz solar direta. Sem dark mode na V1. | ✅ PASS |
| **IV. Strict Data Integrity & Multi-Tenant** | Todas as tabelas contêm `id` (UUID v4), `farm_id`, `created_at`, `updated_at`, `deleted_at` (soft delete) e regra LWW. Datas em formato `YYYY-MM-DD`. | ✅ PASS |
| **V. Continuous Native Generation (CNG)** | Sem alterações manuais em `ios/`/`android/`. Rotas em `src/app/` com Expo Router. `expo lint` e `tsc --noEmit` rigorosos. | ✅ PASS |

## Project Structure

### Documentation (this feature)

```text
specs/000-fundacao-offline/
├── plan.md              # Este arquivo (plano técnico de implementação)
├── research.md          # Pesquisa e decisões de arquitetura da Fase 0
├── data-model.md        # Especificação das entidades e tabelas SQLite da Fase 1
├── quickstart.md        # Guia de validação ponta a ponta da Fase 1
├── contracts/           # Contratos de componentes e banco de dados
│   ├── management-header-contract.md
│   └── db-client-contract.md
└── checklists/
    └── requirements.md  # Checklist de conformidade da especificação
```

### Source Code (repository root)

```text
src/
├── app/                              # Rotas e layout do Expo Router
│   ├── _layout.tsx                   # Layout global com provedores e cabeçalho
│   └── (tabs)/
│       ├── _layout.tsx               # Navegador inferior com as 4 abas
│       ├── hoje.tsx
│       ├── bezerras.tsx
│       ├── reproducao.tsx
│       └── ajustes.tsx
├── db/                               # SQLite local e Drizzle ORM
│   ├── client.ts                     # Conexão e inicialização com expo-sqlite
│   ├── schema/
│   │   ├── common.ts                 # UUID, farm_id, timestamps e soft delete
│   │   ├── farms.ts                  # Tabela farms
│   │   ├── settings.ts               # Tabela settings
│   │   └── sync.ts                   # Tabelas sync_queue e sync_state
│   └── repositories/
│       ├── settingsRepository.ts     # Repositório de configurações locais
│       └── syncQueueRepository.ts    # Repositório da fila de sync
├── domain/                           # Regras puras e manipulação de datas
│   ├── dateSimulation.ts             # Avanço temporal (+1d, +7d, +21d) e máscaras YYYY-MM-DD
│   └── syncState.ts                  # Consolidação dos estados visuais de sincronização
├── context/                          # Estados globais em React
│   ├── ManagementDateContext.tsx     # Provedor da data de manejo ativa
│   └── SyncStatusContext.tsx         # Provedor do estado de sync e simulação offline
├── ui/                               # Primitivas de interface de alta ergonomia rural
│   ├── Botao.tsx                     # Botão com altura mínima de 56px / 48px
│   ├── CampoNumerico.tsx             # Input numérico para brincos e litros
│   ├── Cartao.tsx                    # Card com borda e espaçamento nítido
│   ├── SeloStatus.tsx                # Badges de status coloridos
│   └── CabecalhoStatusSimulador.tsx  # Barra persistente de cabeçalho
└── __tests__/
    ├── domain/
    │   └── dateSimulation.test.ts
    └── db/
        └── schema.test.ts
```

**Structure Decision**: Adoção do padrão oficial do Expo Router (`src/app/`) mantendo toda a lógica de domínio, banco de dados, contextos e componentes fora do diretório de rotas, conforme preconizado pelo `AGENTS.md` e Constituição do Projeto.

## Complexity Tracking

*Nenhuma violação aos princípios constitucionais ou complexidade acidental identificada.*
