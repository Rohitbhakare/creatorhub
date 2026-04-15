# E2.7 — Trust & Safety — Tracking

> Status: **DONE**
> Detail per task lives here. Master dashboard: `docs/epics/TRACKING.md`.

---

## Status

| Field | Value |
|-------|-------|
| Epic | E2.7 Trust & Safety |
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
| T1 | `trust.service.ts` (submitReport 10/hr rate-limit, checkToxicity Perspective API fail-open, moderateText auto-flag, getPendingReports, actionReport, giveStrike, getUserStrikes) | API | `DONE` | `[x]` 23/23 | `trust.service.test.ts` |
| T2 | Trust handlers + routes (`/api/v1/reports`, `/api/v1/admin/moderation`) | API | `DONE` | — | |
| T3 | Trust service tests (23 tests — rate limiting, Perspective mock, auto-flag, report workflow) | API | `DONE` | `[x]` 23/23 | |

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
| `apps/api/src/services/trust.service.test.ts` | 23 | `[x]` 23/23 |

**Total: 23 API tests — all passing**

---

## Notes

- `checkToxicity` calls the Perspective API with a 2s timeout. On network error or API failure, it fails open (returns `{ toxic: false }`) so content is not incorrectly blocked.
- `submitReport` is rate-limited to 10 reports per hour per user using a Redis sliding-window counter.
- Strikes: first strike = warning, second = 7-day suspension, third = permanent ban.
