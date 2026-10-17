-- Esfuerzo pasa de 1-5 a Fibonacci (1, 2, 3, 5, 8). Correr una sola vez en el SQL Editor.
-- Las tarjetas existentes se convierten: 4 -> 5 y 5 -> 8 (1, 2 y 3 quedan igual).
-- Revisá después las estimaciones de las tarjetas que eran 4 o 5.

alter table public.historias drop constraint if exists historias_esfuerzo_check;

update public.historias set esfuerzo = case esfuerzo when 5 then 8 when 4 then 5 else esfuerzo end
where esfuerzo in (4, 5);

alter table public.historias
  add constraint historias_esfuerzo_check check (esfuerzo in (1, 2, 3, 5, 8));
