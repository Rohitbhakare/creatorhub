# E1.1 — Content Framework Tracking

**Status:** IN REVIEW
**Progress:** 14/14 tasks implemented
**Branch:** `dev`
**Last Updated:** 2026-04-12

---

## Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1 | Content Zod Schemas & TypeScript Types | `[x]` Done | `createContentSchema`, `updatePostSchema`, `updateItinerarySchema`, `publishContentSchema`, etc. in `packages/shared/src/schemas/` |
| T2 | Content CRUD Service | `[x]` Done | `createDraft`, `getById`, `updateDraft`, `listDrafts`, `listPublished` (cursor pagination), `softDelete` in `apps/api/src/services/content.service.ts` |
| T3 | Content State Machine Service | `[x]` Done | `publish` (per-type validation, KYC check), `unpublish`, `archive` in `apps/api/src/services/content-state.service.ts` |
| T4 | Content CRUD Handlers & Routes | `[x]` Done | 9 handlers in `apps/api/src/handlers/content.ts`, mounted at `/api/v1/content` |
| T5 | Media Upload Service | `[x]` Done | `generateSignedUrl`, `addMedia` (count limits: 5 posts / 10 others), `removeMedia`, `reorderMedia` in `apps/api/src/services/media.service.ts` |
| T6 | Google Places Proxy | `[x]` Done | `autocomplete` (India bias, `components=country:in`), `placeDetails` (in-memory cache) in `apps/api/src/services/places.service.ts` |
| T7 | T&Cs Consent Service | `[x]` Done | `recordConsent` (idempotent upsert), `hasConsented` in `apps/api/src/services/tnc.service.ts` |
| T8 | Pricing Calculator Utilities | `[x]` Done | `calculatePricing`, `formatPricePaisa` (Indian grouping) in `packages/shared/src/utils/pricing.ts` |
| T9 | Content Type Picker Screen (Flutter) | `[x]` Done | 2×2 grid, Post+Itinerary enabled, Event+Experience disabled — `apps/mobile/lib/features/content/screens/content_type_picker_screen.dart` |
| T10 | Publishing Wizard Shell (Flutter) | `[x]` Done | Stepper + progress bar + auto-save timer (30s) — `apps/mobile/lib/features/content/screens/wizard_shell_screen.dart` |
| T11 | Basics Step Component (Flutter) | `[x]` Done | Title / description / body with live char counters + color thresholds — `apps/mobile/lib/features/content/widgets/steps/basics_step.dart` |
| T12 | Pricing Step Component (Flutter) | `[x]` Done | Free/paid toggle, price input, GST/platform fee/TDS/take-home breakdown — `apps/mobile/lib/features/content/widgets/steps/pricing_step.dart` |
| T13 | Review & Publish Step Component (Flutter) | `[x]` Done | Validation checklist, T&Cs checkbox, publish CTA — `apps/mobile/lib/features/content/widgets/steps/review_step.dart` |
| T14 | Draft Auto-Save Service (Flutter) | `[x]` Done | 30s debounce timer, PUT to API, save status indicator — `apps/mobile/lib/features/content/services/draft_auto_save_service.dart` |

---

## Tests

| Module | Test File | Written | Passing | Notes |
|--------|-----------|---------|---------|-------|
| Pricing Calculator | `packages/shared/src/utils/pricing.test.ts` | `[x]` Yes | `[x]` **35/35** | Pure unit tests — all 35 pass. Covers free/paid/rounding/high-value/format. |
| Content State Machine | `apps/api/src/services/content-state.service.test.ts` | `[x]` Yes | `[x]` **20/20** | Unit tests with mocked Supabase. Covers publish/unpublish/archive + T&C, ownership, KYC, state transitions. |
| Content CRUD Service | `apps/api/src/services/content.service.test.ts` | `[ ]` Pending | — | Needs: createDraft, updateDraft, softDelete, cursor pagination |
| Media Service | `apps/api/src/services/media.service.test.ts` | `[ ]` Pending | — | Needs: count limits (5/10), signed URL generation |
| T&Cs Service | `apps/api/src/services/tnc.service.test.ts` | `[ ]` Pending | — | Simple idempotent upsert |
| Content Handlers | `apps/api/src/handlers/content.test.ts` | `[ ]` Pending | — | Integration: 401 without auth, 400 on invalid input, 404 on missing |
| Flutter Wizard Shell | widget test | `[ ]` Pending | — | Step navigation, auto-save timer |
| Flutter Pricing Step | widget test | `[ ]` Pending | — | Free/paid toggle, breakdown display |

---

## Review Gate

| Review | Status | Findings |
|--------|--------|----------|
| Edge Cases | `[x]` Passed | Media count limits enforced (5 posts, 10 others); KYC check gates paid publishing; `under_review` is pass-through in MVP |
| Security | `[x]` Passed | Ownership checks on every write; parameterized SQL; Google Places API key server-side only; `requireKYC` middleware for paid content |
| Architecture | `[x]` Passed | Handler→service→query pattern; Riverpod Notifier (not StateNotifier); shared types from `packages/shared`; no HTTP context in services |
| Code Quality | `[x]` Passed | `flutter analyze`: 0 issues; `tsc --noEmit`: 0 errors |

---

## Pre-Commit Checklist

| Check | Status | Result |
|-------|--------|--------|
| Pricing tests (`packages/shared` — `pnpm test`) | `[x]` Done | **35/35 passed** |
| API tests (`apps/api` — `pnpm test`) | `[x]` Done | **35/35 passed** (content-state: 20, auth: 15) |
| Content CRUD service tests | `[ ]` Pending | Not yet written |
| Media service tests | `[ ]` Pending | Not yet written |
| Flutter widget tests | `[ ]` Pending | Not yet written |
| Dart analyze (`flutter analyze`) | `[x]` Passed | **0 issues** |
| TypeScript typecheck (`tsc --noEmit`) | `[x]` Passed | **0 errors** |
| Edge case review | `[x]` Passed | See Review Gate above |
| Security review | `[x]` Passed | See Review Gate above |
| Architecture review | `[x]` Passed | See Review Gate above |
| Code quality review | `[x]` Passed | See Review Gate above |
| API boots — `/healthz` 200 | `[x]` Passed | Verified: `{"status":"ok"}` on port 3001 |
| API readyz — database | `[x]` Passed | `database: true` — migrations 001–013 deployed, service role key configured |
| API readyz — firebase | `[x]` Passed | `firebase: true` — Firebase Admin SDK initializes correctly |
| Flutter launches | `[ ]` Pending | Not yet run (`flutter run`) |
| Tracking file updated | `[x]` Done | This file |

**Commit gate:** Blocked on → remaining service tests + Supabase migrations deployed + Flutter launch verified

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-12 | Epic created, 14 tasks defined |
| 2026-04-12 | All 14 tasks completed via 3 parallel agents. `flutter analyze`: 0 issues, `tsc`: 0 errors |
| 2026-04-12 | Pre-commit checklist added. Pricing (35) + content-state (20) + auth (15) tests written and passing. API boots on port 3001. Firebase confirmed working. DB pending migrations. |
