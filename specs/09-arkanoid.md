# SPEC 09 — Add ARKANOID to Arcade Vault

> **Status:** Approved
> **Depends on:** 07-leaderboard-games-table
> **Date:** 2026-06-22
> **Objective:** Integrar ARKANOID en Arcade Vault con canvas de juego, routing, leaderboard y modal de game over.

## Scope

**In:**

- Entrada en array `GAMES` — `lib/data.ts`
- INSERT en tabla `games` de Supabase
- `components/games/ArkanoidGame.tsx` — componente canvas
- `app/games/arkanoid/play/page.tsx` — página de juego
- Cover image `cover-arkanoid` — diseño CSS/asset para la game card
- Audio: sonido de rebote al chocar la pelota con la paleta, y sonido de destrucción al romper un bloque

**Out of scope (for future specs):**

- Responsive/mobile canvas

## Data model

```typescript
// Entry to add to GAMES array in lib/data.ts
{
  id: 'arkanoid',
  title: 'ARKANOID',
  short: 'Classic brick-breaking arcade — keep the ball in play and destroy all blocks',
  long: 'Control your paddle to bounce the ball and smash through waves of colorful blocks across 5 levels of escalating speed. A timeless arcade classic that rewards precision and reflexes.',
  cat: 'ARCADE',
  cover: 'cover-arkanoid',
  color: 'cyan',
  best: 48250,
  plays: '8.7K',
  difficulty: 2,
}
```

```sql
-- Supabase INSERT (Step 2)
INSERT INTO games (slug, title, short, long, cat, cover, color, best, plays, difficulty)
VALUES ('arkanoid', 'ARKANOID', 'Classic brick-breaking arcade — keep the ball in play and destroy all blocks', 'Control your paddle to bounce the ball and smash through waves of colorful blocks across 5 levels of escalating speed. A timeless arcade classic that rewards precision and reflexes.', 'ARCADE', 'cover-arkanoid', 'cyan', 48250, '8.7K', 2)
RETURNING id, slug;
```

## Implementation plan

**Step 1 — Add entry to GAMES array (`lib/data.ts`)**

Append this object to the `GAMES` array following the shape of the `asteroids` entry:

```typescript
{
  id: 'arkanoid',
  title: 'ARKANOID',
  short: 'Classic brick-breaking arcade — keep the ball in play and destroy all blocks',
  long: 'Control your paddle to bounce the ball and smash through waves of colorful blocks across 5 levels of escalating speed. A timeless arcade classic that rewards precision and reflexes.',
  cat: 'ARCADE',
  cover: 'cover-arkanoid',
  color: 'cyan',
  best: 48250,
  plays: '8.7K',
  difficulty: 2,
}
```

Rules: `id` must equal the slug string (not a UUID). Do not modify or reorder existing entries.

---

**Step 2 — Seed game into Supabase `games` table**

Execute via `mcp__supabase__execute_sql`:

```sql
INSERT INTO games (slug, title, short, long, cat, cover, color, best, plays, difficulty)
VALUES ('arkanoid', 'ARKANOID', 'Classic brick-breaking arcade — keep the ball in play and destroy all blocks', 'Control your paddle to bounce the ball and smash through waves of colorful blocks across 5 levels of escalating speed. A timeless arcade classic that rewards precision and reflexes.', 'ARCADE', 'cover-arkanoid', 'cyan', 48250, '8.7K', 2)
RETURNING id, slug;
```

Show the returned UUID to the user. Do NOT create or ALTER tables — only INSERT.

---

**Step 3 — Create `components/games/ArkanoidGame.tsx`**

Read `components/games/AsteroidsGame.tsx` in full before writing. Required patterns:

- Props interface with `paused`, `onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`.
- `pausedRef` and `cbRef` synced on every render (not inside a `useEffect` with deps) so the rAF loop never reads stale props.
- Single `useEffect` for the game loop — all game state lives as closure variables inside it, not in React state.
- No HUD in canvas — fire `cbRef.current.onScoreChange(score)` etc. only when value changes (compare with previous).
- Game states: `'playing'` | `'gameover'` | `'win'`. Fire `cbRef.current.onGameOver(score)` exactly once, guarded by a `gameOverFired` boolean. The `'win'` state (all 5 levels cleared) also triggers `onGameOver`.
- No `'dead'` state — on ball loss, decrement lives and reset ball position immediately without respawn delay.
- Paddle input: keyboard (ArrowLeft / ArrowRight) and mouse (`mousemove` on canvas tracking horizontal position).
- Audio: create two `Audio` objects at the top of the effect — `bounceSound` (ball hits paddle) and `breakSound` (block destroyed). Copy the MP3 files from `references/started-games/04-arkanoid/assets/sounds/` to `public/sounds/`. Call `.cloneNode()` before `.play()` to allow overlapping playback. Wrap each `.play()` call in a try/catch to silently ignore autoplay policy errors.
- Cleanup: `cancelAnimationFrame(rafId)` + remove all input event listeners.
- Canvas dimensions: 800×600 px — do not add responsive resizing.
- Port logic from `references/started-games/04-arkanoid/game.js` and `levels.js`, adapting to the React/rAF pattern. Include the 5 levels inline.

---

**Step 4 — Create `app/games/arkanoid/play/page.tsx`**

Read `app/games/asteroids/play/page.tsx` in full before writing. Required state:

```typescript
const [score, setScore] = useState(0)
const [lives, setLives] = useState(3)
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

- Fetch `gameId` on mount via `getGame('arkanoid')` — never hardcode the UUID.
- Pre-fill `playerName` from `localStorage.getItem('arcade-vault-player-name') ?? ''` on mount.
- Name input: `maxLength={10}`, `value={playerName.toUpperCase()}`, onChange uppercases.
- Confirm button: `saveScore(gameId, playerName, finalScore)` → write localStorage → `router.push('/games/arkanoid')`. Disable while saving. If `saveScore` throws, set `saveError` and keep modal open.
- Restart button: reset score to 0, lives to 3, level to 1, increment `gameKey`. Does NOT save.
- HUD bar: back link to `/games`, game title `ARKANOID`, score, lives, level, pause button.

---

**Step 5 — Add cover image for `cover-arkanoid`**

Read how existing cover classes (e.g. `cover-tetris`, `cover-asteroids`) are defined in the project's CSS before writing. Follow the same pattern:

- Copy or create a representative screenshot/thumbnail of the Arkanoid game and place it in `public/images/` (or the directory used by other covers).
- Add a CSS class `cover-arkanoid` that applies the image as a background, matching the dimensions and `background-size` used by sibling cover classes.

## Acceptance criteria

- [ ] GET /games — card "ARKANOID" aparece en el grid con cover y color cyan
- [ ] GET /games/arkanoid — detail page carga; leaderboard muestra "SÉ EL PRIMERO EN ENTRAR"
- [ ] GET /games/arkanoid/play — canvas 800×600 renderiza sin errores en consola
- [ ] Mover paleta con teclas de flecha — la paleta se desplaza correctamente
- [ ] Mover paleta con el mouse — la paleta sigue la posición horizontal del cursor sobre el canvas
- [ ] La pelota rebota correctamente contra paleta, paredes y bloques
- [ ] Romper bloques — score aumenta; sonido de destrucción se escucha
- [ ] Pelota choca con paleta — sonido de rebote se escucha
- [ ] Avanzar nivel — al destruir todos los bloques del nivel actual, carga el siguiente nivel
- [ ] Perder una vida — contador de vidas decrece; pelota se resetea sin delay
- [ ] Perder las 3 vidas — modal de game over aparece con score final e input de nombre
- [ ] Completar los 5 niveles — modal de game over aparece (estado 'win') con score final
- [ ] Pausar/reanudar — botón de pausa en HUD detiene y reanuda el juego correctamente
- [ ] Si localStorage tiene nombre previo, el input está pre-rellenado
- [ ] Confirmar nombre — score guardado; redirige a /games/arkanoid; fila aparece en leaderboard
- [ ] GET /salon — score guardado aparece en Hall of Fame
- [ ] Reiniciar sin confirmar — score NO guardado (verificado en /games/arkanoid)

## Decisions taken and discarded

- **Audio incluido** — a diferencia de otras integraciones, Arkanoid tiene feedback sonoro directo (rebote de paleta, destrucción de bloque) que forma parte central de la experiencia arcade; se incluye en esta fase.
- **Sin HUD en canvas** — score/lives/level pertenecen a React state, no al canvas; mantiene separación de responsabilidades.
- **pausedRef/cbRef pattern** — leer props directamente dentro de un rAF loop causa stale closures.
- **Canvas size fija 800×600 px** — sin responsive resizing en esta fase.
- **Mouse + teclado para mover la paleta** — el juego de referencia soporta ambos controles; se mantienen los dos para fidelidad a la experiencia original.
- **Sin estado 'dead'** — Arkanoid no tiene delay de respawn entre vidas; al perder la pelota se descuenta una vida y se resetea la pelota inmediatamente.
- **Estado 'win' dispara onGameOver** — completar los 5 niveles es un final de partida válido; se reutiliza el mismo modal de game over para mostrar el score final.
- **Audio con cloneNode()** — permite superponer sonidos (varios bloques rotos en el mismo frame) sin cortar el audio anterior.
- **Cover image como paso separado (Step 5)** — desacoplado de la lógica de juego para que el canvas sea funcional antes de tener el asset visual final.
