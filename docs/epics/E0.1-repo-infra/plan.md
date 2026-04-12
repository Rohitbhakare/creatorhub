# E0.1 — Repo & Infra

## Overview
Scaffold the monorepo, initialize all app shells, configure CI/CD, set up Supabase and Firebase projects, and establish the development environment.

## SRS Requirements
- C-09: Monorepo with clear app boundaries
- NFR-MAINT-001: Monorepo structure
- NFR-MAINT-003: CI runs lint + typecheck + tests on every PR
- NFR-MAINT-004: One-command local dev boot

## Dependencies
- None (this is the first epic)

## Architecture Decisions
- pnpm workspaces (not Turborepo — startup-lean, avoid build tool complexity)
- GitHub Actions for CI (lint + typecheck + test on PR)
- Fly.io for API hosting (Hono)
- Supabase for database (managed Postgres)
- Firebase for auth + storage + push

## Deliverables
1. Monorepo structure with `apps/api`, `apps/mobile`, `apps/web`, `packages/shared`
2. pnpm workspace configuration
3. TypeScript configuration (shared base)
4. ESLint + Prettier configuration
5. Git initialized with `.gitignore`
6. GitHub Actions CI pipeline
7. Hono API shell with health endpoints (`/healthz`, `/readyz`)
8. Flutter app shell
9. Next.js app shell (minimal)
10. `packages/shared` with base types
11. `.env.example` files
12. `pnpm dev` boots everything
