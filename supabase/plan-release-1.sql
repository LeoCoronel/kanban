-- Historias BV · plan de la Release 1 (según el Mapa de Releases de centralBV)
-- Ejecutar en: Supabase → SQL Editor → New query → Run.
-- Requisito: haber ejecutado antes supabase/migracion-epicas.sql.
-- Es seguro correrlo más de una vez y no pisa lo que ya hayas movido a mano.

-- 1) Sprints de la Release 1 (todos quedan "planificado": los iniciás desde la app)
insert into public.sprints (nombre, objetivo, fecha_inicio, fecha_fin, estado)
select v.nombre, v.objetivo, v.inicio::date, v.fin::date, 'planificado'
from (values
  ('Sprint 1', 'Refinar backlog, diseñar el flujo, armar dominio de negocio, configuraciones básicas. Entregable: backlog refinado, wireframes, dominio configurado, repositorios, DER.', '2026-10-03', '2026-10-16'),
  ('Sprint 2', 'Gestión y generación de constancias · Usuarios. Entregable: flujo de constancias completo + tests y documentación · Autenticación y logeo.', '2026-10-17', '2026-10-30'),
  ('Sprint 3', 'Gestión de móviles de emergencia · Gestión de usuarios. Entregable: flujo de gestión de móviles de emergencia + tests y documentación · Gestión de roles de usuarios completo.', '2026-10-31', '2026-11-13'),
  ('Sprint 4', 'Integrar, corregir, hacer demo y cerrar la release. Entregable: demo final · backlog actualizado · MVP entregable.', '2026-11-14', '2026-11-27')
) as v(nombre, objetivo, inicio, fin)
where not exists (select 1 from public.sprints s where s.nombre = v.nombre);

-- 2) Épicas temáticas (Documentación ya existe como transversal)
insert into public.epicas (nombre, descripcion, tono, transversal) values
  ('Usuarios y acceso', 'Alta de usuarios con roles, inicio de sesión y recuperación de contraseña.', 'acento', false),
  ('Móviles de emergencia', 'Alta, disponibilidad, consulta y revisión periódica de móviles.', 'ok', false),
  ('Constancias', 'Solicitudes de constancias de actuación: alta, búsqueda, generación en PDF y entrega.', 'warn', false)
on conflict (nombre) do nothing;

-- 3) Asignación de las historias del MVP a su épica y sprint
--    (solo toca tarjetas sin épica / sin sprint, así no pisa cambios hechos en la app)
do $$
declare r record;
begin
  for r in
    select * from (values
      ('US01', 'Sprint 3', 'Usuarios y acceso'),
      ('US02', 'Sprint 2', 'Usuarios y acceso'),
      ('US03', 'Sprint 3', 'Usuarios y acceso'),
      ('US04', 'Sprint 3', 'Móviles de emergencia'),
      ('US05', 'Sprint 3', 'Móviles de emergencia'),
      ('US06', 'Sprint 3', 'Móviles de emergencia'),
      ('US07', 'Sprint 3', 'Móviles de emergencia'),
      ('US08', 'Sprint 2', 'Constancias'),
      ('US09', 'Sprint 2', 'Constancias'),
      ('US10', 'Sprint 2', 'Constancias'),
      ('US11', 'Sprint 2', 'Constancias'),
      ('US12', 'Sprint 2', 'Constancias'),
      ('US13', 'Sprint 2', 'Constancias'),
      ('US14', 'Sprint 2', 'Constancias')
    ) as p(codigo, sprint, epica)
  loop
    update public.historias h
       set epica_id = (select id from public.epicas where nombre = r.epica)
     where h.codigo = r.codigo and h.epica_id is null;

    update public.historias h
       set sprint_id = (select id from public.sprints where nombre = r.sprint),
           estado = 'por_hacer'
     where h.codigo = r.codigo and h.sprint_id is null and h.estado = 'backlog';
  end loop;
end $$;
