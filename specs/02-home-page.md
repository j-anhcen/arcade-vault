# SPEC 02 — Home Page

> **Status:** Implementado · **Depends on:** SPEC 01 · **Date:** 2026-05-26
> **Objective:** Implementar la landing page (`/`) de Arcade Vault con sus siete secciones visuales y actualizar el `Nav` para incluir los links "Inicio" y "Acerca de".

---

## Scope

**In:**

- `app/page.tsx` → reescribir como página Home con 7 secciones:
  1. **Hero** — título animado, silhouettes flotantes, CTAs hacia `/biblioteca` y `/auth`
  2. **¿Por qué Arcade Vault?** — grid de 4 feature cards con íconos pixel SVG
  3. **Juegos disponibles ahora** — rail horizontal con `GAMES.slice(0, 6)` de `lib/data.ts`
  4. **Stats** — banda con 3 bloques de estadísticas hardcodeadas
  5. **Actividad en vivo** — ticker de últimas puntuaciones + top 5 jugadores del día (datos hardcodeados en el componente)
  6. **Precios** — card plan único + FAQ de 3 ítems
  7. **CTA final** — llamada a acción con botón a `/biblioteca`
- `components/Nav.tsx` → agregar link `{ href: "/", label: "INICIO" }` al inicio del array `LINKS` y `{ href: "/about", label: "ACERCA DE" }` al final
- `app/globals.css` → añadir todas las clases CSS del template relacionadas con home (`home-hero`, `home-silos`, `home-section`, `feature-card`, `mini-card`, `mini-rail`, `home-stats`, `activity-grid`, `ticker`, `top-list`, `pricing-grid`, `price-card`, `home-final`, `reveal`, `reveal.in`, y sus variantes responsive)

**Out of scope (for future specs):**

- Ruta `/about` y su contenido (solo se agrega el link en el nav)
- Datos reales de actividad o leaderboard (todo permanece hardcodeado)
- Animación de scroll automático del ticker
- Tests

---

## Data model

Esta spec no introduce estructuras de datos nuevas. Reutiliza `GAMES` y `CATS` de `lib/data.ts` definidos en SPEC 01. Los datos de actividad y leaderboard van hardcodeados directamente en el componente.

---

## Implementation plan

1. Copiar a `app/globals.css` todos los bloques CSS del template `references/templates/home-about/styles.css` relacionados con home: `home-hero`, `home-silos`, `.silo` (s1–s8), `home-title`, `home-sub`, `home-ctas`, `hero-scroll`, `home-section`, `section-head`, `feature-grid`, `feature-card`, `mini-card`, `mini-rail`, `mini-cover`, `mini-meta`, `home-stats`, `stat-block`, `activity-grid`, `activity-card`, `ac-head`, `ticker`, `tick-row`, `top-list`, `top-row` (y variantes `top1`/`top2`/`top3`), `pricing-grid`, `price-card`, `pricing-faq`, `faq-item`, `home-final`, `final-title`, `final-cta`, `reveal`, `reveal.in`. Verificar que no existan definiciones conflictivas antes de pegar.

2. Reescribir `app/page.tsx` como Client Component (`'use client'`) con los siguientes sub-componentes internos al archivo:
   - `useReveal()` — hook con `IntersectionObserver` para animar `.reveal`
   - `FloatingSilhouettes` — 8 SVGs pixel decorativos flotantes
   - `FeatureIcon({ kind })` — íconos pixel SVG para GAMEPAD, FREE, TROPHY, ROCKET
   - `MiniCard({ game, onClick })` — tarjeta compacta del rail de juegos
   - `Home` (export default) — renderiza las 7 secciones; usa `useRouter().push()` de `next/navigation` para reemplazar la prop `navigate` del template SPA

3. Actualizar `components/Nav.tsx`: agregar `{ href: "/", label: "INICIO" }` al inicio del array `LINKS` y `{ href: "/about", label: "ACERCA DE" }` al final. Ajustar la lógica `active` de `/` para que use `pathname === "/"` y no `pathname.startsWith("/")`.

---

## Acceptance criteria

- [ ] `npm run dev` arranca sin errores de TypeScript ni de compilación
- [ ] `/` muestra la landing Home (ya no redirige a `/biblioteca`)
- [ ] La sección Hero muestra el título en 3 líneas, las 8 silhouettes flotantes animadas y los dos botones CTA
- [ ] El botón "EXPLORAR JUEGOS" navega a `/biblioteca`
- [ ] El botón "CREAR CUENTA" navega a `/auth`
- [ ] La sección "Juegos disponibles ahora" muestra exactamente 6 mini-cards con datos de `GAMES`; hacer clic en una navega a `/detalle/[id]`
- [ ] El botón "VER TODOS LOS JUEGOS →" navega a `/biblioteca`
- [ ] La sección "Actividad en vivo" muestra el ticker con 7 filas y el top 5 de jugadores
- [ ] El botón "VER SALÓN →" navega a `/salon`
- [ ] Las secciones con clase `.reveal` aparecen con animación al hacer scroll
- [ ] El botón "EMPEZAR GRATIS →" navega a `/auth`
- [ ] El botón "INSERTAR MONEDA →" del final navega a `/biblioteca`
- [ ] El `Nav` muestra los links en este orden: INICIO · BIBLIOTECA · SALÓN · ACERCA DE
- [ ] El link INICIO está activo solo cuando `pathname === "/"`
- [ ] El link ACERCA DE apunta a `/about` (puede devolver 404 en esta iteración)
- [ ] No hay errores en consola del navegador en la ruta `/`

---

## Decisions

- **Sí: Home en `app/page.tsx` directamente** en lugar de un componente separado en `components/`. El componente es específico de la ruta y no se reutiliza; colocarlo en el archivo de página sigue la convención del proyecto (ver SPEC 01).
- **Sí: `useRouter().push()`** para navegación en lugar de prop `navigate` del template SPA. El template era una SPA con hash-routing; en App Router la navegación se hace con `router.push()` o `<Link>`.
- **Sí: datos de actividad hardcodeados en el componente.** Consistente con la decisión de SPEC 01 de no introducir persistencia real. Moverlos a `lib/data.ts` no aporta valor sin un backend.
- **Sí: link "ACERCA DE" apunta a `/about` aunque la ruta no exista.** El 404 es aceptable en esta iteración; el spec de about lo resolverá.
- **No: spec conjunto home + about.** About tiene su propio formulario de contacto con estado y validación; separarlo permite implementar y revisar cada página de forma independiente.
- **No: CSS del home en archivo separado (`home.css`).** El proyecto concentra todos los estilos en `globals.css` (decisión de SPEC 01); añadir otro archivo rompe esa convención sin beneficio real en este tamaño de proyecto.

---

## Risks

| Riesgo | Mitigación |
|--------|------------|
| `pathname === "/"` puede fallar con trailing slash según la config de Next.js 16 | Si el link INICIO nunca queda activo, revisar `trailingSlash` en `next.config` |
| CSS `.reveal` o `.reveal.in` ya podría existir en `globals.css` con definición diferente | Verificar con `grep` antes de pegar los bloques del template |
| `lib/data.ts` importado en un Client Component podría traer imports de servidor en el futuro | El módulo es puro hoy; si incorpora imports de Node.js, habrá que separar los datos en un archivo distinto |

---

## What is **not** in this spec

- Ruta `/about` y su contenido.
- Datos reales de actividad o leaderboard.
- Tests.

Cada uno de esos, si llega, va en su propio spec.
