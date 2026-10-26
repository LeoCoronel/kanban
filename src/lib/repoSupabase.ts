import { createClient } from '@supabase/supabase-js'
import { epicaDocumentacion, historiasIniciales, sprint0, tareasSprint0 } from './semilla'
import type { Epica, Historia, NuevaHistoria, Repo, Sprint, SprintHistoria } from './tipos'
import { normalizarCriterios } from './util'

/**
 * Criterios: la checklist vive en `criterios_check` (jsonb). Mientras dure la transición,
 * `criterios` (text[]) se mantiene con los textos para que la versión anterior de la app siga
 * funcionando. Ver supabase/migracion-tareas-hijas.sql.
 */
type Fila = Omit<Historia, 'criterios'> & { criterios: unknown; criterios_check?: unknown }

function deFila({ criterios_check, ...f }: Fila): Historia {
  const check = normalizarCriterios(criterios_check)
  return {
    ...f,
    historia_padre_id: f.historia_padre_id ?? null,
    criterios: check.length ? check : normalizarCriterios(f.criterios),
  }
}

function aFila(h: Partial<NuevaHistoria>): Record<string, unknown> {
  if (!h.criterios) return h
  return { ...h, criterios: h.criterios.map((c) => c.texto), criterios_check: h.criterios }
}

export function crearRepoSupabase(url: string, clave: string): Repo {
  const sb = createClient(url, clave)

  const fallar = (error: { message: string } | null) => {
    if (error) throw new Error(error.message)
  }

  return {
    modo: 'supabase',
    async listar() {
      const [h, s, e, t] = await Promise.all([
        sb.from('historias').select('*').order('orden', { ascending: true }),
        sb.from('sprints').select('*').order('created_at', { ascending: true }),
        sb.from('epicas').select('*').order('created_at', { ascending: true }),
        sb.from('sprint_historias').select('*').order('created_at', { ascending: true }),
      ])
      fallar(h.error)
      fallar(s.error)
      if (e.error) {
        // La tabla no existe: falta correr la migración de épicas.
        throw new Error(
          `No se pudieron leer las épicas (${e.error.message}). ¿Ejecutaste supabase/migracion-epicas.sql?`,
        )
      }
      return {
        historias: ((h.data ?? []) as Fila[]).map(deFila),
        sprints: (s.data ?? []) as Sprint[],
        epicas: (e.data ?? []) as Epica[],
        // Si falta la migración de trazabilidad, el resto de la app sigue funcionando.
        trazas: (t.error ? [] : (t.data ?? [])) as SprintHistoria[],
      }
    },
    async registrarTrazas(trazas) {
      if (!trazas.length) return
      const { error } = await sb
        .from('sprint_historias')
        .upsert(trazas, { onConflict: 'sprint_id,historia_id' })
      if (error) {
        throw new Error(
          `No se pudo guardar la trazabilidad (${error.message}). ¿Ejecutaste supabase/migracion-trazabilidad.sql?`,
        )
      }
    },
    async crearHistorias(hs) {
      const { error } = await sb.from('historias').insert(hs.map(aFila))
      fallar(error)
    },
    async actualizarHistorias(ids, patch) {
      const { error } = await sb.from('historias').update(aFila(patch)).in('id', ids)
      fallar(error)
    },
    async eliminarHistoria(id) {
      const { error } = await sb.from('historias').delete().eq('id', id)
      fallar(error)
    },
    async crearSprint(s) {
      const { error } = await sb.from('sprints').insert(s)
      fallar(error)
    },
    async actualizarSprint(id, patch) {
      const { error } = await sb.from('sprints').update(patch).eq('id', id)
      fallar(error)
    },
    async crearEpica(e) {
      const { error } = await sb.from('epicas').insert(e)
      fallar(error)
    },
    async actualizarEpica(id, patch) {
      const { error } = await sb.from('epicas').update(patch).eq('id', id)
      fallar(error)
    },
    async eliminarEpica(id) {
      const { error } = await sb.from('epicas').delete().eq('id', id)
      fallar(error)
    },
    async importarSemilla() {
      const { data, error } = await sb.from('sprints').insert(sprint0()).select('id').single()
      fallar(error)
      const sprintId = (data as { id: string }).id
      const filas = [
        ...tareasSprint0().map((t) => ({ ...t, sprint_id: sprintId })),
        ...historiasIniciales(),
      ]
      const { error: e2 } = await sb.from('historias').insert(filas.map(aFila))
      fallar(e2)
      const doc = epicaDocumentacion()
      const { data: existe } = await sb
        .from('epicas')
        .select('id')
        .eq('nombre', doc.nombre)
        .limit(1)
      if (!existe?.length) {
        const { error: e3 } = await sb.from('epicas').insert(doc)
        fallar(e3)
      }
    },
    suscribir(alCambiar) {
      const canal = sb
        .channel('cambios-historias-bv')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'historias' }, alCambiar)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sprints' }, alCambiar)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'epicas' }, alCambiar)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sprint_historias' },
          alCambiar,
        )
        .subscribe()
      return () => {
        void sb.removeChannel(canal)
      }
    },
  }
}
