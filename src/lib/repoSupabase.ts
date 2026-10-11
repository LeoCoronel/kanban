import { createClient } from '@supabase/supabase-js'
import { epicaDocumentacion, historiasIniciales, sprint0, tareasSprint0 } from './semilla'
import type { Epica, Historia, Repo, Sprint } from './tipos'

export function crearRepoSupabase(url: string, clave: string): Repo {
  const sb = createClient(url, clave)

  const fallar = (error: { message: string } | null) => {
    if (error) throw new Error(error.message)
  }

  return {
    modo: 'supabase',
    async listar() {
      const [h, s, e] = await Promise.all([
        sb.from('historias').select('*').order('orden', { ascending: true }),
        sb.from('sprints').select('*').order('created_at', { ascending: true }),
        sb.from('epicas').select('*').order('created_at', { ascending: true }),
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
        historias: (h.data ?? []) as Historia[],
        sprints: (s.data ?? []) as Sprint[],
        epicas: (e.data ?? []) as Epica[],
      }
    },
    async crearHistorias(hs) {
      const { error } = await sb.from('historias').insert(hs)
      fallar(error)
    },
    async actualizarHistorias(ids, patch) {
      const { error } = await sb.from('historias').update(patch).in('id', ids)
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
      const { error: e2 } = await sb.from('historias').insert(filas)
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
        .subscribe()
      return () => {
        void sb.removeChannel(canal)
      }
    },
  }
}
