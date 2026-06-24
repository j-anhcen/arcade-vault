---
name: add-game
description: Prepara el archivo de spec en specs/ para integrar un nuevo juego en Arcade Vault — listo para ejecutar con /spec-impl una vez aprobado.
argument-hint: <game-slug | descripción del juego>
---

# /add-game — Generador de spec para Arcade Vault

## Session context

Current branch:
!`git branch --show-current`

Games already in `GAMES` array:
!`grep "id:" lib/data.ts | grep -v "uuid\|game_id\|user_id" | head -20`

Reference implementations available:
!`ls references/started-games/ 2>/dev/null || echo "references/started-games/ not found"`

Existing specs:
!`ls specs/ 2>/dev/null | sort || echo "specs/ not found"`

---

## Instructions

Follow these four phases in strict order. Do not advance to the next phase if the previous one did not complete correctly.

---

### Phase 1 — Identify the game

The received argument is: `$ARGUMENTS`

**Detect argument type:**

- If `$ARGUMENTS` contains one or more spaces → treat as a **game description**
- If `$ARGUMENTS` has no spaces (letters, numbers, hyphens only) → treat as a **slug**

---

**If `$ARGUMENTS` is a description (contains spaces):**

1. Derive a slug from the description: kebab-case, semantically meaningful, max ~15 characters. Example: "un juego de naves que disparan asteroides" → `space-shooter`.
2. Show the suggestion to the user:
   > `Slug sugerido: <slug>. ¿Lo usamos o prefieres otro?`
3. Wait for confirmation or an alternative slug.
4. Once the slug is confirmed, continue with the **"If a slug was provided"** flow below, with this difference:
   - Pre-fill the `short` field with a polished version of the received description (≤ 80 chars) and show it to the user for confirmation alongside the other metadata.

---

**If `$ARGUMENTS` is empty:**

- Show the available reference implementations from `references/started-games/` (you already have them above).
- Ask the user:
  1. What slug to use for the game (e.g. `tetris`, `arkanoid`)
  2. Whether there is a reference in `references/started-games/` or if this is a custom game from scratch
- Stop and wait for an answer. Do not continue.

**If a slug was provided:**

1. Check if a reference directory exists: look for `references/started-games/NN-<slug>/` (the prefix NN may vary). If found, read its `CLAUDE.md` and the first 80 lines of `game.js` to understand the game's architecture before doing anything else.

2. Collect the following metadata. If a reference exists, derive as much as possible from it; ask the user only for what you cannot derive:

   | Field        | Type                                                  | Notes                                                            |
   | ------------ | ----------------------------------------------------- | ---------------------------------------------------------------- |
   | `slug`       | string                                                | Used for routing and Supabase `slug` column                      |
   | `title`      | string (all caps)                                     | Display name, e.g. `"TETRIS"`                                    |
   | `short`      | string (≤ 80 chars)                                   | One-line tagline for the game card                               |
   | `long`       | string (≤ 300 chars)                                  | Paragraph for the detail page                                    |
   | `cat`        | `'ARCADE'` \| `'PUZZLE'` \| `'SHOOTER'` \| `'VERSUS'` | Must match one of the values in `CATS`                           |
   | `cover`      | string                                                | CSS class name for the cover image, e.g. `"cover-tetris"`        |
   | `color`      | `'cyan'` \| `'magenta'` \| `'yellow'` \| `'green'`    | Accent color for the card                                        |
   | `best`       | number                                                | Seed best score for the platform; use a realistic-looking number |
   | `plays`      | string                                                | Display string, e.g. `"12.3K"`                                   |
   | `difficulty` | `1` \| `2` \| `3`                                     | If unclear from the reference, default to `2`                    |

3. Note any game-specific details that affect integration:
   - Does the game have lives or is it single-life (top-out = game over)?
   - What are the initial values for lives and level?
   - Does the game have a `'dead'` state (respawn delay between losing a life and respawning)?
   - Canvas dimensions (width × height in px)?

4. Once all fields are confirmed, show a summary table to the user and ask for go-ahead before proceeding.

---

### Phase 2 — Check conflicts and determine spec number

Before generating anything, verify:

1. **Check `specs/` for existing slug** — scan the spec filenames you already have above. If any file name contains `<slug>` (e.g. `08-tetris.md`), stop and tell the user a spec for this game already exists.

2. **Check `lib/data.ts`** — confirm there is no entry with `id: "<slug>"` in the `GAMES` array. If there is, the game is already implemented — stop and tell the user.

3. **Determine next spec number** — from the existing spec filenames, extract the highest NN prefix and add 1. For example, if the highest is `07-leaderboard.md`, the next spec is `08`.

Show the user:

```
Generaré:
  [ ] specs/NN-<slug>.md — Status: Draft

Ya manejado por la plataforma (no requiere cambios en este spec):
  [✓] Game card en /games              (array GAMES)
  [✓] Detail + leaderboard en /games/<slug>  (ruta dinámica)
  [✓] Hall of Fame en /salon           (lee todas las scores)
```

Ask: "¿Procedo a generar el spec sección a sección?"

---

### Phase 3 — Generate spec section by section

Show each section to the user, wait for explicit confirmation, then write the complete file at the end.

The `<GameName>` used in file paths is the slug with the first letter capitalized (e.g. slug `tetris` → `TetrisGame.tsx`). For multi-word slugs, use PascalCase.

---

#### Section 1 — Header

Show this block with all placeholders filled in and wait for confirmation:

```markdown
# SPEC NN — Add <TITLE> to Arcade Vault

> **Status:** Draft
> **Depends on:** 07-leaderboard-games-table
> **Date:** <today's date>
> **Objective:** Integrar <TITLE> en Arcade Vault con canvas de juego, routing, leaderboard y modal de game over.
```

After confirmation, say: `Sección 1 confirmada.`

---

#### Section 2 — Scope

Show this block and wait for confirmation:

```markdown
## Scope

**In:**

- Entrada en array `GAMES` — `lib/data.ts`
- INSERT en tabla `games` de Supabase
- `components/games/<GameName>Game.tsx` — componente canvas
- `app/games/<slug>/play/page.tsx` — página de juego

**Out of scope (for future specs):**

- Diseño del cover image `cover-<slug>`
- Soporte de audio
- Responsive/mobile canvas
```

After confirmation, say: `Sección 2 confirmada.`

---

#### Section 3 — Data model

Show the concrete values derived in Phase 1 and wait for confirmation:

````markdown
## Data model

```typescript
// Entry to add to GAMES array in lib/data.ts
{
  id: '<slug>',
  title: '<TITLE>',
  short: '<short>',
  long: '<long>',
  cat: '<CAT>',
  cover: 'cover-<slug>',
  color: '<color>',
  best: <number>,
  plays: '<plays>',
  difficulty: <1|2|3>,
}
```
````

```sql
-- Supabase INSERT (Step 2)
INSERT INTO games (slug, title, short, long, cat, cover, color, best, plays, difficulty)
VALUES ('<slug>', '<TITLE>', '<short>', '<long>', '<cat>', 'cover-<slug>', '<color>', <best>, '<plays>', <difficulty>)
RETURNING id, slug;
```

````

After confirmation, say: `Sección 3 confirmada.`

---

#### Section 4 — Implementation plan

Show 4 numbered steps with the concrete values filled in and wait for confirmation.

Adapt the step descriptions based on what you learned about this specific game in Phase 1 (e.g., lives count, canvas size, whether there is a `'dead'` state):

```markdown
## Implementation plan

**Step 1 — Add entry to GAMES array (`lib/data.ts`)**

Append this object to the `GAMES` array following the shape of the `asteroids` entry:

```typescript
{
  id: '<slug>',
  title: '<TITLE>',
  short: '<short>',
  long: '<long>',
  cat: '<CAT>',
  cover: 'cover-<slug>',
  color: '<color>',
  best: <number>,
  plays: '<plays>',
  difficulty: <1|2|3>,
}
````

Rules: `id` must equal the slug string (not a UUID). Do not modify or reorder existing entries.

---

**Step 2 — Seed game into Supabase `games` table**

Execute via `mcp__supabase__execute_sql`:

```sql
INSERT INTO games (slug, title, short, long, cat, cover, color, best, plays, difficulty)
VALUES ('<slug>', '<TITLE>', '<short>', '<long>', '<cat>', 'cover-<slug>', '<color>', <best>, '<plays>', <difficulty>)
RETURNING id, slug;
```

Show the returned UUID to the user. Do NOT create or ALTER tables — only INSERT.

---

**Step 3 — Create `components/games/<GameName>Game.tsx`**

Read `components/games/AsteroidsGame.tsx` in full before writing. Required patterns:

- Props interface with `paused`, `onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`.
- `pausedRef` and `cbRef` synced on every render (not inside a `useEffect` with deps) so the rAF loop never reads stale props.
- Single `useEffect` for the game loop — all game state lives as closure variables inside it, not in React state.
- No HUD in canvas — fire `cbRef.current.onScoreChange(score)` etc. only when value changes (compare with previous).
- Game states: `'playing'` | `'gameover'`<if game has respawn delay, add `| 'dead'`>. Fire `cbRef.current.onGameOver(score)` exactly once, guarded by a `gameOverFired` boolean.
- Cleanup: `cancelAnimationFrame(rafId)` + remove all input event listeners.
- Skip all audio (`new Audio(...)` or `AudioContext`).
- Canvas dimensions: <width>×<height>px — do not add responsive resizing.

---

**Step 4 — Create `app/games/<slug>/play/page.tsx`**

Read `app/games/asteroids/play/page.tsx` in full before writing. Required state:

```typescript
const [score, setScore] = useState(0)
const [lives, setLives] = useState(<initial lives — e.g. 1 for single-life games>)
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

- Fetch `gameId` on mount via `getGame('<slug>')` — never hardcode the UUID.
- Pre-fill `playerName` from `localStorage.getItem('arcade-vault-player-name') ?? ''` on mount.
- Name input: `maxLength={10}`, `value={playerName.toUpperCase()}`, onChange uppercases.
- Confirm button: `saveScore(gameId, playerName, finalScore)` → write localStorage → `router.push('/games/<slug>')`. Disable while saving. If `saveScore` throws, set `saveError` and keep modal open.
- Restart button: reset score/lives/level to initial values, increment `gameKey`. Does NOT save.
- HUD bar: back link to `/games`, game title, score, lives, level, pause button.

````

After confirmation, say: `Sección 4 confirmada.`

---

#### Section 5 — Acceptance criteria

Show these items with the concrete slug and title filled in and wait for confirmation:

```markdown
## Acceptance criteria

- [ ] GET /games — card "<TITLE>" aparece en el grid
- [ ] GET /games/<slug> — detail page carga; leaderboard muestra "SÉ EL PRIMERO EN ENTRAR"
- [ ] GET /games/<slug>/play — canvas renderiza sin errores en consola
- [ ] Jugar hasta game over — modal aparece con score final e input de nombre
- [ ] Si localStorage tiene nombre previo, el input está pre-rellenado
- [ ] Confirmar nombre — score guardado; redirige a /games/<slug>; fila aparece en leaderboard
- [ ] GET /salon — score guardado aparece en Hall of Fame
- [ ] Reiniciar sin confirmar — score NO guardado (verificado en /games/<slug>)
````

After confirmation, say: `Sección 5 confirmada.`

---

#### Section 6 — Decisions taken and discarded

Show this block with any game-specific decisions added and wait for confirmation:

```markdown
## Decisions taken and discarded

- **Audio omitido** — out of scope en esta fase de integración de plataforma.
- **Sin HUD en canvas** — score/lives/level pertenecen a React state, no al canvas; mantiene separación de responsabilidades.
- **pausedRef/cbRef pattern** — leer props directamente dentro de un rAF loop causa stale closures.
- **Canvas size fija** — sin responsive resizing en esta fase.
- <Add any game-specific decisions here, e.g.:>
- **lives inicial = 1** — <GameTitle> es single-life: top-out → game over directo, sin respawn.
- **Sin estado 'dead'** — <GameTitle> no tiene delay de respawn entre vidas.
```

After confirmation, say: `Sección 6 confirmada.`

---

#### Write the file

Once all 6 sections are confirmed, assemble them and write the complete spec to `specs/NN-<slug>.md`.

The final file must follow this structure exactly:

```
# SPEC NN — Add <TITLE> to Arcade Vault
> Status / Depends on / Date / Objective block

## Scope
...

## Data model
...

## Implementation plan
...

## Acceptance criteria
...

## Decisions taken and discarded
...
```

After writing, say: `Spec escrito en specs/NN-<slug>.md.`

---

### Phase 4 — Done

```
✅ Spec generado: specs/NN-<slug>.md

Status actual: Draft

Próximos pasos:
  1. Revisa specs/NN-<slug>.md
  2. Cuando estés conforme, cambia Status de "Draft" a "Approved"
  3. Ejecuta /spec-impl para implementar
```

---

## Hard rules (apply throughout all phases)

- **Never write any TypeScript or application code** — this skill only generates spec files.
- **Never modify `lib/data.ts`** — that happens in spec-impl, not here.
- **Never run SQL INSERT or DDL** — that happens in spec-impl, not here.
- **Never mark the spec as Approved automatically** — only the user can approve.
- **Never skip section-by-section confirmation** — each section must be confirmed before moving to the next.
- **Canvas size, lives count, and game states must be derived from the reference** — do not use generic defaults if the reference says otherwise.
