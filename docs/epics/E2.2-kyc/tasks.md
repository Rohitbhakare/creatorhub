# E2.2 — KYC Flow — Tasks

> Epic status: **DONE**
> Plan: `docs/epics/E2.2-kyc/plan.md`

---

## Task Breakdown

| ID | Task | Platform | Description |
|----|------|----------|-------------|
| T1 | `kyc.service.ts` | API | `getStatus`, `submit`, `resubmit`, `approve`, `reject` — PAN/IFSC/Aadhaar format validation, bank account verification stub |
| T2 | KYC handlers + routes | API | `/api/v1/kyc` — submit, resubmit, status; `/api/v1/admin/kyc` — list pending, get submission, approve/reject |
| T3 | KYC service tests | API | `kyc.service.test.ts` — 26 tests covering all states and validation edge cases |
| T4 | `kyc_provider.dart` | Mobile | Riverpod 3.x Notifier — KYC status polling, submission state machine |
| T5 | `KycStatusScreen` | Mobile | Four states: none (CTA), pending (timeline), verified (badge), rejected (reason + retry) |
| T6 | `KycWizardScreen` | Mobile | 5-step wizard: PAN → Aadhaar → Bank Details → Selfie Upload → Review & Submit |
| T7 | Add routes | Mobile | `/kyc`, `/kyc/wizard` wired into `router.dart`; KYC gate in publish flow |

---

## Test Files

| File | Tests |
|------|-------|
| `apps/api/src/services/kyc.service.test.ts` | 26 |

**Total: 26 API tests**
