# Implementation Plan: Hoje no Curral (Painel Diário de Decisões, Monitoramento de Cios, Toques Veterinários e Trato de Bezerras)

**Branch**: `003-hoje-no-curral` | **Date**: 2026-10-14 | **Spec**: [spec.md](file:///c:/DEV/github/repro-leite/specs/003-hoje-no-curral/spec.md)

**Input**: Feature specification from `specs/003-hoje-no-curral/spec.md`

---

## Summary

Esta feature implementa o centro operacional e executivo diário da fazenda leiteira na aba **"Hoje"** (`features/today`):
1. **Quadro de Cios para Vigiar (Janela de 21 dias)**:
   - Apresenta vacas na janela zootécnica de 18 a 24 dias pós-IA e tarefas em atraso.
   - Ação em 1 toque **"Não Repetiu"**: conclui o alerta de 21 dias, mantém a vaca como `inseminada` e preserva o exame de toque agendado aos 45 dias.
   - Ação em 1 toque **"Repetiu o Cio"**: aciona o modal `RepeatHeatModal` permitindo ao usuário escolher entre *"Re-inseminar Agora"* (redirecionando para a aba de Inseminação Rápida com a fêmea pré-carregada) ou *"Apenas Marcar Cio / Vazia"*, ambas encerrando a IA anterior como vazia.
2. **Quadro de Toques Veterinários (45 a 60 dias)**:
   - Apresenta fêmeas aguardando diagnóstico gestacional na janela de 45 a 60 dias ou em atraso.
   - Ação em 1 toque **"Confirmar Prenhez"**: transação atômica que altera o status do animal para `prenhe`, resultado da IA para `prenhe`, conclui o alerta de toque e consolida as previsões de secagem e parto.
   - Ação em 1 toque **"Vazia"**: transação atômica que altera o status da vaca para `vazia`, resultado da IA para `vazia`, conclui o alerta de toque e cancela/exclui alertas futuros daquela inseminação.
3. **Quadro do Bezerreiro (Trato de Hoje)**:
   - Indicador consolidado de volume de leite a fornecer no dia (**Litros da Manhã** e **Litros da Tarde**), somando a demanda biológica de todas as bezerras vivas da fazenda pela curva nutricional oficial.
   - Componente expansível (gaveta) destacando a relação de bezerras em fase de corte progressivo (101 a 121 dias) ou com mudança de etapa na semana.
4. **Painel Diário Executivo & Ações Rápidas**:
   - Cabeçalho dinâmico integrado a `useManagementDate` (data real ou simulada), contadores vivos de pendências e atalhos rápidos para as rotinas do curral.
5. **Arquitetura Clean + Feature-First (Offline-First)**:
   - `src/features/today/` atua como a camada de orquestração e composição autorizada pelas regras do projeto, consumindo `@features/alerts`, `@features/herd`, `@features/insemination` e `@features/calves` exclusivamente através de seus pontos de entrada públicos (`index.ts`).

---

## Technical Context

**Language/Version**: TypeScript 5.9+ / React 19 / React Native 0.86  
**Primary Dependencies**: Expo SDK 57, Expo Router, NativeWind v4, Tailwind CSS 3.4, Drizzle ORM, `expo-sqlite`, `lucide-react-native`, `react-native-svg`  
**Storage**: SQLite local persistente (`expo-sqlite` + Drizzle ORM) com outbox (`sync_queue`) transacional  
**Testing**: Jest + `@testing-library/react-native` para testes de use cases, funções puras de domínio e componentes de apresentação  
**Target Platform**: Mobile Android prioritário (inclusive aparelhos modestos em curral) e iOS via Expo Continuous Native Generation (CNG)  
**Project Type**: Mobile Application (Offline-First)  
**Performance Goals**: Carregamento do painel e consolidação dos contadores em < 300ms a partir do SQLite local; resolução de ações de 1 toque em < 100ms; fluidez constante a 60 fps sob luz solar  
**Constraints**: 100% Offline-First (zero chamadas de rede na UI); alvos táteis mínimos de 48 dp (56 dp para botões primários); contraste WCAG > 4.5:1; datas no formato canônico `YYYY-MM-DD` sem desvios de fuso  
**Scale/Scope**: Rebanhos com 50 a 1.000 cabeças; multi-tenant estrito via `farm_id` obrigatório  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio Constitucional | Verificação de Conformidade | Status |
| :--- | :--- | :---: |
| **I. Offline-First & Local-First** | Todas as leituras e decisões operacionais ocorrem no SQLite local. Mutações são gravadas com a fila de outbox na mesma transação (`withTransaction`). Nenhuma ação na UI depende de rede. | ✅ PASS |
| **II. Pure TypeScript Domain Engines** | O cálculo de agregação de leite (`calculateDailyFeedingSummary`) e as validações de janela zootécnica de 21d e 45d são funções puras em TypeScript, 100% testadas sem dependência de UI ou SQLite. | ✅ PASS |
| **III. Rural Ergonomics & Accessibility** | Botões primários de confirmação e ações em 1 toque têm altura mínima de 48px/56px, cores semânticas de alto contraste, feedback háptico em todas as ações e design legível sob sol intenso. | ✅ PASS |
| **IV. Strict Data Integrity & Multi-Tenant** | Todas as alterações em `animals`, `inseminations` e `alerts` respeitam `farm_id` UUID, timestamps UTC e soft delete para integridade de sincronização futura. | ✅ PASS |
| **V. Continuous Native Generation (CNG)** | Nenhuma alteração em diretórios nativos. Rotas centralizadas estritamente em `src/app/`. Zero dependências nativas não gerenciadas pelo Expo SDK. | ✅ PASS |

---

## Project Structure

### Documentation (this feature)

```text
specs/003-hoje-no-curral/
├── plan.md              # Este arquivo (plano técnico de implementação)
├── research.md          # Pesquisa e decisões de arquitetura da Fase 0
├── data-model.md        # Especificação das entidades e tabelas SQLite da Fase 1
├── quickstart.md        # Guia de validação ponta a ponta da Fase 1
├── contracts/           # Contratos de interfaces e use cases
│   └── today-actions-contract.md
└── checklists/
    └── requirements.md  # Checklist de qualidade da especificação
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (tabs)/
│       └── index.tsx                         # Rota "Hoje" (renderiza TodayScreen)
├── features/
│   ├── today/
│   │   ├── domain/                           # Regras puras e agregações diárias
│   │   │   ├── today.types.ts                # Interfaces de agregação diária
│   │   │   └── today-filters.ts              # Janelas zootécnicas de 21d e 45d
│   │   ├── application/                      # Use cases de orquestração de curral
│   │   │   ├── get-today-dashboard.usecase.ts# Consolida cios, toques e bezerras
│   │   │   ├── confirm-heat-choice.usecase.ts# Ações "Não Repetiu" e "Repetiu o Cio"
│   │   │   └── record-pregnancy-touch.usecase.ts # Diagnóstico prenhe / vazia
│   │   ├── presentation/
│   │   │   ├── components/
│   │   │   │   ├── HeatCheckListCard.tsx     # Quadro de Cios para Vigiar (21d)
│   │   │   │   ├── PregnancyCheckListCard.tsx# Quadro de Toques Veterinários (45d)
│   │   │   │   ├── CalfFeedingCard.tsx       # Quadro do Bezerreiro (expansível)
│   │   │   │   ├── RepeatHeatModal.tsx       # Modal de decisão rápida pós-cio
│   │   │   │   ├── DailySummaryCard.tsx      # Contadores vivos integrados
│   │   │   │   └── QuickActionsCard.tsx      # Atalhos rápidos de curral
│   │   │   ├── hooks/
│   │   │   │   ├── useTodayDashboard.ts      # Carregamento reativo do painel
│   │   │   │   └── useTodayActions.ts        # Handlers de ações táteis
│   │   │   └── screens/
│   │   │       └── TodayScreen.tsx           # Tela completa consolidada
│   │   ├── factory.ts                        # Injeção e instanciação de use cases
│   │   └── index.ts                          # Ponto de entrada público da feature
│   ├── alerts/                               # Feature de alertas zootécnicos
│   ├── herd/                                 # Feature de animais e rebanho
│   ├── insemination/                         # Feature de IA rápida
│   └── calves/                               # Feature de nutrição e aleitamento
└── ui/                                       # Design System (Screen, Cartao, Botao, SeloStatus, etc.)
```

**Structure Decision**: A feature `today` segue rigorosamente o padrão Clean Architecture + Feature-First. Como é a funcionalidade de composição diária do aplicativo, consome os módulos especializados através de suas interfaces públicas (`index.ts`) e implementa use cases transacionais dedicados para garantir a atomicidade das decisões de curral.

---

## Complexity Tracking

> *Nenhuma violação identificada. O plano adere 100% aos princípios da constituição e às regras do projeto.*

| Item | Avaliação | Decisão |
| :--- | :--- | :--- |
| Composição entre features | Autorizada explicitamente em `.agents/rules/project-architecture.md` (Seção 3) para `features/today/` | Mantido em use cases dedicados da feature `today` |
| Transações atômicas | `DrizzleTransactionRunner` + `OutboxRepository` | Garantia de integridade offline e mutações seguras |
