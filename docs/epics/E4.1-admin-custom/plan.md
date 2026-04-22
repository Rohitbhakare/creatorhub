# E4.1 — Custom Admin Panel (V2 pulled forward)

> Pulls the V2 custom admin panel (ADR-004, ADM-FR-006/007) forward into M2+ so ops work runs against a first-party surface instead of Retool. Parallel track to live launch — does not block M2 launch blockers.

> **Auth note (2026-04-22):** Plan started with Google SSO but switched to in-app email+password login (Firebase Admin email/password, no external billing). Google SSO migration is tracked as a future change — see §13 Q11. Session: pure JWT, **4h absolute TTL**, no refresh token.

---

## 1. Overview

CreatorHub ships a dedicated internal admin web app (`apps/admin/`) that replaces the Retool workflow laid out in E2.8. Staff sign in with Google SSO (domain-allowlisted), and every admin action is gated by RBAC (5 roles: Super Admin, Content Moderator, Support, Finance, Operations) and written to the existing `audit_log`. The app covers ops parity with Retool (user search, KYC queue, moderation, payouts, refunds, feature toggles) plus two V1-tier growth tools (editorial curation CRUD, search analytics dashboard). The existing `x-admin-secret` header auth on the 10 admin endpoints is migrated to session-based admin JWT. Epic runs in parallel with live-launch work — it is **not a launch blocker**.

---

## 2. SRS Requirements

| ID | Requirement | Notes / Scope Decisions |
|----|-------------|------------------------|
| ADM-FR-001 | User search and view (by phone/email/username, show profile + KYC + bookings) | Existing endpoints reused; new screens |
| ADM-FR-002 | KYC review (approve/reject with reason) | Reuses E2.2 endpoints |
| ADM-FR-003 | Content takedown (soft-delete with reason + audit log) | Existing endpoints reused |
| ADM-FR-004 | Payout run (trigger pending payouts) | Reuses E2.12 cron + manual trigger endpoint |
| ADM-FR-005 | Refund run (manual refund with reason) | Existing endpoint reused |
| ADM-FR-006 | Full custom admin panel | **This epic** |
| ADM-FR-007 | RBAC with 5 roles | **All 5 roles implemented in v1** per founder decision |
| ADM-FR-008 | Audit log (all actions logged, queryable) | Service exists; add UI |
| ADM-FR-009 | Editorial Curation CRUD (DD-014 amendment) | **Included in this epic** per founder decision |
| ADM-FR-010 | Search analytics dashboard (DD-015) | **Included in this epic** per founder decision |
| ADM-FR-011 | Feature/unfeature creators & content (DD-039) | New endpoint + UI (not yet built) |

---

## 3. Wireframes Referenced

> **No admin wireframes exist today.** Pack J is a deliverable of this epic (T1) and ships **before** any implementation code. All later tasks reference screens in Pack J once it is approved.

| Wireframe file | Relevant section / component | What to verify |
|----------------|------------------------------|----------------|
| `docs/01_wireframes/v2/project/pack-j-admin.jsx` (new, T1) | All admin screens | Desktop-first layout; Pure White + Coral tokens; admin-specific density (denser than consumer app) |
| `docs/01_wireframes/v2/README.md` | Design system reference | Token adherence |
| `docs/01_wireframes/v2/project/design-system.jsx` | Color/type tokens | Reuse the 8-context coral rules; admin UI gets 1 new coral context: primary action button |

**Pack J scope (10 screens):**
1. J1 Login (Google SSO)
2. J2 Dashboard (counts + audit feed)
3. J3 User Search + Detail split view
4. J4 KYC Review Queue + Detail
5. J5 Moderation Queue + Content Detail
6. J6 Payout Run
7. J7 Manual Refund
8. J8 Editorial Collections (list + editor)
9. J9 Search Analytics Dashboard
10. J10 Audit Log Viewer

---

## 4. Dependencies

| Dependency | Type | Status | What we need from it |
|------------|------|--------|----------------------|
| E2.2 KYC | Epic | DONE | KYC submissions table, approve/reject endpoints |
| E2.3 Payments | Epic | DONE | Bookings, refund endpoint |
| E2.4 Refunds | Epic | DONE | Refund policies, refund service |
| E2.7 Trust & Safety | Epic | DONE | Reports table, moderation queue |
| E2.8 Admin (Retool) | Epic | DONE | 10 admin endpoints to migrate off `x-admin-secret` |
| E2.12 Payouts | Epic | DONE | Payout cron, manual release endpoint |
| Firebase Admin SDK | External | Configured | Email+password credential verification (existing SDK) |
| Google Cloud Console | External | **Not required for v1** | Moved to future epic — see §13 Q11 |

---

## 5. Architecture Decisions

| Decision | Chosen approach | Rejected alternative | Rationale |
|----------|----------------|---------------------|-----------|
| App location | New `apps/admin/` Next.js app (Next 15 + React 19 + Tailwind v4) | Nest under `apps/web/admin/*` | Auth isolation, separate deploy, matches C-09 placeholder |
| Admin auth | Firebase Admin email+password → API-signed session JWT in httpOnly cookie | Google SSO (deferred — needs OAuth client setup), custom bcrypt-only | Reuses existing Firebase Admin SDK; zero external billing; Google SSO can slot in later via the same session layer |
| Password management | Super admin provisions new admins with a temp password + `must_change_password=true`; admins change on first login | Email-based reset tokens | No transactional email plumbing needed; super_admin hands off out-of-band |
| RBAC model | `admin_role` enum on `admin_users` row; `requireAdminRole(roles[])` middleware | Policy-based (Casbin), column-level RLS | 5 roles is shallow — enum + middleware is clearest |
| Session transport | httpOnly SameSite=strict cookie, **4h absolute TTL, no refresh token** | localStorage JWT, sliding session | Cookie is XSS-resistant; 4h forces re-auth daily for sensitive panel |
| Existing endpoint auth migration | Dual-auth for one release: accept `x-admin-secret` OR admin session → remove secret after cutover | Hard cutover | Zero-downtime for ongoing Retool ops during rollout |
| Deploy target | Separate Fly.io app (`creatorhub-admin`), Mumbai region | Same Fly app as `apps/api` | Isolates blast radius, separate scaling |
| Public URL | `admin.creatorhub.in` (TBD DNS), gated by email+password + `admin_users.is_active` | VPN-only internal hostname | Until Google SSO lands, rely on strong passwords + low-enumeration (admin-only provisioning) + aggressive rate limits |
| Rate limit | 100 req/min per admin user, **5 failed logins per IP per 15min → 15min lockout**, 20 failed logins per email per day → account lock | Softer | Password-based auth has higher brute-force surface than SSO |

---

## 6. Database

### Tables touched

| Table | Operation | Schema change? | Notes |
|-------|-----------|---------------|-------|
| `admin_users` | R/W | **NEW** | Admin staff accounts + role |
| `editorial_collections` | R/W | **Already exists (migration 007)** — reuse | Has `content_ids uuid[]` column; admin screens edit this array directly. Also has `source`, `scheduled_start/end` — use them |
| `search_queries` | R | **Already exists (migration 010)** — reuse | Has `normalized_query`, `clicked_result_id`, `clicked_at`; `top_searches_7d` matview already defined |
| `users` | R/W | Add `is_admin` boolean? **No** — admins are separate entities in `admin_users` | Reuse existing |
| `content` | R | No | Moderation list/detail |
| `kyc_submissions` | R/W | No | KYC review queue |
| `bookings` | R/W | No | Refund run |
| `payouts` | R/W | No | Payout run |
| `audit_log` | R/W | No | All admin writes log here |
| `reports` | R | No | Moderation queue source |

> **Discovered during plan review:** `editorial_collections` (007) and `search_queries` + `top_searches_7d` matview (010) were already shipped in E0.2. Migration 014 is therefore smaller than originally sized — only `admin_users` and `admin_role` enum are new. Editorial curation uses the existing `content_ids uuid[]` column (no separate items table needed for v1 — reorder is array index shuffle).

### New migration: `014_admin_panel.sql`

```sql
CREATE TYPE admin_role AS ENUM (
  'super_admin', 'content_moderator', 'support', 'finance', 'operations'
);

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  firebase_uid TEXT UNIQUE,            -- populated on first Firebase login
  full_name TEXT NOT NULL,
  role admin_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  failed_login_count INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,            -- set when brute-force threshold hit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES admin_users(id),
  last_login_at TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ
);
CREATE INDEX idx_admin_users_email ON admin_users(lower(email));

-- Password is stored in Firebase Auth (not in this table).
-- Domain CHECK removed — access gated by admin_users row membership, not email domain.
-- editorial_collections already exists (migration 007) — reuse as-is.
-- search_queries + top_searches_7d already exist (migration 010) — reuse.
```

**Migration 015 — seed founder:**
- Insert `rohitbhakare@gmail.com` as `super_admin` with `must_change_password = true`
- Firebase Auth user provisioned via seed script (not migration) — super_admin logs in with temp password on day 1, changes it immediately

### Key queries

```sql
-- Pending KYC with aging
SELECT k.*, u.username, u.display_name,
  EXTRACT(EPOCH FROM (now() - k.submitted_at))/3600 AS age_hours
FROM kyc_submissions k
JOIN users u ON u.id = k.user_id
WHERE k.status = 'pending'
ORDER BY k.submitted_at ASC
LIMIT $1 OFFSET $2;

-- Top zero-result queries (ADM-FR-010)
SELECT lower(query) AS q, COUNT(*) AS hits
FROM search_queries
WHERE created_at > now() - interval '7 days' AND result_count = 0
GROUP BY lower(query)
ORDER BY hits DESC
LIMIT 50;
```

### RLS policies

| Table | Policy | Rule |
|-------|--------|------|
| `admin_users` | service-role only | No RLS — API service role handles all reads/writes |
| `editorial_collections` | public read published | `is_published = true` for anon/authenticated reads |
| `editorial_collection_items` | public read via join | Follows parent |
| `search_queries` | service-role only | No public read — PII risk in query text |

---

## 7. API Endpoints

> Admin API lives under `/api/v1/admin/*`. All require `requireAdminRole([...])` middleware.

### Auth

**`POST /api/v1/admin/auth/login`** — email + password
- Body: `{ email: string, password: string }`
- Verifies credentials via Firebase Admin (`getUserByEmail` + verify password via Firebase signInWithEmailAndPassword REST endpoint server-side), checks `admin_users` row exists + `is_active=true` + not `locked_until > now()`
- On success: updates `last_login_at`, resets `failed_login_count`, sets httpOnly session cookie (4h TTL)
- On failure: increments `failed_login_count`; after 5 → lock for 15 min
- Response `{ success: true, data: { admin: AdminProfile, must_change_password: boolean } }`
- 401 invalid credentials; 403 admin not provisioned / inactive; 423 locked

**`POST /api/v1/admin/auth/change-password`** — authenticated
- Body: `{ current_password: string, new_password: string }`
- Validates `new_password` (min 12 chars, mixed case, number, symbol)
- Updates Firebase Auth password, clears `must_change_password`, sets `password_changed_at`
- Rotates session JWT (invalidates old one)

**`POST /api/v1/admin/auth/logout`** — clear session cookie

**`GET /api/v1/admin/auth/me`** — return current admin profile (role, email, permissions)

**`POST /api/v1/admin/admins/:id/reset-password`** — super_admin only
- Generates a 16-char temp password, sets it on Firebase Auth, sets `must_change_password=true`
- Returns the temp password in response (super_admin shares out-of-band — one-time display)

### Admin management (super_admin only)

**`POST /api/v1/admin/admins`** — create admin user
**`GET /api/v1/admin/admins`** — list admin users
**`PATCH /api/v1/admin/admins/:id`** — change role / deactivate

### Existing endpoints (migrated off `x-admin-secret`)

All 10 endpoints in [apps/api/src/routes/admin.routes.ts](apps/api/src/routes/admin.routes.ts) gain a `requireAdminRole([...])` guard:
- User search/detail/suspend → `support`, `content_moderator`, `super_admin`
- Content moderation/takedown → `content_moderator`, `super_admin`
- KYC queue → `support`, `super_admin` (KYC-FR-032 compliance — only these see PII)
- Refund processing → `finance`, `super_admin`
- Audit log read → all roles (scoped to their own actions, except super_admin sees all)

### New endpoints

**`POST /api/v1/admin/content/:id/feature`** / **`/unfeature`** — `content_moderator`, `super_admin`
**`POST /api/v1/admin/users/:id/feature`** / **`/unfeature`** — `content_moderator`, `super_admin`
**`POST /api/v1/admin/payouts/release`** — force release pending payout — `finance`, `super_admin`

### Editorial curation (ADM-FR-009) — `content_moderator`, `super_admin`

> Operates on existing `editorial_collections.content_ids uuid[]`. Add/reorder/remove are array mutations in a single row update.

- `GET /api/v1/admin/collections` — list all (active + inactive)
- `POST /api/v1/admin/collections` — create (slug, title, subtitle, cover_image_url, source='manual')
- `GET /api/v1/admin/collections/:id` — detail with resolved content items
- `PATCH /api/v1/admin/collections/:id` — update metadata / toggle `is_active` / reorder `content_ids`
- `DELETE /api/v1/admin/collections/:id` — delete (hard delete ok; they're curated metadata not user data)
- `POST /api/v1/admin/collections/:id/items` — append content_id to array
- `DELETE /api/v1/admin/collections/:id/items/:contentId` — remove content_id from array

### Search analytics (ADM-FR-010) — all roles read, `operations`+`super_admin` edit suggestions

- `GET /api/v1/admin/analytics/search/top` — top queries last 7/30 days
- `GET /api/v1/admin/analytics/search/zero-results` — zero-result queries
- `GET /api/v1/admin/analytics/search/ctr` — click-through by query

### Errors
RFC 9457 per house pattern. 403 with type `admin-forbidden` when role check fails.

---

## 8. Shared Types / Zod Schemas

```typescript
// packages/shared/src/types/admin.ts
export type AdminRole =
  | 'super_admin'
  | 'content_moderator'
  | 'support'
  | 'finance'
  | 'operations'

export interface AdminProfile {
  id: string
  email: string
  full_name: string
  role: AdminRole
  is_active: boolean
  must_change_password: boolean
  last_login_at: string | null
}

export interface EditorialCollection {
  id: string
  slug: string
  title: string
  subtitle: string | null
  cover_image_url: string | null
  is_active: boolean
  content_ids: string[]
  source: 'algorithmic' | 'manual'
  refreshed_at: string
}

// packages/shared/src/schemas/admin.ts
export const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128)
})
export const ChangePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string()
    .min(12)
    .regex(/[a-z]/, 'lowercase required')
    .regex(/[A-Z]/, 'uppercase required')
    .regex(/\d/, 'number required')
    .regex(/[^A-Za-z0-9]/, 'symbol required')
})
export const CreateAdminSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(100),
  role: z.enum(['super_admin','content_moderator','support','finance','operations'])
})
export const CreateCollectionSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(60),
  title: z.string().min(3).max(100),
  subtitle: z.string().max(200).optional(),
  cover_image_url: z.string().url().optional()
})
```

---

## 9. Admin App Screens (Next.js — `apps/admin/`)

> Shared design system: reuse v2 Pure White + Coral tokens from `docs/01_wireframes/v2/project/design-system.jsx`. Desktop-first, min-width 1280px, dense layouts (1.4× consumer density).

| Route | Screen | Description | Data source |
|-------|--------|-------------|-------------|
| `/login` | Login | Email + password form | `/admin/auth/login` |
| `/change-password` | Change Password | Forced when `must_change_password=true` | `/admin/auth/change-password` |
| `/` | Dashboard | Stat cards (pending KYC, open reports, takedowns today) + recent audit feed | multiple GETs |
| `/users` | User Search | Search input + split-view detail | `/admin/users/search` |
| `/users/:id` | User Detail | Profile + KYC + bookings + actions (suspend, feature) | `/admin/users/:id` |
| `/kyc` | KYC Queue | List sorted by age, click → detail | `/admin/kyc` |
| `/kyc/:userId` | KYC Detail | PAN/Aadhaar/bank + approve/reject with reason | `/admin/kyc/:userId` |
| `/moderation` | Moderation Queue | Reports grouped by content | `/admin/reports` (existing) |
| `/moderation/:contentId` | Content Moderation Detail | Preview + takedown action | `/admin/content/:id` |
| `/payouts` | Payout Run | Pending payouts table + release action | `/admin/payouts/*` |
| `/refunds` | Manual Refund | Booking search + refund form | `/admin/bookings/:id/refund` |
| `/collections` | Editorial Collections | List + create | `/admin/collections` |
| `/collections/:id` | Collection Editor | Items list with drag-reorder + content picker | `/admin/collections/:id` |
| `/analytics/search` | Search Analytics | Top / zero-results / CTR charts | `/admin/analytics/search/*` |
| `/audit` | Audit Log | Searchable, filterable log | `/admin/audit-log` |
| `/admins` | Admin Users | super_admin only — list + create/deactivate | `/admin/admins` |

### Shared layout

- Left nav: persistent sidebar with role-scoped menu items (items hidden if role lacks access)
- Top bar: current admin avatar, role badge, logout
- Role badge uses muted chip; **coral reserved for destructive actions** (Takedown, Suspend, Reject KYC)

### UI decisions to verify
- [ ] Coral `#E15A41` only on: destructive actions (Takedown, Suspend, Reject) + single "Approve KYC" primary CTA
- [ ] Fraunces only in page titles (H1 on each route)
- [ ] Skeleton shimmer on every async table/list
- [ ] No spinners anywhere
- [ ] Table rows min 56px tall (dense but still tappable)

---

## 10. Security Considerations

| Risk | Mitigation | Applies here? |
|------|-----------|--------------|
| Unauthorized admin access | Email+password (Firebase) + `admin_users.is_active` check + RBAC middleware + no self-registration (super_admin provisions only) | **Primary concern** |
| Brute-force password attack | 5 failed logins per IP / 15 min lockout, 20 per email / day lockout, bcrypt-equivalent verification cost via Firebase | **Raised concern vs Google SSO plan** |
| Weak admin password | 12+ chars, mixed case, number, symbol required at change time | Yes |
| Session hijack | httpOnly SameSite=strict cookie, **4h absolute TTL, no refresh** | Yes |
| CSRF on admin writes | SameSite=strict cookie + custom header check on mutations | Yes |
| Privilege escalation | Role change requires `super_admin`; audit-logged; cannot self-promote | Yes |
| PII leakage (KYC docs) | KYC-FR-032 — only `support` + `super_admin` see Aadhaar/PAN; detail page requires active submission | Yes |
| Takedown abuse | All takedowns audit-logged; user gets notification with reason; undo available within 24h | Yes |
| Payout manipulation | `finance`/`super_admin` only; rate limit 10 releases/hour; each requires reason | Yes |
| SQL injection on search | Parameterized queries only; no string concat | Always |
| XSS in audit log display | React auto-escapes; all admin inputs validated via Zod | Yes |
| Brute-force login | Rate limit 10 failed Google exchanges/IP/min + alert after 100/day | Yes |
| Admin app exposed to internet | Public URL acceptable given strong password policy + rate limits + provisioning-only onboarding; upgrade to SSO in follow-up epic | Accepted |
| Orphaned `admin_users` row | Nightly job: if `last_login_at > 90 days` ago → auto-deactivate | Yes |
| Temp password leak in transit | Displayed one-time only to the super_admin who provisioned; never emailed; hashed immediately in Firebase | Yes |
| Cookie leak over HTTP | Secure flag set, HSTS on admin.* domain | Yes |

---

## 11. Edge Cases & Error States

### Auth
- Login with email not in `admin_users` → 401 "Invalid credentials" (same shape as wrong password — do NOT leak enumeration)
- Wrong password → 401 "Invalid credentials"; increment `failed_login_count`
- 5th failed login in 15 min from same IP → 423 "Too many attempts. Try again in 15 minutes."
- 20th failed login in 24h for an email → `locked_until = now() + 24h`, requires super_admin unlock
- `admin_users.is_active = false` → 403 "Account deactivated."
- `must_change_password=true` → after successful login, middleware forces redirect to `/change-password`
- Session expired mid-action (4h) → 401 + redirect to `/login?returnTo=...`
- Two tabs, one logs out → other sees 401 on next request and redirects
- Password change: new password same as current → 422 "New password must differ from current"
- Password change: weak password → 422 with field-level errors from Zod

### User search
- Empty query → disable Search button
- Query matches 0 users → "No users found" empty state
- Query matches 500+ users → paginate, show "Showing 20 of 500+"

### KYC review
- Submission already approved → show read-only, hide action buttons
- PAN image fails to load → "Image unavailable" placeholder + retry
- Reviewer closes tab mid-review → no lock; another reviewer may also review
- Reject without reason → validation error

### Moderation
- Content already taken down → show "Already removed" badge, hide action
- Content deleted by creator → show "Deleted by creator" banner
- Report references missing content → show "Content not found" + allow dismissing report

### Payouts / Refunds
- Force-release a payout already paid → 409 "Already released"
- Refund amount > captured amount → 422 validation error
- Booking not refundable (past completion window) → show inline reason, disable button

### Editorial collections
- Slug collision → 409 "Slug already in use"
- Add unpublished content to published collection → warning + confirmation
- Reorder drag crashes → fall back to manual position number

### Audit log
- Log > 10k rows for one admin → cursor pagination
- Filter produces empty set → "No actions match filters"

### RBAC
- User with role `support` tries `DELETE /collections/:id` → 403 `admin-forbidden`
- Role changed mid-session → next request re-validates role, redirects if insufficient

---

## 12. Test Cases

### API tests (Vitest)

| Test | What it verifies |
|------|-----------------|
| `POST /admin/auth/login` — valid credentials | 200, session cookie set, `last_login_at` updated |
| `POST /admin/auth/login` — wrong password | 401, `failed_login_count` incremented |
| `POST /admin/auth/login` — unknown email | 401 (same error as wrong password, no enumeration) |
| `POST /admin/auth/login` — inactive admin | 403 |
| `POST /admin/auth/login` — 6th attempt in 15min | 423 locked |
| `POST /admin/auth/change-password` — weak password | 422 with field errors |
| `POST /admin/auth/change-password` — correct current pw | 200, `must_change_password=false`, session rotated |
| `POST /admin/admins/:id/reset-password` — `support` role | 403 |
| `POST /admin/admins/:id/reset-password` — `super_admin` | 200, temp password returned, `must_change_password=true` |
| `GET /admin/users/search` — no session | 401 |
| `GET /admin/users/search` — `support` role | 200 |
| `POST /admin/content/:id/takedown` — `support` role | 403 (moderator-only) |
| `POST /admin/content/:id/takedown` — `content_moderator` | 200, audit log written |
| `POST /admin/content/:id/feature` — happy path | 200, `content.featured = true` |
| `POST /admin/admins` — `support` attempts | 403 |
| `POST /admin/admins` — `super_admin` | 201 |
| `POST /admin/collections` — duplicate slug | 409 |
| `GET /admin/analytics/search/zero-results` | Returns queries with `result_count = 0` |
| `GET /admin/audit-log` — `support` role | Returns only their own actions |
| `GET /admin/audit-log` — `super_admin` | Returns all actions |

~40 total API tests estimated.

### Admin app tests (Vitest + Playwright smoke)

| Test | What it verifies |
|------|-----------------|
| Login page renders | Google button visible, no errors |
| Login flow (mocked Firebase) | Redirects to `/` on success |
| Dashboard renders stats | Skeleton → cards populated |
| KYC detail approve | Optimistic update + server round-trip |
| Role-hidden nav items | `support` does not see Admins or Collections |
| Takedown requires reason | Submit disabled until reason filled |

~15 smoke tests.

---

## 13. Open Questions / Risks

| # | Question | Impact | Suggested resolution |
|---|----------|--------|---------------------|
| 1 | Session storage: stateful (admin_sessions table) or pure JWT? | Security/ops tradeoff | **RESOLVED:** Pure JWT, 4h absolute TTL, no refresh, no revocation list |
| 2 | Email domain allowlist | Config | **RESOLVED:** No domain restriction at DB level. Access gated by `admin_users` row membership. Founder uses `rohitbhakare@gmail.com` |
| 3 | Seed initial super admin | Bootstrap | **RESOLVED:** Migration 015 inserts `rohitbhakare@gmail.com` as `super_admin`; Firebase Auth user created via seed script with temp password |
| 4 | DNS for admin app | Deploy | `admin.creatorhub.in` — requires DNS setup. Deferred to deploy task |
| 5 | Audit log retention | Compliance | **RESOLVED:** Keep forever. No TTL on `audit_log`. |
| 6 | Rollout of `x-admin-secret` removal | Migration risk | Keep dual-auth for 2 weeks after admin app goes live, then remove |
| 7 | Pack J designer: design-in-code or dedicated design pass? | Schedule | **RESOLVED:** Wireframes-first — proceed with JSX mockups in pack-j-admin.jsx |
| 8 | Search query logging — does the search handler currently write to `search_queries`? | Dependency | Table + matview exist (migration 010). **To verify during T10:** whether the handler inserts on every search. If not, add the hook before analytics endpoints ship |
| 9 | First admin login: bootstrapping | Bootstrap | **RESOLVED:** Migration seeds founder row; seed script creates Firebase user; founder uses `/admins` screen to add others once UI ships |
| 10 | Internal tooling: "log in as user" shadow mode | Scope | **Defer.** Not in SRS; adds major security surface |
| 11 | Google SSO migration path | Future epic | **Deferred to E4.2.** Adding Google SSO later is additive — the `firebase_uid` column already supports Google federation; new `login_method` can coexist with password. No data migration needed |
| 12 | Firebase password-verify: no server-side `signInWithEmailAndPassword` in Admin SDK | Implementation | Use Firebase **Identity Toolkit REST API** (`/accounts:signInWithPassword`) server-side with the web API key. Verified private via env. This is the documented pattern; not a security issue |

---

## 14. Task Breakdown

> 4 phases. Phase 1 is the wireframe deliverable and must be approved before any code.

### Phase 0 — Wireframes (founder-blocking review)

**T1: Pack J admin wireframes**
- Files: `docs/01_wireframes/v2/project/pack-j-admin.jsx` (new, 10 screens)
- Acceptance: All 10 screens from §3 rendered in JSX using existing design-system tokens; founder approves
- No code written until this is approved

### Phase 1 — Auth & RBAC backend

**T2: Admin schema migration**
- Files: `apps/api/src/db/migrations/014_admin_panel.sql`, `apps/api/src/db/migrations/015_seed_super_admin.sql`
- Acceptance: Tables created; super_admin seeded; RLS applied

**T3: Google ID token verification service**
- Files: `apps/api/src/services/admin-auth.service.ts` (new), `apps/api/src/services/admin-auth.service.test.ts`
- Acceptance: Verifies token via Firebase Admin; validates domain; returns admin_users row

**T4: Admin session middleware + handlers**
- Files: `apps/api/src/middleware/requireAdminRole.ts` (new), `apps/api/src/handlers/admin-auth.ts` (new), `apps/api/src/routes/admin-auth.routes.ts` (new), tests
- Acceptance: Session JWT signed + verified; role check middleware; login/logout/me endpoints

**T5: Migrate existing admin endpoints off `x-admin-secret`**
- Files: `apps/api/src/handlers/admin.ts`, `apps/api/src/routes/admin.routes.ts`
- Acceptance: All 10 endpoints gain `requireAdminRole([...])`; dual-auth for rollout; all existing tests updated

**T6: Admin user CRUD endpoints**
- Files: `apps/api/src/handlers/admins.ts` (new), tests
- Acceptance: super_admin only; list/create/update/deactivate

### Phase 2 — New endpoints (ops parity + V1 tools)

**T7: Feature/unfeature endpoints (ADM-FR-011)**
- Files: handler additions, tests
- Acceptance: `content.featured` and `users.featured` toggled; audit logged

**T8: Force-release payout endpoint (ADM-FR-004)**
- Files: `apps/api/src/handlers/admin-payouts.ts`, tests
- Acceptance: Finance/super_admin can trigger early release

**T9: Editorial collections CRUD (ADM-FR-009)**
- Files: `apps/api/src/services/editorial.service.ts`, handlers, routes, tests
- Acceptance: Full CRUD + item reorder; slug uniqueness; publish toggle

**T10: Search analytics endpoints (ADM-FR-010)**
- Files: `apps/api/src/services/search-analytics.service.ts`, handlers, tests
- Pre-req: verify search query logging hook exists (Q8); add if missing
- Acceptance: Top/zero-results/CTR endpoints return last-7/30-day aggregates

### Phase 3 — Admin web app

**T11: `apps/admin` Next.js scaffold**
- Files: `apps/admin/package.json`, Next 15 + Tailwind v4 config, base layout, design tokens imported
- Acceptance: `pnpm --filter admin dev` boots on port 3002; blank layout renders

**T12: Auth flow (login → session → middleware)**
- Files: `apps/admin/src/app/login/page.tsx`, Next middleware for session check
- Acceptance: Login redirects to Google, exchange, cookie set, `/` loads

**T13: Shared layout + role-scoped nav**
- Files: `apps/admin/src/components/AppShell.tsx`, role menu logic
- Acceptance: Nav items hide based on role; logout works

**T14–T20: Screens (one task per Pack J screen except login)**
- T14: Dashboard
- T15: User Search + Detail
- T16: KYC Queue + Detail
- T17: Moderation Queue + Detail
- T18: Payout Run + Manual Refund
- T19: Editorial Collections (list + editor with drag-reorder)
- T20: Search Analytics + Audit Log
- Each: screen + data fetching + smoke test

**T21: Admin Users management screen**
- Files: `apps/admin/src/app/admins/page.tsx`
- Acceptance: super_admin only; list, create, deactivate

### Phase 4 — Deploy & cutover

**T22: Fly.io deployment**
- Files: `apps/admin/fly.toml`, Dockerfile
- Acceptance: `creatorhub-admin` app live on `admin.creatorhub.in`, SSO working

**T23: Remove `x-admin-secret` dual-auth**
- After 2 weeks of parallel operation
- Acceptance: Secret deleted from env; all endpoints session-only

**T24: Docs + handover**
- Files: `docs/engineering/admin-runbook.md`, update `docs/engineering/HLD.md`, OpenAPI spec
- Acceptance: Runbook covers admin onboarding, deactivation, troubleshooting

---

## 15. Pre-Implementation Checklist

**Completeness**
- [ ] All SRS requirements in §2 are covered by a task in §14
- [ ] All Pack J screens in §3 map to a task in §14
- [ ] All edge cases in §11 are addressed in at least one task
- [ ] All open questions in §13 resolved or explicitly deferred

**Design**
- [ ] Architecture decisions in §5 reviewed
- [ ] API endpoints in §7 match house conventions (RFC 9457, Zod, `{success,data}`)
- [ ] Coral usage in §9 reviewed against ui-ux.md
- [ ] All loading states use skeleton shimmer

**Security**
- [ ] All risks in §10 have a mitigation
- [ ] RBAC enforced server-side for every endpoint
- [ ] KYC PII access restricted to `support`/`super_admin` only
- [ ] Cookie flags and rate limits reviewed

**Quality**
- [ ] Test cases in §12 cover all edge cases
- [ ] No vague acceptance criteria in §14
- [ ] Dependencies stated for each task

---

*Plan generated by: Opus (claude-opus-4-7)*
*To be reviewed by: founder before implementation begins — specifically, T1 (Pack J wireframes) is the first deliverable under this plan*
