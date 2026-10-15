# Implementation Plan: 005-ajustes-e-backup

**Branch**: `005-ajustes-e-backup` | **Date**: 2026-10-15 | **Spec**: [spec.md](file:///c:/DEV/github/repro-leite/specs/005-ajustes-e-backup/spec.md)

**Input**: Feature specification from `specs/005-ajustes-e-backup/spec.md` (Ajustes da Fazenda, Parâmetros Zootécnicos, Exportação CSV de Rebanho e Bezerras, Backup JSON Offline para WhatsApp e Restauração Local).

---

## Summary

Implementar a infraestrutura de segurança e portabilidade offline de dados na aba **Ajustes** (`SettingsScreen`):
1. **Exportação Tabular CSV (Rebanho e Bezerras)**: Formatador de CSV com suporte nativo a Microsoft Excel/Google Planilhas (UTF-8 com BOM, delimitador `;`, datas e números localizados) para extração de listas reprodutivas e genealógicas de bezerras com GMD.
2. **Backup em 1 Toque para WhatsApp (JSON) e Área de Transferência**: Geração rápida de envelope estruturado de backup com metadados de integridade e acionamento da folha de compartilhamento nativa (`expo-sharing`) e cópia para o clipboard (`expo-clipboard`).
3. **Restauração de Backup JSON (Disaster Recovery)**: Validador de schema com transação atômica no SQLite para restauração sem corrupção e substituição limpa dos dados locais.
4. **Edição de Parâmetros Zootécnicos**: Modal para personalização de prazos da fazenda (janela de cio, toque, gestação, secagem e meta de peso de novilhas) com persistência na tabela `settings`.
5. **Decoupling Total de Nuvem**: Todas as rotinas operam 100% offline, preparando o terreno para a sincronização remota com Supabase na Feature 006.

---

## Technical Context

**Language/Version**: TypeScript 5.3+ (Strict Mode)  
**Primary Dependencies**: React Native (Expo SDK 57), Expo Router, NativeWind (Tailwind CSS), `lucide-react-native`, `expo-file-system`, `expo-sharing`, `expo-clipboard`, `expo-document-picker`, Drizzle ORM  
**Storage**: SQLite local via `expo-sqlite` (Drizzle ORM), tabela `settings` e tabelas de negócio (`animals`, `bulls`, `inseminations`, `weighings`, `alerts`)  
**Testing**: Jest (testes de formatação CSV pura, validação de schema JSON, use cases de backup/restauração e testes de contrato de repositório)  
**Target Platform**: Mobile (Android & iOS) via Expo CNG e Web  
**Project Type**: Mobile Application (Clean Architecture + Feature-First)  
**Performance Goals**: Geração de backup JSON $< 1\text{ s}$ para 500 animais; exportação CSV $< 500\text{ ms}$; restauração atômica $< 2\text{ s}$  
**Constraints**: 100% offline-first (zero dependência de rede em campo); feedback háptico em ações críticas; alvos de toque $\ge 48/56\text{ px}$  
**Scale/Scope**: Fazendas com centenas de cabeças de gado e milhares de registros de manejo reprodutivo e pesagens  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Offline-First & Local-First Architecture**: Todas as rotinas de backup, exportação e restauração operam exclusivamente sobre o banco SQLite local (`expo-sqlite` + Drizzle) sem chamada de rede.
- [x] **II. Pure TypeScript Domain Engines**: Formatador de CSV (`format-csv.ts`) e validador de schema de backup (`validate-backup.ts`) são funções determinísticas puras em `domain/` sem acoplamento a React ou Expo.
- [x] **III. Rural Ergonomics & Accessibility**: Botões principais de 56 px com feedback háptico (`hapticFeedback.selection`, `hapticFeedback.notification`), contraste visual nítido e textos de diálogo claros em pt-BR.
- [x] **IV. Strict Data Integrity & Multi-Tenant Partitioning**: O envelope de backup carrega o `farm_id` e IDs UUID v4; a restauração executa em transação atômica única com rollback integral em caso de falha.
- [x] **V. Continuous Native Generation (CNG) & Modern Expo Discipline**: Módulos Expo oficiais (`expo-file-system`, `expo-sharing`, `expo-clipboard`, `expo-document-picker`) instalados via `npx expo install`, sem autorar pastas nativas `ios/` ou `android/`.

---

## Project Structure

### Documentation (this feature)

```text
specs/005-ajustes-e-backup/
├── spec.md                  # Especificação funcional
├── plan.md                  # Este plano de arquitetura e implementação
├── research.md              # Pesquisa técnica de bibliotecas, CSV e backup
├── data-model.md            # Esquemas de dados do backup e exportação CSV
├── contracts/
│   └── backup-export-contract.md # Contratos de portas, use cases e serviços
├── checklists/
│   └── requirements.md      # Checklist de qualidade da especificação
└── quickstart.md            # Guia de validação ponta a ponta
```

### Source Code Layout

```text
src/
├── features/settings/
│   ├── domain/
│   │   ├── backup.types.ts                 # Tipagens do envelope de backup e metadados
│   │   ├── export.types.ts                 # Tipagens das linhas de CSV (Rebanho e Bezerras)
│   │   ├── backup.repository.ts            # Porta para persistência e coleta de dados
│   │   ├── file-share.service.ts           # Porta para sistema de arquivos e compartilhamento
│   │   ├── engines/
│   │   │   ├── format-csv.ts               # Motor puro: conversão para CSV com UTF-8 BOM e ";"
│   │   │   └── validate-backup.ts          # Motor puro: validação de integridade estrutural do JSON
│   │   └── __tests__/
│   │       ├── format-csv.test.ts
│   │       └── validate-backup.test.ts
│   ├── application/
│   │   ├── export-herd-csv.usecase.ts      # Use case: geração e compartilhamento de CSV do Rebanho
│   │   ├── export-calves-csv.usecase.ts    # Use case: geração e compartilhamento de CSV de Bezerras
│   │   ├── export-whatsapp-backup.usecase.ts # Use case: exportação de JSON para WhatsApp
│   │   ├── copy-backup.usecase.ts          # Use case: cópia de JSON para área de transferência
│   │   ├── restore-backup.usecase.ts       # Use case: restauração atômica no SQLite
│   │   └── __tests__/
│   │       ├── export-herd-csv.usecase.test.ts
│   │       ├── export-whatsapp-backup.usecase.test.ts
│   │       └── restore-backup.usecase.test.ts
│   ├── infra/
│   │   ├── backup.sqlite.repository.ts     # Implementação SQLite do port BackupRepository
│   │   ├── expo-file-share.service.ts      # Implementação do port com expo-file-system e expo-sharing
│   │   └── __tests__/
│   │       └── backup.sqlite.repository.test.ts
│   ├── presentation/
│   │   ├── components/
│   │   │   ├── EditSettingsModal.tsx       # Modal de edição dos parâmetros zootécnicos
│   │   │   └── RestoreConfirmModal.tsx     # Modal de confirmação e resumo de restauração
│   │   ├── hooks/
│   │   │   ├── useSettings.ts              # Hook existente atualizado
│   │   │   └── useBackupExport.ts          # Hook para acionamento das ações de export/backup
│   │   └── screens/
│   │       └── SettingsScreen.tsx          # Tela de Ajustes conectada aos novos use cases
│   ├── factory.ts                          # Factory com instanciação dos novos use cases
│   └── index.ts                            # API pública do módulo settings
```

---

## Complexity Tracking

*Nenhuma violação aos princípios constitucionais. A arquitetura mantém dependências estritamente unidirecionais e isolamento de portas e adaptadores.*
