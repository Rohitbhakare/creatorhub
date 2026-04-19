# Payouts Ops Playbook — E2.12

> Runbook for CreatorHub Razorpay Route payouts. Read this before touching
> payout state, reversing a settlement, or responding to a "where is my money?"
> ticket.

---

## 1. Lifecycle at a glance

```
  payment.captured (buyer paid)
         │
         │  webhook creates payout row, on_hold=1, status=scheduled
         ▼
  booking.completed (trip ended)
         │
         │  release_at = now + 48h (dispute window)
         ▼
  cron /internal/cron/payouts/release  (every 15m)
         │
         │  calls Razorpay editTransfer, flips status=processing
         ▼
  transfer.settled  OR  payout.processed  (webhook)
         │
         │  status=completed, notifyPayoutProcessed fired once
         ▼
      DONE
```

Failure branches:
- **`payout.reversed` / `payout.failed`** → status=failed, `notifyPayoutFailed` fires with reason. Amount is re-held; does not auto-retry.
- **`releasePayout` throws** (Razorpay 5xx, timeout) → status=failed, `notifyPayoutFailed` fires with the error message. Can be manually retried.

---

## 2. State model

| Column | Values | Who writes |
|---|---|---|
| `status` | `scheduled`, `processing`, `completed`, `failed` | service + webhook |
| `on_hold` | `1` (held), `0` (released) | service at create; cron at release |
| `release_at` | timestamp | service at booking completion |
| `transfer_id` | `trf_xxx` (Razorpay) | service at payment.captured |
| `razorpay_payout_id` | `pout_xxx` | webhook when payout.processed arrives |
| `failure_reason` | free text from Razorpay or internal error | webhook / service |
| `processed_at` | timestamp | webhook on completion |

Monotonic: `scheduled → processing → completed` or `scheduled/processing → failed`.
`notifyCompletionIfFirst` checks status BEFORE writing to avoid double-notify when
both `transfer.settled` and `payout.processed` land.

---

## 3. Daily checks (5 min)

**Morning (09:30 IST):**

1. **Razorpay dashboard** → Transfers → filter last 24h. Count settled vs failed.
2. **Supabase** → run:
   ```sql
   SELECT status, COUNT(*) FROM payouts
   WHERE created_at > now() - interval '24 hours'
   GROUP BY status;
   ```
3. **Stuck payouts** (processing > 6h):
   ```sql
   SELECT id, booking_id, transfer_id, amount_paisa, status, release_at
   FROM payouts
   WHERE status = 'processing'
     AND release_at < now() - interval '6 hours'
   ORDER BY release_at;
   ```
   If any rows return — check Razorpay dashboard for that transfer. If Razorpay
   shows settled but our row didn't flip, see §5 *Webhook missed*.

**Evening (18:00 IST):**

1. **Failed payouts**:
   ```sql
   SELECT id, booking_id, failure_reason, updated_at
   FROM payouts
   WHERE status = 'failed'
     AND updated_at > now() - interval '24 hours';
   ```
2. For each: action per §4.

---

## 4. Responding to failures

### 4.1 `beneficiary_rejected` / `invalid_account_number`
The linked account is bad. Creator must re-submit KYC.

1. The creator already received `notifyPayoutFailed` (push + email).
2. Confirm the linked_account row `status` — should be `rejected` or `needs_clarification`.
3. If not, flip it manually:
   ```sql
   UPDATE razorpay_linked_accounts
   SET status = 'rejected', updated_at = now()
   WHERE user_id = '<user_id>';
   ```
4. Ping the creator in ops Slack (`#creator-support`) with the KYC re-submit link.

### 4.2 `insufficient_funds` (our Razorpay wallet is empty)
This is **our** problem, not the creator's.

1. **Top up the Razorpay wallet immediately** — dashboard → Payouts → Add Funds.
2. After balance lands, manually re-release the failed payouts:
   ```sql
   UPDATE payouts
   SET status = 'scheduled', failure_reason = NULL, on_hold = 1
   WHERE status = 'failed'
     AND failure_reason = 'insufficient_funds'
     AND created_at > now() - interval '7 days';
   ```
3. The next cron tick (within 15m) picks them up.
4. Creator gets `notifyPayoutProcessed` when settled.

### 4.3 Generic Razorpay 5xx during `releasePayout`
Retry path:

1. Check Razorpay status page.
2. If Razorpay is up, manually reset the payout and let cron retry:
   ```sql
   UPDATE payouts SET status = 'scheduled', failure_reason = NULL
   WHERE id = '<payout_id>';
   ```
3. Watch the next cron run. If it fails again, escalate to eng-on-call.

---

## 5. Webhook missed (Razorpay says settled, we say processing)

Symptoms: a payout row stays in `processing` but the Razorpay dashboard shows
the transfer as settled.

**Diagnose:**
1. Find the transfer in Razorpay dashboard, copy `trf_xxx`.
2. Check webhook deliveries for that transfer — Razorpay dashboard →
   Webhooks → Logs → filter by event id.
3. If the webhook shows 4xx/5xx from our side, check API logs
   (`fly logs -a creatorhub-api | grep razorpay-webhook`).

**Reconcile manually:**
```sql
UPDATE payouts
SET status = 'completed',
    processed_at = now(),
    razorpay_payout_id = '<pout_xxx_from_dashboard>'
WHERE transfer_id = '<trf_xxx>';
```

Then manually fire the notification (optional, only if the creator is asking):
```bash
# From apps/api/ — one-off script
pnpm tsx scripts/notify-payout-processed.ts <payout_id>
```
*(script not built yet — add in T-follow-up if needed)*

---

## 6. Linked account lifecycle

| Razorpay event | linked_account status | Notification |
|---|---|---|
| `account.activated` | `activated` | `notifyPayoutsEnabled` |
| `account.under_review` | `under_review` | none |
| `account.needs_clarification` | `needs_clarification` | `notifyLinkedAccountActionRequired` |
| `account.rejected` | `rejected` | `notifyLinkedAccountActionRequired` |
| `account.suspended` | `suspended` | `notifyLinkedAccountActionRequired` |

If a creator pings support asking "why are payouts paused?" — check
`razorpay_linked_accounts.status` for that user. The Studio → Earnings screen
shows the same banner we'd tell them about.

---

## 7. Common support tickets

### "Where is my money?"
1. Look up the booking: `SELECT * FROM bookings WHERE id = '<booking_id>';`
2. Look up the payout: `SELECT * FROM payouts WHERE booking_id = '<booking_id>';`
3. Common outcomes:
   - `on_hold = 1` and `release_at > now()` → 48h dispute window still open, legit. Tell them when it lands.
   - `status = 'scheduled'` and `release_at < now()` → cron will pick up in ≤15m. Reassure.
   - `status = 'processing'` for <6h → normal, Razorpay settling. Reassure.
   - `status = 'processing'` for >6h → see §5.
   - `status = 'completed'` → it landed. Tell them to check the linked bank; funds reflect up to a few hours post-settle.
   - `status = 'failed'` → see §4.

### "I never got notified my payout landed"
1. Check `payout_status = 'completed'` — if true, the notification was fired.
2. Check user's notification preferences: `SELECT * FROM notification_preferences WHERE user_id = '<user_id>';`
3. Check delivery logs (PostHog / SendGrid). If email bounced, send a courtesy SMS manually.

### "My KYC was approved but payouts still show disabled"
1. Check `razorpay_linked_accounts.status` — should be `activated`.
2. If `activated` but the app shows otherwise — user needs to pull-to-refresh on Studio → Earnings (we don't push real-time yet).
3. If not `activated` but Razorpay dashboard says activated — webhook likely missed. Manually:
   ```sql
   UPDATE razorpay_linked_accounts
   SET status = 'activated', activated_at = now()
   WHERE user_id = '<user_id>';
   ```

---

## 8. Dashboards & alerts

| Resource | Location |
|---|---|
| Razorpay dashboard | https://dashboard.razorpay.com |
| Webhook delivery logs | Razorpay → Webhooks → Logs |
| Our API logs | `fly logs -a creatorhub-api` |
| Payouts table (Supabase) | Supabase Studio → `payouts` |
| PostHog events | `payout_processed`, `payout_failed`, `payouts_enabled` |

---

## 9. Escalation

- **Creator-facing urgency (money not landing):** page eng-on-call.
- **Razorpay outage:** post in `#ops-alerts`, do NOT bulk-retry (adds load).
- **Suspected fraud / dispute:** freeze the payout manually, then involve finance:
  ```sql
  UPDATE payouts SET on_hold = 1 WHERE id = '<payout_id>';
  ```

---

## 10. Post-incident

After any failure you had to hand-resolve:
- Note it in `docs/ops/incidents/YYYY-MM-DD-short-name.md`.
- If the root cause suggests an automation gap, add a ticket to the Payouts backlog (E3-series).
