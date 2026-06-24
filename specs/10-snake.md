# SPEC 10 — Add NEON SNAKE to Arcade Vault

> **Status:** Approved
> **Depends on:** 07-leaderboard-games-table
> **Date:** 2026-06-24
> **Objective:** Integrar NEON SNAKE en Arcade Vault con canvas de juego, routing, leaderboard y modal de game over.

## Scope

**In:**

- Verificación de entrada en array `GAMES` — `lib/data.ts` (ya existe)
- Verificación / INSERT en tabla `games` de Supabase
- `components/games/SnakeGame.tsx` — componente canvas
- `app/games/snake/play/page.tsx` — página de juego
- Cover image `cover-snake` — using sprite assets in `references/source-assets/snake-assets/`

**Out of scope (for future specs):**

- Soporte de audio
- Responsive/mobile canvas
- Power-ups y modo contra-reloj (mencionados en `long` pero no en esta fase)

## Data model

```typescript
// Entry already present in GAMES array in lib/data.ts — no changes needed
{
  id: 'snake',
  title: 'NEON SNAKE',
  short: 'Crece, come, no te choques.',
  long: 'La serpiente de luz regresa con pistas laberínticas y power-ups que cambian las reglas a mitad de partida. Modo contra-reloj incluido.',
  cat: 'ARCADE',
  cover: 'cover-snake',
  color: 'green',
  best: 87300,
  plays: '58.4K',
  difficulty: 2,
}
```

```sql
-- Supabase: verify no existing row, then INSERT if missing
INSERT INTO games (slug, title, short, long, cat, cover, color, best, plays, difficulty)
VALUES (
  'snake', 'NEON SNAKE', 'Crece, come, no te choques.',
  'La serpiente de luz regresa con pistas laberínticas y power-ups que cambian las reglas a mitad de partida. Modo contra-reloj incluido.',
  'ARCADE', 'cover-snake', 'green', 87300, '58.4K', 2
)
ON CONFLICT (slug) DO NOTHING
RETURNING id, slug;
```

## Implementation plan

**Step 1 — Verify GAMES array (`lib/data.ts`)**

Confirmar que ya existe el entry `id: 'snake'` con todos los campos requeridos. No modificar ni reordenar entradas existentes.

---

**Step 2 — Seed game into Supabase `games` table**

Execute via `mcp__supabase__execute_sql`:

```sql
INSERT INTO games (slug, title, short, long, cat, cover, color, best, plays, difficulty)
VALUES (
  'snake', 'NEON SNAKE', 'Crece, come, no te choques.',
  'La serpiente de luz regresa con pistas laberínticas y power-ups que cambian las reglas a mitad de partida. Modo contra-reloj incluido.',
  'ARCADE', 'cover-snake', 'green', 87300, '58.4K', 2
)
ON CONFLICT (slug) DO NOTHING
RETURNING id, slug;
```

Show the returned UUID (or confirm the row already existed). Do NOT CREATE or ALTER tables.

---

**Step 3 — Create cover image `cover-snake`**

Source assets: `references/source-assets/snake-assets/fruits.png` and `sprites.js`.

- Copy `fruits.png` to `public/images/snake-fruits.png`.
- Find where other cover CSS classes are defined in the project (e.g. `cover-arkanoid`, `cover-tetris`) and add `cover-snake` in the same location using the same pattern.
- Design the cover using a selection of fruit sprites from the atlas (apple, strawberry, watermelon, cherry) arranged on a dark green background, drawn onto a static canvas or composed as a CSS background image.
- The cover must render correctly in the game card at `/games`.

---

**Step 4 — Create `components/games/SnakeGame.tsx`**

Read `components/games/AsteroidsGame.tsx` in full before writing. Required patterns:

- Props interface with `paused`, `onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`.
- `pausedRef` and `cbRef` synced on every render (not inside a `useEffect` with deps) so the rAF loop never reads stale props.
- Single `useEffect` for the game loop — all game state lives as closure variables inside it, not in React state.
- No HUD in canvas — fire `cbRef.current.onScoreChange(score)` etc. only when value changes (compare with previous).
- Game states: `'playing'` | `'gameover'`. Fire `cbRef.current.onGameOver(score)` exactly once, guarded by a `gameOverFired` boolean.
- Cleanup: `cancelAnimationFrame(rafId)` + remove all input event listeners.
- Skip all audio (`new Audio(...)` or `AudioContext`).
- Canvas dimensions: **600×600 px** — do not add responsive resizing.

Snake-specific game logic:

- Grid: 30×30 cells of 20 px each (600 / 20 = 30).
- Snake starts at center, length 3, moving right.
- Movement tick: time-based interval (initial ~150 ms/cell), not every rAF frame.
- Controls: Arrow keys + WASD. Ignore 180° reversals (can't go directly back).
- Food: one active fruit at a time, placed at a random empty cell. Use a fruit sprite from `references/source-assets/snake-assets/fruits.png` via `SPRITE_ATLAS` (load image once outside the loop). Cycle through or pick randomly from the atlas entries.
- Copy `references/source-assets/snake-assets/fruits.png` to `public/images/snake-fruits.png` if not already done in Step 3.
- Scoring: +10 per fruit. Every 5 fruits eaten, increment level and decrease tick interval by 10 ms (min 60 ms); fire `onLevelChange`.
- Death: snake head exits grid bounds or collides with its own body → set state to `'gameover'`, fire `onGameOver`.
- `onLivesChange(1)` on mount only (single-life game).

---

**Step 5 — Create `app/games/snake/play/page.tsx`**

Read `app/games/asteroids/play/page.tsx` in full before writing. Required state:

```typescript
const [score, setScore] = useState(0)
const [lives, setLives] = useState(1)
const [level, setLevel] = useState(1)
const [paused, setPaused] = useState(false)
const [isGameOver, setGameOver] = useState(false)
const [finalScore, setFinalScore] = useState(0)
const [playerName, setPlayerName] = useState('')
const [isSaving, setIsSaving] = useState(false)
const [saveError, setSaveError] = useState<string | null>(null)
const [gameKey, setGameKey] = useState(0)
const [gameId, setGameId] = useState<string | null>(null)
```

Required behaviors:

- Fetch `gameId` on mount via `getGame('snake')` — never hardcode the UUID.
- Pre-fill `playerName` from `localStorage.getItem('arcade-vault-player-name') ?? ''` on mount.
- Name input: `maxLength={10}`, `value={playerName.toUpperCase()}`, onChange uppercases.
- Confirm button: `saveScore(gameId, playerName, finalScore)` → write localStorage → `router.push('/games/snake')`. Disable while saving. If `saveScore` throws, set `saveError` and keep modal open.
- Restart button: reset score to 0, lives to 1, level to 1, increment `gameKey`. Does NOT save.
- HUD bar: back link to `/games`, game title `NEON SNAKE`, score, lives, level, pause button.

## Acceptance criteria

- [ ] GET /games — card "NEON SNAKE" aparece en el grid con cover-snake visible
- [ ] GET /games/snake — detail page carga; leaderboard muestra "SÉ EL PRIMERO EN ENTRAR"
- [ ] GET /games/snake/play — canvas 600×600 renderiza sin errores en consola
- [ ] La serpiente se mueve con Arrow keys y WASD; no acepta reversión de 180°
- [ ] Comer una fruta incrementa el score en +10 y muestra un sprite del atlas
- [ ] Cada 5 frutas el nivel sube y la serpiente acelera
- [ ] Chocar con la pared o con el propio cuerpo → modal de game over aparece con score final
- [ ] Si localStorage tiene nombre previo, el input está pre-rellenado
- [ ] Confirmar nombre — score guardado; redirige a /games/snake; fila aparece en leaderboard
- [ ] GET /salon — score guardado aparece en Hall of Fame
- [ ] Reiniciar sin confirmar — score NO guardado (verificado en /games/snake)

## Decisions taken and discarded

- **Audio omitido** — out of scope en esta fase de integración de plataforma.
- **Sin HUD en canvas** — score/lives/level pertenecen a React state, no al canvas; mantiene separación de responsabilidades.
- **pausedRef/cbRef pattern** — leer props directamente dentro de un rAF loop causa stale closures.
- **Canvas size fija 600×600** — sin responsive resizing en esta fase.
- **lives inicial = 1** — NEON SNAKE es single-life: chocar con pared o cuerpo → game over directo, sin respawn.
- **Sin estado 'dead'** — NEON SNAKE no tiene delay de respawn entre vidas.
- **Grid 30×30 celdas de 20 px** — encaja exactamente en 600×600 sin píxeles sobrantes.
- **Tick-based movement, no frame-based** — la serpiente avanza a intervalos de tiempo fijos (~150 ms inicial), independiente del framerate del rAF.
- **GAMES entry ya existente** — el entry en lib/data.ts no requiere modificación; Step 1 es sólo verificación.
- **ON CONFLICT (slug) DO NOTHING** — el INSERT en Supabase es idempotente por si la fila ya existe de una carga anterior.
- **Sprites de frutas del atlas** — se usa `references/source-assets/snake-assets/fruits.png` + `SPRITE_ATLAS` para la comida y el cover, en lugar de figuras geométricas planas.
