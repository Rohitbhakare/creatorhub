# E4.1 — Tasks

> Full detail in [plan.md](plan.md) §14. This file is the working checklist.

---

## Phase 0 — Wireframes (BLOCKING)

### T1: Pack J admin wireframes
**Agent:** Design-in-code (JSX)
**Files:** `docs/01_wireframes/v2/project/pack-j-admin.jsx` (new)
**SRS:** ADM-FR-006 visual reference
**Acceptance:** 10 screens rendered using v2 design tokens — J1 Login, J2 Dashboard, J3 User Search+Detail, J4 KYC Queue+Detail, J5 Moderation Queue+Detail, J6 Payout Run, J7 Manual Refund, J8 Editorial Collections, J9 Search Analytics, J10 Audit Log. Approved by founder before any code starts.
**Edge cases:**
- Empty states for every list
- Loading skeletons
- Role-hidden nav (show `support` view vs `super_admin` view side-by-side)
- Destructive-action confirmation modals

---

## Phase 1 — Auth & RBAC backend

### T2: Admin schema migration
**Agent:** API
**Files:**
- `apps/api/src/db/migrations/014_admin_panel.sql` (new)
- `apps/api/src/db/migrations/015_seed_super_admin.sql` (new)
**SRS:** ADM-FR-007
**Acceptance:** `admin_role` enum + `admin_users` table created; founder seeded as `super_admin`. `editorial_collections` (migration 007) and `search_queries` (migration 010) already exist and are reused. Deploy to Supabase.
**Edge cases:** Email domain check constraint; idempotent seed (`ON CONFLICT DO NOTHING`).

### T3: Firebase email+password verification service
**Agent:** API
**Files:**
- `apps/api/src/services/admin-auth.service.ts` (new)
- `apps/api/src/services/admin-auth.service.test.ts` (new)
- `apps/api/src/lib/firebase-identity-toolkit.ts` (new — wraps `/accounts:signInWithPassword` REST call)
**SRS:** ADM-FR-007
**Acceptance:** `verifyPassword(email, password)` returns `{ uid, email }` or throws via Firebase Identity Toolkit REST; `findAdminByEmail(email)` returns `admin_users` row or throws 401/403; lockout check via `locked_until` + `failed_login_count`.
**Edge cases:** Wrong password (401 generic, no enumeration); unknown email (401 same shape); inactive admin (403); locked account (423); Firebase network error (500).
**Tests:** ~8.

### T4: Admin session middleware + auth handlers
**Agent:** API
**Files:**
- `apps/api/src/middleware/requireAdminRole.ts` (new)
- `apps/api/src/handlers/admin-auth.ts` (new — login, logout, me, change-password)
- `apps/api/src/routes/admin-auth.routes.ts` (new)
- tests
**SRS:** ADM-FR-007, ADM-FR-008
**Acceptance:** Signed JWT (HS256 with per-app secret) session in httpOnly SameSite=strict cookie, **4h absolute TTL, no refresh**; `/admin/auth/login`, `/admin/auth/logout`, `/admin/auth/me`, `/admin/auth/change-password` endpoints; `requireAdminRole(['...'])` middleware throws 403 on role mismatch; every protected call logs `admin_id` to audit_log.
**Edge cases:** Expired token; role changed mid-session; IP-based lockout (5 fails/15min); account-level lockout (20 fails/24h); `must_change_password=true` branches.
**Tests:** ~12.

### T5: Migrate existing admin endpoints off `x-admin-secret`
**Agent:** API
**Files:**
- `apps/api/src/handlers/admin.ts` (modify)
- `apps/api/src/routes/admin.routes.ts` (modify)
- all existing admin tests updated
**SRS:** ADM-FR-001–005, ADM-FR-008
**Acceptance:** 10 existing endpoints gain `requireAdminRole([...])` per §7 role matrix; dual-auth window (accept old secret OR new session) for rollout; all existing tests updated to use session.
**Edge cases:** Backwards-compatible response shape; existing Retool continues to work during dual-auth.
**Tests:** existing tests updated, ~4 new.

### T6: Admin user CRUD + password reset
**Agent:** API
**Files:**
- `apps/api/src/handlers/admins.ts` (new)
- `apps/api/src/services/admins.service.ts` (new)
- `apps/api/src/routes/admins.routes.ts` (new)
- tests
**SRS:** ADM-FR-007
**Acceptance:** `super_admin` only. List, create (email + full_name + role → generates temp password, creates Firebase user, sets `must_change_password=true`), update role, deactivate, reset-password. Cannot self-deactivate. Cannot deactivate last active super_admin.
**Edge cases:** Duplicate email; self-role-change; last-remaining super_admin deactivation blocked; Firebase user creation failure (rollback DB insert).
**Tests:** ~8.

---

## Phase 2 — New endpoints

### T7: Feature/unfeature toggles (ADM-FR-011)
**Agent:** API
**Files:** handler additions to `admin.ts`, route additions, tests
**Acceptance:** Toggle `content.featured` and `users.featured`; audit logged with reason; only `content_moderator`/`super_admin`.
**Tests:** ~4.

### T8: Force-release payout (ADM-FR-004)
**Agent:** API
**Files:** `apps/api/src/handlers/admin-payouts.ts` (new), tests
**Acceptance:** `finance`/`super_admin` trigger early release on a pending payout; integrates with E2.12 payout service; audit logged.
**Edge cases:** Payout already released (409); payout failed (422 with reason).
**Tests:** ~4.

### T9: Editorial collections CRUD (ADM-FR-009)
**Agent:** API
**Files:**
- `apps/api/src/services/editorial.service.ts` (new)
- `apps/api/src/handlers/editorial.ts` (new)
- `apps/api/src/routes/editorial.routes.ts` (new)
- tests
**Acceptance:** 7 endpoints from §7 operating on existing `editorial_collections` table (migration 007). Array-based content_ids for ordering. `is_active` toggle. Consumer-facing `GET /collections` public endpoint also added.
**Edge cases:** Slug collision; concurrent array update (use `UPDATE ... WHERE refreshed_at = $prev` optimistic lock); deleting active collection requires confirmation flag; content_id that references deleted content (filter on read).
**Tests:** ~10.

### T10: Search analytics (ADM-FR-010)
**Agent:** API
**Files:**
- **First check** existing search handler (feed/search routes) and add logging hook if missing
- `apps/api/src/services/search-analytics.service.ts` (new)
- `apps/api/src/handlers/search-analytics.ts` (new)
- tests
**Acceptance:** Search queries logged to `search_queries` on every search call; three analytics endpoints return 7/30-day aggregates.
**Edge cases:** Very-long query truncation (max 200 chars); anon users (user_id null).
**Tests:** ~6.

---

## Phase 3 — Admin web app

### T11: `apps/admin` Next.js scaffold
**Agent:** Web
**Files:**
- `apps/admin/package.json`
- `apps/admin/next.config.ts`
- `apps/admin/postcss.config.js`
- `apps/admin/tailwind.config.ts`
- `apps/admin/src/app/layout.tsx`
- `apps/admin/src/app/page.tsx` (placeholder)
- `apps/admin/src/styles/tokens.css` (imports v2 design system)
**Acceptance:** `pnpm --filter admin dev` boots on port 3002; TypeScript strict; Tailwind v4 with v2 tokens.

### T12: Auth flow (login + change-password + middleware)
**Agent:** Web
**Files:**
- `apps/admin/src/app/login/page.tsx`
- `apps/admin/src/app/change-password/page.tsx`
- `apps/admin/src/middleware.ts` (Next.js middleware for session check + redirect to /login; redirect to /change-password when `must_change_password=true`)
- `apps/admin/src/lib/api.ts`
**Acceptance:** Email+password form → POST `/admin/auth/login` → cookie set → redirect to `/` (or `/change-password` if flag). Change-password form validates strength client-side, rotates session on success.
**Edge cases:** Wrong credentials error; lockout error (423 with unlock time); inactive admin error; session expired redirect with returnTo; forced change-password route cannot be bypassed by navigating elsewhere.

### T13: Shared layout + role-scoped nav
**Agent:** Web
**Files:**
- `apps/admin/src/components/AppShell.tsx`
- `apps/admin/src/components/Sidebar.tsx`
- `apps/admin/src/components/TopBar.tsx`
- `apps/admin/src/lib/rbac.ts` (client-side menu gating)
**Acceptance:** Sidebar shows only items the current admin's role allows; top bar shows role badge + logout.

### T14: Dashboard
**Agent:** Web
**Files:** `apps/admin/src/app/page.tsx`, stat card component, audit feed component
**Acceptance:** 4 stat cards (pending KYC, open reports, takedowns today, payouts queued) + recent 20 audit entries; skeleton on load.

### T15: User Search + Detail
**Agent:** Web
**Files:** `apps/admin/src/app/users/page.tsx`, `users/[id]/page.tsx`, `UserSearchBar.tsx`, `UserDetailPanel.tsx`
**Acceptance:** Split view; actions (suspend/unsuspend, feature/unfeature) visible per role; confirmation modal on destructive.

### T16: KYC Queue + Detail
**Agent:** Web
**Files:** `apps/admin/src/app/kyc/page.tsx`, `kyc/[userId]/page.tsx`, KYC-specific components
**Acceptance:** Queue sorted by age; detail shows PAN/Aadhaar/bank with reveal-on-click (PII protection); approve needs confirmation, reject needs reason.
**Security:** Access restricted to `support`/`super_admin` at middleware + component level.

### T17: Moderation Queue + Detail
**Agent:** Web
**Files:** `apps/admin/src/app/moderation/page.tsx`, `moderation/[contentId]/page.tsx`
**Acceptance:** Reports grouped by content with count badge; content preview + takedown with reason; dismiss-report also available.

### T18: Payout Run + Manual Refund
**Agent:** Web
**Files:** `apps/admin/src/app/payouts/page.tsx`, `refunds/page.tsx`
**Acceptance:** Payouts: pending table with release button; audit shown. Refunds: search booking by ID/booking-reference, refund amount + reason form.

### T19: Editorial Collections (list + editor)
**Agent:** Web
**Files:** `apps/admin/src/app/collections/page.tsx`, `collections/[id]/page.tsx`, drag-reorder component
**Acceptance:** Create collection with slug/title/vertical; editor lets admin pick content (search autocomplete) + drag to reorder + publish toggle.

### T20: Search Analytics + Audit Log
**Agent:** Web
**Files:** `apps/admin/src/app/analytics/search/page.tsx`, `audit/page.tsx`
**Acceptance:** Analytics: top queries bar chart + zero-results list + CTR table. Audit log: filterable by actor, action type, date range, target type.

### T21: Admin Users management
**Agent:** Web
**Files:** `apps/admin/src/app/admins/page.tsx`
**Acceptance:** `super_admin` only (route 403 otherwise); list, create with email+name+role (temp password displayed one-time in modal), deactivate, role change, reset-password (temp password displayed one-time).

---

## Phase 4 — Deploy & cutover

### T22: Fly.io deployment
**Files:** `apps/admin/fly.toml`, `apps/admin/Dockerfile`
**Acceptance:** `creatorhub-admin` app live on Fly, Mumbai region; `admin.creatorhub.in` DNS configured; HTTPS + HSTS; login + change-password + core flows work end-to-end in prod.

### T23: Remove `x-admin-secret` dual-auth
**Files:** `apps/api/src/handlers/admin.ts` (remove secret check), env cleanup
**When:** After 2 weeks of admin app in prod with no regressions
**Acceptance:** `ADMIN_SECRET` env var removed; dual-auth code paths deleted; tests updated.

### T24: Docs + handover
**Files:**
- `docs/engineering/admin-runbook.md` (new)
- `docs/engineering/HLD.md` (update with admin app)
- `docs/engineering/openapi.yaml` (add all new endpoints)
**Acceptance:** Runbook covers onboarding a new admin (super_admin provisions → shares temp password out-of-band → admin changes on first login), deactivating one, resetting a password, unlocking a locked account, incident response for compromised admin account, Google SSO migration path (future E4.2).
