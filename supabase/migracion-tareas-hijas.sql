-- Historias BV · migración: tareas hijas de una user story + criterios como checklist
-- Ejecutar UNA vez en: Supabase → SQL Editor → New query → Run.
-- Se puede correr más de una vez sin romper nada. No borra tarjetas.
--
-- Reglas:
--   · Una tarea pertenece a una user story (historia_padre_id).
--   · Las tareas no llevan valor ni esfuerzo: el esfuerzo se estima en la historia.
--   · Los criterios de aceptación son una checklist [{ "texto": "...", "hecho": false }].
--
-- En la base del equipo ya se aplicó el 26/10/2026 (incluido el vínculo de las tareas
-- existentes y las US36–US38). Respaldo y vuelta atrás: select respaldo_tareas_hijas.revertir();

-- 1. Vínculo tarea → user story
alter table public.historias
  add column if not exists historia_padre_id uuid
    references public.historias (id) on delete cascade;

create index if not exists historias_padre_idx on public.historias (historia_padre_id);

-- 2. Una historia nunca tiene padre
alter table public.historias drop constraint if exists historias_padre_solo_tareas;
alter table public.historias add constraint historias_padre_solo_tareas
  check (tipo = 'tarea' or historia_padre_id is null);

-- 3. El padre tiene que ser una user story
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

-- 4. Criterios como checklist. Durante la transición la app escribe las dos columnas:
--    `criterios_check` (checklist) y `criterios` (solo textos, para versiones anteriores).
alter table public.historias
  add column if not exists criterios_check jsonb not null default '[]'::jsonb;

update public.historias h set criterios_check = coalesce((
  select jsonb_agg(jsonb_build_object('texto', c, 'hecho', h.estado = 'hecho'))
  from unnest(h.criterios) as c), '[]'::jsonb)
where h.tipo = 'historia' and h.criterios_check = '[]'::jsonb;

-- 5. Las tareas no suman esfuerzo ni valor
update public.historias set valor = null, esfuerzo = null where tipo = 'tarea';

-- ───────────── Después de publicar la app nueva en todos lados ─────────────
-- Activar la regla en la base (antes no: la versión anterior guarda esfuerzo en tareas):
--
-- alter table public.historias drop constraint if exists historias_tarea_sin_puntos;
-- alter table public.historias add constraint historias_tarea_sin_puntos
--   check (tipo = 'historia' or (valor is null and esfuerzo is null));
--
-- Y cuando ya nadie use la versión anterior, borrar el respaldo:
-- drop schema respaldo_tareas_hijas cascade;
