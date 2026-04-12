# E0.1 — Tasks

## T1: Initialize Git & Root Config
**Files:** `.gitignore`, `.nvmrc`, `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.prettierrc`, `.eslintrc.js`
**SRS:** C-09, NFR-MAINT-001
**Acceptance:**
- `git init` done, initial commit
- Root `package.json` has `"engines": { "node": ">=20.0.0" }` and workspace scripts
- `.nvmrc` pins Node version (e.g., `20.12.0`)
- `pnpm install` succeeds from root
- `tsconfig.base.json` has strict mode: `"strict": true`, `"noUncheckedIndexedAccess": true`
- `.prettierrc` + `.eslintrc.js` configured with consistent rules
**Edge cases:**
- `.gitignore` must exclude: `.env`, `.env.local`, `node_modules`, `.dart_tool`, `build/`, `.flutter-plugins`, `*.g.dart`, `*.freezed.dart`, `ios/Pods`, `android/.gradle`
- Never commit any `.env` file — only `.env.example`

---

## T2: Scaffold API (Hono)
**Files:** `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/Dockerfile`, `apps/api/fly.toml`, `apps/api/.env.example`, `apps/api/CHANGELOG.md`, `apps/api/CLAUDE.md`, `apps/api/src/index.ts`, `apps/api/src/env.ts`
**SRS:** C-09, NFR-MAINT
**Acceptance:**
- `pnpm --filter api dev` starts Hono on port 3000
- `GET /healthz` → `{ status: "ok", timestamp: "..." }` 200
- `GET /readyz` → 200 if DB+Firebase connected, 503 if not
- `apps/api/src/env.ts` validates all required env vars with Zod at startup — process exits if any missing
- `Dockerfile` builds a production image successfully (`docker build` passes)
- `fly.toml` has correct app name, port (3000), health check path (`/healthz`)
- CORS configured for localhost + production domain
- `CHANGELOG.md` initialized with `## [Unreleased]` header
- `CLAUDE.md` documents Hono middleware chain, handler pattern, file structure
**Edge cases:**
- `/readyz` returns 503 gracefully if DB not connected (no unhandled crash)
- `src/env.ts` must use Zod `.parse()` not `.safeParse()` — fail loud on missing vars
- Dockerfile: use `node:20-alpine`, not `node:latest` (smaller image, reproducible)
- `fly.toml`: set `[http_service] force_https = true`

---

## T3: Scaffold Mobile (Flutter)
**Files:** `apps/mobile/` (Flutter create), `apps/mobile/analysis_options.yaml`, `apps/mobile/CLAUDE.md`
**SRS:** C-09
**Acceptance:**
- `flutter run` launches on iOS Simulator or Android Emulator
- `flutter analyze` passes with 0 errors, 0 warnings
- `analysis_options.yaml` extends `package:flutter_lints/flutter.yaml` with strict additions: `avoid_print: true`, `prefer_const_constructors: true`, `prefer_final_fields: true`
- Min SDK versions set: Android `minSdkVersion 24`, iOS deployment target `15.0`
- Bundle ID: `in.creatorhub.app` (Android) + `in.creatorhub.app` (iOS)
- App display name: `CreatorHub`
- `CLAUDE.md` documents Flutter architecture (feature-first, Riverpod, GoRouter), key package list
**Edge cases:**
- Remove all boilerplate counter app code — start from a clean `main.dart`
- Add `flutter_lints` to `dev_dependencies` in `pubspec.yaml`
- iOS `Info.plist`: add `NSLocationWhenInUseUsageDescription` and `NSCameraUsageDescription` (needed later — add now to avoid App Store rejection)
- Android `AndroidManifest.xml`: add `INTERNET`, `CAMERA`, `ACCESS_FINE_LOCATION` permissions

---

## T4: Scaffold Web (Next.js)
**Files:** `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/next.config.ts`, `apps/web/tailwind.config.ts`, `apps/web/postcss.config.js`, `apps/web/.env.example`, `apps/web/CLAUDE.md`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`
**SRS:** C-09
**Acceptance:**
- `pnpm --filter web dev` starts Next.js on port 3001
- Root layout sets `<html lang="en">`, imports Inter font via `next/font/google`
- `next.config.ts` has: `output: 'standalone'` (for Docker if needed), image domains configured
- Tailwind configured with custom colors matching design system
- `CLAUDE.md` documents SSR-only scope (no client-side auth in MVP), page structure
**Edge cases:**
- `"use client"` directive never in MVP pages — SSR only
- Remove default Next.js boilerplate content from `page.tsx`
- `tailwind.config.ts` must extend, not replace, default theme

---

## T5: Shared Package
**Files:** `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`, `packages/shared/src/types/index.ts`, `packages/shared/src/schemas/index.ts`, `packages/shared/src/constants/index.ts`
**SRS:** C-09
**Acceptance:**
- API and web can import from `@creatorhub/shared`
- `src/types/` exports base TypeScript interfaces (User, Content, City, Vertical enum)
- `src/schemas/` exports base Zod schemas (used for API validation + shared contracts)
- `src/constants/` exports: `VERTICALS`, `CONTENT_TYPES`, `PLATFORM_FEE_RATE = 0.17`, `GST_RATE = 0.18`, `TDS_RATE = 0.01`
- TypeScript paths resolve correctly from both `apps/api` and `apps/web`
**Edge cases:**
- `package.json` must have `"main": "./src/index.ts"` and `"types": "./src/index.ts"` for monorepo resolution
- No runtime dependencies — shared package is types + constants only (Zod is a peer dep)
- Never import from `apps/` inside `packages/` — one-way dependency only

---

## T6: Environment Config
**Files:** `apps/api/.env.example`, `apps/web/.env.example`, `.env.example`
**SRS:** NFR-MAINT
**Acceptance:**
- Every required env var documented with: key, example value, description, required/optional
- `apps/api/.env.example` covers: `PORT`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `GOOGLE_PLACES_API_KEY`, `SENTRY_DSN`, `NODE_ENV`
- `apps/web/.env.example` covers: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_POSTHOG_KEY`, `SENTRY_DSN`
- `apps/api/src/env.ts` Zod schema must match `.env.example` exactly — no undocumented vars
**Edge cases:**
- `FIREBASE_PRIVATE_KEY` contains newlines — document this in the example with `\n` escaping note
- `JWT_SECRET` must be ≥32 characters — document minimum length in comment
- Never add actual values — placeholder only (e.g., `JWT_SECRET=your-secret-here-min-32-chars`)
- `.env` must be in `.gitignore` — verify before committing

---

## T7: CI Pipeline
**Files:** `.github/workflows/ci.yml`
**SRS:** NFR-MAINT-003
**Acceptance:**
- Triggers on: `pull_request` to `main`, `push` to `main`
- **Parallel jobs** (not sequential): `lint-and-typecheck` + `flutter-analyze` run simultaneously
- `test` job runs after `lint-and-typecheck` passes
- Node version pinned via `.nvmrc` (`actions/setup-node` with `node-version-file: '.nvmrc'`)
- Flutter version pinned (e.g., `flutter-version: '3.22.0'`)
- pnpm cache enabled (`actions/cache` on `~/.pnpm-store`)
- Flutter pub cache enabled
- All jobs must pass for PR to be mergeable (branch protection rule)
**Job structure:**
```
lint-and-typecheck: pnpm lint && pnpm typecheck   (Node, runs in ~60s)
flutter-analyze:    flutter analyze                (Flutter, runs in ~90s)
test:               pnpm test (depends on lint-and-typecheck)
```
**Edge cases:**
- `pnpm install --frozen-lockfile` in CI — never `pnpm install` (which updates lockfile)
- `flutter test` included in CI once tests exist (skip gracefully if no test files yet)
- Fail fast: if lint fails, don't run tests (saves CI minutes)
- Secret scanning: GitHub default secret scanning enabled on repo

---

## T8: Dev Command
**Files:** Root `package.json` scripts
**SRS:** NFR-MAINT-004
**Acceptance:**
- `pnpm dev` starts API + web simultaneously (uses `concurrently` or `pnpm --parallel`)
- Output is color-coded and prefixed: `[api]`, `[web]`
- `pnpm build` builds API + web
- `pnpm lint` lints all TypeScript workspaces
- `pnpm typecheck` runs TypeScript compiler check across all workspaces
- `pnpm test` runs all tests
**Edge cases:**
- Flutter dev is separate (`cd apps/mobile && flutter run`) — document this in root README
- `pnpm dev` must work with a fresh clone + `pnpm install` (no undocumented global deps)
- API dev uses `tsx watch` (not `ts-node`, not `nodemon`) for fast restarts

---

## T9: Root README
**Files:** `README.md`
**SRS:** NFR-MAINT
**Acceptance:**
- Prerequisites listed: Node 20+, pnpm 9+, Flutter 3.22+, Docker (optional)
- Quick start: `git clone → pnpm install → cp .env.example → pnpm dev`
- App URLs listed: API `localhost:3000`, Web `localhost:3001`
- Flutter run instructions
- Link to `docs/README.md` for full documentation
- Link to `CLAUDE.md` for AI session context
**Edge cases:**
- Keep it short — README is orientation, not documentation
- No architecture diagrams here — those belong in `docs/engineering/HLD.md`
