-- ============================================================================
-- ReproLeite Supabase PostgreSQL Schema & Security Contract
-- Feature: 006-conta-e-sync-supabase
-- ============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. TABELA DE PROPRIEDADES (Farms)
create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Minha Fazenda',
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz
);

-- 3. TABELA DE MEMBROS DA FAZENDA (Farm Members)
create table if not exists public.farm_members (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  constraint uq_farm_user unique (farm_id, user_id)
);

-- 4. TABELA DE ANIMAIS (Animals)
create table if not exists public.animals (
  id uuid primary key,
  farm_id uuid not null references public.farms(id) on delete cascade,
  ear_tag text not null,
  name text,
  category text not null,
  birth_date text not null,
  weight_kg numeric(6,2),
  dam_id uuid,
  sire_id uuid,
  maternal_granddam_id uuid,
  reproductive_status text not null default 'vazia',
  last_insemination_date text,
  last_sire_id uuid,
  pregnancy_status text,
  expected_calving_date text,
  dry_off_date text,
  ear_tag_conflict boolean not null default false,
  notes text,
  server_rev bigint generated always as identity,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz
);

-- 5. TABELA DE TOUROS (Bulls)
create table if not exists public.bulls (
  id uuid primary key,
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  code text,
  breed text,
  semen_type text not null default 'convencional',
  sire_name text,
  maternal_grandsire_name text,
  server_rev bigint generated always as identity,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz
);

-- 6. TABELA DE COBERTURAS / INSEMINAÇÕES (Inseminations)
create table if not exists public.inseminations (
  id uuid primary key,
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  bull_id uuid not null references public.bulls(id) on delete restrict,
  date text not null,
  inseminator_name text,
  notes text,
  server_rev bigint generated always as identity,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz
);

-- 7. TABELA DE PESAGENS (Weighings)
create table if not exists public.weighings (
  id uuid primary key,
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  date text not null,
  weight_kg numeric(6,2) not null,
  notes text,
  server_rev bigint generated always as identity,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz
);

-- 8. TABELA DE ALERTAS ZOOTÉCNICOS (Alerts)
create table if not exists public.alerts (
  id uuid primary key,
  farm_id uuid not null references public.farms(id) on delete cascade,
  type text not null,
  title text not null,
  description text not null,
  animal_id uuid,
  due_date text not null,
  status text not null default 'pendente',
  resolved_at text,
  server_rev bigint generated always as identity,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz
);

-- 9. TABELA DE CONFIGURAÇÕES (Settings)
create table if not exists public.settings (
  id uuid primary key,
  farm_id uuid not null references public.farms(id) on delete cascade,
  key text not null,
  value text not null,
  server_rev bigint generated always as identity,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  constraint uq_farm_setting_key unique (farm_id, key)
);

-- 10. ÍNDICES DE SINCRONIZAÇÃO
create index if not exists idx_animals_farm_updated on public.animals (farm_id, updated_at);
create index if not exists idx_bulls_farm_updated on public.bulls (farm_id, updated_at);
create index if not exists idx_inseminations_farm_updated on public.inseminations (farm_id, updated_at);
create index if not exists idx_weighings_farm_updated on public.weighings (farm_id, updated_at);
create index if not exists idx_alerts_farm_updated on public.alerts (farm_id, updated_at);
create index if not exists idx_settings_farm_updated on public.settings (farm_id, updated_at);

-- 11. ROW LEVEL SECURITY (RLS)
alter table public.farms enable row level security;
alter table public.farm_members enable row level security;
alter table public.animals enable row level security;
alter table public.bulls enable row level security;
alter table public.inseminations enable row level security;
alter table public.weighings enable row level security;
alter table public.alerts enable row level security;
alter table public.settings enable row level security;

-- Política de associação de membros
create policy "farm_members_membership" on public.farm_members
  for all using (user_id = auth.uid() or farm_id in (
    select fm.farm_id from public.farm_members fm where fm.user_id = auth.uid()
  ));

create policy "farms_access" on public.farms
  for all using (
    id in (select fm.farm_id from public.farm_members fm where fm.user_id = auth.uid() and fm.deleted_at is null)
  );

-- Macro de isolamento para tabelas de negócio
create policy "animals_isolation" on public.animals for all using (
  farm_id in (select fm.farm_id from public.farm_members fm where fm.user_id = auth.uid() and fm.deleted_at is null)
);

create policy "bulls_isolation" on public.bulls for all using (
  farm_id in (select fm.farm_id from public.farm_members fm where fm.user_id = auth.uid() and fm.deleted_at is null)
);

create policy "inseminations_isolation" on public.inseminations for all using (
  farm_id in (select fm.farm_id from public.farm_members fm where fm.user_id = auth.uid() and fm.deleted_at is null)
);

create policy "weighings_isolation" on public.weighings for all using (
  farm_id in (select fm.farm_id from public.farm_members fm where fm.user_id = auth.uid() and fm.deleted_at is null)
);

create policy "alerts_isolation" on public.alerts for all using (
  farm_id in (select fm.farm_id from public.farm_members fm where fm.user_id = auth.uid() and fm.deleted_at is null)
);

create policy "settings_isolation" on public.settings for all using (
  farm_id in (select fm.farm_id from public.farm_members fm where fm.user_id = auth.uid() and fm.deleted_at is null)
);

-- 12. RPC BOOTSTRAP DE FAZENDA (Onboarding Silencioso)
create or replace function public.sync_bootstrap_farm(p_local_farm_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_farm_id uuid;
  v_farm_name text;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  -- Verifica se usuário já é membro de alguma fazenda
  select fm.farm_id into v_existing_farm_id
  from public.farm_members fm
  where fm.user_id = v_user_id and fm.deleted_at is null
  limit 1;

  if v_existing_farm_id is not null then
    return jsonb_build_object(
      'farm_id', v_existing_farm_id,
      'is_new_farm', false
    );
  end if;

  -- Usuário novo: cria fazenda vinculando o id local
  insert into public.farms (id, name, owner_user_id)
  values (p_local_farm_id, 'Minha Fazenda', v_user_id)
  on conflict (id) do nothing;

  insert into public.farm_members (farm_id, user_id, role)
  values (p_local_farm_id, v_user_id, 'owner')
  on conflict (farm_id, user_id) do nothing;

  return jsonb_build_object(
    'farm_id', p_local_farm_id,
    'is_new_farm', true
  );
end;
$$;
