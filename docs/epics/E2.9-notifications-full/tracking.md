# E2.9 — Notifications Full — Tracking

> Status: **DONE**
> Detail per task lives here. Master dashboard: `docs/epics/TRACKING.md`.

---

## Status

| Field | Value |
|-------|-------|
| Epic | E2.9 Notifications Full |
| Milestone | M2 |
| Status | `DONE` |
| Plan approved | `[x]` Yes |
| Implementation started | `[x]` Yes |
| Implementation complete | `[x]` Yes |
| Committed | `[x]` Yes — commit `dev` branch |

---

## Task Status

| ID | Task | Agent | Status | Tests | Notes |
|----|------|-------|--------|-------|-------|
| T1 | `whatsapp.service.ts` (Meta Cloud API v18, fire-and-forget, sendWhatsApp, sendBookingConfirmation) | API | `DONE` | `[x]` 5/5 | `whatsapp.service.test.ts` |
| T2 | `email.service.ts` (SendGrid, fire-and-forget, sendEmail, sendBookingConfirmationEmail, sendKycApprovalEmail, sendKycRejectionEmail — XSS-safe escaping) | API | `DONE` | `[x]` 5/5 | `email.service.test.ts` |
| T3 | WhatsApp service tests (5 tests — send success, API error, template formatting) | API | `DONE` | `[x]` 5/5 | |
| T4 | Email service tests (5 tests — send success, XSS escape, template rendering) | API | `DONE` | `[x]` 5/5 | |
| T5 | Add `WHATSAPP_TOKEN` + `SENDGRID_API_KEY` to `env.ts` (warn on missing, not fatal) | API | `DONE` | — | |

---

## Pre-Commit Checklist

- `[x]` All tests passing
- `[x]` `tsc --noEmit` — 0 errors
- `[x]` `flutter analyze` — 0 errors
- `[x]` API boots — `/healthz` 200
- `[x]` Flutter launches — no crash
- `[x]` Tracking updated

---

## Test Coverage

| File | Tests | Passing |
|------|-------|---------|
| `apps/api/src/services/whatsapp.service.test.ts` | 5 | `[x]` 5/5 |
| `apps/api/src/services/email.service.test.ts` | 5 | `[x]` 5/5 |

**Total: 10 API tests — all passing**

---

## Notes

- Both WhatsApp and email services are fire-and-forget. Errors are logged via Sentry but never block the main request.
- WhatsApp uses Meta Cloud API v18 with pre-approved HSM templates. Template IDs are stored in env.
- Email HTML is sanitized with `he.escape()` on all user-supplied strings before template insertion to prevent XSS in email clients.
