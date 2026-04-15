# E2.5 — Reviews — Tasks

> Epic status: **DONE**
> Plan: `docs/epics/E2.5-reviews/plan.md`

---

## Task Breakdown

| ID | Task | Platform | Description |
|----|------|----------|-------------|
| T1 | `review.service.ts` | API | `submitReview` (verified booking required), `submitCreatorResponse`, `getReview`, `listContentReviews` (cursor), `revealDueReviews` — blind 14-day reveal logic |
| T2 | Review handlers + routes | API | `/api/v1/reviews` — submit, get, list; `/api/v1/reviews/:id/response` — creator response; scheduled reveal cron |
| T3 | Review service tests | API | `review.service.test.ts` — covering blind reveal, response submission, listing with pagination |
| T4 | `review_provider.dart` | Mobile | Riverpod 3.x Notifier — review submission state, list provider with caching |
| T5 | `WriteReviewScreen` | Mobile | 5-star selector (tap + haptic), 500-char text area, photo attach (optional), T&C checkbox |
| T6 | `ReviewDetailScreen` | Mobile | Blind reveal countdown (14-day timer), reveal animation, creator response section |
| T7 | `RatingStars` widget | Mobile | Shared display component (read-only and interactive variants) |
| T8 | `ReviewsList` widget | Mobile | Scrollable list with skeleton loading, empty state, pagination |
| T9 | Add routes | Mobile | `/content/:id/write-review`, `/reviews/:id` in `router.dart` |

---

## Test Files

| File | Tests |
|------|-------|
| `apps/api/src/services/review.service.test.ts` | — (see tracking.md) |

**Total: see tracking.md**
