---
id: 01
estado: Implementado
fecha: 2026-05-26
dependencias: ninguna
---

**Objetivo:** Implementar el shell visual completo de Arcade Vault en Next.js App Router —
navegación, biblioteca, detalle, reproductor, auth y salón de la fama— sin lógica de juego real.

---

## Scope

### Dentro del scope

- Layout raíz (`app/layout.tsx`): fondo `.av-bg`, ruido `.av-noise`, footer, fuentes
- Componente `<Nav>` con navegación desktop y panel mobile
- Ruta `/` → redirige a `/biblioteca`
- Ruta `/biblioteca` → página con hero, filtros, grid de cards (8 juegos mock)
- Ruta `/detalle/[id]` → página con cover, stats, leaderboard lateral (datos seeded)
- Ruta `/player/[id]` → página con HUD, pantalla CRT animada, modal "Fin del juego"
- Ruta `/auth` → página con tabs login/registro, botones sociales (sin backend)
- Ruta `/salon` → página con podio top 3, tabla de scores por juego (tabs)
- Datos compartidos: array `GAMES`, `CATS`, función `seededScores` en `lib/data.ts`
- Tipos TypeScript: `Game`, `RouteParams`
- Animación decorativa del reproductor: score ticker, nave y enemigos CSS

### Fuera del scope

- Lógica de juego real (colisiones, input de teclado, game loop)
- Autenticación real (sin NextAuth, sin base de datos)
- Persistencia real de scores (sin API, sin DB)
- Internacionalización
- Tests

---

## Data model

### `lib/data.ts`

```ts
export interface Game {
  id: string
  title: string
  short: string
  long: string
  cat: string
  cover: string   // clase CSS: "cover-bricks" | "cover-tetro" | ...
  color: "cyan" | "magenta" | "yellow" | "green"
  best: number
  plays: string
}

export const GAMES: Game[] = [ /* 8 juegos del template */ ]
export const CATS: string[] = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export function seededScores(seed: number, count?: number): ScoreRow[]
```

```ts
export interface ScoreRow {
  rank: number
  name: string
  score: number
  date: string
}
```

No se introduce ningún modelo de persistencia. Todos los datos son constantes en memoria.

---

## Plan de implementación

1. Crear `lib/data.ts` con `Game`, `ScoreRow`, `GAMES`, `CATS`, `seededScores`
2. Crear `components/Nav.tsx` (`'use client'`) con navegación desktop y panel mobile
3. Actualizar `app/layout.tsx`: importar fuentes (Press Start 2P, JetBrains Mono),
   montar `.av-bg`, `.av-noise`, `<Nav>`, `<main>`, footer
4. Crear `app/page.tsx`: redirect a `/biblioteca`
5. Crear `app/biblioteca/page.tsx` (`'use client'`): hero, búsqueda, chips de categoría,
   grid de `<GameCard>` con tilt 3D, navega a `/detalle/[id]`
6. Crear `app/detalle/[id]/page.tsx` (`'use client'`): cover, tags, stats, descripción,
   leaderboard lateral con `seededScores`, botones a `/player/[id]` y `/biblioteca`
7. Crear `app/player/[id]/page.tsx` (`'use client'`): HUD con score ticker animado,
   pantalla CRT con nave y enemigos CSS, modal "Fin del juego"
8. Crear `app/auth/page.tsx` (`'use client'`): tabs login/registro, campos, botones sociales
9. Crear `app/salon/page.tsx` (`'use client'`): podio top 3, tabs por juego, tabla completa

---

## Criterios de aceptación

- [ ] `npm run dev` arranca sin errores de TypeScript ni de compilación
- [ ] `/` redirige a `/biblioteca`
- [ ] `/biblioteca` muestra los 8 juegos; filtrar por categoría oculta los que no corresponden;
      buscar por nombre filtra en tiempo real
- [ ] Hacer clic en una card navega a `/detalle/[id]` con el juego correcto
- [ ] `/detalle/[id]` muestra cover, stats del juego y leaderboard con 10 filas seeded
- [ ] El botón "JUGAR AHORA" navega a `/player/[id]`
- [ ] `/player/[id]` muestra HUD con score que sube solo, nave animada y enemigos CSS
- [ ] El botón "FIN" abre el modal "FIN DEL JUEGO" con la puntuación final
- [ ] `/auth` muestra el tab "INICIAR SESIÓN" por defecto; cambiar a "CREAR CUENTA"
      muestra el campo de email
- [ ] `/salon` muestra podio con top 3; cambiar de tab actualiza la tabla y el podio
- [ ] El `<Nav>` aparece en todas las rutas; en mobile muestra el hamburger y el panel lateral
- [ ] No hay errores en consola del navegador en ninguna de las 5 rutas

---

## Decisiones tomadas y descartadas

### Tomadas

- **App Router file-based** en lugar de SPA hash-routing: estándar del stack Next.js 16,
  mejor separación de rutas y soporte nativo de SSR/RSC.
- **`globals.css` tal como está** para los estilos específicos del tema (CRT, neon, grids),
  complementado con Tailwind v4 para utilidades puntuales. Evita riesgo de diferencias
  visuales al reescribir 900+ líneas de CSS.
- **Animación decorativa en el reproductor** (score ticker + enemigos CSS): aporta
  verosimilitud visual sin añadir lógica de juego real.
- **Tipos básicos** (`Game`, `ScoreRow`): suficientes para un MVP tipado sin over-engineering.
- **`'use client'`** explícito solo en componentes con estado o event handlers;
  el resto permanece como Server Components.

### Descartadas

- **Reescribir estilos en Tailwind v4**: riesgo alto de diferencias visuales en animaciones
  complejas (gridscroll, flicker, scanlines) por beneficio mínimo en un MVP.
- **Autenticación real**: fuera del alcance del MVP visual; se deja como pantalla estática.
- **Persistencia de scores**: sin backend en este spec; los datos son siempre mock/seeded.

---

## Riesgos identificados

- **Next.js 16 tiene breaking changes** (advertencia explícita en `AGENTS.md`): antes de
  escribir cualquier código hay que leer `node_modules/next/dist/docs/`. APIs de layout,
  metadata o fuentes pueden diferir del comportamiento conocido.

- **`#root` en `globals.css`**: el CSS referencia `#root` (convención de React SPA),
  pero Next.js App Router no genera ese id. Habrá que ajustar el selector al elemento
  raíz real que use Next.js 16 (probablemente `body` o un wrapper propio).

- **Fuentes**: el template las carga vía `<link>` de Google Fonts. En Next.js hay que
  cargarlas con `next/font/google` para evitar layout shift y cumplir con la
  configuración del proyecto.
