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

-- ───────────── Épicas ─────────────
-- Agrupan tarjetas de un mismo tema. Una épica transversal se trabaja en todos los sprints.
create table if not exists public.epicas (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null unique,
  descripcion  text not null default '',
  tono         text not null default 'acento'
               check (tono in ('acento', 'ok', 'warn', 'info', 'neutro')),
  transversal  boolean not null default false,
  created_at   timestamptz not null default now()
);

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
  esfuerzo      smallint check (esfuerzo in (1, 2, 3, 5, 8)),
  prioridad     text not null default 'Media' check (prioridad in ('Alta', 'Media', 'Baja')),
  criterios     text[] not null default '{}',
  notas         text not null default '',
  estado        text not null default 'backlog'
                check (estado in ('backlog', 'por_hacer', 'en_progreso', 'en_revision', 'hecho')),
  sprint_id     uuid references public.sprints (id) on delete set null,
  epica_id      uuid references public.epicas (id) on delete set null,
  -- Solo tareas: la user story a la que pertenecen (ver migracion-tareas-hijas.sql)
  historia_padre_id uuid references public.historias (id) on delete cascade,
  -- Criterios como checklist [{ texto, hecho }]; `criterios` queda por compatibilidad
  criterios_check jsonb not null default '[]'::jsonb,
  responsable   text not null default '',
  orden         integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists historias_sprint_idx on public.historias (sprint_id);
create index if not exists historias_epica_idx on public.historias (epica_id);
create index if not exists historias_padre_idx on public.historias (historia_padre_id);

-- Una historia nunca tiene padre; el padre de una tarea tiene que ser una historia.
alter table public.historias drop constraint if exists historias_padre_solo_tareas;
alter table public.historias add constraint historias_padre_solo_tareas
  check (tipo = 'tarea' or historia_padre_id is null);

create or replace function public.validar_padre_es_historia() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.historia_padre_id is not null and not exists (
    select 1 from public.historias where id = new.historia_padre_id and tipo = 'historia'
  ) then
    raise exception 'El padre de una tarea debe ser una user story';
  end if;
  return new;
end $$;

drop trigger if exists historias_validar_padre on public.historias;
create trigger historias_validar_padre
  before insert or update of historia_padre_id on public.historias
  for each row execute function public.validar_padre_es_historia();

create or replace function public.tocar_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists historias_updated_at on public.historias;
create trigger historias_updated_at before update on public.historias
  for each row execute function public.tocar_updated_at();

-- ───────────── Trazabilidad de sprints ─────────────
-- Foto de cada tarjeta al cerrar un sprint (hecha, arrastrada o devuelta al backlog).
create table if not exists public.sprint_historias (
  id                 uuid primary key default gen_random_uuid(),
  sprint_id          uuid not null references public.sprints (id) on delete cascade,
  historia_id        uuid references public.historias (id) on delete set null,
  codigo             text not null,
  estado_final       text not null
                     check (estado_final in ('backlog', 'por_hacer', 'en_progreso', 'en_revision', 'hecho')),
  resultado          text not null check (resultado in ('hecha', 'arrastrada', 'devuelta')),
  destino_sprint_id  uuid references public.sprints (id) on delete set null,
  created_at         timestamptz not null default now()
);

create unique index if not exists sprint_historias_unica
  on public.sprint_historias (sprint_id, historia_id);
create index if not exists sprint_historias_historia_idx
  on public.sprint_historias (historia_id);

-- ───────────── Seguridad (RLS) ─────────────
-- La app no tiene login: cualquiera que tenga la URL y la anon key puede leer y escribir.
-- Es aceptable para un equipo de 4 en una URL poco difundida; si hace falta cerrarlo,
-- activar Vercel Password Protection o sumar Supabase Auth y cambiar estas políticas.
alter table public.sprints   enable row level security;
alter table public.historias enable row level security;
alter table public.epicas    enable row level security;
alter table public.sprint_historias enable row level security;

drop policy if exists "acceso_equipo_sprint_historias" on public.sprint_historias;
create policy "acceso_equipo_sprint_historias" on public.sprint_historias
  for all to anon using (true) with check (true);

drop policy if exists "acceso_equipo_sprints" on public.sprints;
create policy "acceso_equipo_sprints" on public.sprints
  for all to anon using (true) with check (true);

drop policy if exists "acceso_equipo_historias" on public.historias;
create policy "acceso_equipo_historias" on public.historias
  for all to anon using (true) with check (true);

drop policy if exists "acceso_equipo_epicas" on public.epicas;
create policy "acceso_equipo_epicas" on public.epicas
  for all to anon using (true) with check (true);

-- ───────────── Tiempo real ─────────────
-- Cada tabla se publica solo si todavía no lo está (el script se puede correr más de una vez).
do $$
declare t text;
begin
  foreach t in array array['sprints', 'historias', 'epicas', 'sprint_historias'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ───────────── Datos iniciales ─────────────
insert into public.epicas (nombre, descripcion, tono, transversal)
values ('Documentación', 'Documentación del proyecto. Se trabaja en cada sprint.', 'info', true)
on conflict (nombre) do nothing;
