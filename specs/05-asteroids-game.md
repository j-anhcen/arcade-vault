# SPEC 05 — Integración del juego Asteroids

> **Status:** Aprobado · **Depends on:** SPEC 01, SPEC 02 · **Date:** 2026-06-02
> **Objective:** Adaptar el clon vanilla JS de Asteroids a un componente
> React nativo en Arcade Vault, con game loop integrado al HUD de la
> plataforma mediante callbacks de estado.

---

## Scope

**In:**

- `lib/data.ts` — añadir entry `{ id: "asteroids", ... }` al array `GAMES`
- `components/games/AsteroidsGame.tsx` — Client Component que encapsula el
  canvas 800×600 y el game loop adaptado de `game.js`:
  - Props: `paused`, `onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`
  - Elimina `drawHUD()` del canvas (el HUD vive en React)
  - Mantiene `drawOverlay()` para el estado 'gameover' dentro del canvas
  - Scoping de listeners de teclado al componente (mount/unmount)
  - `cancelAnimationFrame` en cleanup del useEffect
- `app/juegos/asteroids/play/page.tsx` — Client Component que gestiona el
  estado (score, vidas, nivel, paused, isGameOver) y renderiza el wrapper
  de plataforma: HUD con score, vidas, nivel, botón de pausa y botón de volver

**Out of scope:**

- Guardado de puntuación en Supabase (spec posterior)
- Autenticación para acceder al juego
- Pantalla de detalle específica para Asteroids (usa la ruta genérica `/detalle/asteroids`)
- Redimensionado responsive del canvas (tamaño fijo 800×600)
- Sonido o música
- Controles táctiles / móvil
- Conversión del código a TypeScript estricto (el juego se adapta en JS dentro del `.tsx`)

---

## Data model

### Entry en `GAMES` (`lib/data.ts`)

```ts
{
  id: "asteroids",
  title: "ASTEROIDS",
  short: "Destruye rocas espaciales antes de que te destruyan.",
  long: "Nave solitaria en un campo de asteroides infinito. Sin fricción, sin piedad. Los fragmentos se parten al impactar. Esquiva, apunta y sobrevive oleada tras oleada.",
  cat: "SHOOTER",
  cover: "cover-asteroids",
  color: "cyan",
  best: 134600,
  plays: "29.5K",
}
```

### Estado interno de `AsteroidsGame.tsx` (no es estado React — vive en refs)

| Variable | Tipo     | Descripción                             |
| -------- | -------- | --------------------------------------- |
| `score`  | `number` | Puntuación acumulada                    |
| `lives`  | `number` | Vidas restantes (empieza en 3)          |
| `level`  | `number` | Nivel actual (empieza en 1)             |
| `state`  | `string` | `'playing'` \| `'dead'` \| `'gameover'` |

El estado del juego vive en variables de cierre del `useEffect`, no en `useState`, para evitar re-renders durante el game loop.

### Props de `AsteroidsGame`

```ts
interface AsteroidsGameProps {
  paused: boolean
  onScoreChange: (score: number) => void
  onLivesChange: (lives: number) => void
  onLevelChange: (level: number) => void
  onGameOver: (score: number) => void
}
```

### Estado React de `play/page.tsx`

```ts
const [score, setScore] = useState(0)
const [lives, setLives] = useState(3)
const [level, setLevel] = useState(1)
const [paused, setPaused] = useState(false)
const [isGameOver, setGameOver] = useState(false)
```

---

## Implementation plan

1. **Añadir entry `asteroids` a `GAMES` en `lib/data.ts`.**
   El juego aparece inmediatamente en `/biblioteca` y en `/detalle/asteroids`.

2. **Crear `components/games/AsteroidsGame.tsx`.**
   - Copiar la lógica de `references/started-games/02-asteroids/game.js`
     dentro de un `useEffect` que recibe el `canvasRef`.
   - Reemplazar las variables globales (`ship`, `bullets`, etc.) por
     variables de cierre dentro del efecto.
   - Eliminar `drawHUD()` del draw loop. En su lugar, llamar los callbacks
     `onScoreChange`, `onLivesChange`, `onLevelChange` cada vez que el
     valor cambia (comparar con el valor anterior para no llamar en cada frame).
   - Llamar `onGameOver(score)` cuando `state` pasa a `'gameover'`.
   - Leer la prop `paused` desde una ref (`pausedRef`) para evitar
     re-crear el game loop al cambiar — cuando `pausedRef.current` es
     `true`, el tick de `update` no ejecuta y `requestAnimationFrame`
     sigue corriendo en idle.
   - Scoping de key listeners: `addEventListener` en el `useEffect`,
     `removeEventListener` en el cleanup.
   - Cleanup: `cancelAnimationFrame(rafId)` al desmontar.

3. **Crear `app/juegos/asteroids/play/page.tsx`.**
   - Estado React: `score`, `lives`, `level`, `paused`, `isGameOver`.
   - Renderizar wrapper con:
     - Barra superior: botón ← volver (`/biblioteca`), título "ASTEROIDS",
       score, nivel, vidas (iconos de nave).
     - Botón de pausa que alterna `paused`.
     - `<AsteroidsGame>` con los callbacks y la prop `paused`.
     - Overlay de game over (cuando `isGameOver`) con el score final
       y botón de reiniciar — al reiniciar, remontar el componente
       reseteando una key.

---

## Acceptance criteria

- [ ] Entry `{ id: "asteroids", ... }` existe en el array `GAMES` de `lib/data.ts`
- [ ] `/juegos/asteroids/play` carga sin errores de compilación ni de consola
- [ ] El canvas renderiza la nave y los asteroides al cargar la página
- [ ] Las teclas `←` `→` `↑` `Space` controlan la nave correctamente
- [ ] El HUD de la plataforma (fuera del canvas) muestra score, vidas y nivel
      actualizados en tiempo real durante la partida
- [ ] El canvas NO dibuja su propio HUD (score/vidas/nivel eliminados del canvas)
- [ ] El botón de pausa congela el movimiento de todos los objetos en pantalla
- [ ] Al reanudar, el game loop continúa exactamente desde donde se pausó
- [ ] Al perder la última vida, aparece el overlay de game over con el score final
- [ ] El botón de reiniciar del overlay restablece score=0, lives=3, level=1
      y lanza una nueva partida
- [ ] Al desmontar la página, no quedan `requestAnimationFrame` activos
      (verificable con DevTools Performance)
- [ ] `npm run dev` arranca sin errores de TypeScript
- [ ] El juego aparece listado en `/biblioteca` como entrada "ASTEROIDS"

---

## Decisions

- **Sí: lógica del juego en variables de cierre del `useEffect`, no en `useState`.**
  El game loop corre a 60 fps; poner `ship`, `asteroids`, etc. en estado React
  provocaría re-renders continuos y rompería el rendimiento.

- **Sí: `pausedRef` en lugar de leer la prop directamente en el loop.**
  El callback de `requestAnimationFrame` captura el valor de la prop en el
  momento de creación del efecto. Una ref permite leer el valor actual sin
  recrear el loop.

- **Sí: eliminar `drawHUD()` del canvas.** El HUD vive en React para ser
  coherente con el diseño de plataforma. Mantener dos HUDs (uno en canvas,
  uno en React) crearía duplicación y desincronización visual.

- **Sí: mantener `drawOverlay()` en canvas para el estado 'gameover'.**
  Es un feedback visual inmediato dentro del área de juego. El overlay React
  complementa con el botón de reiniciar; no son redundantes.

- **Sí: remontar `AsteroidsGame` con una `key` para reiniciar.**
  Resetear el estado interno del juego desde fuera requeriría exponer una
  función imperativa (ref + `useImperativeHandle`). Cambiar la `key` es más
  simple, más predecible y sin acoplamiento extra.

- **No: convertir `game.js` a TypeScript estricto en este spec.** El juego
  funciona correctamente en JS; la conversión completa es refactoring sin
  valor de producto. Se puede abordar en un spec de deuda técnica posterior.

- **No: canvas responsive.** Escalar el canvas requiere ajustar las constantes
  de física (`W`, `H`, velocidades). Es scope suficiente para un spec propio.

- **No: usar el entry `rocas` existente para este juego.** Se mantiene como
  placeholder de un juego futuro distinto. Se añade `asteroids` como entry
  independiente.

---

## Risks

| Riesgo                                                                                                                                                                                                 | Mitigación                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React StrictMode monta y desmonta efectos dos veces en desarrollo, lo que puede arrancar dos game loops en paralelo                                                                                    | El cleanup del `useEffect` debe cancelar el RAF y eliminar los key listeners antes de que el segundo mount ocurra; verificar en DevTools que solo hay un loop activo                    |
| Los callbacks `onScoreChange` / `onLivesChange` disparan `setState` en el padre, lo que re-renderiza `AsteroidsGame` con nuevas props — si el componente no es estable, puede interrumpir el game loop | Envolver los callbacks en `useCallback` en el padre; asegurarse de que los cambios de props no recrean el `useEffect` del game loop (depender solo de `canvasRef`, no de los callbacks) |
| `cover-asteroids` no existe como asset o clase CSS — la tarjeta del juego en `/biblioteca` puede renderizar rota                                                                                       | Verificar cómo el sistema de covers resuelve el valor del campo `cover` antes de añadir el entry; usar el mismo patrón que los entries existentes o añadir el asset necesario           |
