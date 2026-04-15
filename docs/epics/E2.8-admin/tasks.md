# E2.8 — Admin — Tasks

> Epic status: **DONE**
> Plan: `docs/epics/E2.8-admin/plan.md`

---

## Task Breakdown

| ID | Task | Platform | Description |
|----|------|----------|-------------|
| T1 | `admin.service.ts` | API | `searchUsers`, `getUserDetail`, `suspendUser`, `unsuspendUser`, `takedownContent`, `getContentForModeration`, `listPendingKyc`, `getKycSubmission`, `processRefund` (Razorpay), `getAuditLog` — all mutating actions write to `audit_log` table |
| T2 | Admin handlers + routes | API | `/api/v1/admin` — all endpoints gated behind `x-admin-secret` header middleware (not user JWT) |
| T3 | Admin service tests | API | `admin.service.test.ts` — 12 tests covering user management, content takedown, KYC processing, audit log writes |

---

## Test Files

| File | Tests |
|------|-------|
| `apps/api/src/services/admin.service.test.ts` | 12 |

**Total: 12 API tests**
