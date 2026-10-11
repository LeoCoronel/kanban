-- Historias BV · migración: épicas
-- Ejecutar UNA vez en: Supabase → SQL Editor → New query → Run.
-- No borra ni modifica tarjetas existentes: agrega la tabla `epicas` y la columna `epica_id`.

create table if not exists public.epicas (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null unique,
  descripcion  text not null default '',
  tono         text not null default 'acento'
               check (tono in ('acento', 'ok', 'warn', 'info', 'neutro')),
  transversal  boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.historias
  add column if not exists epica_id uuid references public.epicas (id) on delete set null;

create index if not exists historias_epica_idx on public.historias (epica_id);

-- Acceso del equipo (misma política que el resto: sin login)
alter table public.epicas enable row level security;
drop policy if exists "acceso_equipo_epicas" on public.epicas;
create policy "acceso_equipo_epicas" on public.epicas
  for all to anon using (true) with check (true);

-- Tiempo real (solo si la tabla todavía no está publicada)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'epicas'
  ) then
    alter publication supabase_realtime add table public.epicas;
  end if;
end $$;

-- Épica transversal inicial
insert into public.epicas (nombre, descripcion, tono, transversal)
values ('Documentación', 'Documentación del proyecto. Se trabaja en cada sprint.', 'info', true)
on conflict (nombre) do nothing;
