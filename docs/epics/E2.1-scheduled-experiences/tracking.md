# E2.1 — Scheduled Experiences — Tracking

> Status: **DONE**
> Detail per task lives here. Master dashboard: `docs/epics/TRACKING.md`.

---

## Status

| Field | Value |
|-------|-------|
| Epic | E2.1 Scheduled Experiences |
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
| T1 | `experience.service.ts` (createDraft, getDetail T-24h reveal, update, setMeetingPoint, publish with KYC gate) | API | `DONE` | `[x]` 27/27 | `experience.service.test.ts` |
| T2 | `scheduled-dates.service.ts` (addDate, updateDate, deleteDate soft-delete if bookings, listDates) | API | `DONE` | `[x]` 26/26 | `scheduled-dates.service.test.ts` |
| T3 | Experience handlers + routes (`/api/v1/experiences`, `/api/v1/experiences/:id/dates`) | API | `DONE` | — | |
| T4 | Experience service tests | API | `DONE` | `[x]` 27/27 | |
| T5 | Scheduled dates service tests | API | `DONE` | `[x]` 26/26 | |
| T6 | `experience_provider.dart` (Riverpod 3.x Notifier — detail, draft, publish flow) | Mobile | `DONE` | — | |
| T7 | `ExperienceDetailScreen` (T-24h host reveal banner, meeting point, booking CTA, skeleton) | Mobile | `DONE` | — | |
| T8 | `CreateExperienceWizard` (6 steps: Basics → Itinerary → Meeting Point → Dates → Pricing → Review) | Mobile | `DONE` | — | |
| T9 | Add routes to `router.dart` (`/experiences/:id`, `/create/experience`) | Mobile | `DONE` | — | |

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
| `apps/api/src/services/experience.service.test.ts` | 27 | `[x]` 27/27 |
| `apps/api/src/services/scheduled-dates.service.test.ts` | 26 | `[x]` 26/26 |

**Total: 53 API tests — all passing**
