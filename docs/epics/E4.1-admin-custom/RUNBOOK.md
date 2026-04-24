# E4.1 — Admin panel operations runbook

> Day-to-day playbooks for running the admin console. Pair with
> [DEPLOY.md](DEPLOY.md) (provisioning / cutover) and the master
> tracking file at [tracking.md](tracking.md).

Screenshots referenced below live under
[screenshots/admin/](../../../screenshots/admin/). They will be
captured during the **first ops rehearsal** after the Fly.io cutover
(T22 deploy step). Until then the screenshot callouts are placeholders
— the sequence of clicks is still canonical.

---

## Table of contents

1. [Roles and blast radius](#1-roles-and-blast-radius)
2. [Admin onboarding](#2-admin-onboarding)
3. [Admin offboarding](#3-admin-offboarding)
4. [Password rotation](#4-password-rotation)
5. [User suspend / unsuspend](#5-user-suspend--unsuspend)
6. [KYC review](#6-kyc-review)
7. [Content takedown](#7-content-takedown)
8. [Payout force-release](#8-payout-force-release)
9. [Refund processing](#9-refund-processing)
10. [Editorial collections](#10-editorial-collections)
11. [Featuring content or creators](#11-featuring-content-or-creators)
12. [Audit log investigation](#12-audit-log-investigation)
13. [Search analytics read](#13-search-analytics-read)
14. [Dashboard tiles — what each means](#14-dashboard-tiles--what-each-means)
15. [Incident response checklist](#15-incident-response-checklist)

---

## 1. Roles and blast radius

Five roles. Access is enforced server-side on every request — the
sidebar hides what the role can't see, but the API re-checks.

| Role | Can do |
|------|--------|
| `super_admin` | Everything. Provision admins, deactivate admins, reset any password, force-release payouts, takedown, refund, suspend. Only role that sees `/admins`. |
| `content_moderator` | Content takedown, feature/unfeature, editorial collections, user suspend. No KYC PII, no finance. |
| `support` | User search/detail/suspend, KYC queue read + approve/reject. No finance. |
| `finance` | Bookings detail, refunds, payouts list/detail/force-release. No user suspend, no content takedown. |
| `operations` | Read-only across dashboard, audit log, analytics. No mutations. |

**Rule of thumb:** if an action mutates user-visible state or money,
the actor's `admin_id` lands in `admin_audit_log` with a reason
string. Non-mutation reads are not audited.

![Role matrix in sidebar](../../../screenshots/admin/01-sidebar-roles.png)
*Sidebar shown to a `support` admin — no `/admins`, no `/payouts`,
no `/moderation/collections`.*

---

## 2. Admin onboarding

Only `super_admin` can provision new admins. Do this ahead of the
person's first shift — they need the one-time temporary password
before they can sign in.

### Steps

1. Sign in at `https://admin.creatorhub.in` as a super_admin.
2. Navigate to **Admins** (left sidebar, super_admin only).
3. Click **+ New admin** in the top-right of the list.
4. Fill the modal:
   - **Email** — their work email (used as the sign-in identifier)
   - **Full name** — real name, appears in audit log previews
   - **Role** — pick from the five above; default to the most
     restrictive role that still lets them do their job
5. Submit. The modal swaps to a **Temporary password** panel.
6. Click **Copy** (the page shows a 1.5s "Copied" toast), then send
   the password + sign-in URL to the new admin via **an out-of-band
   channel** (Signal, 1Password share, sealed envelope — not the
   same inbox as the admin email).
7. Tell them the password expires on first use: they'll be forced to
   `/change-password` immediately after login.

![Create admin modal](../../../screenshots/admin/02-create-admin-modal.png)

![Temp password reveal](../../../screenshots/admin/03-temp-password-modal.png)
*The temp password shows once. If the super_admin closes the modal
without copying, they must run a reset — the hash has already been
written and there is no readback path.*

### Gotchas

- **Email must be unique.** Reusing an email that belonged to a
  deactivated admin returns `409 admin_email_taken` — reactivate the
  old row instead of creating a new one (see §3).
- **Roles can be changed later.** The inline role `<select>` on the
  list view fires `PATCH /api/v1/admin/admins/:id` immediately on
  change and writes an audit entry. No confirmation modal — changing
  a role is low blast radius (the admin keeps their session; the
  next request re-checks their new role).
- **`super_admin` demotions are guarded.** DB trigger
  `guard_last_super_admin` blocks demoting or deactivating the last
  active super_admin. The API surfaces this as `409 last_super_admin`.

---

## 3. Admin offboarding

When someone leaves, **deactivate** (don't delete). Deactivation
preserves their audit-log history; deletion would leave dangling
`admin_id` references.

### Steps

1. **Admins** → find the row → toggle **Active** off.
2. Confirm in the modal (reason required, e.g. "Left company
   2026-04-30").
3. Their `ch_admin_session` cookie is **not** actively revoked —
   but the next API request from that session hits
   `requireAdminRole`, which re-reads `is_active` from the DB and
   returns `403 admin_inactive`. Worst case they see one extra page
   before the next navigation boots them to `/login`.
4. If the departure is hostile or you suspect session theft, **also**
   rotate `ADMIN_SESSION_SECRET` (see [DEPLOY.md](DEPLOY.md) §
   operational notes — rotating invalidates **all** admin sessions,
   everyone re-logs in).

![Deactivate toggle](../../../screenshots/admin/04-deactivate-toggle.png)

### Reactivating later

Flip **Active** back on. Their old password is still on file but
should be rotated before first use (§4).

---

## 4. Password rotation

Two flavors: **self-rotation** (any admin, for their own account) and
**super_admin forced reset** (issues a fresh temp password).

### Self-rotation

Sign in → avatar menu (top-right) → **Change password** →
`/change-password`. Current password required, new password must
pass the client-side + server-side policy:

- ≥ 12 chars
- lower + upper + digit + symbol
- different from current

On success the session cookie is **re-issued** (same name, new
expiry). No other sessions are invalidated — that's only
`ADMIN_SESSION_SECRET` rotation.

### Super_admin forced reset

Use when: a junior admin forgets their password, is on leave and
can't self-rotate, or the account shows suspicious activity.

1. **Admins** → find the row → **Reset password**.
2. Confirm modal (reason required, e.g. "User reported lost phone").
3. The TempPasswordModal opens with the new temp password. Copy +
   send out-of-band as in §2, step 6.
4. The target admin's `must_change_password` flag flips true; they
   are force-redirected to `/change-password` on next sign-in
   regardless of which URL they hit.

**You cannot reset your own password from `/admins`.** The button is
disabled with a tooltip; the API returns `403 cannot_self_reset`.
Use the self-rotation flow above.

![Reset password confirm](../../../screenshots/admin/05-reset-password-confirm.png)

---

## 5. User suspend / unsuspend

A suspended user can't publish, can't book, can't comment. They can
still log in (so they see the suspension banner) and request
data-export under DPDPA.

### Suspend

1. **Users** → search by phone / email / username / handle.
2. Open the detail page → **Suspend user** button (top-right).
3. Reason modal. Minimum 10 characters. Pick a category chip
   (spam / harassment / impersonation / fraud / other) and add
   a free-text note referencing the ticket ID.
4. Confirm. The row's `is_suspended` flips true; audit log records
   `user.suspend` with the reason verbatim.

### Unsuspend

Same screen, same button label flips to **Unsuspend**. Same reason
requirement (e.g. "Appeal granted; see ticket CH-4821").

![User detail suspend panel](../../../screenshots/admin/06-user-suspend.png)

### Don't

- **Don't deactivate the user's Firebase record** from the Firebase
  console. Suspend is a DB flag; Firebase auth continues to work so
  they can still sign in to see the banner. Firebase disablement is
  reserved for confirmed-fraud accounts and needs a manual
  conversation with the finance role first (payout implications).

---

## 6. KYC review

KYC submissions are PII-gated: only `support` and `super_admin` can
open a submission detail. The list screen shows minimal info
(pending count, submitted-at, full name); the detail screen fetches
document URLs on demand.

### Review flow

1. **KYC** (sidebar) → queue sorted by submitted-at ascending (FIFO).
2. Click a row → opens the detail page. Documents (PAN, Aadhaar
   masked, selfie) load via **signed URLs** that expire in 10 min.
3. Cross-check:
   - PAN format matches regex + matches the name on the profile
   - Aadhaar last-4 matches what Firebase has for the phone
   - Selfie matches the ID photo (no deep-forgery check yet — flag
     to super_admin if anything looks off)
   - Bank IFSC is a real branch, bank name matches the name on PAN
4. Approve or reject.

### Approve

Click **Approve** → reason modal (optional note, e.g. "PAN + Aadhaar
match; bank verified via penny drop"). The creator's
`kyc_status` flips to `verified`; they receive an FCM
notification; paid content gates open.

### Reject

Click **Reject** → reason modal (**required**, ≥ 20 chars). The
reason text is shown to the creator verbatim in the rejection
notification — so write something actionable ("Aadhaar image is
blurry on line 3; please re-upload a clearer photo"), not
"rejected".

![KYC review detail](../../../screenshots/admin/07-kyc-detail.png)

### PII handling

- **Never** copy KYC document URLs into Slack / Linear / email. The
  URLs expire in 10 min anyway but leaking them is a DPDPA incident.
- Close the tab when you're done. The signed URL stays valid until
  expiry; better to not leave it in a browser history.

---

## 7. Content takedown

Takedown removes content from all public surfaces (feed, profile,
collections) and flips `status=removed`. It's **soft-delete** — the
row stays in DB so refunds for scheduled experiences can still
resolve.

### Steps

1. **Moderation** → **Reports** queue, or **Content search** if you
   have a content ID from an external report.
2. Open the content detail → **Takedown** button.
3. Reason modal. Required. Pick a reason chip (spam / harassment /
   CSAM / copyright / misinformation / other) + free-text.
4. Confirm. If the content is a **paid experience with live
   bookings**, the modal warns: takedown triggers refunds for all
   non-attended bookings. Acknowledge the warning checkbox before
   **Takedown (and refund)** enables.

![Content takedown with refund warning](../../../screenshots/admin/08-takedown-modal.png)

### After takedown

- Creator gets an FCM notification with the takedown reason.
- Finance sees refund rows appear in the **Refunds** queue (if paid).
- The content ID is retained in reports for appeal handling.

### CSAM

CSAM takedowns follow a separate escalation that is **not** managed
from the admin panel. Click **Takedown** but also immediately
escalate to founder + legal via the out-of-band channel — NCMEC
reporting has a 7-day statutory deadline.

---

## 8. Payout force-release

Default is automatic release after booking completion + 48h dispute
window. Force-release is for edge cases: bank downtime left a payout
stuck in `processing` past SLA, or a creator needs an early release
for legitimate reasons.

### Prereqs

- Role: `finance` or `super_admin`.
- You have confirmation from the creator (email / ticket) that they
  want early release, **or** the payout is stuck and you have a
  Razorpay support ticket ID.

### Steps

1. **Payouts** (sidebar) → filter by status = `scheduled` or `stuck`.
2. Click the row → detail page shows the booking, the net amount,
   the creator's bank details, and the current state machine
   position.
3. **Force release** button (top-right).
4. Modal:
   - **Reason** — required, min 20 chars. Include the ticket ID.
   - Acknowledge checkbox: "I understand this bypasses the dispute
     window and cannot be reversed."
5. Confirm. The API calls Razorpay immediately, writes an audit
   entry `payout.force_release`, and updates the payout row.

![Force release modal](../../../screenshots/admin/09-payout-force-release.png)

### Reversal

You can't. Once Razorpay accepts the payout it's irrevocable. If
you mis-fire, raise a clawback ticket with finance + founder.

---

## 9. Refund processing

Refunds are either auto-triggered (takedown, creator cancel,
event-cancelled) or manually processed by finance from a customer
ticket.

### Manual refund

1. **Refunds** → click the booking, or use **Bookings** detail if
   you only have the booking ID.
2. **Process refund** button.
3. Modal:
   - **Amount** — paisa (auto-filled to full amount; override for
     partials)
   - **Reason** — required, min 20 chars
   - **Refund type** — full / partial / goodwill
4. Confirm. The API hits Razorpay's refund endpoint, audit logs
   `booking.refund`, and updates the booking + payout states.

### Gotchas

- **Goodwill refunds** deduct from platform margin, not the
  creator's payout. Use sparingly; document the rationale.
- **Already-paid-out bookings** can still be refunded but the
  creator's next payout is short-paid. The system handles this
  automatically via negative ledger entries.

![Refund modal](../../../screenshots/admin/10-refund-modal.png)

---

## 10. Editorial collections

Collections drive the home-feed rails. Each collection has a slug
(URL-safe, e.g. `weekend-gateaways`), title, subtitle, optional cover,
priority (higher = shown first), and an ordered list of content IDs.

### Create

1. **Moderation → Collections** → **+ New collection**.
2. Fill slug + title + subtitle + priority (start with 0).
3. Save. You land on the editor.
4. Use the **Add content** picker — server-side search across
   published content, filter by type. Click **Add**.
5. Reorder with the **↑ ↓** buttons on each row (drag-reorder is on
   the backlog; the arrows call the same `PATCH /collections/:id`
   with the new order array).
6. Toggle **Active** on when you're ready. Inactive collections are
   hidden from feed but not deleted.

![Collection editor](../../../screenshots/admin/11-collection-editor.png)

### Edit

Same screen. Title / subtitle / slug / priority / items are all
live-editable. Slug changes break any external links — confirm
before saving.

### Delete

Trash icon on the list view → confirmation modal. Deletion is
hard: items are cascaded, audit log keeps the create/update trail
but the collection row is gone. Prefer **Active = off** for
temporary pauses.

---

## 11. Featuring content or creators

Featuring is lighter than collections: it flips a `is_featured` bit
on content or on a user's profile. The feed's "Editor's picks" rail
and the creator discover carousel consume this flag.

### Feature

1. **Content** detail or **User** detail → **Feature** button.
2. Optional reason modal (skip if obvious). Confirm.

### Unfeature

Same button flips to **Unfeature**. Reason still optional.

Featured state shows as a small coral star icon on content tiles.
Unfeaturing is instant and cache-invalidates the feed rail within
60 s.

---

## 12. Audit log investigation

Every mutation across the admin panel writes an `admin_audit_log`
row. Reads are available to all admin roles.

### Finding a specific action

1. **Audit** (sidebar) → list sorted by created-at desc.
2. Scroll, or hit **Load more** (cursor pagination, 20 rows at a
   time).
3. Click the target link — the audit row deep-links to the actual
   object page:
   - `user.*` → `/users/:id`
   - `content.*` → `/moderation/content/:id`
   - `report.*` → `/moderation/reports/:id`
   - `booking.*` → `/bookings/:id`
   - `payout.*` → `/payouts/:id`
   - `collection.*` → `/moderation/collections/:id`

### Reading an entry

Each row shows: timestamp (relative + absolute on hover), actor
email, action verb, target (deep-linked), and a truncated reason.
Expand the **Details** `<details>` section for the full JSON diff
blob — `before` + `after` + headers.

![Audit log list](../../../screenshots/admin/12-audit-list.png)

### Scoping

- `super_admin` sees **all rows**.
- Non-super_admins see **only their own rows** (enforced server-side
  in `getAuditLog`). This is intentional — it's not a compliance
  substitute, it's a "I need to reconstruct what I did last week"
  tool.

---

## 13. Search analytics read

Informational dashboard. Updates nightly from the `search_events`
table (populated by Hono middleware on every `/api/v1/search`
request).

### What to look at

1. **Analytics → Search** → pick a window (**7d** / **30d** toggle).
2. Three panes:
   - **Top queries** — volume-ranked. Gut-check against expected
     niches; if a new niche shows up in the top 20, it may warrant
     its own collection (see §10).
   - **Zero-result queries** — queries that returned nothing.
     Useful for content-sourcing (what creators should we recruit?)
     and for typo detection (if "bengluru" trends, think about
     fuzzy-match or a synonyms file).
   - **CTR** — click-through rate per top query. Low CTR on a
     high-volume query means the top results don't match intent;
     consider a curated collection override.

![Search analytics window](../../../screenshots/admin/13-analytics-search.png)

### Limitations

- No per-user drill-down. By design — search queries are not PII-
  audited and we don't want an audit trail that would tempt misuse.
- 30-day window max. Older events age out of the source table.

---

## 14. Dashboard tiles — what each means

The home page (`/`) shows stat tiles and a recent-audit preview.
All tiles are computed live (no caching yet) from count queries;
expect ~400 ms load.

| Tile | Meaning | SLA |
|------|---------|-----|
| **Users (24h)** | New users created in the last 24 h | — |
| **KYC pending** | Submissions awaiting review | Review within 48 h; page oncall if > 50 |
| **Reports open** | Unresolved user-filed reports | Triage within 24 h |
| **Payouts scheduled** | Payouts queued, not yet released | Investigate if a row is > 72 h old |
| **Refunds pending** | Refunds initiated, awaiting Razorpay confirmation | Investigate if > 24 h |
| **Revenue (7d)** | Platform fee (17%) collected, paisa | Informational |

![Dashboard tiles](../../../screenshots/admin/14-dashboard.png)

Recent audit preview (last 5 rows) sits under the tiles — quick
glance for "what changed recently".

---

## 15. Incident response checklist

When something is wrong in production:

### Triage (first 5 min)

- [ ] Is `admin.creatorhub.in` up? `curl -I` → 307 expected.
- [ ] Is `creatorhub-api.fly.dev/healthz` returning 200?
- [ ] Is Sentry throwing? Check the project dashboard.
- [ ] Check Fly logs: `fly logs --app creatorhub-admin` and
      `fly logs --app creatorhub-api`.

### If admin panel is down but API is up

1. Roll back admin to the previous release:
   `fly releases rollback <n> --app creatorhub-admin`
   (see [DEPLOY.md](DEPLOY.md) § Rollback).
2. File a post-mortem ticket.
3. Affected surface is **internal only** — no user-visible impact
   unless ops needs to act on something urgent. In that case,
   coordinate via the fallback Retool URL (while T23 dual-auth
   window is still open).

### If a super_admin session is compromised

1. From any other super_admin session: **Admins** → deactivate the
   compromised row.
2. Rotate `ADMIN_SESSION_SECRET` via `fly secrets set` ←
   invalidates **all** admin sessions, everyone re-logs in.
3. Force-reset the compromised admin's password (they can then
   self-rotate after re-activation).
4. Review `admin_audit_log` for the last 24 h of actions by that
   `admin_id`; reverse anything unauthorized (takedowns can't be
   un-done cleanly — contact the creator, restore from DB backup
   if needed).

### If the last super_admin is locked out

- DB trigger prevents the last super_admin from being deactivated,
  but a forgotten password with no other super_admin is a real
  recovery scenario.
- Founder has direct Supabase SQL access. Last-resort: insert a new
  super_admin row manually (see migration 018 for the bcrypt-hashed
  seed format) and force `must_change_password=true`.

---

## Links

- [DEPLOY.md](DEPLOY.md) — provisioning, cutover, rollback
- [tracking.md](tracking.md) — epic task status
- [plan.md](plan.md) — architectural decisions
- [HLD § Admin panel](../../engineering/HLD.md) — system context
- [OpenAPI admin paths](../../engineering/openapi.yaml) — endpoint contracts
