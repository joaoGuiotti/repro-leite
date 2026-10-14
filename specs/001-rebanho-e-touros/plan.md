# Implementation Plan: Rebanho & Catálogo de Touros com Estoque de Doses e Política de Brinco

**Branch**: `001-rebanho-e-touros` | **Date**: 2026-10-14 | **Spec**: [spec.md](file:///c:/DEV/github/repro-leite/specs/001-rebanho-e-touros/spec.md)

**Input**: Feature specification from `specs/001-rebanho-e-touros/spec.md`

## Summary

Esta feature implementa o módulo cadastral e operacional do rebanho e reprodutores:
1. **Modelagem Relacional e Persistência SQLite**: Criação das tabelas `animals` e `bulls` via Drizzle ORM, com índice único parcial em `(farm_id, ear_tag_normalized)` para animais ativos, campos multi-tenant (`farm_id`), chaves UUID v4 e fila de sincronização (`sync_queue`).
2. **Motores de Domínio Puro (`src/domain/`)**: Normalização de brinco e política determinística de reuso (bloqueio de ativos vs alerta amarelo para inativos/excluídos em `earTag.ts`), filtragem zootécnica com exclusão automática de machos em filtros específicos de fêmeas (`animalFilters.ts`) e controle de estoque de palhetas de sêmen sem saldo negativo (`bullStock.ts`).
3. **Repositórios Locais**: `AnimalRepository` e `BullRepository` com operações atômicas que registram mutações na `sync_queue`.
4. **Interface & Ergonomia Rural**: Tela "Reprodução" (`src/app/(tabs)/reproducao/index.tsx`) com seletor segmentado entre "Rebanho" e "Touros", listagem instantânea com busca numérica por brinco, pílulas de filtro reprodutivo, modais de cadastro ágil com validação em tempo real e ajuste rápido de doses de sêmen.

## Technical Context

**Language/Version**: TypeScript 5.9+ / React 19 / React Native 0.86  
**Primary Dependencies**: Expo SDK 57, Expo Router, NativeWind v4, Tailwind CSS 3.4, Drizzle ORM, `expo-sqlite`, `date-fns`, `lucide-react-native`, `react-native-svg`  
**Storage**: SQLite local (`expo-sqlite` + Drizzle ORM) com índice único parcial e persistência 100% offline  
**Testing**: Jest para testes unitários dos motores puros em `src/domain/` e testes de esquemas/repositórios  
**Target Platform**: Mobile Android prioritário (incluindo aparelhos de entrada 2-3GB RAM) e iOS via Expo CNG  
**Project Type**: Mobile Application (React Native / Expo)  
**Performance Goals**: Filtragem e busca em memória em < 200ms para rebanhos de 500+ animais; persistência SQLite em < 20ms; fluidez a 60 fps em Android de entrada  
**Constraints**: 100% Offline-First; tema claro fixo de alto contraste (WCAG > 4.5:1); botões primários com altura mínima de 56px (`min-h-14`); chaves UUID v4 geradas no cliente; LWW (Last-Write-Wins); exclusão lógica via `deleted_at`; transações atômicas com `sync_queue`  
**Scale/Scope**: Rebanhos de ~200 a 1.000 animais por fazenda; suporte a multi-fazenda via `farm_id` obrigatório  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio Constitucional | Verificação de Conformidade | Status |
| :--- | :--- | :---: |
| **I. Offline-First & Local-First** | Todas as ações de cadastro de animais, inativação, reativação, ajuste de estoque de sêmen e consultas executam localmente no SQLite. Nenhuma dependência de rede na UI. | ✅ PASS |
| **II. Pure TypeScript Domain Engines** | Regras de normalização de brinco, política de reuso, filtragem de animais e controle de estoque de doses isoladas em `src/domain/` com testes unitários no Jest sem React/SQLite. | ✅ PASS |
| **III. Rural Ergonomics & Accessibility** | Botões primários com `min-h-14` (56px), entradas de brinco e doses usando teclado numérico (`CampoNumerico`), alto contraste e selos visuais legíveis sob luz solar. | ✅ PASS |
| **IV. Strict Data Integrity & Multi-Tenant** | Todas as tabelas possuem `id` (UUID v4), `farm_id`, `created_at`, `updated_at`, `deleted_at` e registro automático em `sync_queue`. Datas em formato canônico `YYYY-MM-DD`. | ✅ PASS |
| **V. Continuous Native Generation (CNG)** | Sem código nativo manual em `ios/`/`android/`. Telas integradas no Expo Router (`src/app/`). `expo lint` e `tsc --noEmit` rigorosos. | ✅ PASS |

## Project Structure

### Documentation (this feature)

```text
specs/001-rebanho-e-touros/
├── plan.md              # Este arquivo (plano técnico de implementação)
├── research.md          # Pesquisa e decisões de arquitetura da Fase 0
├── data-model.md        # Especificação das entidades e tabelas SQLite da Fase 1
├── quickstart.md        # Guia de validação ponta a ponta da Fase 1
├── contracts/           # Contratos de interfaces, repositórios e motores
│   ├── herd-contract.md
│   └── bulls-contract.md
└── checklists/
    └── requirements.md  # Checklist de qualidade da especificação
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (tabs)/
│       └── reproducao/
│           └── index.tsx             # Aba Rebanho & Touros com busca, filtros e catálogo
├── db/
│   ├── schema/
│   │   ├── common.ts                 # BaseEntity e commonColumns
│   │   ├── farms.ts                  # Tabela farms
│   │   ├── animals.ts                # Tabela animals com índice único parcial
│   │   ├── bulls.ts                  # Tabela bulls
│   │   ├── settings.ts               # Tabela settings
│   │   ├── sync.ts                   # Tabelas sync_queue e sync_state
│   │   └── index.ts                  # Exportação consolidada de schemas
│   └── repositories/
│       ├── animalRepository.ts       # Repositório de animais com gravação na sync_queue
│       └── bullRepository.ts         # Repositório de touros com ajuste de doses
├── domain/
│   ├── earTag.ts                     # Normalização de brinco e política de reuso
│   ├── animalFilters.ts              # Filtragem por brinco, nome, status e sexo
│   └── bullStock.ts                  # Ajuste e validação de estoque de palhetas
├── types/
│   ├── animal.ts                     # Tipos e interfaces de animais
│   └── bull.ts                       # Tipos e interfaces de touros
├── ui/
│   ├── Botao.tsx
│   ├── CampoNumerico.tsx
│   ├── Cartao.tsx
│   ├── SeloStatus.tsx
│   └── CabecalhoStatusSimulador.tsx
└── __tests__/
    ├── domain/
    │   ├── earTag.test.ts            # Testes de normalização e política de reuso
    │   ├── animalFilters.test.ts     # Testes de filtros de rebanho e exclusão de machos
    │   └── bullStock.test.ts         # Testes de estoque de doses de sêmen
    └── db/
        └── schema.test.ts            # Testes de integridade das tabelas animals e bulls
```

**Structure Decision**: Adoção estrita da arquitetura modular do ReproLeite: regras de negócio puras em `src/domain/`, esquemas e repositórios em `src/db/`, tipos em `src/types/` e interface em `src/app/` e `src/ui/`.

## Complexity Tracking

*Nenhuma violação aos princípios constitucionais ou complexidade desnecessária detectada.*
