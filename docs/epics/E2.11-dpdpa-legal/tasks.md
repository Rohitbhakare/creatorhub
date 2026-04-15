# E2.11 — DPDPA & Legal — Tasks

> Epic status: **DONE**
> Plan: `docs/epics/E2.11-dpdpa-legal/plan.md`

---

## Task Breakdown

| ID | Task | Platform | Description |
|----|------|----------|-------------|
| T1 | `dpdpa.service.ts` | API | `requestDeletion` (30-day grace period, sets `deletion_scheduled_at`), `cancelDeletion`, `getDeletionStatus`, `exportUserData` (JSON export of all user data), `recordConsent` (versioned consent log), `getConsentStatus` |
| T2 | DPDPA handlers + routes | API | `/api/v1/dpdpa` — deletion request/cancel/status, data export, consent record/status |
| T3 | DPDPA service tests | API | `dpdpa.service.test.ts` — covering deletion lifecycle, grace period, data export completeness, consent versioning |
| T4 | `dpdpa_provider.dart` | Mobile | Riverpod 3.x Notifier — `deletionStatusProvider`, `consentStatusProvider`, `DpdpaActionsNotifier` (request/cancel deletion, export data) |
| T5 | `PrivacySettingsScreen` | Mobile | Data export CTA, deletion request with 30-day countdown, consent history list, links to legal pages |
| T6 | `LegalScreen` | Mobile | Parameterised screen displaying Terms / Privacy Policy / Community Guidelines (fetched or static) |
| T7 | Add routes | Mobile | `/privacy-settings` and `/legal/:type` wired into `router.dart` |
| T8 | Settings card update | Mobile | Add "Privacy & Data" row to `_SettingsCard` in `you_tab_screen.dart` linking to `/privacy-settings` |

---

## Test Files

| File | Tests |
|------|-------|
| `apps/api/src/services/dpdpa.service.test.ts` | — (see tracking.md) |

**Total: see tracking.md**
