# SPEC 04 — Integración de Supabase

> **Status:** Aprobado · **Depends on:** SPEC 03 · **Date:** 2026-06-02
> **Objective:** Conectar Arcade Vault a Supabase instalando los paquetes
> necesarios y creando los clientes de browser y servidor listos para
> usar en futuros specs de auth y base de datos.

---

## Scope

**In:**

- `package.json` / lock file — instalar `@supabase/supabase-js` y `@supabase/ssr`
- `.env.local` — añadir slots `NEXT_PUBLIC_SUPABASE_URL=` y
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=`
- `lib/supabase/client.ts` — cliente Supabase para Client Components (browser)
- `lib/supabase/server.ts` — cliente Supabase para Server Components y API Routes

**Out of scope:**

- Implementación de autenticación (registro, login, sesión)
- Esquema de base de datos (tablas, migraciones)
- Middleware de refresco de sesión
- Realtime y Edge Functions
- `SUPABASE_SERVICE_ROLE_KEY` y operaciones admin
- Tests

---

## Data model

No aplica. Los clientes de Supabase son utilidades de infraestructura sin estado propio.

---

## Implementation plan

1. **Instalar paquetes:**

   ```
   npm install @supabase/supabase-js @supabase/ssr
   ```

2. **Añadir variables de entorno a `.env.local`:**

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   ```

   Rellenar los valores con los del proyecto Supabase existente.

3. **Crear `lib/supabase/client.ts`** — cliente para Client Components:

   ```ts
   import { createBrowserClient } from '@supabase/ssr'

   export function createClient() {
     return createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
     )
   }
   ```

4. **Crear `lib/supabase/server.ts`** — cliente para Server Components y API Routes.
   Usa `cookies()` de `next/headers` (async en Next.js 16):

   ```ts
   import { createServerClient } from '@supabase/ssr'
   import { cookies } from 'next/headers'

   export async function createClient() {
     const cookieStore = await cookies()

     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
       {
         cookies: {
           getAll() {
             return cookieStore.getAll()
           },
           setAll(cookiesToSet) {
             try {
               cookiesToSet.forEach(({ name, value, options }) =>
                 cookieStore.set(name, value, options)
               )
             } catch {}
           },
         },
       }
     )
   }
   ```

5. **Verificar la integración:** arrancar `npm run dev` y confirmar que
   no hay errores de TypeScript ni de compilación relacionados con los
   nuevos archivos.

---

## Acceptance criteria

- [ ] `npm install` completa sin errores; `@supabase/supabase-js` y
      `@supabase/ssr` aparecen en `package.json`
- [ ] `.env.local` contiene los slots `NEXT_PUBLIC_SUPABASE_URL` y
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con valores reales
- [ ] `lib/supabase/client.ts` existe y exporta `createClient`
- [ ] `lib/supabase/server.ts` existe y exporta `createClient` (async)
- [ ] `npm run dev` arranca sin errores de TypeScript ni de compilación
- [ ] No hay errores en consola del navegador al navegar por la app

---

## Decisions

- **Sí: `@supabase/ssr` junto con `@supabase/supabase-js`** en lugar de solo
  el cliente base. El App Router de Next.js requiere manejo de cookies para
  sesiones SSR; instalar ambos ahora evita refactoring cuando llegue el spec
  de auth.

- **Sí: dos clientes separados (`client.ts` / `server.ts`)** en lugar de uno
  único. Los entornos browser y servidor tienen APIs distintas (`createBrowserClient`
  vs `createServerClient`); mezclarlos en un archivo único generaría imports
  de servidor en Client Components.

- **Sí: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** como nombre de la variable
  (en lugar del histórico `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Es el nombre
  que usa el proyecto Supabase existente del usuario.

- **No: middleware de sesión en este spec.** Su responsabilidad es refrescar
  tokens de auth — sin auth implementado no aporta valor. Se añadirá en el
  spec de autenticación.

- **No: `SUPABASE_SERVICE_ROLE_KEY`.** No hay API routes que requieran
  privilegios admin todavía. Se añadirá cuando sea necesario.

---

## Risks

| Riesgo                                                                    | Mitigación                                                                                                                                     |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Versión de `@supabase/ssr` incompatible con Next.js 16                    | Leer `node_modules/next/dist/docs/` y el changelog de `@supabase/ssr` antes de escribir los clientes; usar la versión más reciente del paquete |
| `cookies()` lanza en Server Components de solo lectura al llamar `setAll` | El bloque `try/catch` vacío en `setAll` absorbe el error esperado; es el patrón oficial de Supabase para App Router                            |
| Variables de entorno no cargadas (valor vacío)                            | `createBrowserClient` / `createServerClient` lanzarán en tiempo de ejecución con mensaje claro; verificar `.env.local` antes de arrancar       |
