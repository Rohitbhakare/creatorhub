# E2.4 — Refunds & Cancellations — Tracking

> Status: **DONE**
> Detail per task lives here. Master dashboard: `docs/epics/TRACKING.md`.

---

## Status

| Field | Value |
|-------|-------|
| Epic | E2.4 Refunds & Cancellations |
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
| T1 | `refund.service.ts` (3 policies: flexible/moderate/strict; calculateRefundAmount, getRefundPolicy, setRefundPolicy, cancelBookingByBuyer/Creator/Admin, getRefundStatus — Razorpay Refund API) | API | `DONE` | `[x]` 21/21 | `refund.service.test.ts` |
| T2 | Refund handlers + routes (`/api/v1/bookings/:id/cancel`, `/api/v1/experiences/:id/refund-policy`) | API | `DONE` | — | |
| T3 | Refund service tests (21 tests — policies, edge cases, Razorpay mock) | API | `DONE` | `[x]` 21/21 | |
| T4 | Add cancel routes to `bookings.routes.ts` (buyer/creator/admin cancel with middleware) | API | `DONE` | — | |

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
| `apps/api/src/services/refund.service.test.ts` | 21 | `[x]` 21/21 |

**Total: 21 API tests — all passing**

---

## Notes

- Flexible policy: 100% refund if cancelled > 24h before start.
- Moderate policy: 100% if > 7 days, 50% if 2–7 days, 0% if < 2 days.
- Strict policy: 100% if > 14 days, 0% otherwise.
- Creator-initiated cancellations always trigger 100% refund regardless of policy.
- Razorpay Refund API is called async; `getRefundStatus` polls Razorpay for settlement status.
