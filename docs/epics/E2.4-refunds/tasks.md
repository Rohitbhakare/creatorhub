# E2.4 — Refunds & Cancellations — Tasks

> Epic status: **DONE**
> Plan: `docs/epics/E2.4-refunds/plan.md`

---

## Task Breakdown

| ID | Task | Platform | Description |
|----|------|----------|-------------|
| T1 | `refund.service.ts` | API | Three refund policies (flexible/moderate/strict), `calculateRefundAmount`, `getRefundPolicy`, `setRefundPolicy`, `cancelBookingByBuyer`, `cancelBookingByCreator`, `cancelBookingByAdmin`, `getRefundStatus` — Razorpay Refund API integration |
| T2 | Refund handlers + routes | API | Cancel endpoints mounted on `/api/v1/bookings/:id/cancel`; policy endpoints on `/api/v1/experiences/:id/refund-policy` |
| T3 | Refund service tests | API | `refund.service.test.ts` — 21 tests covering all three policies, edge cases (0% refund, 100% refund, partial), Razorpay mock |
| T4 | Add cancel routes to `bookings.routes.ts` | API | Wire buyer/creator/admin cancel handlers with appropriate middleware |

---

## Test Files

| File | Tests |
|------|-------|
| `apps/api/src/services/refund.service.test.ts` | 21 |

**Total: 21 API tests**
