# E1.9 — Notifications — Tracking

> Status: **DONE**
> Detail per task lives here. Master dashboard: `docs/epics/TRACKING.md`.

---

## Status

| Field | Value |
|-------|-------|
| Epic | E1.9 Notifications |
| Milestone | M1 |
| Status | `DONE` |
| Plan approved | `[x]` Yes |
| Implementation started | `[x]` Yes |
| Implementation complete | `[x]` Yes |
| Committed | `[x]` Yes — commit `dev` branch |

---

## Task Status

| ID | Task | Agent | Status | Tests | Notes |
|----|------|-------|--------|-------|-------|
| T1 | `notification.service.ts` (createNotification, listNotifications cursor, markRead, markAllRead, deleteNotification, getUnreadCount) | API | `DONE` | `[x]` 16/16 | `notification.service.test.ts` |
| T2 | `device.service.ts` (registerDevice, unregisterDevice, listUserDevices — FCM token management) | API | `DONE` | `[x]` 8/8 | `device.service.test.ts` |
| T3 | `push.service.ts` (sendPush, sendPushToUser, sendPushToMultiple — Firebase Admin SDK) | API | `DONE` | `[x]` 8/8 | `push.service.test.ts` |
| T4 | Notification handlers + routes (`/api/v1/notifications`, `/api/v1/devices`) | API | `DONE` | — | Covered by service tests |
| T5 | `NotificationPreferencesScreen` (per-category toggles, quiet hours) | Mobile | `DONE` | — | |
| T6 | `FcmService` (Flutter — FCM token registration, foreground/background message handling) | Mobile | `DONE` | — | Firebase Messaging SDK |
| T7 | `notification_provider.dart` (unread count badge, notification list, mark read on tap) | Mobile | `DONE` | — | Riverpod 3.x Notifier |

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
| `apps/api/src/services/notification.service.test.ts` | 16 | `[x]` 16/16 |
| `apps/api/src/services/device.service.test.ts` | 8 | `[x]` 8/8 |
| `apps/api/src/services/push.service.test.ts` | 8 | `[x]` 8/8 |

**Total: 32 API tests — all passing**
