-- Historias BV · esquema de base de datos (Supabase / Postgres)
-- Ejecutar completo en: Supabase → SQL Editor → New query → Run

create extension if not exists "pgcrypto";

-- ───────────── Sprints ─────────────
create table if not exists public.sprints (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  objetivo      text not null default '',
  fecha_inicio  date,
  fecha_fin     date,
  estado        text not null default 'planificado'
                check (estado in ('planificado', 'activo', 'cerrado')),
  cerrado_en    timestamptz,
  created_at    timestamptz not null default now()
);

-- Un solo sprint activo a la vez
create unique index if not exists sprints_un_solo_activo
  on public.sprints ((estado)) where estado = 'activo';

-- ───────────── Historias / tarjetas ─────────────
create table if not exists public.historias (
  id            uuid primary key default gen_random_uuid(),
  codigo        text not null unique,
  tipo          text not null default 'historia' check (tipo in ('historia', 'tarea')),
  version       text not null default 'MVP'
                check (version in ('MVP', 'Release 2', 'Futuro', 'Fuera de alcance')),
  historia      text not null default '',
  descripcion   text not null default '',
  valor         smallint check (valor between 1 and 5),
  esfuerzo      smallint check (esfuerzo between 1 and 5),
  prioridad     text not null default 'Media' check (prioridad in ('Alta', 'Media', 'Baja')),
  criterios     text[] not null default '{}',
  notas         text not null default '',
  estado        text not null default 'backlog'
                check (estado in ('backlog', 'por_hacer', 'en_progreso', 'en_revision', 'hecho')),
  sprint_id     uuid references public.sprints (id) on delete set null,
  responsable   text not null default '',
  orden         integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists historias_sprint_idx on public.historias (sprint_id);

create or replace function public.tocar_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists historias_updated_at on public.historias;
create trigger historias_updated_at before update on public.historias
  for each row execute function public.tocar_updated_at();

-- ───────────── Seguridad (RLS) ─────────────
-- La app no tiene login: cualquiera que tenga la URL y la anon key puede leer y escribir.
-- Es aceptable para un equipo de 4 en una URL poco difundida; si hace falta cerrarlo,
-- activar Vercel Password Protection o sumar Supabase Auth y cambiar estas políticas.
alter table public.sprints   enable row level security;
alter table public.historias enable row level security;

drop policy if exists "acceso_equipo_sprints" on public.sprints;
create policy "acceso_equipo_sprints" on public.sprints
  for all to anon using (true) with check (true);

drop policy if exists "acceso_equipo_historias" on public.historias;
create policy "acceso_equipo_historias" on public.historias
  for all to anon using (true) with check (true);

-- ───────────── Tiempo real ─────────────
alter publication supabase_realtime add table public.sprints;
alter publication supabase_realtime add table public.historias;
