# Implementation Plan: Inseminação Rápida no Curral com Baixa de Doses, Projeções Reprodutivas e Alerta de Consanguinidade

**Branch**: `002-inseminacao-rapida` | **Date**: 2026-10-14 | **Spec**: [spec.md](file:///c:/DEV/github/repro-leite/specs/002-inseminacao-rapida/spec.md)

**Input**: Feature specification from `specs/002-inseminacao-rapida/spec.md`

## Summary

Esta feature implementa o fluxo operacional central do manejo reprodutivo bovino leiteiro:
1. **Modelagem e Persistência no SQLite Local (`src/db/`)**:
   - Criação das tabelas `inseminations` e `alerts` via Drizzle ORM, com índices por fazenda, data e origem.
   - Adição de campos de genealogia (`sire_id`, `sire_name`, etc.) em `animals` para rastreamento de filiação.
   - Transação atômica em `InseminationRepository`: inserção da IA, atualização de `repro_status` da vaca para `'inseminada'`, débito de 1 dose do touro no botijão (com suporte a estoque zerado e abastecimento rápido), geração dos alertas de retorno de cio (21d) e toque (45d), e registro na `sync_queue`.
2. **Motores de Domínio Zootécnico em TypeScript Puro (`src/domain/`)**:
   - `reproduction.ts`: Cálculo canônico das 4 datas zootécnicas (+21d cio, +45d toque, +282d parto, -60d secagem = +222d) em formato `YYYY-MM-DD` sem desvios de fuso horário, e algoritmo determinístico de restauração de status após exclusão.
   - `consanguinity.ts`: Verificação determinística de parentesco de 1º grau (pai) e 2º grau (avô materno/paterno).
3. **Primitivas Reutilizáveis de UI (`src/ui/`)**:
   - Implementação de 4 novos componentes no design system rural: `BannerAlerta`, `PainelProjecaoZootecnica`, `SeletorItemModal` e `BadgeEstoqueDoses`, todos com alvos táteis $\ge 48/56\text{ px}$ e alto contraste solar.
4. **Interface & Fluxo no Curral**:
   - Integração da seção `"Inseminar"` na aba Reprodução (`src/app/(tabs)/reproducao.tsx`).
   - Ações `"Confirmar e Concluir"` e `"Confirmar e Inseminar Outra"` (fluxo sequencial que reabre o seletor com touro e dados mantidos).
   - Atalho rápido `"Inseminar"` no cartão de vacas vazias/aptas da lista de rebanho.

---

## Technical Context

**Language/Version**: TypeScript 5.9+ / React 19 / React Native 0.86  
**Primary Dependencies**: Expo SDK 57, Expo Router, NativeWind v4, Tailwind CSS 3.4, Drizzle ORM, `expo-sqlite`, `date-fns`, `lucide-react-native`, `react-native-svg`  
**Storage**: SQLite local (`expo-sqlite` + Drizzle ORM) com persistência 100% offline e fila `sync_queue`  
**Testing**: Jest para testes unitários dos motores de domínio (`reproduction.test.ts`, `consanguinity.test.ts`) e testes de repositórios  
**Target Platform**: Mobile Android prioritário (incluindo aparelhos de entrada 2-3GB RAM) e iOS via Expo CNG  
**Project Type**: Mobile Application (React Native / Expo)  
**Performance Goals**: Cálculo instantâneo das 4 datas e verificação de consanguinidade em < 50ms; persistência atômica da IA e débito de estoque em < 25ms; fluidez a 60 fps sob toques rápidos no curral  
**Constraints**: 100% Offline-First (Modo Curral sem internet); tema claro fixo de alto contraste (WCAG > 4.5:1 / 7:1); botões primários com altura mínima de 56px (`min-h-14`) e secundários de 48px (`min-h-12`); chaves UUID v4; datas canônicas `YYYY-MM-DD`  
**Scale/Scope**: Fazendas com 50 a 1.000 fêmeas; suporte multi-fazenda via `farm_id` obrigatório  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio Constitucional | Verificação de Conformidade | Status |
| :--- | :--- | :---: |
| **I. Offline-First & Local-First** | Todos os lançamentos de IA, cálculos de datas, verificações de consanguinidade, débito de doses e geração de alertas ocorrem localmente no SQLite. Nenhuma chamada de rede síncrona é disparada na interface. | ✅ PASS |
| **II. Pure TypeScript Domain Engines** | Os cálculos de marcos reprodutivos (`reproduction.ts`) e a verificação de parentesco (`consanguinity.ts`) são funções puras em `src/domain/` testadas exaustivamente no Jest com zero dependências de React, Expo ou SQLite. | ✅ PASS |
| **III. Rural Ergonomics & Accessibility** | Botões primários com altura mínima de 56px (`min-h-14`), teclado numérico nativo para busca de brinco, alto contraste com paleta pasto/âmbar e 4 novas primitivas reutilizáveis padronizadas em `src/ui/`. | ✅ PASS |
| **IV. Strict Data Integrity & Multi-Tenant** | Todas as novas tabelas (`inseminations`, `alerts`) possuem `id` (UUID v4), `farm_id` (UUID), `created_at`, `updated_at`, `deleted_at` e datas biológicas em formato `YYYY-MM-DD` canônico. Operações registram mutações na `sync_queue`. | ✅ PASS |
| **V. Continuous Native Generation (CNG)** | Nenhuma alteração manual em pastas nativas `ios/` ou `android/`. Telas integradas no Expo Router (`src/app/`). Rigor com `npx expo lint` e `npx tsc --noEmit`. | ✅ PASS |

---

## Project Structure

### Documentation (this feature)

```text
specs/002-inseminacao-rapida/
├── plan.md              # Este arquivo (plano técnico de implementação)
├── research.md          # Pesquisa e decisões de arquitetura da Fase 0
├── data-model.md        # Especificação das entidades e tabelas SQLite da Fase 1
├── quickstart.md        # Guia de validação ponta a ponta da Fase 1
├── contracts/           # Contratos de interfaces, repositórios e componentes UI
│   ├── insemination-contract.md
│   └── ui-components-contract.md
└── checklists/
    └── requirements.md  # Checklist de qualidade da especificação
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (tabs)/
│       └── reproducao.tsx            # Seções 'rebanho' | 'touros' | 'inseminar'
├── components/
│   └── inseminacao/
│       ├── FormularioInseminacaoRapida.tsx # Formulário de 3 toques com preview de projeções
│       ├── HistoricoInseminacoesRecentes.tsx # Lista com ação de exclusão e estorno
│       └── ModalAbastecimentoDoses.tsx     # Diálogo de abastecimento rápido de sêmen
├── db/
│   ├── schema/
│   │   ├── animals.ts                # Adição de campos de filiação (sireId, sireName, etc.)
│   │   ├── inseminations.ts          # Tabela inseminations com projeções
│   │   ├── alerts.ts                 # Tabela alerts com marcos reprodutivos
│   │   └── index.ts                  # Re-exportação consolidada
│   └── repositories/
│       ├── inseminationRepository.ts # Repositório com transações atômicas e sync_queue
│       └── alertRepository.ts        # Repositório de alertas de manejo
├── domain/
│   ├── reproduction.ts               # Cálculo puro dos 4 marcos e restauração de status
│   └── consanguinity.ts              # Detecção determinística de consanguinidade 1º e 2º grau
├── types/
│   ├── insemination.ts               # Interfaces e DTOs de inseminação e projeções
│   └── alert.ts                      # Tipos de alertas zootécnicos
├── ui/
│   ├── BannerAlerta.tsx              # Nova primitiva de advertência rural
│   ├── PainelProjecaoZootecnica.tsx  # Nova primitiva de grid com os 4 marcos
│   ├── SeletorItemModal.tsx          # Nova primitiva de modal de seleção com busca ágil
│   ├── BadgeEstoqueDoses.tsx         # Nova primitiva de pílula de saldo de doses
│   └── index.ts                      # Re-exportação com os 4 novos componentes
└── __tests__/
    ├── domain/
    │   ├── reproduction.test.ts      # Testes dos 4 marcos e restauração de status
    │   └── consanguinity.test.ts     # Testes de consanguinidade pai x filha e avô x neta
    └── db/
        └── inseminationRepository.test.ts # Testes de persistência atômica e baixa de doses
```

**Structure Decision**: Segue rigorosamente a arquitetura em camadas do ReproLeite: regras de negócio puras isoladas em `src/domain/`, banco local Drizzle em `src/db/`, tipos canônicos em `src/types/`, design system rural atômico em `src/ui/` e telas em `src/app/` com componentes especializados em `src/components/inseminacao/`.

---

## Complexity Tracking

*Nenhuma violação aos princípios constitucionais ou complexidade desnecessária detectada. Todas as operações utilizam transações atômicas locais e componentes estáticos do NativeWind.*
