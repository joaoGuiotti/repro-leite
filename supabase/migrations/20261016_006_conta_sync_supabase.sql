-- ============================================================================
-- ReproLeite Supabase PostgreSQL Migration (Definitiva e sem recursão)
-- ============================================================================

-- 1. LIMPEZA TOTAL (Cascade)
drop table if exists public.alerts cascade;
drop table if exists public.weighings cascade;
drop table if exists public.inseminations cascade;
drop table if exists public.bulls cascade;
drop table if exists public.animals cascade;
drop table if exists public.settings cascade;
drop table if exists public.farm_members cascade;
drop table if exists public.farms cascade;
drop function if exists public.get_user_farm_ids() cascade;

-- 2. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 3. TABELA DE PROPRIEDADES (Farms)
create table public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Minha Fazenda',
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz
);

-- 4. TABELA DE MEMBROS DA FAZENDA (Farm Members)
create table public.farm_members (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  constraint uq_farm_user unique (farm_id, user_id)
);

-- 5. TABELA DE ANIMAIS (Animals)
create table public.animals (
  id uuid primary key,
  farm_id uuid not null references public.farms(id) on delete cascade,
  ear_tag text not null,
  ear_tag_normalized text not null,
  name text,
  breed text not null,
  sex text not null default 'femea',
  birth_date text not null,
  birth_weight_kg numeric default 40.0,
  life_stage text not null default 'adulta',
  repro_status text not null default 'vazia',
  exit_status text not null default 'ativo',
  exit_date text,
  exit_reason text,
  sire_id text,
  sire_name text,
  dam_id text,
  dam_name text,
  maternal_grandsire_name text,
  paternal_grandsire_name text,
  notes text,
  ear_tag_conflict boolean not null default false,
  server_rev bigint generated always as identity,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz
);

-- 6. TABELA DE TOUROS (Bulls)
create table public.bulls (
  id uuid primary key,
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  breed text not null,
  code text,
  straws_in_stock integer not null default 0,
  notes text,
  server_rev bigint generated always as identity,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz
);

-- 7. TABELA DE COBERTURAS / INSEMINAÇÕES (Inseminations)
create table public.inseminations (
  id uuid primary key,
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  bull_id uuid references public.bulls(id),
  bull_name text not null,
  date text not null,
  inseminator text not null,
  expected_heat_date text not null,
  pregnancy_check_date text not null,
  expected_calving_date text not null,
  dry_off_date text not null,
  result text not null default 'pendente',
  notes text,
  server_rev bigint generated always as identity,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz
);

-- 8. TABELA DE PESAGENS (Weighings)
create table public.weighings (
  id uuid primary key,
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  date text not null,
  weight_kg numeric not null,
  notes text,
  server_rev bigint generated always as identity,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz
);

-- 9. TABELA DE ALERTAS ZOOTÉCNICOS (Alerts)
create table public.alerts (
  id uuid primary key,
  farm_id uuid not null references public.farms(id) on delete cascade,
  target_animal_id uuid not null references public.animals(id) on delete cascade,
  type text not null,
  due_date text not null,
  completed_at text,
  source_id text,
  notes text,
  server_rev bigint generated always as identity,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz
);

-- 10. TABELA DE CONFIGURAÇÕES (Settings)
create table public.settings (
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

-- 11. ÍNDICES DE SINCRONIZAÇÃO
create index idx_animals_farm_updated on public.animals (farm_id, updated_at);
create index idx_bulls_farm_updated on public.bulls (farm_id, updated_at);
create index idx_inseminations_farm_updated on public.inseminations (farm_id, updated_at);
create index idx_weighings_farm_updated on public.weighings (farm_id, updated_at);
create index idx_alerts_farm_updated on public.alerts (farm_id, updated_at);
create index idx_settings_farm_updated on public.settings (farm_id, updated_at);

-- 12. FUNÇÃO SECURITY DEFINER PARA EVITAR RECURSÃO NO RLS
create or replace function public.get_user_farm_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select farm_id from public.farm_members where user_id = auth.uid() and deleted_at is null;
$$;

-- 13. ROW LEVEL SECURITY (Multi-tenant por fazenda)
alter table public.farms enable row level security;
alter table public.farm_members enable row level security;
alter table public.animals enable row level security;
alter table public.bulls enable row level security;
alter table public.inseminations enable row level security;
alter table public.weighings enable row level security;
alter table public.alerts enable row level security;
alter table public.settings enable row level security;

create policy "farms_isolation" on public.farms for all using (
  id in (select public.get_user_farm_ids())
);

create policy "farm_members_isolation" on public.farm_members for all using (
  farm_id in (select public.get_user_farm_ids()) or user_id = auth.uid()
);

create policy "animals_isolation" on public.animals for all using (
  farm_id in (select public.get_user_farm_ids())
);

create policy "bulls_isolation" on public.bulls for all using (
  farm_id in (select public.get_user_farm_ids())
);

create policy "inseminations_isolation" on public.inseminations for all using (
  farm_id in (select public.get_user_farm_ids())
);

create policy "weighings_isolation" on public.weighings for all using (
  farm_id in (select public.get_user_farm_ids())
);

create policy "alerts_isolation" on public.alerts for all using (
  farm_id in (select public.get_user_farm_ids())
);

create policy "settings_isolation" on public.settings for all using (
  farm_id in (select public.get_user_farm_ids())
);

-- 14. RPC DE ONBOARDING SILENCIOSO DA FAZENDA
create or replace function public.sync_bootstrap_farm(p_local_farm_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_farm_id uuid;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

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

-- 15. RECARREGAR O SCHEMA CACHE DO SUPABASE
notify pgrst, 'reload schema';
