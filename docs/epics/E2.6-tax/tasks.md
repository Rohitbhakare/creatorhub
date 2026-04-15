# E2.6 — Tax Compliance — Tasks

> Epic status: **DONE**
> Plan: `docs/epics/E2.6-tax/plan.md`

---

## Task Breakdown

| ID | Task | Platform | Description |
|----|------|----------|-------------|
| T1 | `tax.service.ts` | API | `calculateTaxBreakdown` (GST = 18% of platform fee, TDS = 1% of base price), `generateBuyerInvoice` (PDF-ready JSON), `getTdsInfo` (creator view), `getAnnualTdsSummary` (India FY Apr–Mar grouping) |
| T2 | Tax handlers + routes | API | `/api/v1/tax` — breakdown (per booking), buyer invoice, TDS info, annual TDS summary |
| T3 | Tax service tests | API | `tax.service.test.ts` — 20 tests covering GST/TDS calculations, FY boundary edge cases, invoice generation |
| T4 | Add `CREATORHUB_GSTIN` to `env.ts` | API | Required for buyer invoice generation; validated on boot |

---

## Test Files

| File | Tests |
|------|-------|
| `apps/api/src/services/tax.service.test.ts` | 20 |

**Total: 20 API tests**
