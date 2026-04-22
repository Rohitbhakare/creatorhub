# E4.1 — Tracking

**Status:** IN PROGRESS — Auth + RBAC + admin CRUD (T1–T6) complete; new Phase-2 endpoints (T7–T10) next
**Progress:** 6/24 tasks done
**Branch:** `dev` (single-branch flow per CLAUDE.md)
**Last Updated:** 2026-04-22

---

## Tasks

| ID | Task | Phase | Status | Notes |
|----|------|-------|--------|-------|
| T1 | Pack J admin wireframes (10 screens) | 0 | [x] Done | Approved by founder 2026-04-22. Grouped sidebar nav added (Overview / Trust & Safety / Money / Growth / System). |
| T2 | Admin schema migration (017 + 018 seed) | 1 | [x] Done | Migrations 014–016 were already taken; used 017/018. 017 also fills the pre-existing `admin_audit_log` gap. |
| T3 | Firebase email+password verification service | 1 | [x] Done | Identity Toolkit REST wrapper + `admin-auth.service.ts` (login/change-password/provision). Generic 401 collapse for enumeration resistance. |
| T4 | Admin session middleware + auth handlers (login/logout/me/change-password) | 1 | [x] Done | `requireAdminRole` middleware w/ live is_active check; `ch_admin_session` cookie (HS256, 4h, SameSite=Strict, separate secret from JWT_SECRET). 12 integration tests pass. |
| T5 | Migrate existing admin endpoints off `x-admin-secret` | 1 | [x] Done | `dualAdminAuth(roles[])` factory accepts legacy secret OR session cookie. All 10 `admin.routes.ts` endpoints now role-scoped per plan §7. 6 new middleware tests + full suite green (869). Trust/KYC/reviews admin endpoints deferred to T23. |
| T6 | Admin user CRUD + password reset (super_admin only) | 1 | [x] Done | `admins.service.ts` + `admins.ts` handler + `/api/v1/admin/admins` router. Create/list/patch/reset-password; self-reset blocked (use /change-password); last-super-admin trigger → 409; rollback disables Firebase on DB failure. 10 integration tests. |
| T7 | Feature/unfeature toggles (ADM-FR-011) | 2 | [ ] Not Started | |
| T8 | Force-release payout endpoint | 2 | [ ] Not Started | |
| T9 | Editorial collections CRUD (ADM-FR-009) | 2 | [ ] Not Started | |
| T10 | Search analytics endpoints (ADM-FR-010) | 2 | [ ] Not Started | May need search-logging hook first |
| T11 | `apps/admin` Next.js scaffold | 3 | [ ] Not Started | |
| T12 | Auth flow (login + change-password + middleware) | 3 | [ ] Not Started | Depends on T4, T11 |
| T13 | Shared layout + role-scoped nav | 3 | [ ] Not Started | Depends on T12 |
| T14 | Dashboard | 3 | [ ] Not Started | |
| T15 | User Search + Detail | 3 | [ ] Not Started | |
| T16 | KYC Queue + Detail | 3 | [ ] Not Started | |
| T17 | Moderation Queue + Detail | 3 | [ ] Not Started | |
| T18 | Payout Run + Manual Refund | 3 | [ ] Not Started | |
| T19 | Editorial Collections (list + editor) | 3 | [ ] Not Started | Depends on T9 |
| T20 | Search Analytics + Audit Log | 3 | [ ] Not Started | Depends on T10 |
| T21 | Admin Users management screen | 3 | [ ] Not Started | Depends on T6 |
| T22 | Fly.io deployment + DNS | 4 | [ ] Not Started | |
| T23 | Remove `x-admin-secret` dual-auth | 4 | [ ] Not Started | +2 weeks after T22 |
| T24 | Docs + runbook | 4 | [ ] Not Started | |

Status markers: `[ ]` Not Started · `[~]` In Progress · `[x]` Done · `[!]` Blocked · `[-]` Deferred

---

## Review Gate

| Review | Status | Findings |
|--------|--------|----------|
| Plan approval (founder) | [ ] Not Run | Awaiting decisions on §13 Open Questions |
| Wireframe approval (founder) | [ ] Not Run | After T1 |
| Edge Cases | [ ] Not Run | |
| Security | [ ] Not Run | Extra scrutiny — admin is high-value target |
| Architecture | [ ] Not Run | |
| Code Quality | [ ] Not Run | |

---

## Pre-commit Checklist (per `.claude/instructions/precommit.md`)

- [ ] Tests written + passing (API: ~40 new tests; Admin app: ~15 smoke tests)
- [ ] Lint clean (`pnpm lint` in api + admin)
- [ ] Type check passes (`tsc --noEmit` both)
- [ ] 4-step review gate passed
- [ ] API boots (`/healthz` → 200)
- [ ] Admin app boots (`pnpm --filter admin dev` → `admin.creatorhub.in` loads)
- [ ] Tracking file updated

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-22 | Epic created. Plan drafted by Opus 4.7 per founder decision to pull V2 admin forward. Awaiting approval. |
| 2026-04-22 | Founder resolved open questions: (1) seed `rohitbhakare@gmail.com` as super_admin; auth switched from Google SSO to Firebase email+password (Google SSO deferred to E4.2) — avoids OAuth client setup cost. (2) Pure JWT, 4h TTL, no refresh. (3) Audit log kept forever. Plan updated accordingly. |
| 2026-04-22 | T1 Pack J wireframes drafted (10 screens, ~1120 lines). Wired into `CreatorHub Redesign.html` canvas (J section added). Ready for founder visual review. |
| 2026-04-22 | T1 wireframes approved; founder greenlit implementation with strong logging + exception handling. |
| 2026-04-22 | T2 migrations 017 + 018 written. 017 creates `admin_users`, `admin_audit_log`, `admin_role` enum, RLS, `guard_last_super_admin` trigger. 018 seeds `rohitbhakare@gmail.com` as super_admin. |
| 2026-04-22 | T3 Firebase Identity Toolkit REST wrapper + `admin-auth.service.ts`. All auth failures collapse to generic 401 for enumeration resistance; lockout at 20 failed logins / 24h; inactive check deferred until password proven. |
| 2026-04-22 | T4 `requireAdminRole` middleware + admin-auth handlers (login/logout/me/change-password) + routes wired under `/api/v1/admin/auth`. `ADMIN_SESSION_SECRET` isolated from `JWT_SECRET`. 12 integration tests passing. Full API suite still green (863 tests). |
| 2026-04-22 | T5 `dualAdminAuth(roles[])` middleware migrates 10 legacy admin endpoints to role-scoped session auth while keeping `x-admin-secret` as fallback for the Retool rollout window. Per-route roles per plan §7 (moderation → content_moderator+super_admin, KYC → support+super_admin, refunds → finance+super_admin, audit → any admin w/ non-super_admin scoping). Handlers prefer `c.get('adminId')` over body `admin_id`; `routeParam` helper eliminates 7 pre-existing `!` non-null assertions. Trust/KYC/reviews admin endpoints still on secret-only — migration folded into T23 cutover. +6 middleware tests, 869/869 pass. |
| 2026-04-22 | T6 `admins.service.ts` + `/api/v1/admin/admins` routes (create, list, patch, reset-password) — all super_admin-gated (no secret bypass). Temp password generated via `generateTempPassword()` and returned ONCE in the response for super_admin out-of-band delivery. Create flow: uniqueness check → Firebase provision (reuse or create) → row insert → rollback Firebase `disabled=true` on DB failure. Update translates `guard_last_super_admin` trigger rejection into 409. Reset-password blocks self-reset (handlers force admins through `/auth/change-password` instead). 10 integration tests. |
