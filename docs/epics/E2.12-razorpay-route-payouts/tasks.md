# E2.12 — Razorpay Route Payouts · Task Breakdown

Expanded from `plan.md` §14. Each task below is self-contained — an implementer should be able to pick it up without re-reading the full plan. Dependencies reference other task IDs (e.g. "depends on T2").

---

## T1 — Shared types + Zod schemas

**Agent:** API
**Depends on:** none
**Files:**
- `packages/shared/src/types/payout.ts` (new)
- `packages/shared/src/schemas/payout.ts` (new)
- `packages/shared/src/index.ts` (re-export)

**SRS refs:** BOOK-FR-005

**Acceptance:**
- `PayoutStatus` union: `pending | scheduled | processing | completed | failed`
- `PayoutSummary`: `{ id, bookingId, amountPaisa, tdsPaisa, status, scheduledAt, processedAt, bookingTitle }`
- `LinkedAccountStatus` union: `created | activated | suspended | deactivated`
- `LinkedAccount`: `{ status, activatedAt, holderName, bankAccountMasked, bankIfsc }` (all fields nullable except `status` which is `|null`)
- `ListPayoutsQuerySchema`: Zod — status optional, limit 1-50 default 20, cursor optional
- Exported via `packages/shared`; TypeScript build clean

**Edge cases:** N/A (types only).

**Done when:** `pnpm -r build` + `pnpm -r type-check` pass; imports resolve from both `apps/api` and `apps/mobile` (Dart shares types via manual mirror — no action here).

---

## T2 — Razorpay client wrapper

**Agent:** API
**Depends on:** none
**Files:**
- `apps/api/src/lib/razorpay.ts` (new)
- `apps/api/src/lib/razorpay.test.ts` (new)

**Acceptance:**
- Single exported `razorpay` singleton using `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` from `env.ts`
- Typed wrappers:
  - `createLinkedAccount(params): Promise<{ id, status }>`
  - `fetchLinkedAccount(id): Promise<...>`
  - `editTransfer(transferId, { on_hold, on_hold_until }): Promise<...>`
  - `reverseTransfer(transferId, amountPaisa?): Promise<...>`
  - `fetchPayout(payoutId): Promise<...>`
- All 4xx responses surfaced as `AppError('external_service', 502, razorpayError.description)` with `razorpayCode: error.code` in AppError.detail
- 5xx → same AppError with `retryable: true`
- Razorpay key never appears in AppError detail or logs

**Edge cases:**
- Missing env → throw at module load
- Network timeout → retryable AppError

**Done when:** 6 unit tests passing (happy path + 4xx + 5xx for each wrapper).

---

## T3 — Linked account service

**Agent:** API
**Depends on:** T1, T2
**Files:**
- `apps/api/src/services/linked-account.service.ts` (new)
- `apps/api/src/services/linked-account.service.test.ts` (new)
- `apps/api/src/db/queries/linked-accounts.ts` (new — parameterized queries)

**SRS refs:** IAM-FR-014, BOOK-FR-005

**Acceptance:**
- `createLinkedAccountForUser(userId)`:
  1. SELECT existing row in `razorpay_linked_accounts` — if found and `status != 'deactivated'`, return it (idempotent)
  2. Load user's KYC fields (`pan_name`, bank decrypted via `kyc.service`, `display_name`, `email`)
  3. Call `razorpay.createLinkedAccount` with `type='route'`, business_type from KYC
  4. INSERT into `razorpay_linked_accounts` with returned `id`
  5. Return row
- `updateLinkedAccountStatus(razorpayAccountId, status, activatedAt?)`:
  - UPDATE by `razorpay_account_id`; set `activated_at` when transitioning to `activated`
- `getLinkedAccountForUser(userId)`:
  - SELECT row; JOIN `users` for bank_account + ifsc; mask bank_account to `XXXXXX` + last 4; return `LinkedAccount | null`
- Bank account number never logged anywhere

**Edge cases (per plan §11):**
- Duplicate call → no-op
- Bad IFSC → AppError with Razorpay detail, no DB row
- Route not enabled on merchant → 503 AppError, email ops (T15)
- User has no KYC → AppError 'precondition_failed', don't call Razorpay

**Done when:** 8 tests passing (happy, duplicate, bad IFSC, no KYC, status-update-by-rzpId, mask check, activation, deactivation transition).

---

## T4 — KYC hook → linked account creation

**Agent:** API
**Depends on:** T3
**Files:**
- `apps/api/src/services/kyc.service.ts` (modify — `approveKyc` and on re-approval)
- `apps/api/src/services/kyc.service.test.ts` (extend — 2 new tests)

**Acceptance:**
- After `kyc_status` flip to `'verified'`, call `linkedAccountService.createLinkedAccountForUser(userId)` inside a `try/catch`
- On Razorpay failure: log `error`, do NOT throw (KYC approval still succeeds); insert a row into a new `pending_linked_account_retries` queue? **No — simpler:** background cron (T10) reconciles by finding `users.kyc_status='verified'` where no `razorpay_linked_accounts` row exists
- On re-approval (KYC re-uploaded post-bank-change): mark old linked_account `deactivated`; create new one

**Edge cases:**
- KYC approval succeeds, linked account fails → KYC stays verified, cron retries
- Multiple approvals (manual ops action) → idempotent

**Done when:** 2 new tests (happy + Razorpay 5xx doesn't rollback KYC); `kyc.service.test.ts` fully green.

---

## T5 — Booking service: transfers at order creation

**Agent:** API
**Depends on:** T3
**Files:**
- `apps/api/src/services/booking.service.ts` (modify `createBooking`)
- `apps/api/src/services/booking.service.test.ts` (extend — 3 new tests)

**SRS refs:** BOOK-FR-005

**Acceptance:**
- In `createBooking`, after computing `amounts`:
  1. SELECT creator's `razorpay_linked_accounts.razorpay_account_id` WHERE `status IN ('created', 'activated')`
  2. If missing / `suspended` / `deactivated` → AppError 503 `"Creator's payouts are not set up"`
  3. Build `transfers: [{ account, amount: amounts.creatorPayoutPaisa, currency: 'INR', on_hold: 1, on_hold_until: <NOW + 30 days epoch> }]` (placeholder TTL; recomputed on completion via T8)
  4. Pass to `razorpay.orders.create({ ..., transfers })`
  5. Persist `razorpay_transfer_id = order.transfers[0].id` to a new column on `bookings` **OR** to the `payouts` row at webhook time (see T6)
- Free bookings / free content → no transfers array, no linked account lookup
- Existing behavior (capacity, booking row insert) unchanged

**Edge cases:**
- Creator has no linked account → 503
- Creator linked account suspended → 503 "Creator not accepting bookings"
- Razorpay returns 4xx on order.create with transfers → surface to client as 502 with retry hint

**Done when:** 3 new tests (happy, no linked account, suspended) green; existing 27 booking tests still pass.

---

## T6 — Payout service

**Agent:** API
**Depends on:** T2, T5
**Files:**
- `apps/api/src/services/payout.service.ts` (new)
- `apps/api/src/services/payout.service.test.ts` (new)
- `apps/api/src/db/queries/payouts.ts` (new)
- Migration `014_payouts_unique_booking.sql` (new — UNIQUE constraint on `payouts.booking_id` if not already present)

**SRS refs:** BOOK-FR-005, TAX-FR-005

**Acceptance:**
- `createPayoutOnPaymentCaptured(bookingId, transferId)`:
  - INSERT into `payouts` with `status='pending'`, `scheduled_at=NOW()`, `razorpay_transfer_id=transferId`
  - `ON CONFLICT (booking_id) DO NOTHING` — idempotent
- `schedulePayoutOnBookingCompleted(bookingId)`:
  - UPDATE `payouts` SET `status='scheduled'`, `scheduled_at = NOW() + interval '48 hours'`
- `releasePayout(payoutId)`:
  - SELECT payout + join bookings + left-join refunds; abort if any refund is `pending`/`processing` or booking not `completed`
  - Call `razorpay.editTransfer(transferId, { on_hold: 0 })`
  - UPDATE `status='processing'`
- `releasePendingPayouts()`:
  - SELECT eligible rows (see plan §6 query); iterate, call `releasePayout`; return `{ released, skipped, failed }`
- `reversePayout(payoutId, reason, amountPaisa?)`:
  - Call `razorpay.reverseTransfer`; UPDATE `status='failed'`, `failure_reason=reason`
- `listPayoutsForCreator(creatorId, filter, pagination)` — cursor-based, matches `/creators/me/payouts` shape
- `getPayoutSummary(creatorId)` — single query for `pendingPaisa + processingPaisa + paidLast30dPaisa`

**Edge cases (§11):** all of "Transfer release" + "Refund interaction" pre-release.

**Done when:** 12 tests (create, create-duplicate, schedule, release-happy, release-refund-pending, release-booking-not-completed, release-linked-suspended, reverse, list-pagination, list-filter, summary, release-batch).

---

## T7 — Webhook handler: new Route events

**Agent:** API
**Depends on:** T3, T6
**Files:**
- `apps/api/src/handlers/webhooks.razorpay.ts` (modify — route new event types)
- `apps/api/src/handlers/webhooks.razorpay.test.ts` (extend — 10 new tests)
- `apps/api/src/services/razorpay-webhook.service.ts` (new — idempotency ledger wrapper)

**SRS refs:** BOOK-FR-005

**Acceptance:**
- Raw body read from `c.req.raw.arrayBuffer()` BEFORE any JSON parse
- HMAC signature verify against `RAZORPAY_WEBHOOK_SECRET` — reject 400 on mismatch (no DB writes)
- Idempotency: INSERT into `razorpay_webhook_events (event_id, event_type, payload)` `ON CONFLICT DO NOTHING`; if no row returned → respond 200 immediately (already processed)
- Event routing:
  - `payment.captured` → `payout.service.createPayoutOnPaymentCaptured(bookingId, transferId)`
  - `account.under_review` → `linked-account.service.updateLinkedAccountStatus(id, 'created')`
  - `account.needs_clarification` → update status, fire notification `payout.action_required` (T15)
  - `account.activated` → update status + `activated_at`, fire notification `payout.enabled`
  - `account.rejected` / `account.suspended` → update status, email ops
  - `transfer.processed` — log only (hold confirmed)
  - `transfer.settled` → update payout `status='processing'`
  - `payout.processed` → update `status='completed'`, `processed_at=NOW()`, notification `payout.processed`
  - `payout.reversed` / `payout.failed` → update `status='failed'`, `failure_reason=event.description`, notification `payout.failed`
- Mark `razorpay_webhook_events.processed=true` after successful handler run
- Always 200 to Razorpay (unless signature fails)

**Edge cases (§11 "Webhook handler"):** unknown event type → ledger only; booking not found → log + 200; body too large → 413.

**Done when:** 10 new webhook tests (each event type + bad signature + duplicate event + unknown event); existing webhook tests still pass.

---

## T8 — Booking completion triggers scheduling

**Agent:** API
**Depends on:** T6
**Files:**
- `apps/api/src/services/booking.service.ts` (modify `completeBooking`)
- `apps/api/src/services/booking.service.test.ts` (extend — 1 new test)

**Acceptance:**
- After setting booking `status='completed'`, within the same transaction:
  1. Call `payoutService.schedulePayoutOnBookingCompleted(bookingId)`
  2. If that fails, rollback booking update
- Idempotent: completing an already-completed booking is a no-op (no duplicate payout mutations)

**Done when:** 1 new test (complete → payouts.scheduled_at pushed to NOW+48h); existing `completeBooking` tests pass.

---

## T9 — Creator-facing API endpoints

**Agent:** API
**Depends on:** T3, T6
**Files:**
- `apps/api/src/handlers/creators.payouts.ts` (new) — `GET /creators/me/payouts`, `GET /creators/me/linked-account`
- `apps/api/src/routes/creators.routes.ts` (modify — mount these under existing `/creators/me/*` prefix with `authenticate` + `requireCreator`)
- `apps/api/src/handlers/creators.payouts.test.ts` (new)

**Acceptance:**
- `GET /creators/me/payouts?status=<s>&limit=<n>&cursor=<c>`:
  - Parse via `ListPayoutsQuerySchema`
  - Call `payoutService.listPayoutsForCreator`
  - Return `{ items, nextCursor, summary }` per plan §7
- `GET /creators/me/linked-account`:
  - Call `linkedAccountService.getLinkedAccountForUser`
  - If null → 200 `{ data: { status: null, ... } }` (no 404 — screen handles null)
- Both endpoints behind `authenticate + requireCreator`

**Done when:** 8 tests (happy + filter + pagination + empty + requireCreator 403 + unauth 401 + linked-account-null + linked-account-activated).

---

## T10 — Internal payout release cron

**Agent:** API
**Depends on:** T6
**Files:**
- `apps/api/src/handlers/internal.payouts.ts` (new) — `POST /internal/payouts/release`
- `apps/api/src/routes/internal.routes.ts` (new or extend)
- `apps/api/src/middleware/requireInternalKey.ts` (new — reuses rateLimit pattern)
- `apps/api/src/handlers/internal.payouts.test.ts` (new)
- `apps/api/.env.example` — add `INTERNAL_CRON_KEY`
- `apps/api/src/env.ts` — add `INTERNAL_CRON_KEY` Zod validation
- `apps/api/fly.toml` — add `[[services.scheduled]]` or `[deploy.release_command]` block (founder to decide deployment shape)

**Acceptance:**
- Endpoint requires `X-Internal-Key` header matching `INTERNAL_CRON_KEY`; 401 on mismatch
- Calls `payoutService.releasePendingPayouts()`; returns `{ released, skipped, failed }`
- Also triggers a linked-account-creation retry pass: find users with `kyc_status='verified'` and no `razorpay_linked_accounts` row → call `linkedAccountService.createLinkedAccountForUser`; max 10 per tick
- Idempotent — safe to run concurrently (DB constraints are the lock)

**Done when:** 4 tests (bad key → 401, no eligible → 0/0/0, 3 eligible → 3/0/0, 1 refund-pending → 0/1/0); fly.toml change reviewed by founder.

---

## T11 — Refund → transfer reversal

**Agent:** API
**Depends on:** T6
**Files:**
- `apps/api/src/services/refund.service.ts` (modify — `initiateRefund`, `creatorInitiatedCancel`)
- `apps/api/src/services/refund.service.test.ts` (extend — 4 new tests)

**Acceptance:**
- Before calling Razorpay's refund API, SELECT the booking's `payouts` row:
  - Status `pending` / `scheduled` → call `payoutService.reversePayout(payoutId, 'refund', refundAmountPaisa)`; then proceed with customer refund
  - Status `processing` → 409 AppError "Refund blocked — payout in transit. Retry in 2 days."
  - Status `completed` → proceed with customer refund BUT create an `admin_tasks` row "Recover ₹X from creator @handle"
- Partial refund: reverse amount proportional to refund percentage
- Full refund: full reversal

**Edge cases (§11 "Refund interaction"):** all covered.

**Done when:** 4 new tests (refund-before-schedule, refund-pre-release, refund-in-transit-blocked, refund-post-complete-creates-admin-task).

---

## T12 — Flutter providers

**Agent:** Mobile
**Depends on:** T9
**Files:**
- `apps/mobile/lib/features/studio/providers/earnings_provider.dart` (new)
- `apps/mobile/lib/features/studio/providers/linked_account_provider.dart` (new)
- `apps/mobile/test/features/studio/providers/earnings_provider_test.dart` (new)
- `apps/mobile/test/features/studio/providers/linked_account_provider_test.dart` (new)

**Acceptance:**
- `earningsProvider` = `AsyncNotifierProvider` — fetches `/creators/me/payouts`; exposes `loadMore(cursor)`, `refresh()`
- `linkedAccountProvider` = `AsyncNotifierProvider.autoDispose` — fetches `/creators/me/linked-account`; invalidates on provider re-enter
- Both use `authServiceProvider.dio` pattern (see E1.8 studio providers for reference)
- Errors surface as `AsyncError` with localized message

**Done when:** 6 tests (happy for each + error + pagination); `flutter analyze` clean.

---

## T13 — Flutter Earnings screen

**Agent:** Mobile
**Depends on:** T12
**Files:**
- `apps/mobile/lib/features/studio/screens/earnings_screen.dart` (new)
- `apps/mobile/lib/features/studio/widgets/payout_row.dart` (new)
- `apps/mobile/lib/features/studio/widgets/payout_summary_card.dart` (new)
- `apps/mobile/lib/features/studio/widgets/linked_account_banner.dart` (new)
- `apps/mobile/lib/app/router.dart` (modify — add `/studio/earnings` route)
- Widget tests: `payout_row_test.dart`, `payout_summary_card_test.dart`, `linked_account_banner_test.dart`, `earnings_screen_test.dart`

**Acceptance:**
- Matches plan §9 file list
- Loading state uses `SkeletonList` — no `CircularProgressIndicator`
- Empty state uses `EmptyState` component with Fraunces title
- Status pills use `StatusBadge` component
- Coral only on "Paid" badge (via `StatusBadgeType.success`)
- Amounts via `formatPrice` utility
- Row tap → `context.push('/bookings/:id')`
- Pull-to-refresh on list

**Edge cases (§11 "Creator-side UX"):** all addressed.

**Done when:** 12 widget tests; `flutter analyze` 0 issues.

---

## T14 — Studio tab: Earnings entry point

**Agent:** Mobile
**Depends on:** T13
**Files:**
- `apps/mobile/lib/features/studio/screens/studio_tab_screen.dart` (modify — replace the empty "Set up bank account payouts..." copy near line 874 with a live earnings card)

**Acceptance:**
- Card renders `Pending: ₹X` + `Paid last 30d: ₹Y` using `linkedAccountProvider` + `earningsProvider`
- Tap → `context.push('/studio/earnings')`
- If linked account is null → card reads "Enable payouts" + navigates to KYC screen
- 44dp min tap target; haptic on tap

**Done when:** Studio tab widget test extended (2 new tests: with linked account, without); `flutter analyze` clean.

---

## T15 — Payout lifecycle notifications

**Agent:** API
**Depends on:** T3, T7, T11
**Files:**
- `apps/api/src/services/notification.service.ts` (modify — 4 new notification types)
- Notification templates: `payout.enabled`, `payout.processed`, `payout.failed`, `payout.action_required`
- `apps/api/src/services/notification.service.test.ts` (extend — 4 tests)

**Acceptance:**
- Each notification type has FCM payload + SendGrid email template
- Fired from: T3 (activation → `payout.enabled`), T7 (webhook → `payout.processed` / `payout.failed` / `payout.action_required`), T11 (refund-triggered reversal → `payout.failed`)
- Fire-and-forget (never blocks the triggering transaction)

**Done when:** 4 new tests; SendGrid templates in ops doc (T16).

---

## T16 — Ops playbook + OpenAPI update

**Agent:** Docs
**Depends on:** T1–T15
**Files:**
- `docs/ops/payout-playbook.md` (new)
- `docs/engineering/openapi.yaml` (modify — add 3 new endpoints + Route webhook event types)

**Acceptance:**
- Playbook covers:
  - Stuck `under_review` (>7 days) — ops ticket to Razorpay
  - Post-release refund — manual debit via Razorpay dashboard + creator outreach script
  - Linked account rejection — creator support email template
  - Webhook replay from Razorpay dashboard
  - How to pause a creator's payouts (suspend linked account)
- OpenAPI has complete schemas for `Payout`, `LinkedAccount`, + all new endpoints

---

## T17 — Integration test

**Agent:** API
**Depends on:** T1–T11
**Files:**
- `apps/api/src/integration/payout-lifecycle.test.ts` (new)

**Acceptance:**
- Single Vitest file with mocked Razorpay SDK
- Test: KYC approve → linked account created → booking created with transfer → `payment.captured` webhook → payout row `pending` → booking complete → payout `scheduled` → cron release → Razorpay `editTransfer` called → `transfer.settled` webhook → `processing` → `payout.processed` webhook → `completed`
- Verifies: idempotency (re-delivered webhooks), amount correctness, state-machine constraints
- Runs in <5s

**Done when:** 1 comprehensive test green; all state transitions asserted.

---

## Dependency graph (abbreviated)

```
T1 (types) ──┐
T2 (rzp lib) ─┼─> T3 (linked-account) ─> T4 (kyc hook)
              │                       └─> T5 (booking transfers) ─┐
              │                                                    │
              └────────────────────────> T6 (payout.service) <────┘
                                               │
         ┌─────────────────────────────────────┼──────────────┬──────────┐
         │                                     │              │          │
         ▼                                     ▼              ▼          ▼
     T7 (webhook)                         T8 (complete)   T9 (API)   T11 (refund)
         │                                     │              │
         └──────┬──────────────┬──────────────┘              │
                │              │                              ▼
                ▼              ▼                        T10 (cron)
         T15 (notifs)    T12 (providers)                      │
                                │                             │
                                ▼                             │
                        T13 (Earnings UI)                     │
                                │                             │
                                ▼                             │
                        T14 (Studio link) ◄───────────────────┘

T16 (docs), T17 (integration) ← after all of the above
```

Recommended execution: T1 + T2 parallel → T3 → (T4, T5) parallel → T6 → (T7, T8, T9, T11) parallel → T10 → (T12 → T13 → T14) + T15 + T16 → T17.
