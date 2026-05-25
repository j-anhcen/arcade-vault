# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## About

Arcade Vault is an online gaming platform where users compete for points. Built with Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS v4.

## Commands

```bash
npm run dev      # start dev server (Turbopack, port 3000)
npm run build    # production build
npm run lint     # run ESLint (uses flat config eslint.config.mjs)
```

There is no test runner configured yet.

## Architecture

- **`app/`** — App Router. Every folder is a route segment; `page.tsx` exposes it, `layout.tsx` wraps descendants. Root layout is `app/layout.tsx`.
- **`public/`** — static assets served at `/`
- **`@/*`** — path alias for the project root (configured in `tsconfig.json`)
- Components default to **Server Components**. Add `'use client'` only when you need state, event handlers, or browser APIs.

## Next.js 16 Breaking Changes

This is **Next.js 16**, not 15 or 14. Key differences:

- **`params` and `searchParams` are async** — they are `Promise` objects; always `await` them.
  ```tsx
  // correct
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
  }
  ```
- **`middleware` → `proxy`** — the request-interception file is now `proxy.ts` (not `middleware.ts`). The `edge` runtime is not supported in `proxy`; use `proxy` with the default Node.js runtime.
- **`revalidateTag` requires a second argument** — pass a `cacheLife` profile (e.g. `'max'`): `revalidateTag('posts', 'max')`.
- **Turbopack is on by default** — `next dev` and `next build` use Turbopack; opt out with `--webpack`.
- **ESLint flat config** — linting is `eslint` (not `next lint`); config lives in `eslint.config.mjs`.
- **PPR via `cacheComponents`** — `experimental_ppr` route segment config is removed; enable PPR in `next.config.ts` via `cacheComponents`.
- **Local images with query strings** — require `images.localPatterns.search` in `next.config.ts`.
- **AMP removed** — `next/amp` and `useAmp` no longer exist.

Read `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` for the full migration guide.

## Development Approach

This project uses **Spec Driven Design** with the `/spec` and `/spec-impl` skills from `Klerith/fernando-skills`. Add skills via:

```bash
npx skills@latest add Klerith/fernando-skills
```
