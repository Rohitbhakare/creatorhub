# E2.9 — Notifications Full — Tasks

> Epic status: **DONE**
> Plan: `docs/epics/E2.9-notifications-full/plan.md`

---

## Task Breakdown

| ID | Task | Platform | Description |
|----|------|----------|-------------|
| T1 | `whatsapp.service.ts` | API | Meta Cloud API v18 integration — `sendWhatsApp` (fire-and-forget), `sendBookingConfirmation` (WhatsApp template message with booking details) |
| T2 | `email.service.ts` | API | SendGrid integration (fire-and-forget) — `sendEmail` (generic), `sendBookingConfirmationEmail`, `sendKycApprovalEmail`, `sendKycRejectionEmail` — XSS-safe HTML escaping on all user-supplied strings |
| T3 | WhatsApp service tests | API | `whatsapp.service.test.ts` — 5 tests covering send success, API error handling, template formatting |
| T4 | Email service tests | API | `email.service.test.ts` — 5 tests covering send success, XSS escape, template rendering |
| T5 | Add `WHATSAPP_TOKEN` + `SENDGRID_API_KEY` to `env.ts` | API | Validated on boot; missing keys log a warning (not fatal — fire-and-forget services) |

---

## Test Files

| File | Tests |
|------|-------|
| `apps/api/src/services/whatsapp.service.test.ts` | 5 |
| `apps/api/src/services/email.service.test.ts` | 5 |

**Total: 10 API tests**
