# Data Model: 006-conta-e-sync-supabase

**Feature**: `006-conta-e-sync-supabase`  
**Date**: 2026-10-16  
**Status**: Completed  

---

## 1. Entidades de Domínio

### UserAccount
Representa o usuário autenticado na plataforma.
- `id`: `string` (UUID v4 do Supabase Auth `auth.users.id`)
- `email`: `string` (endereço de e-mail validado)
- `createdAt`: `string` (ISO 8601 UTC)

### Farm
Representa a propriedade rural na nuvem e no dispositivo.
- `id`: `string` (UUID v4)
- `name`: `string` (nome amigável da fazenda, ex.: "Minha Fazenda")
- `ownerUserId`: `string` (UUID do criador / proprietário)
- `createdAt`: `string` (ISO 8601 UTC)
- `updatedAt`: `string` (ISO 8601 UTC)
- `deletedAt`: `string | null` (soft delete)

### FarmMember
Representa a filiação e permissão de acesso à fazenda.
- `id`: `string` (UUID v4)
- `farmId`: `string` (UUID da fazenda)
- `userId`: `string` (UUID do usuário autenticado)
- `role`: `'owner' | 'member'` (proprietário ou colaborador)
- `createdAt`: `string` (ISO 8601 UTC)
- `updatedAt`: `string` (ISO 8601 UTC)
- `deletedAt`: `string | null`

### EarTagConflictAlert
Representa o alerta zootécnico gerado quando dois animais distintos possuem o mesmo número de brinco após sync concorrente.
- `id`: `string` (UUID v4)
- `farmId`: `string` (UUID da fazenda)
- `earTag`: `string` (número do brinco em duplicidade)
- `animalIds`: `string[]` (IDs dos animais envolvidos)
- `detectedAt`: `string` (ISO 8601 UTC)
- `resolvedAt`: `string | null` (data de resolução quando um dos brincos for alterado)

---

## 2. Esquema Local (SQLite / Drizzle)

As tabelas de negócio locais (`animals`, `bulls`, `inseminations`, `weighings`, `alerts`, `settings`, `sync_outbox`, `sync_state`) já possuem a estrutura padronizada com:
- `id`: `text primary key` (UUID v4)
- `farm_id`: `text not null`
- `created_at`: `text not null` (ISO 8601 UTC)
- `updated_at`: `text not null` (ISO 8601 UTC)
- `deleted_at`: `text` (null se ativo)

### Atualização Incremental na Tabela `animals`:
- Adicionar coluna `ear_tag_conflict`: `integer default 0` (0 = sem conflito, 1 = duplicidade detectada no sync).

### Tabela `sync_state`:
- `farm_id`: `text primary key`
- `server_rev`: `integer default 0`
- `last_pulled_at`: `text`
- `last_success_at`: `text`
- `in_flight`: `integer default 0`
- `updated_at`: `text not null`

---

## 3. Esquema Remoto (Supabase PostgreSQL)

### `public.farms`
```sql
create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Minha Fazenda',
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz
);
```

### `public.farm_members`
```sql
create table if not exists public.farm_members (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  constraint uq_farm_member unique (farm_id, user_id)
);
```

### Tabelas Zootécnicas no Supabase
Todas as tabelas de negócio (`animals`, `bulls`, `inseminations`, `weighings`, `alerts`, `settings`) são criadas com as colunas sincronizáveis:
- `id uuid primary key`
- `farm_id uuid not null references public.farms(id) on delete cascade`
- `server_rev bigint generated always as identity`
- `created_at timestamptz not null default clock_timestamp()`
- `updated_at timestamptz not null default clock_timestamp()`
- `deleted_at timestamptz`

### Índices de Performance:
- `create index idx_animals_sync on public.animals (farm_id, updated_at);`
- `create index idx_inseminations_sync on public.inseminations (farm_id, updated_at);`
- `create index idx_weighings_sync on public.weighings (farm_id, updated_at);`
- `create index idx_alerts_sync on public.alerts (farm_id, updated_at);`
- `create index idx_bulls_sync on public.bulls (farm_id, updated_at);`

---

## 4. Políticas de Segurança (Row Level Security)

Em todas as tabelas:
```sql
alter table public.farms enable row level security;
alter table public.farm_members enable row level security;
alter table public.animals enable row level security;
alter table public.bulls enable row level security;
alter table public.inseminations enable row level security;
alter table public.weighings enable row level security;
alter table public.alerts enable row level security;
alter table public.settings enable row level security;

-- Política de isolamento multi-tenant
create policy "farm_member_access" on public.animals
  for all using (
    farm_id in (
      select fm.farm_id from public.farm_members fm
      where fm.user_id = auth.uid() and fm.deleted_at is null
    )
  );
```
