# E1.2 — Posts Tracking

**Status:** IN REVIEW
**Progress:** 9/10 tasks implemented (T9 deferred)
**Branch:** `dev`
**Last Updated:** 2026-04-12

---

## Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1 | Post Zod Schema & Validation | `[x]` Done | `updatePostSchema` already existed in `packages/shared/src/schemas/`; no new schema needed (posts are always free, use `createContentSchema` for draft creation) |
| T2 | Post Service | `[x]` Done | Thin layer over content service — `createPostDraft` (forces free pricing), `getPostDetail` (with `is_liked`/`is_saved` stubs), `updatePost`, `publishPost` (no KYC required), `listPosts` — `apps/api/src/services/post.service.ts` |
| T3 | Post Handlers & Routes | `[x]` Done | 5 handlers in `apps/api/src/handlers/posts.ts`, mounted at `/api/v1/posts`. Auth middleware on all write endpoints. |
| T4 | Post Creation Wizard (Flutter) | `[x]` Done | 3-step wizard (Basics → Media → Review) using E1.1 shell — `apps/mobile/lib/features/posts/` |
| T5 | Post Body Editor (Flutter) | `[x]` Done | Multi-line input, 1000-char live counter with color thresholds, location chip placeholder — `apps/mobile/lib/features/posts/widgets/post_body_editor.dart` |
| T6 | Post Media Step (Flutter) | `[x]` Done | `image_picker`, 2-col grid, max 5 images enforced — `apps/mobile/lib/features/posts/widgets/post_media_step.dart` |
| T7 | Post Detail Screen (Flutter) | `[x]` Done | Hero image, Fraunces body font, creator header, engagement bar (like/comment/share/save), skeleton loading — `apps/mobile/lib/features/posts/screens/post_detail_screen.dart` |
| T8 | Post Feed Card Widget (Flutter) | `[x]` Done | 16:9 cover image, POST badge, press animation, creator row — `apps/mobile/lib/features/posts/widgets/post_feed_card.dart` |
| T9 | Post Detail SSR Page (Web) | `[ ]` Deferred | Deferred to E2.10 (minimal web). SEO page for WhatsApp sharing. |
| T10 | Mount Post Routes in App | `[x]` Done | `app.route('/api/v1/posts', postsRoutes)` in `apps/api/src/index.ts` |

---

## Tests

| Module | Test File | Written | Passing | Notes |
|--------|-----------|---------|---------|-------|
| Post Service | `apps/api/src/services/post.service.test.ts` | `[x]` Yes | `[x]` **16/16** | createPostDraft delegates with type=post, publishPost: 404/403/422/400 cases, forces free pricing, skips KYC, getPostDetail: 404 on wrong type |
| Post Handlers | `apps/api/src/handlers/posts.test.ts` | `[x]` Yes | `[x]` **20/20** | 401 no auth (all write routes), 400 invalid body/vertical, 400 tnc_accepted≠true, 404/403 from service, 201 with Location, 200 success, pagination meta |
| Post Feed Card | widget test | `[ ]` Pending | — | Needs: renders title, POST badge, cover image |
| Post Detail Screen | widget test | `[ ]` Pending | — | Needs: skeleton on loading, engagement bar renders |
| **Auth Middleware** | `apps/api/src/middleware/authenticate.test.ts` | `[x]` Yes | `[x]` **15/15** | Covers authenticate, optionalAuthenticate, requireCreator, requireKYC — shared with E1.1 |

---

## Review Gate

| Review | Status | Findings |
|--------|--------|----------|
| Edge Cases | `[x]` Passed | Posts always free — `createPostDraft` forces `pricing_model: 'free'`; max 5 images enforced in media service; body required to publish |
| Security | `[x]` Passed | Ownership check on update/delete; `authenticate` on all write routes; `optionalAuthenticate` on GET detail (guest browsing allowed) |
| Architecture | `[x]` Passed | Post service delegates to content service — no business logic duplication; thin handler pattern |
| Code Quality | `[x]` Passed | `flutter analyze`: 0 issues; `tsc --noEmit`: 0 errors |

---

## Pre-Commit Checklist

| Check | Status | Result |
|-------|--------|--------|
| Post service tests | `[x]` Done | **16/16 passed** in `post.service.test.ts` |
| Post handler tests | `[x]` Done | **20/20 passed** in `posts.test.ts` — auth wiring, validation, service error propagation |
| Flutter post widget tests | `[ ]` Pending | Widget tests not yet written |
| Auth middleware tests (shared) | `[x]` Done | **15/15 passed** in `authenticate.test.ts` |
| Dart analyze (`flutter analyze`) | `[x]` Passed | **0 issues** |
| TypeScript typecheck (`tsc --noEmit`) | `[x]` Passed | **0 errors** |
| Edge case review | `[x]` Passed | See Review Gate above |
| Security review | `[x]` Passed | See Review Gate above |
| Architecture review | `[x]` Passed | See Review Gate above |
| Code quality review | `[x]` Passed | See Review Gate above |
| API boots — `/healthz` 200 | `[x]` Passed | Verified: `{"status":"ok"}` on port 3001 |
| API readyz — database | `[x]` Passed | `database: true` — migrations 001–013 deployed, service role key configured |
| API readyz — firebase | `[x]` Passed | `firebase: true` |
| Flutter launches | `[ ]` Pending | Not yet run (`flutter run`) |
| Tracking file updated | `[x]` Done | This file |

**Commit gate:** Blocked on → Flutter widget tests + Flutter launch verified

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-12 | Epic created, 10 tasks defined |
| 2026-04-12 | 9/10 tasks completed (T9 SSR deferred). 4 API files + 5 Flutter files. `flutter analyze`: 0 issues, `tsc`: 0 errors |
| 2026-04-12 | Pre-commit checklist added. Service tests pending. API boots confirmed on port 3001. Firebase confirmed working. DB pending migrations. |
| 2026-04-12 | `post.service.test.ts` written: 16/16 passing. Migrations 001–013 deployed to new Supabase project. DB readyz blocked on service role key. |
