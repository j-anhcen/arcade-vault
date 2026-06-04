# SPEC 06 — Reorganización de rutas: /games

> **Status:** Implementado · **Depends on:** SPEC 02, SPEC 05 · **Date:** 2026-06-03
> **Objective:** Unificar las rutas de biblioteca, detalle y partida bajo
> el prefijo `/games`, eliminando `/biblioteca`, `/detalle`, `/juegos` y `/player`.

---

## Scope

**In:**

- `app/games/page.tsx` — renombrar/mover desde `app/biblioteca/page.tsx`
- `app/games/[id]/page.tsx` — mover desde `app/detalle/[id]/page.tsx`
- `app/games/asteroids/play/page.tsx` — mover desde `app/juegos/asteroids/play/page.tsx`
- Actualizar todos los enlaces internos que apuntan a las rutas eliminadas:
  - `/biblioteca` → `/games`
  - `/detalle/[id]` → `/games/[id]`
  - `/juegos/asteroids/play` → `/games/asteroids/play`
- Eliminar las carpetas `app/biblioteca/`, `app/detalle/`, `app/juegos/` y `app/player/`

**Out of scope:**

- Cambios de contenido o diseño en ninguna de las páginas movidas
- Rutas `/salon`, `/about` y `/auth`
- Implementación de nuevos juegos
- Guardado de puntuaciones en Supabase

---

## Data model

No aplica. Esta spec solo reorganiza rutas; no introduce estructuras de datos nuevas.

---

## Implementation plan

1. **Crear `app/games/page.tsx`** — copiar `app/biblioteca/page.tsx` y actualizar
   los dos `router.push('/detalle/${game.id}')` (líneas 28 y 33) a `/games/${game.id}`.

2. **Crear `app/games/[id]/page.tsx`** — copiar `app/detalle/[id]/page.tsx` y:
   - Actualizar los dos `href="/biblioteca"` (líneas 28 y 75) a `href="/games"`.
   - Eliminar el botón `<Link href={'/player/${game.id}'}...>` (línea 72), ya que
     la ruta `/player` desaparece y no tiene reemplazo.

3. **Crear `app/games/asteroids/play/page.tsx`** — copiar
   `app/juegos/asteroids/play/page.tsx` y actualizar los dos
   `href="/biblioteca"` (líneas 66 y 452) a `href="/games"`.

4. **Actualizar `app/page.tsx`** (home) — corregir los cuatro `router.push`
   con rutas antiguas:
   - Línea 197: `/biblioteca` → `/games`
   - Línea 234: `/detalle/` → `/games/`
   - Línea 238: `/biblioteca` → `/games`
   - Línea 351: `/biblioteca` → `/games`

5. **Eliminar las carpetas obsoletas:**
   - `app/biblioteca/`
   - `app/detalle/`
   - `app/juegos/`
   - `app/player/`

6. **Verificar:** `npm run dev` sin errores de compilación; navegar por
   `/games`, `/games/asteroids`, `/games/asteroids/play` y la home page
   confirmando que todos los enlaces funcionan.

---

## Acceptance criteria

- [X] `GET /games` devuelve la página de biblioteca sin errores
- [X] `GET /games/[id]` (cualquier juego no implementado) muestra la página de detalle
- [X] `GET /games/asteroids` muestra la página de detalle de Asteroids
- [X] `GET /games/asteroids/play` carga el juego Asteroids sin errores de consola
- [X] El botón "Explorar juegos" y "Ver todos los juegos" de la home navegan a `/games`
- [X] Las MiniCards de la home navegan a `/games/[id]`
- [X] Las tarjetas de `/games` navegan a `/games/[id]`
- [X] El botón "Volver" en `/games/[id]` navega a `/games`
- [X] El botón "Volver" en `/games/asteroids/play` navega a `/games`
- [X] `GET /biblioteca`, `GET /detalle/[id]`, `GET /juegos/asteroids/play` y
      `GET /player/[id]` devuelven 404
- [X] `npm run dev` arranca sin errores de TypeScript ni de compilación

---

## Decisions

- **Sí: `/games/[id]` como ruta dinámica única para todos los juegos.**
  Asteroids usa la misma plantilla de detalle que los juegos no implementados;
  no necesita su propia `app/games/asteroids/page.tsx`. Next.js resuelve
  `/games/asteroids` contra el segmento dinámico `[id]` sin conflicto con
  `app/games/asteroids/play/page.tsx`.

- **Sí: eliminar el botón que enlazaba a `/player/[id]` en la página de detalle.**
  La ruta `/player` desaparece sin reemplazo; mantener el botón dejaría un
  enlace roto. No se considera cambio de contenido sino saneamiento necesario.

- **No: añadir redirecciones 301 desde las rutas antiguas.** Las rutas antiguas
  son internas de la plataforma, no indexadas públicamente. Una redirección
  añadiría configuración extra sin valor real para el usuario.

- **No: tocar `/salon`, `/about` ni `/auth`.** Quedan fuera del alcance de
  esta spec para mantener el cambio acotado y reversible.
