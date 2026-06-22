# SPEC 08 — Add TETRIS to Arcade Vault

> **Status:** Implemented
> **Depends on:** 07-leaderboard-games-table
> **Date:** 2026-06-22
> **Objective:** Integrar TETRIS en Arcade Vault con canvas de juego, routing, leaderboard y modal de game over.

## Scope

**In:**

- Entrada en array `GAMES` — `lib/data.ts`
- INSERT en tabla `games` de Supabase
- `components/games/TetrisGame.tsx` — componente canvas
- `app/games/tetris/play/page.tsx` — página de juego

**Out of scope (for future specs):**

- Diseño del cover image `cover-tetris`
- Soporte de audio
- Responsive/mobile canvas

## Data model

```typescript
// Entry to add to GAMES array in lib/data.ts
{
  id: 'tetris',
  title: 'TETRIS',
  short: 'Stack falling tetrominoes, clear lines, and survive the ever-increasing speed.',
  long: 'The timeless puzzle game. Rotate and drop tetrominoes to fill rows and clear them from the board. Lines cleared give points — four at once scores a Tetris. The pace quickens with every 10 lines. How long can you last?',
  cat: 'PUZZLE',
  cover: 'cover-tetris',
  color: 'cyan',
  best: 48500,
  plays: '18.7K',
  difficulty: 2,
}
```

```sql
-- Supabase INSERT (Step 2)
INSERT INTO games (slug, title, short, long, cat, cover, color, best, plays, difficulty)
VALUES ('tetris', 'TETRIS', 'Stack falling tetrominoes, clear lines, and survive the ever-increasing speed.', 'The timeless puzzle game. Rotate and drop tetrominoes to fill rows and clear them from the board. Lines cleared give points — four at once scores a Tetris. The pace quickens with every 10 lines. How long can you last?', 'PUZZLE', 'cover-tetris', 'cyan', 48500, '18.7K', 2)
RETURNING id, slug;
```

## Implementation plan

**Step 1 — Add entry to GAMES array (`lib/data.ts`)**

Append this object to the `GAMES` array following the shape of the `asteroids` entry:

```typescript
{
  id: 'tetris',
  title: 'TETRIS',
  short: 'Stack falling tetrominoes, clear lines, and survive the ever-increasing speed.',
  long: 'The timeless puzzle game. Rotate and drop tetrominoes to fill rows and clear them from the board. Lines cleared give points — four at once scores a Tetris. The pace quickens with every 10 lines. How long can you last?',
  cat: 'PUZZLE',
  cover: 'cover-tetris',
  color: 'cyan',
  best: 48500,
  plays: '18.7K',
  difficulty: 2,
}
```

Rules: `id` must equal the slug string (not a UUID). Do not modify or reorder existing entries.

---

**Step 2 — Seed game into Supabase `games` table**

Execute via `mcp__supabase__execute_sql`:

```sql
INSERT INTO games (slug, title, short, long, cat, cover, color, best, plays, difficulty)
VALUES ('tetris', 'TETRIS', 'Stack falling tetrominoes, clear lines, and survive the ever-increasing speed.', 'The timeless puzzle game. Rotate and drop tetrominoes to fill rows and clear them from the board. Lines cleared give points — four at once scores a Tetris. The pace quickens with every 10 lines. How long can you last?', 'PUZZLE', 'cover-tetris', 'cyan', 48500, '18.7K', 2)
RETURNING id, slug;
```

Show the returned UUID to the user. Do NOT create or ALTER tables — only INSERT.

---

**Step 3 — Create `components/games/TetrisGame.tsx`**

Read `components/games/AsteroidsGame.tsx` in full before writing. Required patterns:

- Props interface with `paused`, `onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`.
- `pausedRef` and `cbRef` synced on every render (not inside a `useEffect` with deps) so the rAF loop never reads stale props.
- Single `useEffect` for the game loop — all game state lives as closure variables inside it, not in React state.
- No HUD in canvas — fire `cbRef.current.onScoreChange(score)` etc. only when value changes (compare with previous).
- Game states: `'playing'` | `'gameover'`. Fire `cbRef.current.onGameOver(score)` exactly once, guarded by a `gameOverFired` boolean.
- Cleanup: `cancelAnimationFrame(rafId)` + remove all input event listeners.
- Skip all audio (`new Audio(...)` or `AudioContext`).
- Canvas dimensions: 300×600px — do not add responsive resizing.
- Port logic from `references/started-games/03-tetris/game.js`: board matrix, piece shapes, `rotateCW()`, `collide()`, `clearLines()`, `ghostY()`, scoring (`LINE_SCORES = [0,100,300,500,800]` × level), and speed formula (`max(100, 1000 − (level−1) × 90)` ms).
- Render the next-piece preview on a second `<canvas>` element (120×120px) inside the component — do not put it in the HUD bar.

---

**Step 4 — Create `app/games/tetris/play/page.tsx`**

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

- Fetch `gameId` on mount via `getGame('tetris')` — never hardcode the UUID.
- Pre-fill `playerName` from `localStorage.getItem('arcade-vault-player-name') ?? ''` on mount.
- Name input: `maxLength={10}`, `value={playerName.toUpperCase()}`, onChange uppercases.
- Confirm button: `saveScore(gameId, playerName, finalScore)` → write localStorage → `router.push('/games/tetris')`. Disable while saving. If `saveScore` throws, set `saveError` and keep modal open.
- Restart button: reset score to `0`, lives to `1`, level to `1`, increment `gameKey`. Does NOT save.
- HUD bar: back link to `/games`, game title `TETRIS`, score, lives, level, pause button.

## Acceptance criteria

- [ ] GET /games — card "TETRIS" aparece en el grid
- [ ] GET /games/tetris — detail page carga; leaderboard muestra "SÉ EL PRIMERO EN ENTRAR"
- [ ] GET /games/tetris/play — canvas renderiza sin errores en consola
- [ ] Jugar hasta game over — modal aparece con score final e input de nombre
- [ ] Si localStorage tiene nombre previo, el input está pre-rellenado
- [ ] Confirmar nombre — score guardado; redirige a /games/tetris; fila aparece en leaderboard
- [ ] GET /salon — score guardado aparece en Hall of Fame
- [ ] Reiniciar sin confirmar — score NO guardado (verificado en /games/tetris)

## Decisions taken and discarded

- **Audio omitido** — out of scope en esta fase de integración de plataforma.
- **Sin HUD en canvas** — score/lives/level pertenecen a React state, no al canvas; mantiene separación de responsabilidades.
- **pausedRef/cbRef pattern** — leer props directamente dentro de un rAF loop causa stale closures.
- **Canvas size fija** — sin responsive resizing en esta fase.
- **lives inicial = 1** — Tetris es single-life: top-out (spawn inmediato con colisión) → game over directo, sin respawn.
- **Sin estado 'dead'** — Tetris no tiene delay de respawn entre vidas.
- **Next-piece preview en canvas secundario** — renderizado en un `<canvas>` de 120×120px dentro del componente, no en la barra HUD, siguiendo la arquitectura del reference.
- **Skin por defecto: retro** — el reference incluye tres skins (retro/neon/pastel); se usa retro como único skin en la integración para mantener el scope acotado.
- **cover-tetris no existe aún** — los covers disponibles son cover-bricks, cover-tetro, cover-snake, cover-glot, cover-invaders, cover-rocas, cover-rana y cover-duelo. El campo `cover: 'cover-tetris'` se registra con el nombre definitivo para cuando se diseñe el asset; la plataforma aplica un fallback visual mientras tanto (mismo patrón que asteroids).
