# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## About

Arcade Vault is an online gaming platform where users compete for points. Players browse a catalog of neon-arcade games, play them in the browser on a `<canvas>`, and their scores are persisted to a global leaderboard ("Salón de la Fama"). Built with Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS v4, backed by Supabase.

## Stack

| Layer         | Technology                                 | Version              |
| ------------- | ------------------------------------------ | -------------------- |
| Framework     | Next.js (App Router)                       | 16.2.6               |
| UI Library    | React                                      | 19.2.4               |
| Language      | TypeScript                                 | ^5                   |
| Styling       | Tailwind CSS                               | ^4                   |
| Database/Auth | Supabase (`@supabase/ssr` + `supabase-js`) | ^0.10 / ^2.107       |
| Email         | Resend                                     | ^6.12                |
| Linter        | ESLint (flat config)                       | ^9                   |
| Formatter     | Prettier                                   | ^3.8                 |
| Bundler       | Turbopack (default)                        | bundled with Next.js |

## Skills

- **`/frontend-design`** — usa siempre esta skill para diseñar la interfaz de usuario.
- **`/spec`** — diseña un spec sección a sección (fase de definición). No escribe código; produce un archivo en `specs/`.
- **`/spec-impl <NN-slug>`** — implementa un spec ya **Approved**: crea la rama de git, y ejecuta el plan paso a paso con pausas para revisar diffs.
- **`/add-game <slug | descripción>`** — genera el archivo de spec para integrar un juego nuevo en la plataforma (catálogo + tabla `games` + componente canvas + ruta de juego). Deja el spec listo para `/spec-impl`.

Custom skills live in `.agents/skills/` and are symlinked into `.claude/skills/`.

## Development workflow

This project follows a **spec-driven** method: large features start as a spec in `specs/` (numbered `NN-<slug>.md`), get reviewed and marked `Approved`, then are implemented with `/spec-impl`. Every game currently in the app was added this way — see `specs/05-asteroids-game.md` through `specs/10-snake.md`.

- **`npm run dev`** — start the dev server (Turbopack)
- **`npm run build`** / **`npm start`** — production build / serve
- **`npm run lint`** — ESLint

A **PostToolUse hook** (`.claude/format-hook.py`, configured in `.claude/settings.json`) auto-runs Prettier on every written `.ts/.tsx/.jsx/.md` file and ESLint `--fix` on TS/JS files. You don't need to format manually after edits.

## Architecture

- **`app/`** — App Router. Every folder is a route segment; `page.tsx` exposes it, `layout.tsx` wraps descendants. Root layout is `app/layout.tsx` (fonts, global chrome, footer).
- **`components/`** — shared React components (e.g. `Nav.tsx`). Game canvases live in **`components/games/`**.
- **`lib/`** — non-UI logic. `lib/data.ts` holds the `Game`/`Score` types, the static `GAMES`/`CATS` catalog seed, and all Supabase query helpers. `lib/supabase/` has the `client.ts` (browser) and `server.ts` (SSR, cookie-based) factories.
- **`specs/`** — spec-driven feature docs.
- **`references/`** — reference material: `started-games/` (original vanilla-JS game implementations used as source for canvas ports) and `templates/`, `source-assets/`.
- **`public/`** — static assets served at `/` (game images under `images/`, audio under `sounds/`).
- **`@/*`** — path alias for the project root (configured in `tsconfig.json`).
- Components default to **Server Components**. Add `'use client'` only when you need state, event handlers, or browser APIs. Data pages (`/salon`, `/games/[id]`) are async Server Components that `await` Supabase helpers; interactive pages (`/games`, `/games/*/play`, `/auth`) are client components.

## Routes

| Route                 | Type   | Purpose                                              |
| --------------------- | ------ | ---------------------------------------------------- |
| `/`                   | client | Home / landing                                       |
| `/games`              | client | Game catalog grid, filterable by category            |
| `/games/[id]`         | server | Game detail + per-game leaderboard                   |
| `/games/<slug>/play`  | client | Playable canvas game + game-over/save-score modal    |
| `/salon`              | server | Global "Salón de la Fama" (Hall of Fame) leaderboard |
| `/about`              | —      | About + contact form                                 |
| `/auth`               | client | Login / register tabs (UI)                           |
| `/api/contact` (POST) | route  | Sends contact-form email via Resend                  |

## Data & backend (Supabase)

- Two tables: **`games`** (catalog — `slug`, `title`, `short`, `long`, `cat`, `cover`, `color`, `best`, `plays`, `difficulty`) and **`scores`** (`game_id` FK, `player_name`, `score`, `user_id`, `created_at`).
- All DB access goes through helpers in `lib/data.ts`: `getGames`, `getGame(slug)`, `getTopScoresByGame`, `getTopScoresGlobal`, `saveScore`. Prefer these over inlining queries.
- Read the schema with the Supabase MCP tools (`list_tables`) before schema changes; seed new game rows with `execute_sql` INSERT — never hardcode a game UUID in the app (fetch it via `getGame(slug)`).

### Environment variables

See `.env.template`. Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `SUPABASE_DB_PASSWORD` (local tooling only)

## Games

Playable games: **Asteroids, Tetris, Arkanoid, Snake and more... (see references/implemented-games.md)** (`components/games/*Game.tsx`). Each is a `'use client'` canvas component driven by a single `requestAnimationFrame` loop. Conventions (mirror `AsteroidsGame.tsx` when adding one):

- Props: `paused`, `onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`.
- Sync `paused` and callbacks through refs (`pausedRef`, `cbRef`) updated on every render — the rAF loop must never read stale props.
- All game state lives as closure variables inside the loop's `useEffect`, not in React state. No HUD is drawn on the canvas; fire `onScoreChange`/etc. only when a value changes.
- Fire `onGameOver(score)` exactly once (guard with a boolean). Cleanup must `cancelAnimationFrame` and remove input listeners.
- The play page (`app/games/<slug>/play/page.tsx`) owns the HUD, pause, game-over modal, name input (pre-filled from `localStorage` key `arcade-vault-player-name`, `maxLength={10}`, uppercased), and calls `saveScore` on confirm. Restart bumps a `gameKey` and does **not** save.

To add a new game, use **`/add-game`** rather than doing it by hand.
