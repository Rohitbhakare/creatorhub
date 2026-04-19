# E2.12 — Razorpay Route Payouts

> Closes the M2 gap left by E2.3. Bookings collect customer money correctly today, but the creator never actually gets paid — this epic wires the full Route escrow → transfer → payout pipeline.

---

## 1. Overview

E2.3 Payments & Booking uses Razorpay Orders to collect money from the buyer and computes `creator_payout_paisa` on every booking, but the creator never receives a rupee — the `payouts` and `razorpay_linked_accounts` tables exist (migration 008) and sit empty. This epic activates **Razorpay Route** end-to-end: on KYC approval we open a linked account; at payment capture we create a transfer split (platform 17% + GST 18% + TDS 1% retained, remainder routed to the creator's linked account on-hold); on booking completion + 48h dispute window the hold is released and Razorpay auto-pays T+2 to the creator's bank account. This is the last blocker for real money flowing to creators at launch and unblocks SRS BOOK-FR-005.

---

## 2. SRS Requirements

| ID | Requirement | Notes / Scope Decisions |
|----|-------------|------------------------|
| BOOK-FR-005 | Customer payment → platform Razorpay account. Route auto-transfers creator share after completion + 48h dispute window. Payout T+2 business days. | Implemented with `order.transfers[]` at order creation, `on_hold_until` set to completion + 48h; release via webhook handler when booking flips to `completed`. |
| BOOK-FR-007 | State machine: `paid → confirmed → in_progress → completed → reviewed`. | Transfer release bound to `completed` state — not `in_progress`. |
| TAX-FR-005 | Creator payout = base − platform fee − TDS. GST collected from buyer, retained by platform for remittance. | Already implemented in `calculateBookingAmounts`; this epic wires the amount into the transfer. |
| IAM-FR-014 | KYC verification required before paid publish. | On `kyc_status → verified`, auto-open Razorpay linked account; creator sees "Payouts enabled" on Studio. |
| C-05 | Razorpay as sole PG/escrow provider for Phase 1. | No fallback payout rail. |
| A-01 | Razorpay Route approval assumption. | **Open question** — founder must confirm Route is active on the live account before launch. Test mode is always on. |

---

## 3. Wireframes Referenced

| Wireframe file | Relevant section / component | What to verify |
|----------------|------------------------------|----------------|
| `docs/01_wireframes/v2/project/pack-E-studio.jsx` (if present — otherwise current Studio tab) | Earnings page / Payouts section | Copy for "Pending", "Processing", "Paid", payout history row layout |
| `apps/mobile/lib/features/studio/screens/studio_tab_screen.dart:874` | Existing empty-state copy "Set up bank account payouts when you start publishing paid experiences." | Replace with real payout card once linked account exists |

> No dedicated Route screen exists in v2 today — payouts render inside the existing Studio tab. If a bespoke design is needed, defer to E2.12b (nice-to-have).

---

## 4. Dependencies

| Dependency | Type | Status | What we need from it |
|------------|------|--------|----------------------|
| E0.2 Database Schema (migration 008) | Epic | DONE | `payouts`, `razorpay_linked_accounts`, `razorpay_webhook_events` tables |
| E2.2 KYC Flow | Epic | DONE | `users.kyc_status = 'verified'` + `pan_number`, `pan_name`, `bank_account` (encrypted), `bank_ifsc` |
| E2.3 Payments & Booking | Epic | DONE | Razorpay order creation, HMAC verify, booking state machine |
| E2.4 Refunds | Epic | DONE | Refund flow; we need to block transfer release when a refund is in-flight |
| E1.8 Studio Tab | Epic | DONE | Earnings surface to render payout list |
| Razorpay Route (external) | SaaS | **PENDING FOUNDER** | Route must be activated on live account; test mode works out-of-the-box |

---

## 5. Architecture Decisions

| Decision | Chosen approach | Rejected alternative | Rationale |
|----------|----------------|---------------------|-----------|
| Transfer creation timing | At **order creation** via `order.transfers[]` | Post-payment `/v1/transfers` POST | Razorpay best practice — atomic with the payment, no risk of capturing money without a linked transfer; customer invoice shows the split |
| Transfer hold strategy | `on_hold: 1` with explicit `on_hold_until = completion + 48h`, released via webhook on booking.completed | Always `on_hold_until` timestamp + Razorpay auto-release | Dispute window extends from *completion* (a manual creator action), not booking date. Auto-release by timestamp would mis-fire on rescheduled experiences. |
| Linked account creation trigger | On `kyc_status` flip to `verified` | On first paid publish | SRS IAM-FR-014 says KYC gates publish; we already have the bank details at KYC time; avoids a second collection flow |
| Webhook idempotency | Insert-then-process via `razorpay_webhook_events` with UNIQUE on `event_id` | In-memory dedup | Fly.io is multi-machine — must be DB-enforced |
| Payout release worker | Cron endpoint `/internal/payouts/release` hit by Fly scheduled machine every 15 min + immediate release on booking.completed webhook | Only release on webhook | Webhook can drop; cron catches stragglers. Defence in depth. |
| Refund-vs-transfer interaction | Block `release_transfer` if any `refunds` row for the booking is `pending`/`processing`; reverse transfer if refund completes after release | Attempt to claw back funds post-release | Reversal post-release requires creator cooperation (money is in their bank). Strict ordering is safer. |
| Amount stored on transfer | `creator_payout_paisa` (base − 17% platform fee − 1% TDS) | Include GST | GST is collected from the buyer and retained by the platform for remittance (TAX-FR-005); never part of the creator's cut. |

---

## 6. Database

### Tables touched

| Table | Operation | Schema change? | Notes |
|-------|-----------|---------------|-------|
| `razorpay_linked_accounts` | R/W | **No** — already in 008 | Populate on KYC verified |
| `payouts` | R/W | **No** — already in 008 | One row per booking, inserted at payment success |
| `razorpay_webhook_events` | R/W | **No** — already in 008 | Idempotency ledger |
| `bookings` | R | No | Source of truth for `creator_payout_paisa`, status |
| `users` | R | No | `kyc_status`, `pan_number`, `pan_name`, `bank_account`, `bank_ifsc`, `display_name`, `email` |
| `refunds` | R | No | Check before releasing transfer |

### Key queries

```sql
-- Find payouts eligible for release (cron)
SELECT p.id, p.booking_id, p.creator_id, p.razorpay_transfer_id, p.amount_paisa
FROM payouts p
JOIN bookings b ON b.id = p.booking_id
WHERE p.status = 'pending'
  AND p.scheduled_at <= NOW()
  AND b.status = 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM refunds r
    WHERE r.booking_id = b.id AND r.status IN ('pending', 'processing')
  )
ORDER BY p.scheduled_at ASC
LIMIT 100;

-- Lookup booking by Razorpay order ID (webhook handler)
SELECT id, user_id, creator_id, status, creator_payout_paisa,
       razorpay_order_id, razorpay_payment_id
FROM bookings
WHERE razorpay_order_id = $1
FOR UPDATE;  -- lock to prevent duplicate payout inserts

-- Idempotency guard (first action in every webhook handler)
INSERT INTO razorpay_webhook_events (event_id, event_type, payload)
VALUES ($1, $2, $3)
ON CONFLICT (event_id) DO NOTHING
RETURNING id;  -- NULL row → event already processed, skip
```

### RLS policies needed

No new RLS — all Route tables are service-role-only (webhook handler + internal cron). Studio earnings reads via service layer with explicit `user_id = $creatorId` filter, no RLS.

### Migration required

**No.** All necessary tables are already in migration 008. This epic is wiring-only.

---

## 7. API Endpoints

### `POST /api/v1/payments/webhook` (modify existing)

**Auth:** Public — Razorpay webhook signature verified via `X-Razorpay-Signature` header HMAC-SHA256 against `RAZORPAY_WEBHOOK_SECRET`.
**Request body:** Razorpay event payload (raw `Buffer` — do NOT parse before verify).
**Response:** Always `200 OK` with `{ ok: true }` (Razorpay retries on non-200; idempotency handled in code).

**New events handled by this epic (existing handler adds routing):**
- `payment.captured` — already handled; extend to insert `payouts` row with `status='pending'`, `razorpay_transfer_id = order.transfers[0].id`, `scheduled_at = NOW()` (will be updated to completion+48h on booking completion)
- `order.paid` — log only
- `account.under_review` → update linked_account `status='created'`
- `account.needs_clarification` → update status, notify creator
- `account.activated` → update status + `activated_at`, notify creator "Payouts enabled"
- `account.rejected` → update status + notify creator + email ops
- `account.suspended` → update status + pause future payouts for creator
- `transfer.processed` → confirms transfer is held at Razorpay
- `transfer.settled` → payout moved from held to creator's linked account, update `payouts.status='processing'`
- `payout.processed` → update `payouts.status='completed'`, set `processed_at`
- `payout.reversed` / `payout.failed` → update `payouts.status='failed'`, set `failure_reason`, notify creator

### `GET /api/v1/creators/me/payouts`

**Auth:** `authenticate` + `requireCreator`
**Query:** `?status=pending|completed|failed&limit=20&cursor=<b64>`
**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "bookingId": "uuid",
        "amountPaisa": 415000,
        "tdsPaisa": 50000,
        "status": "completed",
        "scheduledAt": "2026-04-21T12:00:00Z",
        "processedAt": "2026-04-23T14:22:01Z",
        "bookingTitle": "Night kayaking in Goa"
      }
    ],
    "nextCursor": "b64...",
    "summary": {
      "pendingPaisa": 1830000,
      "processingPaisa": 0,
      "paidLast30dPaisa": 620000
    }
  }
}
```

### `GET /api/v1/creators/me/linked-account`

**Auth:** `authenticate` + `requireCreator`
**Response 200:**
```json
{
  "success": true,
  "data": {
    "status": "activated",  // created | activated | suspended | deactivated | null
    "activatedAt": "2026-04-19T10:12:00Z",
    "holderName": "Rohit Bhakare",
    "bankAccountMasked": "XXXXXX1234",
    "bankIfsc": "HDFC0001234"
  }
}
```

### `POST /internal/payouts/release` (NEW — service-to-service)

**Auth:** Shared secret header `X-Internal-Key` matching `INTERNAL_CRON_KEY` env var.
**Body:** none.
**Response 200:**
```json
{ "success": true, "data": { "released": 7, "skipped": 2, "failed": 0 } }
```

Hit by a Fly scheduled machine every 15 minutes. Also invoked internally when a booking flips to `completed`.

### `POST /api/v1/bookings/:id/complete` (modify existing)

After setting booking status to `completed`, enqueue immediate payout release for this booking's `payouts` row (no 15-min wait on the happy path).

---

## 8. Shared Types / Zod Schemas

```typescript
// packages/shared/src/types/payout.ts
export type PayoutStatus =
  | 'pending'      // transfer created, held at Razorpay
  | 'scheduled'    // dispute window started, countdown to release
  | 'processing'   // transfer released, Razorpay paying out
  | 'completed'    // money in creator's bank account
  | 'failed'       // reversed / rejected — see failure_reason

export interface PayoutSummary {
  id: string
  bookingId: string
  amountPaisa: number
  tdsPaisa: number
  status: PayoutStatus
  scheduledAt: string  // ISO
  processedAt: string | null
  bookingTitle: string
}

export type LinkedAccountStatus = 'created' | 'activated' | 'suspended' | 'deactivated'

export interface LinkedAccount {
  status: LinkedAccountStatus | null  // null = not yet opened
  activatedAt: string | null
  holderName: string
  bankAccountMasked: string  // e.g. "XXXXXX1234"
  bankIfsc: string
}

// packages/shared/src/schemas/payout.ts
export const ListPayoutsQuerySchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
})
```

---

## 9. Flutter Screens & Widgets

| File | Type | Description | State managed by |
|------|------|-------------|-----------------|
| `features/studio/screens/earnings_screen.dart` | Screen | Earnings tab — summary cards + payout list | `earnings_provider.dart` |
| `features/studio/widgets/payout_row.dart` | Widget | Single payout row — title, amount, status pill, date | Stateless |
| `features/studio/widgets/payout_summary_card.dart` | Widget | "Pending ₹X · In transit ₹Y · Paid last 30d ₹Z" | Stateless |
| `features/studio/widgets/linked_account_banner.dart` | Widget | Top-of-earnings banner — "Payouts enabled" / "Setting up" / "Action required" | Reads `linkedAccountProvider` |
| `features/studio/providers/earnings_provider.dart` | Provider | Paginated payout list + summary | AsyncNotifier |
| `features/studio/providers/linked_account_provider.dart` | Provider | Linked account status | AsyncNotifier (polls on screen focus) |

### UI decisions to verify against design system

- [ ] Coral `#E15A41` only on the "Paid" status pill (per ui-ux.md: status badges are one of the 8 contexts) — NOT on amount text
- [ ] `StatusBadge` component (already built) with `type: success` for Paid, `warning` for Pending, `danger` for Failed, `info` for Processing
- [ ] Fraunces only on empty-state title "No payouts yet"; Inter for all amounts and row text
- [ ] Skeleton shimmer (`SkeletonList`) while `earningsProvider` is loading — never `CircularProgressIndicator`
- [ ] Amount formatted via `formatPrice(amountPaisa)` utility — "₹4,150" (Indian grouping)
- [ ] 44dp min tap target on every row (tap opens booking detail)

---

## 10. Security Considerations

| Risk | Mitigation | Applies here? |
|------|-----------|--------------|
| Webhook forgery (fake Razorpay event) | HMAC-SHA256 signature verify on raw body **before** JSON parse; reject on mismatch | Yes — critical |
| Webhook replay | `razorpay_webhook_events.event_id UNIQUE` — second insert silently no-ops | Yes |
| Double-payout (same booking creates two payouts rows) | `payouts.booking_id` UNIQUE + `ON CONFLICT DO NOTHING` on insert | Yes — add unique constraint in migration 014 if not present (verify 008) |
| Transfer released while refund pending | `NOT EXISTS (refund WHERE status IN ('pending','processing'))` guard in release query | Yes |
| Internal cron endpoint exposed to public | Shared secret `INTERNAL_CRON_KEY` header; 401 on mismatch; CIDR allowlist if Fly.io provides internal network | Yes |
| Creator impersonation (another creator sees my payouts) | `requireCreator` + service filters `WHERE creator_id = $ctx.userId` — no override | Yes |
| Bank account number leakage in logs | Never log decrypted `bank_account`; mask to `XXXXXX1234` at service boundary | Yes |
| Razorpay API key in error messages | Scrub `key_id`/`key_secret` from any AppError detail returned to client | Yes |
| PII in webhook payload | Only store `payload` in `razorpay_webhook_events` — do not forward to client; purge after 90 days (DPDPA) | Yes — add cleanup task to existing purge job |
| KYC bypass via manually forged linked account creation | Linked account creation is server-side only (no public endpoint); triggered only by `kyc_status = 'verified'` transition | Yes |

---

## 11. Edge Cases & Error States

### Linked account creation
- [ ] KYC verified but Razorpay returns 4xx (bad PAN / IFSC) → retain error, email ops, flag `kyc_status = 'needs_review'`
- [ ] KYC verified but Route not enabled on the merchant account → 503 error, email ops, no linked account row
- [ ] User is already linked (`razorpay_linked_accounts` row exists) → skip create, idempotent
- [ ] User changes bank account post-activation (via KYC re-upload) → create a second linked account; mark old one `deactivated`; route future transfers to new one
- [ ] Activation never arrives (`under_review` stuck >7 days) → nightly alert email to ops

### Payment capture → transfer
- [ ] `payment.captured` fires before `order.paid` → use `payment.captured` as source of truth, store `razorpay_payment_id`
- [ ] Creator has no linked account at payment time (shouldn't happen — paid publish requires KYC) → log critical error, insert `payouts` with `status='pending'` and `razorpay_transfer_id = null`; manual ops release
- [ ] Creator linked account is `suspended` at payment time → create transfer anyway (funds sit at Razorpay); ops to remediate
- [ ] Duplicate `payment.captured` for the same payment ID → idempotency ledger catches it
- [ ] Razorpay transfer creation fails inside order creation → order fails; customer retries; no half-state in our DB

### Transfer release
- [ ] Booking completed before linked account activated → `payouts.status='pending'`, hold until activation webhook; then release
- [ ] Booking completed but refund pending → skip release; re-check on next cron tick
- [ ] Booking completed, refund initiated 1 hour later but transfer already released → cannot claw back from creator; ops marks refund as `failed` and files dispute with creator
- [ ] User marks booking complete but creator disputes (no `in_progress` → `completed` creator-side event) → completion only settable by creator via `POST /bookings/:id/complete`; user can only mark `reviewed`
- [ ] Transfer release API returns 4xx (already released) → treat as success, update `payouts.status` if still `pending`
- [ ] Transfer release API returns 5xx → retry in next cron tick; after 3 failures, mark `failed` + alert ops

### Webhook handler
- [ ] Event arrives for a booking that doesn't exist (payment in a different env) → log warning, insert into ledger, 200 OK
- [ ] Unknown event type → insert into ledger, 200 OK, log for investigation
- [ ] Signature verify fails → 400, no insert, log source IP
- [ ] Body is >64KB (suspicious) → 413, no processing

### Creator-side UX
- [ ] Creator opens Earnings before first paid booking → empty state "No payouts yet. Your first payout lands 2 days after your first trip wraps."
- [ ] Linked account `created` but not `activated` → banner "Setting up payouts — usually takes 2 business days"
- [ ] Linked account `needs_clarification` → banner "Action required: re-upload KYC" → CTA to KYC screen
- [ ] `account.suspended` → banner "Payouts paused. Contact support." + deep link to help center

### Refund interaction
- [ ] Full refund before transfer release → transfer reversed via `PATCH /transfers/:id` with `reversals=1`; `payouts.status='failed'`; `failure_reason='refund'`
- [ ] Partial refund before transfer release → prorate creator payout, adjust transfer amount; document in creator's earnings as "Refund adjustment -₹X"
- [ ] Refund after transfer release → cannot reverse; admin manually books a debit; out of scope for this epic (ops playbook)

---

## 12. Test Cases

### API tests (Vitest)

| Test | What it verifies |
|------|-----------------|
| `createLinkedAccount` — happy path | Creates Razorpay account, inserts `razorpay_linked_accounts` row with `status='created'` |
| `createLinkedAccount` — duplicate call | No-op, returns existing row |
| `createLinkedAccount` — bad IFSC | 4xx from Razorpay surfaces as `AppError` with detail, no DB row |
| `POST /webhook` — `payment.captured` | Inserts `payouts` row, sets `razorpay_transfer_id` from order.transfers[0] |
| `POST /webhook` — duplicate `payment.captured` | Idempotency ledger blocks second insert |
| `POST /webhook` — `account.activated` | Updates linked_account.status + activated_at |
| `POST /webhook` — `transfer.settled` | Updates payouts.status = 'processing' |
| `POST /webhook` — `payout.processed` | Updates payouts.status = 'completed' + processed_at |
| `POST /webhook` — `payout.reversed` | Updates payouts.status = 'failed' + failure_reason |
| `POST /webhook` — bad signature | 400, no DB writes |
| `POST /webhook` — unknown event | 200, event stored, no side effects |
| `releasePendingPayouts` — happy path | Calls Razorpay PATCH, payouts.status flips processing |
| `releasePendingPayouts` — refund pending | Skips release, payout remains pending |
| `releasePendingPayouts` — booking not completed | Skips release |
| `releasePendingPayouts` — linked account suspended | Skips release, logs warning |
| `GET /creators/me/payouts` — pagination | Cursor returns next page; no overlap |
| `GET /creators/me/payouts` — status filter | Returns only matching status |
| `GET /creators/me/payouts` — summary | pendingPaisa + paidLast30dPaisa computed correctly |
| `GET /creators/me/linked-account` — no account | Returns `status: null`, no 404 |
| `GET /creators/me/linked-account` — activated | Returns full payload with masked bank account |
| `POST /internal/payouts/release` — bad secret | 401 |
| `POST /internal/payouts/release` — happy path | Returns released/skipped/failed counts |
| Integration: book → pay → complete → release | End-to-end state machine; 4 DB writes; 3 Razorpay API calls mocked |

### Flutter widget tests

| Widget | What it verifies |
|--------|-----------------|
| `PayoutRow` — pending status | Renders "Pending" badge, amount, booking title, scheduled date |
| `PayoutRow` — completed status | Renders "Paid" badge with coral |
| `PayoutRow` — failed status | Renders "Failed" badge + failure_reason tooltip |
| `PayoutSummaryCard` | Renders three amounts formatted with `formatPrice` |
| `LinkedAccountBanner` — null | Renders "Complete KYC to enable payouts" + CTA |
| `LinkedAccountBanner` — activated | Renders green check + masked bank |
| `LinkedAccountBanner` — needs_clarification | Renders amber + "Re-upload KYC" CTA |
| `EarningsScreen` — empty | Empty state "No payouts yet" with Fraunces title |
| `EarningsScreen` — loading | SkeletonList, no CircularProgressIndicator |
| `EarningsScreen` — loaded | Renders summary + N rows from mocked provider |

---

## 13. Open Questions / Risks

| # | Question | Impact | Suggested resolution |
|---|----------|--------|---------------------|
| 1 | Route enabled on live Razorpay account? | **Hard block for live** | Founder confirms after Razorpay sales call; test mode always works |
| 2 | Transfer created at order creation vs post-capture? | Architectural | **Recommend:** at order creation (`orders.transfers[]`) — atomic, no orphans |
| 3 | Transfer release trigger — cron only, webhook only, or both? | Reliability | **Recommend:** both — webhook for fast-path, cron every 15 min as safety net |
| 4 | Where does the earnings screen live — new `/studio/earnings` route or inside existing Studio tab? | UX + Nav | **Recommend:** new route `/studio/earnings`, reachable from Studio tab's earnings card |
| 5 | Should we block paid-content publish if linked account is not `activated`? | UX | **Recommend:** No — allow publish (collect money), queue payout; show creator a banner "Payouts will start flowing once your bank account activates" |
| 6 | TDS form-26AS reporting — in scope? | Compliance | **Out of scope** — E2.6 Tax Compliance already computes TDS per booking. Filing is a separate manual process (ops). |
| 7 | Payout summary window: "last 30 days" vs calendar month vs current FY? | UX | **Recommend:** 30-day rolling for the Earnings card; FY-to-date on a secondary screen (defer to E2.12b) |
| 8 | What email/push notifications fire on which events? | Notifications | **Recommend:** `account.activated` → push "Payouts enabled"; `payout.processed` → push + email "₹X sent to your bank"; `payout.failed` → push + email; `account.needs_clarification` → push + email |
| 9 | Can we retry linked account creation automatically on transient 5xx? | Reliability | **Recommend:** Yes — exponential backoff 3 attempts, then manual |
| 10 | Who owns the ops playbook for edge cases (stuck activations, post-release refunds)? | Ops | **Recommend:** Create `docs/ops/payout-playbook.md` as part of this epic's docs task |

---

## 14. Task Breakdown

### T1: Zod Schemas & Shared Types
**Agent:** API
**Files:**
- `packages/shared/src/types/payout.ts` (new)
- `packages/shared/src/schemas/payout.ts` (new)
**SRS:** BOOK-FR-005
**Acceptance:** `PayoutSummary`, `LinkedAccount`, `PayoutStatus`, `LinkedAccountStatus` types + `ListPayoutsQuerySchema` exported.
**Edge cases:** N/A (types only)

### T2: Razorpay Route client wrapper
**Agent:** API
**Files:**
- `apps/api/src/lib/razorpay.ts` (new) — centralised Razorpay SDK singleton with typed wrappers for `accounts.create`, `transfers.edit`, `transfers.reverse`, `payouts.fetch`
- `apps/api/src/lib/razorpay.test.ts`
**Dependencies:** None
**Acceptance:** Single entry point for all Route API calls; all callers throw `AppError('external_service')` on Razorpay 5xx; Razorpay key never logged.
**Edge cases:** Missing env → throw at import; 4xx → typed errors with Razorpay's `error.description`; 5xx → retryable flag.

### T3: Linked account service
**Agent:** API
**Files:**
- `apps/api/src/services/linked-account.service.ts` (new)
- `apps/api/src/services/linked-account.service.test.ts`
**SRS:** IAM-FR-014, BOOK-FR-005
**Dependencies:** T2
**Acceptance:**
- `createLinkedAccountForUser(userId)` — idempotent; reads KYC fields; POSTs to Razorpay; inserts `razorpay_linked_accounts` row
- `updateLinkedAccountStatus(accountId, status, activatedAt?)` — webhook-fed updates
- `getLinkedAccountForUser(userId)` — returns `LinkedAccount | null`, masks bank account
- Called from `kyc.service.ts` on verify transition (T4 wires this)
**Edge cases:** Duplicate call (§11), bad IFSC (§11), already-activated (idempotent), status transitions enforced (`activated → suspended` allowed; `deactivated` is terminal).

### T4: KYC → linked account wiring
**Agent:** API
**Files:**
- `apps/api/src/services/kyc.service.ts` (modify) — on `approveKyc`, call `linked-account.service.createLinkedAccountForUser` (fire-and-retry, don't block the KYC approval response)
- `apps/api/src/services/kyc.service.test.ts` (extend — 2 new tests)
**Dependencies:** T3
**Acceptance:** KYC approval triggers linked account creation; failure logs but does not block approval; re-approval is idempotent.
**Edge cases:** Razorpay down during approval → `razorpay_linked_accounts` row still inserted with `status='created'` + `razorpay_account_id='pending'`? No — only insert on success. Background retry via cron (T10) handles this.

### T5: Booking service — transfer creation at order
**Agent:** API
**Files:**
- `apps/api/src/services/booking.service.ts` (modify) — `createBooking` passes `transfers: [{ account, amount, on_hold: 1, on_hold_until }]` to `razorpay.orders.create`
- `apps/api/src/services/booking.service.test.ts` (extend — 3 new tests)
**SRS:** BOOK-FR-005
**Dependencies:** T3
**Acceptance:** Every paid order creation includes a transfer spec; amount = `creator_payout_paisa`; `account = creator's razorpay_account_id`; `on_hold_until = NOW + 7d placeholder`, recomputed on completion.
**Edge cases:** Creator has no linked account (§11 — block booking with AppError 503 "Payouts not yet set up for this creator"); linked account suspended (block booking with "Creator not accepting bookings right now"); free content (no transfer spec).

### T6: Payout service — lifecycle
**Agent:** API
**Files:**
- `apps/api/src/services/payout.service.ts` (new)
- `apps/api/src/services/payout.service.test.ts`
**SRS:** BOOK-FR-005, TAX-FR-005
**Dependencies:** T2, T5
**Acceptance:**
- `createPayoutOnPaymentCaptured(bookingId, transferId)` — inserts `payouts` with `status='pending'`, `scheduled_at=NOW()`
- `schedulePayoutOnBookingCompleted(bookingId)` — updates `scheduled_at = NOW + 48h`, `status='scheduled'`
- `releasePayout(payoutId)` — verifies preconditions, calls `razorpay.transfers.edit(transferId, { on_hold: 0 })`, updates status
- `reversePayout(payoutId, reason)` — called on refund
- `listPayoutsForCreator(creatorId, filter, pagination)` + `getPayoutSummary(creatorId)`
**Edge cases:** All of §11 "Transfer release".

### T7: Webhook handler — extend for Route events
**Agent:** API
**Files:**
- `apps/api/src/handlers/webhooks.razorpay.ts` (modify — add new event routes)
- `apps/api/src/handlers/webhooks.razorpay.test.ts` (extend — 8 new tests covering each new event type)
- `apps/api/src/services/razorpay-webhook.service.ts` (new or existing — idempotency guard)
**SRS:** BOOK-FR-005
**Dependencies:** T3, T6
**Acceptance:** Signature verify on raw body; idempotency via `razorpay_webhook_events`; each event type handled per §7.
**Edge cases:** All of §11 "Webhook handler".

### T8: Booking completion → payout release
**Agent:** API
**Files:**
- `apps/api/src/services/booking.service.ts` (modify `completeBooking`) — after status flip, call `payout.service.schedulePayoutOnBookingCompleted`
- `apps/api/src/services/booking.service.test.ts` (extend — 1 test)
**Dependencies:** T6
**Acceptance:** `POST /bookings/:id/complete` updates booking + schedules payout in one transaction.
**Edge cases:** Already completed (no-op); completion while refund pending (still schedule, cron blocks release); creator calls complete twice (idempotent).

### T9: Creator-facing API endpoints
**Agent:** API
**Files:**
- `apps/api/src/handlers/creators.ts` (modify or new sub-file `handlers/creators.payouts.ts`) — `GET /creators/me/payouts`, `GET /creators/me/linked-account`
- `apps/api/src/routes/creators.routes.ts` (modify)
- `apps/api/src/handlers/creators.payouts.test.ts` (new)
**Dependencies:** T3, T6
**Acceptance:** Both endpoints behind `authenticate + requireCreator`; paginated payout list; linked account with null handling.
**Edge cases:** All of §11 "Creator-side UX" (server-side shape).

### T10: Payout release cron endpoint
**Agent:** API
**Files:**
- `apps/api/src/handlers/internal.payouts.ts` (new) — `POST /internal/payouts/release`
- `apps/api/src/routes/internal.routes.ts` (new or existing)
- `apps/api/src/handlers/internal.payouts.test.ts`
- `apps/api/.env.example` — add `INTERNAL_CRON_KEY`
- `apps/api/fly.toml` — add scheduled machine config (every 15 min)
**Dependencies:** T6
**Acceptance:** Shared-secret auth; calls `payout.service.releasePendingPayouts()`; returns counts; idempotent (re-running is safe).
**Edge cases:** All of §11 "Transfer release".

### T11: Refund → transfer reversal
**Agent:** API
**Files:**
- `apps/api/src/services/refund.service.ts` (modify) — after refund initiated, check if `payouts.status` is `pending/scheduled`; if yes, call `payout.service.reversePayout`; if `processing/completed`, log + alert ops
- `apps/api/src/services/refund.service.test.ts` (extend — 3 new tests)
**Dependencies:** T6
**Acceptance:** Pre-release refund reverses transfer atomically; post-release refund logs but does not attempt claw-back.
**Edge cases:** Partial refund (prorate), full refund, refund after release (§11 Refund interaction).

### T12: Flutter providers
**Agent:** Mobile
**Files:**
- `apps/mobile/lib/features/studio/providers/earnings_provider.dart` (new)
- `apps/mobile/lib/features/studio/providers/linked_account_provider.dart` (new)
- Tests in `apps/mobile/test/features/studio/providers/`
**Dependencies:** T9
**Acceptance:** AsyncNotifier for both; pagination on earnings; linked account refreshes on screen focus.

### T13: Flutter Earnings screen + widgets
**Agent:** Mobile
**Files:**
- `apps/mobile/lib/features/studio/screens/earnings_screen.dart` (new)
- `apps/mobile/lib/features/studio/widgets/payout_row.dart` (new)
- `apps/mobile/lib/features/studio/widgets/payout_summary_card.dart` (new)
- `apps/mobile/lib/features/studio/widgets/linked_account_banner.dart` (new)
- `apps/mobile/lib/app/router.dart` (modify — add `/studio/earnings`)
- Widget tests in `apps/mobile/test/features/studio/screens/earnings_screen_test.dart` + widget tests
**Dependencies:** T12
**Acceptance:** Matches §9; passes `flutter analyze`; all widget tests pass.
**Edge cases:** All of §11 "Creator-side UX".

### T14: Studio tab — link to Earnings
**Agent:** Mobile
**Files:**
- `apps/mobile/lib/features/studio/screens/studio_tab_screen.dart` (modify — replace line 874 empty-state copy with live earnings card that navigates to `/studio/earnings`)
**Dependencies:** T13
**Acceptance:** Earnings card on Studio tab renders "Pending ₹X" + "Paid last 30d ₹Y" + arrow → navigates to Earnings screen.

### T15: Notifications on payout lifecycle
**Agent:** API
**Files:**
- `apps/api/src/services/notification.service.ts` (modify — add 4 new notification types: `payout.enabled`, `payout.processed`, `payout.failed`, `payout.action_required`)
- Hook into T3 (activation) + T7 (webhook events) + T11 (refund)
- Tests
**Dependencies:** T3, T7
**Acceptance:** Each event fires FCM + email (SendGrid) per templates.

### T16: Ops playbook + docs
**Agent:** Docs
**Files:**
- `docs/ops/payout-playbook.md` (new) — stuck activations, post-release refunds, manual transfer reversal via Razorpay dashboard
- `docs/engineering/openapi.yaml` (modify — add new endpoints)
**Dependencies:** All Ts
**Acceptance:** Runbook covers every §11 edge case that requires human intervention.

### T17: Integration test — full happy path
**Agent:** API
**Files:**
- `apps/api/src/integration/payout-lifecycle.test.ts` (new) — end-to-end: KYC verify → linked account → booking → payment webhook → complete → release webhook → payout completed
**Dependencies:** All Ts
**Acceptance:** Single test drives the state machine across all services with mocked Razorpay SDK.

---

## 15. Pre-Implementation Checklist (for reviewer)

**Completeness**
- [ ] All SRS requirements in §2 are covered by a task in §14
- [ ] All wireframe elements in §3 map to a widget/screen in §9
- [ ] All edge cases in §11 are addressed in at least one task's acceptance criteria
- [ ] All open questions in §13 are resolved or explicitly deferred

**Design**
- [ ] Architecture decisions in §5 are consistent with HLD
- [ ] API endpoints in §7 follow the conventions in `.claude/instructions/api.md`
- [ ] Coral usage in §9 is within the 8 allowed contexts
- [ ] All UI loading states use skeleton shimmer (not spinner)

**Security**
- [ ] All security risks in §10 have a mitigation
- [ ] Webhook signature verification happens before JSON parse
- [ ] Internal cron endpoint requires shared secret

**Quality**
- [ ] Test cases in §12 cover all edge cases
- [ ] No task has vague acceptance criteria
- [ ] Task dependencies are clearly stated

---

*Plan generated by: Opus 4.7 — see `/plan-epic` command*
*To be reviewed by: founder before implementation begins*
