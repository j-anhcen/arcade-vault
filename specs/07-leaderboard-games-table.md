# SPEC 07 — Leaderboard y tabla de juegos

> **Status:** Aprobado · **Depends on:** SPEC 04, SPEC 05, SPEC 06 · **Date:** 2026-06-04  
> **Objective:** Persistir scores de Asteroids en Supabase al hacer Game Over y
> mostrar leaderboards por juego y global, migrando el catálogo a una tabla
> Supabase y convirtiendo `/games` en una tabla con datos en vivo.

---

## Scope

**In:**

- **Supabase migrations:**
  - Crear tabla `games` con seed de **un único registro: `asteroids`**
  - Crear tabla `scores` con los campos especificados

- **`lib/data.ts`** — eliminar `GAMES`, `seededScores` y la interfaz `ScoreRow`;
  añadir tipos `Game` y `Score` que reflejen las tablas Supabase;
  añadir cliente Supabase y helpers de fetch

- **`app/games/page.tsx`** — reemplazar galería de tarjetas por una tabla con
  columnas: Nombre, Categoría, Dificultad, Best Score, Plays; botón "Jugar" en
  la fila de Asteroids lleva a `/games/asteroids/play`; el resto muestra "Próximamente"

- **`app/games/[id]/page.tsx`** — añadir sección leaderboard por juego: top 10
  de `scores` filtrado por `game_id`, con columnas Rank, Nombre, Score, Fecha

- **`app/salon/page.tsx`** — nueva ruta: leaderboard global top 10 de `scores`
  (todos los juegos), con columnas Rank, Nombre, Juego, Score, Fecha

- **`app/games/asteroids/play/page.tsx`** — sustituir el overlay de Game Over
  por un modal con input de nombre (pre-relleno desde localStorage), botón
  "Confirmar nombre" que guarda en Supabase y botón "Jugar de nuevo"; si el
  jugador cierra sin confirmar, el score se descarta

**Out of scope:**

- Seed de los 8 juegos restantes del array `GAMES` (se migran en specs futuras)
- El array `GAMES` permanece en `lib/data.ts` para los juegos no migrados aún
- Autenticación / login (el campo `user_id` en `scores` queda nullable y vacío)
- Leaderboard de juegos distintos a Asteroids (los demás no están implementados)
- Paginación del leaderboard (top 10 fijo)
- Moderación, edición o borrado de scores
- Sorting interactivo en la tabla de juegos
- Responsive del canvas de Asteroids

---

## Data model

### Tabla `games` (Supabase)

| Columna      | Tipo    | Restricciones                                            |
| ------------ | ------- | -------------------------------------------------------- |
| `id`         | uuid    | PK, default gen_random_uuid()                            |
| `slug`       | text    | unique, not null (usado para routing, ej. `'asteroids'`) |
| `title`      | text    | not null                                                 |
| `short`      | text    |                                                          |
| `long`       | text    |                                                          |
| `cat`        | text    |                                                          |
| `cover`      | text    |                                                          |
| `color`      | text    |                                                          |
| `best`       | integer |                                                          |
| `plays`      | text    |                                                          |
| `difficulty` | integer |                                                          |

**Seed:** un único registro con los datos de `asteroids`.

---

### Tabla `scores` (Supabase)

| Columna       | Tipo      | Restricciones                 |
| ------------- | --------- | ----------------------------- |
| `id`          | uuid      | PK, default gen_random_uuid() |
| `game_id`     | uuid      | FK → `games.id`, not null     |
| `player_name` | text      | not null                      |
| `score`       | integer   | not null                      |
| `user_id`     | uuid      | nullable                      |
| `created_at`  | timestamp | default now()                 |

> **Nota:** `game_id` se define como `uuid` (no `text`) para mantener coherencia
> con la PK de `games`. El routing sigue usando `slug` — ver Decisions.

---

### Tipos TypeScript (`lib/data.ts`)

```ts
export interface Game {
  id: string // uuid
  slug: string
  title: string
  short: string
  long: string
  cat: string
  cover: string
  color: 'cyan' | 'magenta' | 'yellow' | 'green'
  best: number
  plays: string
  difficulty: number
}

export interface Score {
  id: string
  game_id: string
  player_name: string
  score: number
  user_id: string | null
  created_at: string
}
```

El array `GAMES` y la función `seededScores` permanecen en `lib/data.ts`
durante esta spec para los juegos aún no migrados a Supabase, pero dejarán
de usarse en `/games/page.tsx`.

---

## Implementation plan

1. **Migration: crear tabla `games` con seed.**
   Aplicar migration SQL que crea la tabla `games` e inserta el registro de
   Asteroids. El catálogo ya tiene un juego disponible desde Supabase.

2. **Migration: crear tabla `scores`.**
   Aplicar migration SQL que crea la tabla `scores` con FK a `games.id`.

3. **Actualizar `lib/data.ts` — tipos y helpers de fetch.**
   - Añadir interfaces `Game` y `Score` alineadas con las tablas Supabase.
   - Añadir helpers:
     - `getGames()` → `Game[]` — todos los juegos
     - `getGame(slug: string)` → `Game | null` — juego por slug
     - `getTopScoresByGame(gameId: string, limit = 10)` → `Score[]`
     - `getTopScoresGlobal(limit = 10)` → `Score & { game_slug: string }[]`
     - `saveScore(gameId: string, playerName: string, score: number)` → `void`
   - El array `GAMES` y `seededScores` permanecen sin cambios (los usan
     otras partes del proyecto aún no migradas).

4. **Actualizar `app/games/page.tsx` — tabla de juegos.**
   - Cambiar de galería de tarjetas a tabla con columnas:
     Nombre, Categoría, Dificultad, Best Score, Plays, Acción.
   - Leer datos desde `getGames()` (Server Component, fetch en build time).
   - Fila de Asteroids: botón "Jugar" → `/games/asteroids/play`.
   - Resto de filas: badge "Próximamente" en lugar de botón.

5. **Actualizar `app/games/[id]/page.tsx` — leaderboard por juego.**
   - Leer el juego con `getGame(slug)` en lugar del array `GAMES`.
   - Añadir sección "Top 10" al final de la página usando
     `getTopScoresByGame(game.id)`.
   - Si no hay scores aún, mostrar estado vacío ("Sé el primero en entrar").

6. **Crear `app/salon/page.tsx` — leaderboard global.**
   - Server Component que llama `getTopScoresGlobal()`.
   - Tabla con columnas: Rank, Nombre, Juego, Score, Fecha.
   - Si no hay scores, mostrar estado vacío.

7. **Actualizar `app/games/asteroids/play/page.tsx` — modal Game Over.**
   - Al disparar `onGameOver(score)`, mostrar un modal (no el overlay de
     canvas) con:
     - Score final
     - Input de nombre pre-relleno desde `localStorage.getItem('arcade-vault-player-name')`
     - Botón "Confirmar nombre": llama `saveScore(...)`, guarda el nombre en
       `localStorage.setItem('arcade-vault-player-name', name)`, cierra modal
     - Botón "Jugar de nuevo": descarta el score, reinicia la partida
   - Si el jugador cierra el modal sin confirmar, el score se descarta.

8. **Verificar enlace `/salon` en la navegación.**
   - Confirmar que la nav principal ya incluye el enlace a `/salon` o
     añadirlo si falta.

---

## Acceptance criteria

- [ ] La tabla `games` existe en Supabase con el registro de Asteroids
- [ ] La tabla `scores` existe en Supabase con la FK correcta a `games.id`
- [ ] `GET /games` muestra una tabla (no galería) con los datos de Asteroids
      leídos desde Supabase
- [ ] La fila de Asteroids en `/games` tiene un botón "Jugar" que navega a
      `/games/asteroids/play`
- [ ] Las filas de juegos sin implementar muestran "Próximamente" en lugar
      del botón "Jugar"
- [ ] `GET /games/asteroids` incluye una sección leaderboard con top 10 scores
      de Asteroids; si no hay scores, muestra el estado vacío
- [ ] `GET /salon` carga sin errores y muestra el leaderboard global top 10;
      si no hay scores, muestra el estado vacío
- [ ] Al hacer Game Over en Asteroids, aparece un modal con el score final y
      un input de nombre
- [ ] Si hay un nombre en localStorage, el input aparece pre-relleno con ese valor
- [ ] Al pulsar "Confirmar nombre", el score se guarda en la tabla `scores` de
      Supabase con el `game_id` correcto
- [ ] Tras confirmar, el nombre queda guardado en
      `localStorage` con clave `arcade-vault-player-name`
- [ ] Al pulsar "Jugar de nuevo" sin confirmar, el score no se guarda en Supabase
- [ ] El leaderboard en `/games/asteroids` refleja el score recién guardado
      al recargar la página
- [ ] `npm run dev` arranca sin errores de TypeScript ni de compilación

---

## Decisions

- **Sí: añadir campo `slug` a la tabla `games` además de la PK uuid.**
  El routing de Next.js usa el parámetro `[id]` como slug de texto
  (ej. `'asteroids'`). Sin un campo `slug`, no habría forma de hacer
  `getGame('asteroids')` desde la URL sin una segunda tabla o un mapeo manual.

- **Sí: `scores.game_id` como `uuid` FK a `games.id`, no `text`.**
  Mantener la FK sobre la PK uuid garantiza integridad referencial en Supabase.
  El slug solo se usa para routing; internamente todas las relaciones van por uuid.

- **Sí: helpers de fetch en `lib/data.ts` en lugar de un archivo nuevo.**
  El proyecto ya centraliza la capa de datos ahí. Añadir los helpers al mismo
  archivo evita fragmentar una capa que hoy es un único punto de verdad.

- **Sí: mantener el array `GAMES` y `seededScores` durante esta spec.**
  Otras rutas del proyecto (home, nav) pueden depender del array. Eliminarlos
  es scope de una spec futura de migración completa.

- **Sí: localStorage con clave `arcade-vault-player-name`.**
  Clave con prefijo de proyecto para evitar colisiones con otras apps en el
  mismo dominio durante desarrollo.

- **Sí: descartar el score si el jugador cierra el modal sin confirmar.**
  Guardar scores sin nombre asociado contamina el leaderboard. El jugador
  tuvo la oportunidad de confirmar y eligió no hacerlo.

- **No: paginación en el leaderboard.** Top 10 fijo es suficiente para la
  motivación competitiva en esta fase. Se puede ampliar en un spec posterior.

- **No: mostrar `user_id` en el leaderboard.** No hay autenticación aún;
  el campo queda nullable y sin uso visible hasta que se implemente auth.

---

## Risks

| Riesgo                                                                                                                      | Mitigación                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getGames()` falla en build time si las variables de entorno de Supabase no están configuradas en el entorno de despliegue  | Verificar que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` existen antes de hacer deploy; el error se manifestará en `npm run build`, no en runtime |
| El leaderboard en `/games/[id]` y `/salon` puede quedar desactualizado si Next.js cachea el fetch de Supabase agresivamente | Usar `{ cache: 'no-store' }` en los fetches del leaderboard para garantizar datos frescos en cada request                                                           |
| React StrictMode puede intentar llamar `saveScore` dos veces en desarrollo al montar el componente                          | El guardado se dispara solo en el click del botón "Confirmar", no en un `useEffect` — no hay riesgo de doble inserción                                              |
| El modal de Game Over puede quedar sin cerrar si `saveScore` lanza un error de red                                          | Añadir manejo de error en el botón "Confirmar": mostrar mensaje de error en el modal sin cerrarlo, permitiendo reintentar                                           |
