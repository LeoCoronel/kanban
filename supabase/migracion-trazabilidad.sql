-- Historias BV · migración: trazabilidad de sprints
-- Ejecutar UNA vez en: Supabase → SQL Editor → New query → Run.
-- No modifica tablas existentes: agrega `sprint_historias`, que guarda una foto de cada
-- tarjeta al cerrar un sprint (hecha, arrastrada a otro sprint o devuelta al backlog).

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

-- Acceso del equipo (misma política que el resto: sin login)
alter table public.sprint_historias enable row level security;
drop policy if exists "acceso_equipo_sprint_historias" on public.sprint_historias;
create policy "acceso_equipo_sprint_historias" on public.sprint_historias
  for all to anon using (true) with check (true);

-- Tiempo real (solo si la tabla todavía no está publicada)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sprint_historias'
  ) then
    alter publication supabase_realtime add table public.sprint_historias;
  end if;
end $$;
