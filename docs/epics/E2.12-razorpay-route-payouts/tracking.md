# E2.12 — Razorpay Route Payouts · Tracking

**Status:** `DONE` (completed 2026-04-19)
**Plan:** `plan.md`
**Tasks:** `tasks.md`
**Opened:** 2026-04-19
**Closed:** 2026-04-19

---

## Summary

Activates Razorpay Route end-to-end: linked account creation on KYC verify, transfer-at-order, payout release after completion + 48h, webhook-driven state machine, creator-facing earnings UI. Closes the gap left by E2.3 (money was collected but never flowed to creators).

---

## Task progress

| # | Task | Agent | Status | Tests | Notes |
|---|------|-------|--------|-------|-------|
| T1 | Shared types + Zod schemas | API | `[x]` Done | — | `PayoutStatus`, `PayoutSummary`, `PayoutListResponse`, `LinkedAccount` |
| T2 | Razorpay client wrapper | API | `[x]` Done | 6 | `createLinkedAccount`, `createTransfer`, `editTransfer`, `reverseTransfer` |
| T3 | Linked account service | API | `[x]` Done | 8 | status machine, upsert on webhook |
| T4 | KYC hook → linked account | API | `[x]` Done | 4 | auto-creates Razorpay account on KYC verified |
| T5 | Booking: transfers at order | API | `[x]` Done | 12 | creates `transfers[]` on order create, `on_hold=1` |
| T6 | Payout service | API | `[x]` Done | 14 | `createPayoutOnPaymentCaptured`, `schedulePayoutOnBookingCompleted`, `releasePayout`, `releasePendingPayouts`, `reversePayout` |
| T7 | Webhook handler extend | API | `[x]` Done | 9 | payment.captured, transfer.settled, payout.processed/reversed/failed, account.* |
| T8 | Booking completion trigger | API | `[x]` Done | 3 | schedules payout at `now + 48h` |
| T9 | Creator-facing endpoints | API | `[x]` Done | 5 | `GET /creators/me/payouts`, `GET /creators/me/linked-account` |
| T10 | Internal release cron | API | `[x]` Done | 3 | `POST /internal/cron/payouts/release` (15m cadence) |
| T11 | Refund → transfer reversal | API | `[x]` Done | 6 | partial + full reversal paths |
| T12 | Flutter providers | Mobile | `[x]` Done | — | `earningsProvider`, `linkedAccountProvider` |
| T13 | Flutter Earnings screen | Mobile | `[x]` Done | 14 | `/studio/earnings` route + summary + list + banner |
| T14 | Studio tab → Earnings link | Mobile | `[x]` Done | — | `_EarningsInfoCard` shows live amount + status, taps to earnings |
| T15 | Payout lifecycle notifications | API | `[x]` Done | 10 | 4 types: payouts_enabled, processed, failed, action_required |
| T16 | Ops playbook + OpenAPI | Docs | `[x]` Done | — | `docs/ops/payouts-playbook.md` + 3 OpenAPI paths |
| T17 | Integration test (full lifecycle) | API | `[x]` Done | 5 | happy path + release failure |

---

## Pre-Commit Checklist

- [x] All tests passing — **839 API + 225 Flutter** (target was +75/+20; delivered +105 API, +14 Flutter)
- [x] `tsc --noEmit` — 0 errors
- [x] `flutter analyze` — 0 issues in new E2.12 code (53 pre-existing info-level elsewhere, untouched)
- [x] API boots — unchanged; webhook + cron routes wired in `src/index.ts`
- [x] Flutter launches — no runtime crashes after mobile changes
- [ ] Webhook signature verification verified against live Razorpay test events — **deferred to staging rollout**
- [ ] `/internal/payouts/release` validated with a scripted run — **deferred to staging rollout**
- [x] Tracking file updated (this file)

---

## Decisions (Q1–Q10 resolved 2026-04-19)

| # | Question | Decision |
|---|----------|----------|
| Q1 | Route enabled live? | Test mode — live activation deferred |
| Q2 | Transfer at order vs post-capture | **At order, `on_hold=1`** |
| Q3 | Release trigger | **Cron (15m) + transfer.settled webhook** |
| Q4 | Earnings screen placement | **New `/studio/earnings` route** |
| Q5 | Block paid publish if linked account inactive | **No — allow, show banner** |
| Q6 | TDS 26AS filing | Out of scope (ops) |
| Q7 | Summary window | **30-day rolling** |
| Q8 | Notifications on lifecycle | **4 types shipped (T15)** |
| Q9 | Auto-retry linked account on 5xx | **3 attempts w/ exponential backoff** |
| Q10 | Ops playbook location | **`docs/ops/payouts-playbook.md`** |

---

## Follow-ups (backlog)

- B1 → Razorpay live-account activation gate before production toggle
- B2 → Wire PostHog events: `payout_processed`, `payout_failed`, `payouts_enabled`
- B3 → Build a `scripts/notify-payout-processed.ts` one-off for ops replay (see playbook §5)

---

*This tracking file is updated after every task completes.*
