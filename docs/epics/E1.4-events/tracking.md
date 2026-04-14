# E1.4 — Events — Tracking

> Status: **PLAN REVIEW** — awaiting founder approval before implementation begins.
> Detail per task lives here. Master dashboard: `docs/epics/TRACKING.md`.

---

## Status

| Field | Value |
|-------|-------|
| Epic | E1.4 Events |
| Milestone | M1 — Private Alpha |
| Status | `PLAN REVIEW` |
| Plan approved | `[ ]` Not yet |
| Implementation started | `[ ]` Not yet |

---

## Task Status

| ID | Task | Agent | Status | Tests | Notes |
|----|------|-------|--------|-------|-------|
| T0 | Migration 014 — event_occurrences nullable + what_to_bring column | API | `[ ] Not Started` | — | **First** — must deploy before T2 |
| T1 | Event Zod Schemas & Shared Types | API | `[ ] Not Started` | — | Unblocks all other tasks |
| T2 | Event Service | API | `[ ] Not Started` | — | Deps: T0, T1 |
| T3 | Event Handlers & Routes | API | `[ ] Not Started` | — | Deps: T2 |
| T4 | Mount Event Routes | API | `[ ] Not Started` | — | Deps: T3 |
| T5 | Event Service Tests | API | `[ ] Not Started` | 0/15+ | Deps: T2 |
| T6 | Event Handler Tests | API | `[ ] Not Started` | 0/21+ | Deps: T3, T5 |
| T7 | Event Creation Wizard (Flutter) | Mobile | `[ ] Not Started` | — | Deps: T1, T3, E1.1 wizard shell |
| T8 | Event Detail Screen (Flutter) | Mobile | `[ ] Not Started` | — | Deps: T1, T3 |
| T9 | Event Feed Card Widget (Flutter) | Mobile | `[ ] Not Started` | — | Deps: T1, E0.4 |
| T10 | Flutter Widget Tests | Mobile | `[ ] Not Started` | 0/10+ | Deps: T8, T9 |
| T11 | Register Event Routes in Router | Mobile | `[ ] Not Started` | — | Deps: T7, T8 |

**Parallelism note:** T0 first (deploy migration). T1 next (unblocks both agents). Then T2–T6 (API) run in parallel with T7–T11 (Mobile).

---

## Pre-Commit Checklist

> Fill in when all tasks are DONE. Run in order. Zero exceptions.

**Tests**
- `[ ]` `pnpm test` in `apps/api/` — all tests passing (including new event service + handler tests)
- `[ ]` `flutter test` in `apps/mobile/` — all widget tests passing
- `[ ]` No skipped tests

**Lint & Type Check**
- `[ ]` `eslint` — 0 errors in `apps/api/` and `packages/shared/`
- `[ ]` `tsc --noEmit` — 0 errors in `apps/api/` and `packages/shared/`
- `[ ]` `flutter analyze` — 0 errors, 0 warnings in `apps/mobile/`

**4-Step Review Gate**
- `[ ]` Edge case review — all §11 edge cases covered in tests or documented as deferred
- `[ ]` Security review — §10 risks verified (especially atomic RSVP capacity check)
- `[ ]` Architecture review — HLD adherence, API conventions followed
- `[ ]` Code quality review — `simplify` + `/review-pr`

**Runtime Verification**
- `[ ]` `GET /healthz` returns 200 after mounting event routes
- `[ ]` `GET /api/v1/events` returns valid response (may be empty list)
- `[ ]` Flutter app launches without crash after adding event routes

**Tracking**
- `[ ]` This file updated with final task statuses
- `[ ]` `docs/epics/TRACKING.md` updated with E1.4 status = `DONE`

---

## Test Coverage

| File | Tests | Passing |
|------|-------|---------|
| `apps/api/src/services/event.service.test.ts` | 0 | — |
| `apps/api/src/handlers/events.test.ts` | 0 | — |
| `apps/mobile/test/features/events/widgets/event_feed_card_test.dart` | 0 | — |
| `apps/mobile/test/features/events/widgets/date_block_test.dart` | 0 | — |
| `apps/mobile/test/features/events/screens/event_detail_screen_test.dart` | 0 | — |

**Target:** ≥ 15 API service tests + ≥ 21 API handler tests + ≥ 10 Flutter widget tests = **46+ tests**

---

## Open Questions Resolution

> All resolved by founder on 2026-04-14.

| # | Question | Decision |
|---|----------|----------|
| 1 | Where to store draft event fields? | **`event_occurrences` table** (nullable columns via migration 014) |
| 2 | List default: upcoming-only or all? | **Upcoming only** (`start_at >= now`, opt-in `include_past=true`) |
| 3 | Can creator edit after publish? | **NO** — unpublish → edit → republish |
| 4 | RSVPs on unpublish? | **Soft-cancel** (`status='cancelled'`) + reset `spots_booked=0` + **push notification** to each user |
| 5 | What to bring: structured or free text? | **Drawer with category checkboxes + free text.** Predefined suggestions as Flutter constant `Map<String, List<String>>`. DB: `TEXT[]` in `event_occurrences.what_to_bring` |
| 6 | Feed card format? | **"X going / Y max"** |
