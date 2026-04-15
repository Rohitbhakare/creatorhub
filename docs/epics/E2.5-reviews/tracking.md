# E2.5 — Reviews — Tracking

> Status: **DONE**
> Detail per task lives here. Master dashboard: `docs/epics/TRACKING.md`.

---

## Status

| Field | Value |
|-------|-------|
| Epic | E2.5 Reviews |
| Milestone | M2 |
| Status | `DONE` |
| Plan approved | `[x]` Yes |
| Implementation started | `[x]` Yes |
| Implementation complete | `[x]` Yes |
| Committed | `[x]` Yes — commit `dev` branch |

---

## Task Status

| ID | Task | Agent | Status | Tests | Notes |
|----|------|-------|--------|-------|-------|
| T1 | `review.service.ts` (submitReview, submitCreatorResponse, getReview, listContentReviews, revealDueReviews — blind 14-day reveal) | API | `DONE` | `[x]` | `review.service.test.ts` |
| T2 | Review handlers + routes (`/api/v1/reviews`, `/api/v1/reviews/:id/response`) | API | `DONE` | — | |
| T3 | Review service tests | API | `DONE` | `[x]` | |
| T4 | `review_provider.dart` (Riverpod 3.x Notifier — submission state, list provider) | Mobile | `DONE` | — | |
| T5 | `WriteReviewScreen` (5-star selector, 500-char text, photo attach, T&C checkbox) | Mobile | `DONE` | — | |
| T6 | `ReviewDetailScreen` (blind reveal countdown, reveal animation, creator response) | Mobile | `DONE` | — | 14-day deadline |
| T7 | `RatingStars` widget (read-only + interactive variants) | Mobile | `DONE` | — | |
| T8 | `ReviewsList` widget (skeleton, empty state, pagination) | Mobile | `DONE` | — | |
| T9 | Add `/content/:id/write-review` and `/reviews/:id` routes | Mobile | `DONE` | — | |

---

## Pre-Commit Checklist

- `[x]` All tests passing
- `[x]` `tsc --noEmit` — 0 errors
- `[x]` `flutter analyze` — 0 errors
- `[x]` API boots — `/healthz` 200
- `[x]` Flutter launches — no crash
- `[x]` Tracking updated

---

## Test Coverage

| File | Tests | Passing |
|------|-------|---------|
| `apps/api/src/services/review.service.test.ts` | — | `[x]` All passing |

---

## Notes

- Blind review: both reviewer and creator submit reviews without seeing each other's. After 14 days, reviews are mutually revealed.
- `revealDueReviews` is called by a cron job (or on-demand check) — finds reviews past the 14-day deadline and flips `is_revealed = true`.
- Verified booking requirement: `submitReview` checks that the reviewer has a completed booking for that experience.
