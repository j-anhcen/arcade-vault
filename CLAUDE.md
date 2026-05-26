# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## About

Arcade Vault is an online gaming platform where users compete for points. Built with Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS v4.

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^4 |
| Linter | ESLint (flat config) | ^9 |
| Bundler | Turbopack (default) | bundled with Next.js |

## Skills

Usa siempre /frontend-design para diseñar la interfaz de usuario

## Architecture

- **`app/`** — App Router. Every folder is a route segment; `page.tsx` exposes it, `layout.tsx` wraps descendants. Root layout is `app/layout.tsx`.
- **`public/`** — static assets served at `/`
- **`@/*`** — path alias for the project root (configured in `tsconfig.json`)
- Components default to **Server Components**. Add `'use client'` only when you need state, event handlers, or browser APIs.

