# SPEC 03 — About Page + Contacto con Resend

> **Status:** Implementado · **Depends on:** SPEC 02 · **Date:** 2026-05-27
> **Objective:** Implementar la página `/about` de Arcade Vault con su sección
> de presentación y formulario de contacto funcional que envía correos mediante Resend.

---

## Scope

**In:**

- `app/about/page.tsx` — nueva página Client Component con la sección About
  (presentación + highlight cards) y el formulario de contacto con estados
  `idle | sending | sent | error`
- `app/api/contact/route.ts` — API Route POST que valida campos, llama al SDK
  de Resend y devuelve `{ ok: true }` o `{ ok: false, error }`
- `app/globals.css` — añadir los bloques CSS del template correspondientes a
  About: `.about`, `.about-hero`, `.about-title`, `.about-mission`,
  `.highlight-row`, `.highlight`, `.about-divider`, `.div-bar`, `.div-pixels`,
  `.about-contact`, `.contact-grid`, `.contact-intro`, `.contact-title`,
  `.contact-sub`, `.contact-tips`, `.contact-form`, `.btn.press:active`,
  `.terminal-success`, `.term-bar`, `.term-body` (y variantes responsive)
- `.env.local` — añadir slot `RESEND_API_KEY=`
- `package.json` / lock file — instalar dependencia `resend`

**Out of scope:**

- Verificación de dominio real en Resend (se usa `onboarding@resend.dev`, sandbox)
- Rate limiting o captcha en el formulario
- Persistencia de mensajes en base de datos
- Tests

---

## Data model

No se introducen estructuras de datos persistentes.

**Estado del formulario (en memoria, cliente):**
```ts
type FormState = { name: string; email: string; msg: string }
type Status = 'idle' | 'sending' | 'sent' | 'error'
```

**Contrato de la API Route:**
- Request: `POST /api/contact` con body JSON `{ name, email, msg }`
- Response éxito: `{ ok: true }` — HTTP 200
- Response error de validación: `{ ok: false, error: string }` — HTTP 400
- Response error de Resend: `{ ok: false, error: string }` — HTTP 500

---

## Implementation plan

1. Instalar la dependencia: `npm install resend`

2. Añadir `RESEND_API_KEY=` (valor vacío) a `.env.local` como slot documentado.

3. Copiar a `app/globals.css` los bloques CSS del template de About
   (`references/templates/home-about/styles.css`, sección `/* ===== ABOUT PAGE ===== */`
   hasta el final del archivo). Verificar con `grep` que `.about`, `.contact-form`
   y `.terminal-success` no existan antes de pegar.

4. Crear `app/api/contact/route.ts`:
   - `export async function POST(req: Request)`: parsear body JSON
   - Validar que `name`, `email` y `msg` no estén vacíos; devolver 400 si faltan
   - Instanciar `new Resend(process.env.RESEND_API_KEY)`
   - Llamar `resend.emails.send({ from: 'onboarding@resend.dev', to: 'j.anhuaman@gmail.com',
     subject: '[Arcade Vault] Mensaje de {name}', html: '...' })`
   - Devolver `{ ok: true }` en éxito o `{ ok: false, error }` en fallo

5. Crear `app/about/page.tsx` como Client Component (`'use client'`):
   - `useReveal()` — hook con `IntersectionObserver` para animar `.reveal`
     (igual al de `app/page.tsx`)
   - `HighlightIcon({ kind })` — SVGs pixel HEART, BROWSER, PLANT del template
   - Componente `About` (export default):
     - Estados: `form`, `status: Status`, `shake: boolean`
     - `onSubmit`: valida campos → `setStatus('sending')` → `fetch POST /api/contact`
       → `setStatus('sent')` o `setStatus('error')` + shake
     - Mientras `sending`: botón deshabilitado con `<span className="spinner" />`
     - Mientras `error`: mensaje `ERROR: NO SE PUDO ENVIAR. REINTENTA.` en
       `neon-magenta` encima del botón
     - Cuando `sent`: mostrar bloque `terminal-success` con `form.name.toUpperCase()`
     - "ENVIAR OTRO MENSAJE": resetea `form` y `status` a `idle`

---

## Acceptance criteria

- [ ] `npm run dev` arranca sin errores de TypeScript ni de compilación
- [ ] `/about` carga y muestra la sección "ACERCA DE" con título, misión y las
      3 highlight cards (HEART, BROWSER, PLANT)
- [ ] El divisor animado (pixel dots) es visible entre las dos secciones
- [ ] La sección "CONTACTO" muestra el grid con intro a la izquierda y formulario
      a la derecha
- [ ] Enviar el formulario con campos vacíos produce el efecto shake sin enviar
      petición a la API
- [ ] Durante el envío el botón muestra el spinner y está deshabilitado
- [ ] Si Resend responde con éxito, aparece el `terminal-success` con el nombre
      del usuario en mayúsculas
- [ ] El botón "ENVIAR OTRO MENSAJE" resetea el formulario y vuelve al estado idle
- [ ] Si la API falla, aparece el mensaje de error encima del botón y el formulario
      hace shake
- [ ] El correo llega a `j.anhuaman@gmail.com` con el asunto
      `[Arcade Vault] Mensaje de {name}`
- [ ] Las secciones con `.reveal` se animan al hacer scroll
- [ ] El link "ACERCA DE" del Nav queda activo cuando `pathname === "/about"`
- [ ] No hay errores en consola del navegador en `/about`

---

## Decisions

- **Sí: API Route en `app/api/contact/route.ts`** para el envío de correo.
  El SDK de Resend requiere la API key en servidor; exponerla en el cliente
  sería un riesgo de seguridad.

- **Sí: `onboarding@resend.dev` como remitente** mientras no haya dominio
  verificado. Permite probar el flujo completo sin configuración adicional.
  Restricción: en modo sandbox, Resend solo entrega al email del propietario
  de la cuenta.

- **Sí: estado `sending` con spinner** para dar feedback visual durante la
  latencia de red. El template SPA simulaba éxito instantáneo porque no había
  red real.

- **Sí: error inline sobre el botón** (clase `neon-magenta`) en lugar de
  pantalla de error separada. Más rápido de recuperar para el usuario;
  consistente con el shake ya presente en el template.

- **No: rate limiting** en esta iteración. El formulario es MVP; se puede
  agregar en un spec posterior si hay abuso.

- **No: guardar mensajes en DB.** El correo es el registro primario por ahora.

---

## Risks

| Riesgo | Mitigación |
|--------|------------|
| `onboarding@resend.dev` solo entrega al propietario de la cuenta Resend en modo sandbox | El `to` debe ser el email registrado en Resend; si difiere de `j.anhuaman@gmail.com`, el correo no llegará |
| `RESEND_API_KEY` no configurado devuelve 500 | La API route captura el error y el formulario muestra el mensaje de error inline |
| Next.js 16 puede tener diferencias en App Router API routes | Leer `node_modules/next/dist/docs/` antes de escribir la route; usar `export async function POST(req: Request)` |
