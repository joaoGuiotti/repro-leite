<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0
Modified principles:
- I. Offline-First & Local-First Architecture (Updated: atomic transaction with outbox, reactive queries, strict UI read isolation)
- II. Pure TypeScript Domain Engines (Deterministic & Test-First) → II. Clean Architecture & Pure TypeScript Domain Engines (Updated: formal dependency rules, Result<T, AppError>, port/adapter boundaries, event-based movements)
- III. Rural Ergonomics & Accessibility → III. Rural Ergonomics, Semantic Tokens & Lucide Iconography (Updated: semantic design tokens, light & dark mode support, standardized Lucide wrapper)
- IV. Strict Data Integrity & Multi-Tenant Partitioning → IV. Strict Data Integrity, Multi-Tenant Partitioning & Tombstones (Updated: UUID generation, strict soft-deletes, LWW conflict resolution)
- V. Continuous Native Generation (CNG) & Modern Expo Discipline → Renumbered to VI
Added principles:
- V. Cloud Backend Isolation & Secure Authentication (Supabase Behind Ports)
Added sections/rules:
- Formal Clean Architecture dependency rules table
- Explicit test coverage thresholds (domain ≥ 90%, application ≥ 80%)
- Pre-completion mandatory validation gates
Removed sections:
- None
Follow-up TODOs:
- None
-->

# ReproLeite Constitution

## Core Principles

### I. Offline-First & Local-First Architecture
Every user interaction and state change MUST read and write against the local SQLite database (`expo-sqlite` with Drizzle ORM) as the single local source of truth. Under no circumstance may UI responsiveness or data operations depend on an active internet connection.
- **Strict UI Read Isolation**: The user interface reads exclusively from the local SQLite database. Direct data fetches from external HTTP endpoints or cloud SDKs into presentation screens or hooks are strictly prohibited.
- **Atomic Mutation + Outbox Transaction**: Every syncable write operation MUST execute within the same atomic database transaction (`withTransaction`): saving the entity state and enqueueing the mutation into the outbox (`outbox.enqueue`) with a unique `operation_id`.
- **Reactive UI Queries**: Presentation hooks MUST utilize reactive SQLite queries (`useLiveQuery`) so that local changes and background synchronization pulls immediately reflect in the interface without manual re-fetching.
- **Resilient Background Sync**: Synchronization with cloud backends MUST run asynchronously in the background. Network errors or offline states MUST NOT trigger blocking alerts or impede record creation and browsing.
- *Rationale*: Dairy farm environments (milking parlors, calf pens, pastures) routinely have unreliable or absent cellular/Wi-Fi connectivity. The system must guarantee operational continuity in all conditions without data loss.

### II. Clean Architecture & Pure TypeScript Domain Engines
The codebase strictly adheres to Feature-First Clean Architecture with explicit dependency direction: `presentation → application → domain ← infra`.
- **Pure Domain Isolation**: All agricultural, reproductive, and nutritional logic MUST reside in `domain/` as pure, deterministic TypeScript entities, value objects, and rules with zero dependencies on React, Expo, SQLite, Drizzle, Supabase, or native device APIs.
- **Ports & Adapters**: Domain models declare repository and remote gateway interfaces (ports). Implementations reside strictly in `infra/` and are bound via Dependency Injection (`core/di/`). Instantiating repositories or use cases directly inside screens or hooks is strictly prohibited.
- **Deterministic Results over Exceptions**: Domain rules and use cases MUST return deterministic `Result<T, AppError>` types; throwing exceptions for expected business rule violations is forbidden.
- **Immutable Metric Movements**: Inventory and biological balances (such as semen doses and weight deltas) MUST be registered as immutable transactional movements rather than overwriting raw values.
- **Public Feature Barrels**: Cross-feature communication MUST occur exclusively through the target feature's public API barrel (`features/<feature>/index.ts`). Importing internal files of another feature is an architectural violation.
- *Rationale*: Isolating business rules from frameworks and storage mechanisms ensures 100% testability, deterministic biological calculations, and resilience against UI or library upgrades.

### III. Rural Ergonomics, Semantic Tokens & Lucide Iconography
User interfaces MUST be specifically designed for outdoor field operation under harsh environmental and lighting conditions.
- **Ergonomic Touch Targets**: Primary action buttons MUST have a minimum height of 56 px (`min-h-14`) and secondary interactive controls MUST be at least 48 px (`min-h-12`) to support reliable interaction with gloved hands or while walking in the field.
- **Semantic Design Tokens**: Styling MUST be declared exclusively via NativeWind (`className`) using semantic design tokens from `tailwind.config.js` (`bg-surface`, `text-on-surface`, `bg-danger`, `bg-warning`, `bg-success`, `bg-sync-pending`). Raw hex color literals (`#hex`) and arbitrary pixel measurements in feature components are prohibited.
- **High Contrast & Dark Mode**: Interfaces MUST maintain high contrast (minimum 4.5:1, target 7:1 for critical text) to guarantee legibility under direct sunlight. All new components MUST support both Light Mode and Dark Mode via semantic tokens and `dark:` modifiers.
- **Standardized Iconography**: The icon system MUST strictly and exclusively use `lucide-react-native` (via `react-native-svg`) rendered through the `ui/primitives/Icon.tsx` wrapper. Mixing with `@expo/vector-icons`, raw SVGs, emojis, or PNG images as UI icons is strictly forbidden.
- **Accessible Status & Inputs**: Status indicators MUST NEVER rely solely on color; they MUST combine semantic color with explicit text or icon cues (`SeloStatus`). Input fields for ear tags (`brinco`), milk volumes, and weights MUST default to numeric keypads.
- *Rationale*: Field operators interact with the app in direct sunlight, frequently while standing, walking, or wearing protective gear, requiring distinct visual cues, error-tolerant touch targets, and standardized feedback.

### IV. Strict Data Integrity, Multi-Tenant Partitioning & Tombstones
All persistent entities MUST adhere to standardized relational schemas designed for conflict-free distributed synchronization:
- **Client-Generated UUIDs**: All entity IDs MUST be client-generated UUID strings (UUID v4/v7), eliminating key collisions when multiple devices record data offline simultaneously.
- **Multi-Tenant Partitioning**: Every business table MUST include a non-nullable `farm_id` (UUID) to guarantee multi-tenant tenant isolation from inception, reinforced by Row Level Security (RLS) on remote storage.
- **Canonical Date Representation**: Biological management dates (birth dates, inseminations, palpations, dry-off dates) MUST be persisted as canonical ISO `YYYY-MM-DD` strings without timestamps or timezones to prevent timezone skew.
- **UTC Audit Timestamps**: Audit timestamps (`created_at`, `updated_at`) MUST be recorded in UTC ISO 8601 strings.
- **Soft Deletion & Tombstones**: Physical `DELETE` operations on syncable tables are strictly prohibited. Deletions MUST utilize soft deletion (`deleted_at IS NOT NULL`) to preserve synchronization tombstones across devices.
- **Deterministic Conflict Resolution**: Distributed conflicts MUST resolve using a deterministic Last-Write-Wins (LWW) strategy based on `updated_at`, with domain-specific conflict rules (such as ear tag reuse/collisions) explicitly tracked.
- *Rationale*: Asynchronous distributed synchronization across multiple mobile devices requires stable identification, predictable date handling without daylight saving distortions, and reliable tombstone tracking.

### V. Cloud Backend Isolation & Secure Authentication (Supabase Behind Ports)
The cloud backend serves exclusively as an asynchronous backup, synchronization, and multi-user collaboration layer.
- **Port-Backed SDK Encapsulation**: Supabase MUST remain strictly encapsulated behind domain ports (`*RemoteGateway`) and infrastructure adapters (`infra/*.remote.ts`). No code outside `infra/` and `core/network|sync` may import or reference `@supabase/supabase-js`.
- **Secure Token Storage**: Authentication tokens and session secrets MUST be persisted in `expo-secure-store`, NEVER in `AsyncStorage` or SQLite.
- **Restricted Client Credentials**: Only public anon keys (`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`) are permitted in client configurations. The `service_role` key MUST NEVER be embedded or referenced in client applications.
- **Acesso Imediato no Curral**: The application MUST launch and remain 100% operational in offline mode without requiring authentication. Cloud login (email OTP) serves solely to activate cloud backup and multi-device synchronization in the background.
- *Rationale*: Protects client security credentials, prevents cloud outages from disrupting on-farm livestock operations, and allows backend evolution without impacting core domain logic.

### VI. Continuous Native Generation (CNG) & Modern Expo Discipline
The codebase MUST strictly adhere to Expo Continuous Native Generation (CNG) and modern Expo Router standards:
- **Zero Native Directory Modification**: The `ios/` and `android/` native directories are generated artifacts and MUST NEVER be manually authored or committed to version control. All native capabilities, permissions, and configurations MUST be declared via `app.json` and Expo config plugins.
- **SDK-Compatible Package Management**: Dependencies MUST be installed using `npx expo install` (or `bunx expo install` when Bun lockfile is present) to guarantee SDK compatibility.
- **Thin Route Architecture**: Application routing MUST reside strictly in `src/app/` using Expo Router file-based conventions. Routes MUST remain thin wrappers that render feature screen components (`<XScreen />`) without housing business logic or direct database queries.
- *Rationale*: Respecting CNG and Expo SDK version resolution eliminates configuration drift, native module divergence, and upgrade friction across development and cloud builds (EAS).

## Technology Stack & Architectural Standards

The project is governed by the following technical choices:
- **Client Runtime**: React Native on Expo SDK (development build profile and Continuous Native Generation).
- **Navigation & Routing**: Expo Router with typed file-based routes in `src/app/`.
- **Styling & Design System**: NativeWind (Tailwind CSS) using centralized tokens in `tailwind.config.js`. Classes MUST be static and declared through semantic UI primitives in `src/ui/`. Dynamic string concatenation of class names is strictly prohibited.
- **Iconography**: `lucide-react-native` exclusively, wrapped via `ui/primitives/Icon.tsx`.
- **Local Persistence**: `expo-sqlite` managed via Drizzle ORM with versioned schema migrations.
- **Cloud Backend**: Supabase (PostgreSQL with Row Level Security, Auth OTP, and automated storage).
- **Network State**: `@react-native-community/netinfo` or `expo-network` abstracted behind network ports in `core/network/`.
- **Language & Locale**: TypeScript with strict mode (`strict: true`); UI language fixed to Brazilian Portuguese (`pt-BR`).

### Clean Architecture Dependency Matrix

```
presentation → application → domain ← infra
```

| Camada | Pode importar | Proibido importar |
|---|---|---|
| `domain` | `domain` da mesma feature, `core/result`, `core/utils` | React, Drizzle, expo-*, Supabase, outras camadas |
| `application` | `domain` (ports/tipos), `core/result` | `infra`, `presentation`, SQLite, UI |
| `infra` | `domain`, `core/db`, `core/sync`, `core/network` | `presentation`, `application`, UI |
| `presentation` | `application`, `ui`, `core`, tipos do `domain` | `infra` diretamente |
| `features/A` → `features/B` | Apenas `features/B/index.ts` | Arquivos internos de B |
| `core` | Outros módulos `core`, `core/utils` | `features`, `ui` |
| `ui` | `ui`, `core/utils` | `features`, `core/db`, `core/sync` |

## Development Workflow & Quality Gates

All development activities MUST adhere to the following workflow gates:
- **TDD for Domain Rules**: Pure calculation functions and domain rules MUST have automated test suites validating edge dates, leap years, negative deltas, and business thresholds before feature completion.
- **Coverage Minimums**: Domain layer coverage MUST maintain ≥ 90%; application use case layer coverage MUST maintain ≥ 80%.
- **Database Schema Migrations**: All changes to SQLite schema tables MUST be scripted through versioned migration files; direct manual schema alterations are prohibited.
- **Syncable Write Pattern**: Every syncable write must use a transactional use case orchestrating repository save and outbox enqueue in the same transaction.
- **Pre-Completion Validation Gates**: Prior to declaring any task or feature complete, the following checks MUST pass with 0 errors:
  1. `npx tsc --noEmit` (TypeScript typecheck).
  2. `npm test` or `npx jest` (Full unit & integration test suite).
  3. `npx eslint .` or `npx expo lint` (Linting and Clean Architecture boundary rules).
  4. No raw untyped SQL queries bypassing repository/ORM boundaries.
  5. No raw `console.log` statements in production domain code.

## Governance

This Constitution represents the supreme architectural and quality charter for the ReproLeite codebase:
- **Precedence**: The rules and principles codified here supersede informal practices, ad-hoc convenience, or third-party boilerplate recommendations.
- **Amendment Process**: Amendments to this document require:
  1. Documented justification explaining the operational, architectural, or domain necessity.
  2. Analysis of backward compatibility with existing SQLite schemas and local device data.
  3. Version increment according to the versioning policy below.
- **Versioning Policy**:
  - **MAJOR** version bumps occur when fundamental principles are removed or redefined (e.g., transition from offline-first to online-only, ORM replacement).
  - **MINOR** version bumps occur when new principles, quality gates, or architectural layers are added.
  - **PATCH** version bumps occur for wording clarifications, typo fixes, or non-semantic structural refinements.
- **Compliance**: All code reviews, automated agent workflows, and pull requests MUST verify compliance with this Constitution before approval and merge.

**Version**: 1.1.0 | **Ratified**: 2026-10-13 | **Last Amended**: 2026-10-16
