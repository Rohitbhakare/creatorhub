# E2.11 — DPDPA & Legal Compliance

> **SRS refs:** DPDPA-LGL-001–005, LGL-DPDPA-001–010, IAM-FR-003, NFR-PRIV-001–006
> **Depends on:** E0.3 (auth — account management), E2.10 (web — legal pages)
> **Legal dependency:** Privacy policy + T&C docs from counsel (must be ready by this epic)

---

## Market Research — DPDPA Compliance (India 2023+2025)

### Key DPDPA Requirements
1. **Consent:** Explicit, purpose-bound consent at first use of each processing purpose.
2. **Right to access:** User can export their data as JSON.
3. **Right to erasure:** User can delete their account. 30-day soft-delete, then hard-delete PII. Bookings/reviews anonymized (legal retention).
4. **Breach notification:** To Data Protection Board within 72h.
5. **Children:** Under 18 — parental consent required. MVP: self-declaration age gate.

### Competitors
- **Instagram:** Settings → Account → Download data (JSON + HTML). Account deletion 30-day grace period.
- **Airbnb:** Data download request → processed in 24h → email link. Account deletion cancels active bookings first.

### CreatorHub Approach
- **Consent gate:** Registration screen includes purpose-bound consent. Stored in `user_consents` table.
- **Data export:** "Download my data" in settings → API generates JSON export → signed URL download. Contains: profile, content, bookings, reviews, preferences. No PII of other users.
- **Account deletion:** "Delete my account" in settings → confirmation screen listing what happens (content removed, bookings anonymized, 30-day grace period) → confirm → soft-delete. Blocked if active bookings exist.
- **Search history clearing:** Clear search history from settings (DPDPA-LGL-004).
- **Social account data minimization:** Only store necessary social data, clear stale tokens (DPDPA-LGL-005).

---

## Task Breakdown

| ID | Task | Platform | Est. Tests |
|----|------|----------|-----------|
| T1 | Consent service (record consent per purpose, check consent, withdraw) | API | ~8 |
| T2 | Data export service (generate JSON with all user data, signed URL) | API | ~6 |
| T3 | Account deletion service (soft-delete, 30-day grace, hard-delete PII, anonymize bookings) | API | ~10 |
| T4 | Search history service (clear history, 90-day retention) | API | ~4 |
| T5 | Consent + deletion + export handlers + routes | API | ~8 |
| T6 | Consent gate UI (registration flow — purpose-bound checkboxes) | Mobile | — |
| T7 | Data export screen (settings → "Download my data" → progress → download) | Mobile | — |
| T8 | Account deletion screen (settings → "Delete account" → consequences list → confirm) | Mobile | — |
| T9 | Clear search history UI (settings toggle) | Mobile | — |
| T10 | Privacy policy + T&C content (receive from counsel, render in-app + web) | All | — |
| T11 | API tests | API | ~36 total |

**Estimated total: ~36 API tests**

---

## Key UX Decisions

1. **Consent gate:** Checkboxes at registration. NOT pre-checked (DPDPA requires explicit opt-in). Categories: "Use my location for personalized feed", "Send promotional notifications", etc.
2. **Data export:** JSON format. Ready in < 60s for most users. Large accounts → background job with notification when ready.
3. **Account deletion consequences screen:** Bullet list: "Your profile will be hidden immediately", "Your content will be removed", "Active bookings must be completed or cancelled first", "You have 30 days to change your mind", "After 30 days, your data is permanently deleted."
4. **Deletion blocked:** If active bookings exist, show "Complete or cancel your active bookings first" with list of blocking bookings.

## Definition of Done

- [ ] Consent gate at registration with purpose-bound consent
- [ ] Data export (JSON) downloadable from settings
- [ ] Account deletion with 30-day soft-delete grace period
- [ ] Hard-delete PII after 30 days (cron job)
- [ ] Bookings/reviews anonymized on deletion
- [ ] Deletion blocked if active bookings exist
- [ ] Search history clearing
- [ ] Privacy policy + T&C rendered in-app and on web
- [ ] ~36 API tests passing
