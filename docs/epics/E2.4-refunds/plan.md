# E2.4 — Refunds & Cancellations

> **SRS refs:** BOOK-FR-006, BK-FR-014
> **Depends on:** E2.3 (payments & booking — refund operates on existing bookings)

---

## Market Research — Refund UX

### Airbnb
- **3 policies:** Flexible (full refund 24h before), Moderate (full 5 days before), Strict (50% 7 days before). Creator chooses at listing creation.
- **Traveller-initiated:** "Cancel booking" → policy shown → refund amount calculated → confirm.
- **Creator-initiated:** Full refund always. Creator cancellation hurts listing ranking.

### CreatorHub Approach (per SRS)
- **3 policies:** Flexible (full refund 7 days before), Moderate (50% 3 days before), Strict (no refund).
- **Refund calculation:** Base amount × refund percentage. GST refunded proportionally. Platform fee not refunded.
- **Processing:** Razorpay refund API. T+5-7 business days.
- **Visibility:** Refund status inline on booking card (BK-FR-014).

---

## Task Breakdown

| ID | Task | Platform | Est. Tests |
|----|------|----------|-----------|
| T1 | Refund policy schemas (flexible/moderate/strict rules) | Shared | — |
| T2 | Refund service (calculate refund, initiate via Razorpay, update booking state) | API | ~12 |
| T3 | Cancellation service (traveller-initiated, creator-initiated, policy enforcement) | API | ~10 |
| T4 | Refund handlers + routes | API | ~8 |
| T5 | Cancellation flow screen (policy display, refund amount preview, confirmation) | Mobile | — |
| T6 | Refund status display on booking card | Mobile | — |
| T7 | API tests | API | ~30 total |

**Estimated total: ~30 API tests**

## Definition of Done

- [ ] 3 refund policies enforced correctly
- [ ] Traveller + creator cancellation flows
- [ ] Razorpay refund API integration
- [ ] Refund status visible on booking cards
- [ ] ~30 API tests passing
