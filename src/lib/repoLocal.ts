import { epicaDocumentacion, historiasIniciales, sprint0, tareasSprint0 } from './semilla'
import type { Epica, Historia, NuevaEpica, NuevaHistoria, NuevoSprint, Repo, Sprint } from './tipos'

const CLAVE = 'historias-bv:v1'
const EVENTO = 'historias-bv:cambio'

interface Datos {
  historias: Historia[]
  sprints: Sprint[]
  epicas?: Epica[]
  semillado: boolean
}

function leer(): Datos {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (crudo) return JSON.parse(crudo) as Datos
  } catch {
    /* almacenamiento no disponible: arranca vacío */
  }
  return { historias: [], sprints: [], epicas: [], semillado: false }
}

function guardar(d: Datos) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(d))
  } catch {
    /* sin persistencia: queda solo en esta sesión */
  }
  window.dispatchEvent(new Event(EVENTO))
}

const ahora = () => new Date().toISOString()

function aHistoria(h: NuevaHistoria): Historia {
  return { ...h, id: crypto.randomUUID(), created_at: ahora(), updated_at: ahora() }
}

function aEpica(e: NuevaEpica): Epica {
  return { ...e, id: crypto.randomUUID(), created_at: ahora() }
}

function sembrar(d: Datos) {
  const s: Sprint = {
    ...sprint0(),
    id: crypto.randomUUID(),
    created_at: ahora(),
    cerrado_en: null,
  }
  d.sprints.push(s)
  d.historias.push(...tareasSprint0().map((t) => aHistoria({ ...t, sprint_id: s.id })))
  d.historias.push(...historiasIniciales().map(aHistoria))
  d.epicas = d.epicas ?? []
  if (!d.epicas.some((e) => e.nombre === epicaDocumentacion().nombre)) {
    d.epicas.push(aEpica(epicaDocumentacion()))
  }
  d.semillado = true
}

export const repoLocal: Repo = {
  modo: 'local',
  async listar() {
    const d = leer()
    if (!d.semillado && d.historias.length === 0) {
      sembrar(d)
      guardar(d)
    } else if (!d.epicas) {
      // Datos guardados antes de que existieran las épicas.
      d.epicas = [aEpica(epicaDocumentacion())]
      guardar(d)
    }
    return {
      historias: d.historias.map((h) => ({ ...h, epica_id: h.epica_id ?? null })),
      sprints: d.sprints,
      epicas: d.epicas ?? [],
    }
  },
  async crearHistorias(hs) {
    const d = leer()
    for (const h of hs) {
      if (d.historias.some((x) => x.codigo === h.codigo))
        throw new Error(`Ya existe el código ${h.codigo}.`)
    }
    d.historias.push(...hs.map(aHistoria))
    guardar(d)
  },
  async actualizarHistorias(ids, patch) {
    const d = leer()
    d.historias = d.historias.map((h) =>
      ids.includes(h.id) ? { ...h, ...patch, updated_at: ahora() } : h,
    )
    guardar(d)
  },
  async eliminarHistoria(id) {
    const d = leer()
    d.historias = d.historias.filter((h) => h.id !== id)
    guardar(d)
  },
  async crearSprint(s: NuevoSprint) {
    const d = leer()
    d.sprints.push({ ...s, id: crypto.randomUUID(), created_at: ahora(), cerrado_en: null })
    guardar(d)
  },
  async actualizarSprint(id, patch) {
    const d = leer()
    d.sprints = d.sprints.map((s) => (s.id === id ? { ...s, ...patch } : s))
    guardar(d)
  },
  async crearEpica(e) {
    const d = leer()
    d.epicas = [...(d.epicas ?? []), aEpica(e)]
    guardar(d)
  },
  async actualizarEpica(id, patch) {
    const d = leer()
    d.epicas = (d.epicas ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e))
    guardar(d)
  },
  async eliminarEpica(id) {
    const d = leer()
    d.epicas = (d.epicas ?? []).filter((e) => e.id !== id)
    d.historias = d.historias.map((h) => (h.epica_id === id ? { ...h, epica_id: null } : h))
    guardar(d)
  },
  async importarSemilla() {
    const d = leer()
    sembrar(d)
    guardar(d)
  },
  suscribir(alCambiar) {
    window.addEventListener(EVENTO, alCambiar)
    window.addEventListener('storage', alCambiar)
    return () => {
      window.removeEventListener(EVENTO, alCambiar)
      window.removeEventListener('storage', alCambiar)
    }
  },
}
