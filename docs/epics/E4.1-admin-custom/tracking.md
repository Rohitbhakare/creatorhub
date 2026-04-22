# E4.1 — Tracking

**Status:** IN PROGRESS — Auth foundation (T1–T4) complete; backend endpoints (T5–T10) next
**Progress:** 4/24 tasks done
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
| T5 | Migrate existing admin endpoints off `x-admin-secret` | 1 | [ ] Not Started | Depends on T4 |
| T6 | Admin user CRUD + password reset (super_admin only) | 1 | [ ] Not Started | Depends on T4 |
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
