import { repoLocal } from './repoLocal'
import { crearRepoSupabase } from './repoSupabase'
import type { Repo } from './tipos'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Con variables de Supabase usa la base compartida; sin ellas, guarda en el navegador (modo demo). */
export const repo: Repo = url && clave ? crearRepoSupabase(url, clave) : repoLocal
