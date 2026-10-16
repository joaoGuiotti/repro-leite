# Implementation Plan: 006-conta-e-sync-supabase

**Branch**: `006-conta-e-sync-supabase` | **Date**: 2026-10-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-conta-e-sync-supabase/spec.md`

---

## Summary

Implementar a camada de autenticação sem senha (OTP de 6 dígitos via e-mail) e sincronização bidirecional em nuvem com o Supabase para o ReproLeite. A arquitetura preserva o **Acesso Imediato no Curral** (uso 100% offline sem login obrigatório), isolando o SDK do Supabase estritamente atrás de portas na Clean Architecture (`AuthGateway` e `RemoteSyncGateway`). Tokens e sessões são persistidos de forma segura no iOS Keychain e Android Keystore via `expo-secure-store`. A sincronização remota orquestra push de mutações locais da outbox em lotes idempotentes e pull incremental por cursor temporal (`updated_at` / `server_rev`), com detecção de conflitos zootécnicos de brinco duplicado e tela de progresso na carga inicial em novos dispositivos.

---

## Technical Context

**Language/Version**: TypeScript 6.0.3 com strict mode ativado (`strict: true`)  
**Primary Dependencies**: 
- `@supabase/supabase-js` (transporte remoto e auth)
- `expo-secure-store` (armazenamento criptografado de credenciais)
- `@react-native-community/netinfo` (monitoramento de conectividade em `core/network/network-monitor.ts`)
- `expo-sqlite` + `drizzle-orm` (persistência local offline e outbox)
- `lucide-react-native` + `react-native-svg` (iconografia padrão)
- `nativewind` v4 (estilização por tokens semânticos)

**Storage**: 
- Local: SQLite criptografado/persistente no aparelho via `expo-sqlite`
- Remoto: PostgreSQL no Supabase com Row Level Security (RLS) particionado por `farm_id`
- Credenciais: iOS Keychain / Android Keystore via `expo-secure-store`

**Testing**: 
- `jest` + `ts-jest` (unitários puros de domínio, use cases com in-memory fakes e contratos de gateway)
- Suíte `core/sync` e `features/account` executável offline sem dependência de rede real

**Target Platform**: Android e iOS (Expo CNG / EAS Build) + Web (Preview)  
**Project Type**: Mobile Application (React Native + Expo Router)  
**Performance Goals**: 
- Abertura do app em curral < 1s (zero chamada bloqueante de rede)
- Drenagem da outbox (push) < 2s para lotes de até 50 mutações
- Carga inicial em aparelho novo < 15s para rebanhos médios (500 animais)
- Disparo de sync reativo < 1s após retorno da conectividade

**Constraints**: 
- 100% offline-first: a UI jamais faz leitura direta via `fetch` ou SDK do Supabase
- Toda escrita sincronizável deve persistir entidade + outbox na mesma transação atômica
- Proibição da chave `service_role` no aplicativo móvel
- Proibição de armazenamento de tokens em `AsyncStorage` ou SQLite puro
- Touch targets mínimos de 56 px (`min-h-14`) para ações primárias e 48 px (`min-h-12`) para secundárias

**Scale/Scope**: 
- Suporte a fazendas de até 2.000 animais e 20.000 eventos de manejo por propriedade
- Suporte a multi-dispositivos operando em modo offline intermitente na mesma fazenda

---

## Constitution Check

*GATE 1: Avaliado antes da fase de design. Re-avaliado pós-design.*

| Princípio Constitucional | Status | Justificativa / Validação |
|---|---|---|
| **I. Offline-First & Local-First** | ✅ PASS | Leitura e escrita continuam 100% no SQLite local. O Supabase opera exclusivamente como destino assíncrono da outbox e fonte de pull em segundo plano. |
| **II. Clean Architecture & Pure Domain** | ✅ PASS | O Supabase fica confinado na camada `infra/` (`supabase-auth.repository.ts`) e `core/network/` (`supabase-remote-gateway.ts`). O domínio e os use cases interagem estritamente com ports (`AuthGateway` e `RemoteSyncGateway`). |
| **III. Rural Ergonomics & UI Standards** | ✅ PASS | Telas e modais de login e progresso utilizam tokens do NativeWind, botões com altura ≥ 56px/48px, teclado numérico nativo para o código OTP e ícones estritamente do Lucide. |
| **IV. Data Integrity & Multi-Tenant** | ✅ PASS | UUID v4 em todas as tabelas, particionamento estrito por `farm_id`, soft-deletes (`deleted_at`), datas em `YYYY-MM-DD` canônico e RLS nativo no PostgreSQL. |
| **V. Cloud Backend Isolation & Secure Auth** | ✅ PASS | Sessões gravadas em `expo-secure-store`, somente chaves públicas (`EXPO_PUBLIC_*`), login sem senha OTP e Acesso Imediato no Curral garantido. |
| **VI. Continuous Native Generation (CNG)** | ✅ PASS | Sem alterações manuais em `ios/` ou `android/`. Dependências instaladas via `npx expo install`. Rotas concentradas em `src/app/`. |

---

## Project Structure

### Documentation (this feature)

```text
specs/006-conta-e-sync-supabase/
├── spec.md              # Especificação de negócio da feature
├── plan.md              # Plano de arquitetura e implementação (este arquivo)
├── research.md          # Decisões arquiteturais e resolução de incógnitas
├── data-model.md        # Modelagem conceitual, SQLite local e PostgreSQL remoto
├── quickstart.md        # Guia executável de validação de ponta a ponta
├── contracts/           # Contratos formais de interfaces e schemas
│   ├── auth.contract.ts
│   ├── sync-remote.contract.ts
│   └── schema.sql
└── checklists/
    └── requirements.md  # Checklist de qualidade da especificação
```

### Source Code Layout

```text
src/
├── core/
│   ├── network/
│   │   ├── api-client.ts                # Interfaces RemoteSyncGateway e FakeRemoteSyncGateway
│   │   ├── network-monitor.ts           # Monitor de conectividade (@react-native-community/netinfo)
│   │   └── supabase-remote-gateway.ts   # [NOVO] Implementação real do RemoteSyncGateway via Supabase
│   ├── sync/
│   │   ├── outbox.repository.ts         # Fila local de mutações pendentes
│   │   ├── push.ts                      # Motor de envio em lotes (PushEngine)
│   │   ├── pull.ts                      # Motor de busca incremental (PullEngine)
│   │   ├── conflict-resolver.ts         # Resolução LWW e detecção de brinco duplicado
│   │   └── sync-engine.ts               # Orquestrador central de sincronização
├── features/
│   └── account/                         # [NOVA FEATURE] Gestão de conta e autenticação
│       ├── domain/
│       │   ├── account.entity.ts        # Entidade UserAccount e UserSession
│       │   └── auth.repository.ts       # Port da interface AuthGateway
│       ├── application/
│       │   ├── request-otp.usecase.ts   # Envio do código de 6 dígitos
│       │   ├── verify-otp.usecase.ts    # Validação do OTP e vinculação de fazenda
│       │   ├── get-session.usecase.ts   # Consulta da sessão ativa
│       │   └── sign-out.usecase.ts      # Encerramento seguro de sessão
│       ├── infra/
│       │   ├── supabase-client.ts       # Inicialização do Supabase com SecureStore
│       │   ├── secure-storage.adapter.ts# Adaptador de persistência para expo-secure-store
│       │   └── supabase-auth.repository.ts # Implementação do AuthGateway
│       ├── presentation/
│       │   ├── components/
│       │   │   ├── LoginOtpModal.tsx    # Modal de entrada com e-mail e código de 6 dígitos
│       │   │   └── InitialSyncModal.tsx # Tela de progresso de carga inicial em novo aparelho
│       │   └── hooks/
│       │       └── useAccount.ts        # Hook reativo de estado de autenticação
│       └── index.ts                     # API pública da feature account
├── features/
│   └── settings/
│       └── presentation/
│           └── screens/
│               └── SettingsScreen.tsx   # Integração do botão de login e status da conta
```

---

## Complexity Tracking

| Decisão | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| **Adaptador `expo-secure-store` para Supabase** | Garante que JWTs e refresh tokens fiquem em hardware criptografado seguro (Keychain / Keystore). | `AsyncStorage` armazenaria credenciais em texto plano vulnerável no sistema de arquivos. |
| **`sync_bootstrap_farm` via RPC PostgreSQL** | Vincula a fazenda do aparelho à conta do usuário de forma atômica no primeiro login sem exigir telas de cadastro da fazenda. | Criação manual na UI aumentaria o atrito e causaria divergência entre IDs locais e remotos. |
| **Alerta Zootécnico para Brinco Duplicado** | Previne a perda ou sobrescrita silenciosa de animais cadastrados com o mesmo brinco em aparelhos distintos offline. | LWW cego apagaria ou descaracterizaria um dos animais, destruindo o histórico produtivo. |
