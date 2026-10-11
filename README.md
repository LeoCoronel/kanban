# Historias BV

App del equipo para gestionar las historias de usuario de **centralBV**: tablero kanban, backlog en tabla y sprints que se pueden cerrar.

- **Tablero:** columna _Backlog_ + columnas del sprint activo (_Por hacer, En progreso, En revisión, Hecho_). Las tarjetas se arrastran entre columnas.
- **Cierre de sprint:** al cerrar un sprint se crea una columna propia (como _Sprint 0_) con todas sus tarjetas, de solo lectura. Las tarjetas sin terminar vuelven al backlog o pasan a otro sprint planificado.
- **Planificación:** columna _Sin asignar_ + una columna por sprint (activo y planificados). Se arrastran tarjetas para decidir de antemano qué se trabaja en cada sprint; cada columna suma el esfuerzo.
- **Épicas:** agrupan tarjetas de un tema. Las _transversales_ (ej.: Documentación) se trabajan en todos los sprints y pueden generar una tarjeta por sprint de un solo paso. Cada tarjeta muestra su sprint y su épica.
- **Backlog:** tabla con filtros (versión, prioridad, responsable, texto) y orden por columna.
- **Sprints:** crear, editar, iniciar y cerrar; avance por sprint y listado de tarjetas.
- **Tiempo real:** los cambios de una persona se ven en las demás sin recargar (Supabase Realtime).

Stack: React 19 · TypeScript · Vite · Tailwind v4 (tokens del design system de centralBV, solo modo oscuro) · Supabase · dnd-kit · Lucide.

## Puesta en marcha

```bash
npm install
npm run dev
```

Sin variables de entorno la app corre en **modo demo**: guarda todo en el navegador (`localStorage`) y se siembra sola con el backlog inicial. Sirve para probar, pero los datos no se comparten.

### Conectar Supabase (datos compartidos del equipo)

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor** pegar y ejecutar [`supabase/schema.sql`](supabase/schema.sql).
3. En **Project Settings → API** copiar la _Project URL_ y la _anon public key_.
4. Copiar `.env.example` a `.env.local` y completar los dos valores.
5. `npm run dev`. En el tablero vacío, tocar **Cargar backlog inicial** (33 historias + Sprint 0).

> La app no tiene login: quien tenga la URL y la anon key puede leer y escribir. Para cerrarla, activar _Password Protection_ en Vercel o sumar Supabase Auth y ajustar las políticas RLS de `schema.sql`.

### Actualizar una base que ya tenías

Si tu proyecto de Supabase ya tenía las tablas de una versión anterior, ejecutá una vez [`supabase/migracion-epicas.sql`](supabase/migracion-epicas.sql) (agrega épicas sin tocar las tarjetas). Para proyectos nuevos alcanza con `schema.sql`.

### Plan de la Release 1

[`supabase/plan-release-1.sql`](supabase/plan-release-1.sql) crea los Sprints 1 a 4 con las fechas y objetivos del Mapa de Releases, tres épicas temáticas y asigna las historias US01–US14 a su épica y sprint. Se ejecuta una vez, después de `migracion-epicas.sql`.

### Desplegar en Vercel (vía GitHub)

1. Subir el repo a GitHub.
2. En Vercel: **Add New → Project** → importar el repo (detecta Vite solo, `vercel.json` ya está).
3. En **Environment Variables** cargar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Cada push a `main` despliega a producción; cada PR genera un preview.

## Scripts

| Comando          | Qué hace                        |
| ---------------- | ------------------------------- |
| `npm run dev`    | Servidor de desarrollo          |
| `npm run build`  | Typecheck + build de producción |
| `npm run lint`   | ESLint                          |
| `npm run format` | Prettier                        |

## Estructura

```
src/
  components/   UI compartida (tarjeta, modales, filtros, navegación)
    ui/         Botón, insignia, modal, campos (según el design system)
  lib/          tipos, datos (Supabase y modo local), provider, utilidades, semilla
  pages/        Tablero, Backlog, Sprints
  styles/       tokens.css (design system) + index.css
  data/         backlog.json (backlog inicial extraído del Excel)
supabase/       schema.sql
```

## Design system

`src/styles/tokens.css` es el mismo archivo del front de centralBV: dark, sin sombras, rojo de marca como acento, Inter + JetBrains Mono, estados con color + glifo + texto. Si cambian los tokens en un repo, copiar el archivo al otro.

## Flujo de trabajo

- Ramas: `main` (producción) y `develop` (integración); features en `feat/us05-dashboard`.
- Commits en español, estilo convencional: `feat: tablero kanban`, `fix: filtro de prioridad`.
- Todo PR pasa por CI (`lint` + `build`) y usa la plantilla de PR.
