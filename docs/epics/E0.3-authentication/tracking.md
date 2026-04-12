# E0.3 — Tracking

**Status:** DONE
**Progress:** 10/10 tasks (100%)
**Branch:** `dev`
**Last Updated:** 2026-04-12

---

## Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1 | Firebase Admin SDK Setup | `[x]` Done | Verified in E0.1 — firebase-admin configured in `apps/api/src/lib/firebase.ts` |
| T2 | Auth Middleware | `[x]` Done | `authenticate`, `optionalAuthenticate`, `requireCreator`, `requireKYC` |
| T3 | Auth Routes & Handlers | `[x]` Done | POST `/auth/register`, `/auth/refresh`, `/auth/sign-out` |
| T4 | Auth Service & Token Management | `[x]` Done | jose JWTs (access 1h + refresh 90d), SHA-256 hashed refresh tokens, mutex refresh |
| T5 | Flutter Auth — Phone OTP Screen | `[x]` Done | Two-step flow, Pinput 6-digit, resend timer (30s, max 3), max 5 verify attempts |
| T6 | Flutter Auth — Social Login | `[x]` Done | Google (google_sign_in 7.2.0) + Apple (iOS), OAuth permissions card (IAM-FR-012) |
| T7 | Flutter Auth State & Token Storage | `[x]` Done | Riverpod 3.x `Notifier<AuthState>`, flutter_secure_storage, Dio interceptors |
| T8 | Soft Auth Wall Component | `[x]` Done | Bottom sheet for guest users on protected actions |
| T9 | Rate Limiting Middleware | `[x]` Done | In-memory sliding window: 10 req/min auth, 5 req/hr OTP, 100 req/min general |
| T10 | Audit Event Logging | `[x]` Done | Fire-and-forget, never throws, no PII/tokens logged |

---

## Review Gate

| Review | Status | Findings |
|--------|--------|----------|
| Edge Cases | `[ ]` Not Run | |
| Security | `[ ]` Not Run | |
| Architecture | `[ ]` Not Run | |
| Code Quality | `[ ]` Not Run | |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-12 | Epic created, 10 tasks defined |
| 2026-04-12 | All 10 tasks completed. API typecheck passes. Flutter analyze clean (0 issues). |
