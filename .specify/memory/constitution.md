<!--
SYNC IMPACT REPORT
==================
Version change: Template Initial → 1.0.0
Modified principles:
- [PRINCIPLE_1_NAME] → I. Offline-First & Local-First Architecture
- [PRINCIPLE_2_NAME] → II. Pure TypeScript Domain Engines (Deterministic & Test-First)
- [PRINCIPLE_3_NAME] → III. Rural Ergonomics & Accessibility
- [PRINCIPLE_4_NAME] → IV. Strict Data Integrity & Multi-Tenant Partitioning
- [PRINCIPLE_5_NAME] → V. Continuous Native Generation (CNG) & Modern Expo Discipline
Added sections:
- Technology Stack & Architectural Standards
- Development Workflow & Quality Gates
- Governance
Removed sections:
- None
Follow-up TODOs:
- None
-->

# ReproLeite Constitution

## Core Principles

### I. Offline-First & Local-First Architecture
Every user interaction and state change MUST read and write against the local SQLite database (`expo-sqlite` with Drizzle ORM) as the single local source of truth. Under no circumstance may UI responsiveness or data operations depend on an active internet connection.
- Cloud synchronization with Supabase MUST execute asynchronously in the background using an explicit pending mutations queue (`sync_queue`) and incremental pulls.
- Network errors or offline states MUST NOT trigger blocking alerts or impede record creation and browsing.
- *Rationale*: Dairy farm environments (milking parlors, calf pens, pastures) routinely have unreliable or absent cellular/Wi-Fi connectivity. The system must guarantee operational continuity in all conditions.

### II. Pure TypeScript Domain Engines (Deterministic & Test-First)
All agricultural, reproductive, and nutritional logic MUST be implemented as pure, deterministic TypeScript functions in `src/domain/` with zero dependencies on React, Expo, SQLite, or device APIs.
- Domain engines include: reproductive milestones (heat return at 21 days, pregnancy diagnosis/palpation at 45 days, expected calving at 282 days, dry-off at calving minus 60 days), calf suckling/weaning phase transitions and daily milk allotments, average daily weight gain (GMD) with breeding eligibility thresholds, and consanguinity checking.
- Every domain calculation and transition rule MUST have unit tests written and verified before feature integration.
- *Rationale*: Reproductive scheduling and nutritional plans directly impact herd health and farm economics; isolating domain logic ensures 100% testability, deterministic behavior, and resilience against UI or framework updates.

### III. Rural Ergonomics & Accessibility
User interfaces MUST be specifically designed for outdoor field operation under harsh environmental conditions.
- Primary action buttons MUST have a minimum height of 56 px (`min-h-14`) and secondary interactive controls MUST be at least 48 px (`min-h-12`).
- The color scheme MUST maintain high contrast (minimum 4.5:1, target 7:1 for critical text) using curated design tokens (pasture green `#1b4332`, earth tones, amber alert highlights) over light backgrounds. V1 MUST operate in fixed light mode without dark mode variants to ensure legibility under intense sunlight.
- Data input fields for ear tags (`brinco`) and milk volumes MUST default to numeric keypads, minimizing typing friction.
- *Rationale*: Field operators interact with the app in direct sunlight, frequently while standing, walking, or wearing protective gear, requiring distinct visual cues and error-tolerant touch targets.

### IV. Strict Data Integrity & Multi-Tenant Partitioning
All persistent entities MUST adhere to standardized relational schemas designed for conflict-free distributed synchronization:
- Entity IDs MUST be client-generated UUID v4 strings (never autoincrementing integers).
- Every business table MUST include a non-nullable `farm_id` (UUID) to guarantee multi-tenant tenant isolation from inception.
- Biological management dates (birth dates, inseminations, palpations, dry-off dates) MUST be persisted as canonical ISO `YYYY-MM-DD` strings without timestamps or timezones to prevent timezone skew.
- Audit timestamps (`created_at`, `updated_at`) MUST be recorded in UTC.
- Deletions MUST utilize soft deletion (`deleted_at IS NOT NULL`) to preserve synchronization tombstones across devices.
- Distributed conflicts MUST resolve using a deterministic last-write-wins strategy based on `updated_at`.
- *Rationale*: Asynchronous distributed synchronization across multiple mobile devices requires stable identification, predictable date handling without daylight saving distortions, and reliable tombstone tracking.

### V. Continuous Native Generation (CNG) & Modern Expo Discipline
The codebase MUST strictly adhere to Expo Continuous Native Generation (CNG) and modern Expo Router standards:
- The `ios/` and `android/` native directories are generated artifacts and MUST NEVER be manually authored or checked in. All native capabilities and configurations MUST be declared via `app.json` and Expo config plugins.
- Dependencies MUST be installed using `npx expo install` (or `bunx expo install` when Bun lockfile is present) to ensure SDK compatibility.
- Application routing MUST reside strictly in `src/app/` using Expo Router file-based conventions. Components, hooks, utilities, domain logic, and database schemas MUST reside outside `src/app/`.
- Every pull request and deliverable MUST pass `npx expo lint` and `npx tsc --noEmit` without errors.
- *Rationale*: Respecting CNG and Expo SDK version resolution eliminates configuration drift, native module divergence, and upgrade friction across development and cloud builds (EAS).

## Technology Stack & Architectural Standards

The project is governed by the following technical choices:
- **Client Runtime**: React Native on Expo SDK (development build profile).
- **Navigation**: Expo Router (v4+) with typed routes.
- **Styling**: NativeWind (Tailwind CSS) using centralized tokens in `tailwind.config.js`. Classes MUST be static and declared through semantic UI primitives in `src/ui/` (`Botao`, `CampoNumerico`, `Cartao`, `SeloStatus`, `IndicadorSync`). Dynamic string concatenation of class names is strictly prohibited.
- **Local Persistence**: `expo-sqlite` managed via Drizzle ORM with versioned schema migrations.
- **Cloud Backend**: Supabase (PostgreSQL with Row Level Security, Auth, Storage, automated backups).
- **Language & Locale**: TypeScript with strict mode; UI language fixed to Brazilian Portuguese (`pt-BR`).

## Development Workflow & Quality Gates

All development activities MUST adhere to the following workflow gates:
- **TDD for Domain Rules**: Pure calculation functions in `src/domain/` MUST have automated test suites validating boundary cases (e.g. edge dates, leap years, negative weight deltas, zero milk consumption).
- **Database Schema Migrations**: All changes to SQLite schema tables MUST be scripted through Drizzle migration files; direct manual schema alterations are prohibited.
- **Validation Gates**: Prior to merging any branch, developers and agents MUST verify:
  1. `npx expo lint` passes with 0 errors.
  2. `npx tsc --noEmit` passes with 0 type errors.
  3. No raw untyped SQL queries bypassing repository/ORM boundaries.
  4. No raw `console.log` statements in production domain code.

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

**Version**: 1.0.0 | **Ratified**: 2026-10-13 | **Last Amended**: 2026-10-13
