# E2.7 — Trust & Safety — Tasks

> Epic status: **DONE**
> Plan: `docs/epics/E2.7-trust-safety/plan.md`

---

## Task Breakdown

| ID | Task | Platform | Description |
|----|------|----------|-------------|
| T1 | `trust.service.ts` | API | `submitReport` (10/hr rate-limit per user), `checkToxicity` (Perspective API — fail-open), `moderateText` (auto-flag if toxicity score ≥ threshold), `getPendingReports` (admin), `actionReport` (dismiss/remove), `giveStrike` (warn/suspend), `getUserStrikes` |
| T2 | Trust handlers + routes | API | `/api/v1/reports` — submit report; `/api/v1/admin/moderation` — pending reports, action, strikes |
| T3 | Trust service tests | API | `trust.service.test.ts` — 23 tests covering rate limiting, Perspective mock (pass + fail-open), auto-flag, report workflow |

---

## Test Files

| File | Tests |
|------|-------|
| `apps/api/src/services/trust.service.test.ts` | 23 |

**Total: 23 API tests**
