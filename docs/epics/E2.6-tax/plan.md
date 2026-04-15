# E2.6 — Tax Compliance (GST + TDS + Invoices)

> **SRS refs:** TAX-FR-001–006
> **Depends on:** E2.2 (KYC — PAN required for TDS), E2.3 (payments — tax calculated at checkout)
> **Note:** Tax calculation logic already partially built in E1.1 pricing calculator. This epic wires it into real bookings.

---

## Market Research — Tax Compliance (India E-Commerce)

### Indian Tax Rules for Marketplaces
- **GST 18%:** On services (experiences are services). Collected from buyer. Platform files GST returns.
- **TDS 1% (Sec 194-O):** E-commerce operators must deduct 1% TDS on gross amount payable to sellers/creators. Rate jumps to 5% if creator has no PAN (Sec 206AA).
- **Invoice:** GST-compliant invoice required for every transaction. Must include: GSTIN, HSN/SAC code, tax breakdown.

### CreatorHub Approach
- **GST:** 18% on base price. Shown in price breakdown at checkout.
- **TDS:** 1% on creator payout (base - platform fee). Deducted before payout.
- **Invoice:** PDF generated server-side. Downloadable from booking detail. Emailed on payment success.
- **Payout calculation:** `creator_payout = base_price - platform_fee (17%) - tds (1% of base) - gst_on_platform_fee`

---

## Task Breakdown

| ID | Task | Platform | Est. Tests |
|----|------|----------|-----------|
| T1 | Tax calculation service (GST, TDS, platform fee, creator payout) | API | ~10 |
| T2 | Invoice generation service (PDF via PDFKit or similar) | API | ~6 |
| T3 | Invoice model + storage (signed URL download) | API | ~4 |
| T4 | Wire tax into booking flow (price breakdown at checkout) | API | — |
| T5 | Wire tax into payout calculation | API | ~5 |
| T6 | Invoice download on booking detail screen | Mobile | — |
| T7 | Tax breakdown display in price summary component | Mobile | — |
| T8 | API tests | API | ~25 total |

**Estimated total: ~25 API tests**

## Definition of Done

- [ ] GST 18% calculated and displayed at checkout
- [ ] TDS 1% (or 5% without PAN) deducted from creator payout
- [ ] PDF invoice generated for every paid booking
- [ ] Invoice downloadable from booking detail
- [ ] ~25 API tests passing
