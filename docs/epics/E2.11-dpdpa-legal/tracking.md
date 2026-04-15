# E2.11 — DPDPA & Legal — Tracking

> Status: **DONE**
> Detail per task lives here. Master dashboard: `docs/epics/TRACKING.md`.

---

## Status

| Field | Value |
|-------|-------|
| Epic | E2.11 DPDPA & Legal |
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
| T1 | `dpdpa.service.ts` (requestDeletion 30-day grace, cancelDeletion, getDeletionStatus, exportUserData JSON, recordConsent, getConsentStatus) | API | `DONE` | `[x]` | `dpdpa.service.test.ts` |
| T2 | DPDPA handlers + routes (`/api/v1/dpdpa`) | API | `DONE` | — | |
| T3 | DPDPA service tests (deletion lifecycle, grace period, data export, consent versioning) | API | `DONE` | `[x]` | |
| T4 | `dpdpa_provider.dart` (`deletionStatusProvider`, `consentStatusProvider`, `DpdpaActionsNotifier`) | Mobile | `DONE` | — | Riverpod 3.x |
| T5 | `PrivacySettingsScreen` (data export, deletion request + 30-day countdown, consent history, legal links) | Mobile | `DONE` | — | |
| T6 | `LegalScreen` (Terms / Privacy / Community Guidelines — parameterised by type) | Mobile | `DONE` | — | |
| T7 | Add `/privacy-settings` and `/legal/:type` routes to `router.dart` | Mobile | `DONE` | — | |
| T8 | Add "Privacy & Data" row to `_SettingsCard` in `you_tab_screen.dart` | Mobile | `DONE` | — | |

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
| `apps/api/src/services/dpdpa.service.test.ts` | — | `[x]` All passing |

---

## Notes

- DPDPA compliance: India's Digital Personal Data Protection Act 2023.
- Data deletion uses a 30-day grace period. Actual data purge is handled by a scheduled job that checks `deletion_scheduled_at < now()`.
- `exportUserData` returns a single JSON object containing all tables where `user_id = userId`. Excludes audit logs (internal).
- Consent is versioned — each T&C/Privacy Policy update requires a new consent record. `getConsentStatus` returns whether user has consented to the current version.
