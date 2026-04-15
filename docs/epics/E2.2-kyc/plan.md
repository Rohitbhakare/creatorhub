# E2.2 — KYC Flow (Creator Verification)

> **SRS refs:** KYC-FR-001–034, DD-049–056
> **Wireframe refs:** Phase B KYC wireframes
> **Depends on:** E0.3 (auth), E0.4 (design system), E1.1 (publishing wizard — KYC trigger at Paid toggle)
> **Critical path:** Blocks all paid content publishing (E2.3 Payments)

---

## Market Research — KYC UX Patterns

### Razorpay / Cashfree (Indian fintech KYC)
- **PAN validation:** Real-time regex + NSDL verification API (MVP: regex only, per SRS).
- **Aadhaar:** Digilocker integration (V1 for us). Manual upload with masked display.
- **Bank:** IFSC autofill via RBI API — instant trust signal. Account number double-entry.
- **UX pattern:** Linear wizard, step-by-step, each step independently saveable.

### PhonePe / Paytm
- **Selfie:** Oval face guide with real-time feedback. Clear coaching text.
- **Status states:** Submitted → Under Review → Approved/Rejected with specific fix instructions.
- **"Why we ask" patterns:** Privacy explainers build trust, especially for Aadhaar.

### CreatorHub Approach (per DD-049–056)
- **Trigger:** Inline interrupt when creator toggles "Paid" in pricing step. No "skip" option.
- **5 linear steps:** Intro → PAN → Aadhaar → Bank → Selfie → Review & Submit.
- **IFSC magic moment:** Auto-populate bank + branch + city on valid IFSC entry.
- **Selfie coaching:** Real-time oval guide with 4 positioning states.
- **Post-submission:** 4 states (submitted → pending → approved → needs_more_info).
- **Single KYC unlocks everything:** Explicit messaging throughout.

---

## Task Breakdown

| ID | Task | Platform | Est. Tests |
|----|------|----------|-----------|
| T1 | KYC Zod schemas (PAN regex, Aadhaar masked, bank fields) | Shared | — |
| T2 | KYC submissions service (create, update step, submit, review) | API | ~15 |
| T3 | KYC document upload service (Firebase Storage, signed URLs, encryption) | API | ~8 |
| T4 | IFSC lookup proxy service (RBI API) | API | ~5 |
| T5 | KYC handlers + routes | API | ~12 |
| T6 | KYC trigger modal (inline interrupt at Paid toggle in wizard) | Mobile | — |
| T7 | KYC intro screen (time estimate, document list, privacy reassurance) | Mobile | — |
| T8 | Step 1: PAN screen (regex validation, photo upload, "Why we ask") | Mobile | — |
| T9 | Step 2: Aadhaar screen (masked input, front/back upload, Digilocker placeholder) | Mobile | — |
| T10 | Step 3: Bank screen (IFSC autofill magic, double-entry account, account type) | Mobile | — |
| T11 | Step 4: Selfie screen (camera + oval guide + 4 positioning states) | Mobile | — |
| T12 | Step 5: Review & Submit (summary cards, edit links, declaration checkbox) | Mobile | — |
| T13 | Post-submission status screens (submitted, pending, approved, needs_more_info) | Mobile | — |
| T14 | KYC providers (submission state, step navigation, draft persistence) | Mobile | — |
| T15 | Admin review API (approve/reject with reasons — consumed by Retool in E2.8) | API | ~6 |
| T16 | API tests | API | ~46 total |

**Estimated total: ~46 API tests**

---

## Key UX Decisions

1. **"Why we ask" explainers:** Every sensitive field has expandable card with 3 statements (legal requirement, non-sharing guarantee, encryption disclosure). Coral left border + sunken background.
2. **Validation states:** 4 per field — Empty (default), Valid (green border + checkmark), Invalid (red border + error), Loading (spinner for IFSC).
3. **Aadhaar masking:** Only last 4 digits visible after entry. Full number never re-displayed.
4. **Selfie oval states:** Dashed coral (positioning) → Solid green (captured). Status pill: "Move closer" / "Move back" / "Center your face" / "Hold still — Captured!"
5. **Resume capability:** Each step auto-saves as draft. Creator can leave and return at same step.

## Definition of Done

- [ ] KYC trigger interrupt in publishing wizard at Paid toggle
- [ ] 5-step KYC wizard (PAN → Aadhaar → Bank → Selfie → Review)
- [ ] IFSC autofill working via RBI API
- [ ] Selfie capture with oval guide + positioning feedback
- [ ] Post-submission states (submitted/pending/approved/needs_more_info)
- [ ] Admin review API (approve/reject with field-level reasons)
- [ ] Document upload with encryption
- [ ] ~46 API tests passing
- [ ] `flutter analyze` 0 issues, `tsc --noEmit` 0 errors
