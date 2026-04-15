# E1.9 — Notifications (FCM Push + Preferences)

> **SRS refs:** NTF-FR-001, NOT-FR-001–005, DD-034
> **Wireframe refs:** Screen 12a (notification preferences — part of You tab settings)
> **Depends on:** E0.3 (auth, Firebase), E1.6 (profiles — You tab settings), E1.7 (social events trigger notifications)
> **Scope:** M1 = FCM push only + preferences screen. Email (NTF-FR-002) and WhatsApp (E2.9) are M2.

---

## Market Research — Notification Preferences UX

### Instagram
- **Simple toggle list:** "Posts, Stories and Comments", "Following and Followers", "Messages", "Live and Reels". Each category has sub-options (Off/From People I Follow/From Everyone).
- **Not a matrix** — single column, one toggle per category.

### YouTube
- **Channel-level controls:** Email/Push per notification type. Matrix-style but cleaner than a raw grid.
- **Mobile settings:** Toggle each category on/off. Push vs email toggles nested inside.

### WhatsApp
- **DND mode:** "Do Not Disturb" at OS level integration. Custom notification sounds per contact.

### Airbnb
- **3-column matrix:** Email / Push / SMS per category (Booking updates, Messages, Reminders, Promotions). Closest to our SRS design.
- **Some locked:** "Booking confirmations" email is always on — similar to our "bookings × whatsapp locked" requirement.

### Best Practices for CreatorHub
1. **6×3 matrix per SRS** — NOT-FR-001 specifies 6 categories × 3 channels. Airbnb-style grid. Each cell is independently toggleable.
2. **Locked cell** — bookings × WhatsApp is locked ON with lock icon + toast explanation. Clear visual distinction.
3. **DND master switch** — Prominent at top. When ON, suppresses push + WhatsApp for non-transactional. Email continues. Clear "On/Off" label.
4. **Default preferences** — Inserted at user creation time. Promotions = all OFF. Transactional = all ON.
5. **Quiet hours placeholder** — Show disabled row with "Coming soon" badge per NOT-FR-004 (V1).
6. **For M1** — Only Push column is functional. WhatsApp and Email columns render but are effectively no-ops until E2.9. Show them so users can pre-set preferences.

---

## Architecture Overview

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/notifications/preferences` | Required | Get all 18 preference rows (6×3) |
| PUT | `/api/v1/notifications/preferences` | Required | Bulk update preferences |
| PUT | `/api/v1/users/me/dnd` | Required | Toggle DND master switch |
| POST | `/api/v1/devices` | Required | Register FCM device token |
| DELETE | `/api/v1/devices/:tokenId` | Required | Unregister device token |

### DB Tables (already exist)

- `user_notification_preferences` (migration 009) — user_id, category, channel, enabled. PK (user_id, category, channel).
- `devices` (migration 002) — id, user_id, fcm_token, platform, device_info, last_active_at
- `users.dnd_enabled` (migration 002) — boolean column for DND state

### Notification Categories (6)

| Key | Label | Default Push | Default WA | Default Email |
|-----|-------|-------------|-----------|--------------|
| `bookings_trips` | Bookings & Trips | ON | **LOCKED ON** | ON |
| `messages_creators` | Messages from Creators | ON | OFF | ON |
| `new_content_followed` | New Content from Followed | ON | OFF | ON |
| `activity_own_content` | Activity on Your Content | ON | OFF | ON |
| `platform_updates` | Platform Updates | ON | OFF | ON |
| `promotions` | Promotions & Offers | **OFF** | **OFF** | **OFF** |

### FCM Integration (M1 Scope)

- **Device token registration:** On app launch + after auth, register FCM token via POST /devices.
- **Push sending:** Server-side via Firebase Admin SDK (`firebase.messaging().send()`). Called from services that trigger notifications (follow, comment, booking — wired in E1.7 and E2.3).
- **M1 notification types:** New follower, new comment on own content, new like milestone (10, 50, 100).
- **Payload format:** `{ type: 'new_follower' | 'new_comment' | ..., title: string, body: string, data: { targetRoute: string } }`.

---

## Task Breakdown

### T1 · Notification preferences service (API)
**Files:** `apps/api/src/services/notification.service.ts`
**SRS:** NOT-FR-001, NOT-FR-002, NOT-FR-005

- `getPreferences(userId)` — SELECT all 18 rows from user_notification_preferences.
- `updatePreferences(userId, updates: { category, channel, enabled }[])` — Bulk UPDATE. Reject if category=bookings_trips AND channel=whatsapp (locked). Respect DND: if DND enabled, still store preference but note DND overrides at send time.
- `insertDefaultPreferences(userId)` — INSERT 18 rows with correct defaults per NOT-FR-005. Called during user registration (if not already done in E0.3).
- `getDndStatus(userId)` — SELECT dnd_enabled from users.
- `setDndStatus(userId, enabled)` — UPDATE users SET dnd_enabled = ?.

**Tests:** ~10 tests

---

### T2 · Device registration service (API)
**Files:** Add to `notification.service.ts` or separate `device.service.ts`

- `registerDevice(userId, fcmToken, platform, deviceInfo?)` — UPSERT INTO devices. If token already exists for user, update last_active_at. If different user has same token, reassign (user switched accounts).
- `unregisterDevice(userId, tokenId)` — DELETE FROM devices WHERE id = ? AND user_id = ?. Owner check.
- `getUserDeviceTokens(userId)` — SELECT fcm_token FROM devices WHERE user_id = ?. Used by push sender.

**Tests:** ~6 tests

---

### T3 · Push notification sender (API)
**Files:** `apps/api/src/services/push.service.ts`
**SRS:** NTF-FR-001

- `sendPush(userId, payload)` — Checks user preferences (is this category enabled for push?), checks DND, gets device tokens, sends via Firebase Admin SDK. Fire-and-forget (no waiting for delivery).
- `sendPushBatch(userIds, payload)` — For batched notifications (e.g., new follower notification to many).
- Notification payload: `{ notification: { title, body }, data: { type, targetRoute, ... } }`.
- DND check: if user.dnd_enabled AND category is not transactional → skip.
- Preference check: if user has push disabled for this category → skip.

**M1 triggers to wire:**
- New follower → notify followee: "X started following you"
- New comment → notify content owner: "X commented on your post"
- Like milestone → notify content owner: "Your post reached 10 likes!"

**Tests:** ~8 tests

---

### T4 · Notification handlers + routes (API)
**Files:** `apps/api/src/handlers/notifications.ts`, `apps/api/src/routes/notifications.routes.ts`

- GET `/api/v1/notifications/preferences` → getPreferences
- PUT `/api/v1/notifications/preferences` → updatePreferences (body: array of { category, channel, enabled })
- PUT `/api/v1/users/me/dnd` → setDndStatus (body: { enabled: boolean })
- POST `/api/v1/devices` → registerDevice (body: { fcm_token, platform, device_info? })
- DELETE `/api/v1/devices/:tokenId` → unregisterDevice

**Tests:** ~8 handler tests

---

### T5 · Notification preferences screen (Mobile)
**Files:** `apps/mobile/lib/features/notifications/screens/notification_preferences_screen.dart`
**SRS:** NOT-FR-001, NOT-FR-002, NOT-FR-003, NOT-FR-004

**Layout:**
1. **AppBar:** "Notification Preferences" title, back arrow
2. **DND switch:** Prominent row at top with icon + "Do Not Disturb" label + toggle. When ON: amber/warning color indicator. Subtitle: "Pauses push and WhatsApp notifications. Booking alerts still come through."
3. **Quiet hours placeholder:** Greyed-out row with clock icon + "Quiet Hours" + "Coming soon" badge. Non-interactive.
4. **6×3 matrix:** Section header per category (left-aligned label). Three toggle switches per row (Push / WhatsApp / Email). Column headers: icon + label at top.
5. **Locked cell:** bookings_trips × WhatsApp shows lock icon instead of toggle. Tap → toast: "This cannot be turned off for your safety."
6. **Promotions row:** All three toggles OFF by default. Different styling to signal "optional."

**Edge cases:**
- DND ON → visually dim non-transactional rows (show they won't fire)
- Toggle fails → revert toggle state + show error snackbar
- Screen loads → skeleton shimmer while preferences load

---

### T6 · Notification providers + FCM setup (Mobile)
**Files:** `apps/mobile/lib/features/notifications/providers/notification_provider.dart`

- `notificationPreferencesProvider` — FutureProvider.autoDispose, GET /api/v1/notifications/preferences
- `dndStatusProvider` — Provider tracking DND state
- FCM token registration: On app launch (after auth), get FCM token via `FirebaseMessaging.instance.getToken()`, POST to /devices. Listen for token refresh events.
- FCM message handler: `FirebaseMessaging.onMessage` → show local notification (flutter_local_notifications). `onMessageOpenedApp` → navigate to targetRoute from data payload.

---

### T7 · Wire into You tab settings + router (Mobile)
**Files:** Update `you_tab_screen.dart`, `router.dart`

- "Notifications" row in settings card → push to `/notifications/preferences`.
- Add route in router: `/notifications/preferences` → NotificationPreferencesScreen.

---

### T8 · Wire push triggers in social service (API)
**Files:** Update `social.service.ts` (from E1.7)

- After followUser() → call sendPush(followeeId, { type: 'new_follower', title: 'New follower', body: '{name} started following you', data: { targetRoute: '/profile/{followerId}' } })
- After addComment() → call sendPush(contentOwnerId, { type: 'new_comment', ... })
- Fire-and-forget (don't await, don't fail the main operation if push fails).

---

### T9 · Tests
**Files:** `notification.service.test.ts`, `notifications.test.ts` (handlers)

- Preferences: get, update, locked cell rejection, defaults insertion
- Device: register, unregister, reassign token
- Push sender: sends to correct tokens, respects DND, respects preferences, skips locked categories
- Handlers: all 5 endpoints
- **Total: ~32 new API tests**

---

## Dependency Order

```
T1 (preferences service) ─┐
T2 (device service) ───────┼─→ T3 (push sender) ─→ T8 (wire triggers)
T4 (handlers/routes) ──────┘
                           │
T9 (tests) ────────────────┘

T5 (preferences screen) + T6 (providers + FCM) → T7 (wire to settings)
```

---

## UI/UX Specifications

### DND Row
```
┌────────────────────────────────────┐
│ 🔕 Do Not Disturb          [═══] │
│ Pauses push & WhatsApp.           │
│ Booking alerts still come through. │
└────────────────────────────────────┘
```

### Preference Matrix
```
                          Push  WhatsApp  Email
┌─────────────────────────┬──────┬──────┬──────┐
│ Bookings & Trips        │ [ON] │ [🔒] │ [ON] │
│ Messages from Creators  │ [ON] │ [off]│ [ON] │
│ New Content from Follows│ [ON] │ [off]│ [ON] │
│ Activity on Your Content│ [ON] │ [off]│ [ON] │
│ Platform Updates        │ [ON] │ [off]│ [ON] │
│ Promotions & Offers     │ [off]│ [off]│ [off]│
└─────────────────────────┴──────┴──────┴──────┘
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| FCM requires Firebase config in app | Already configured in E0.3 (Firebase Auth uses same project) |
| WhatsApp/Email channels non-functional in M1 | Toggles render but are clearly marked as "push only for now" in a subtle hint. Or: all 3 render, preferences saved, but only push actually sends. |
| Default preference insertion timing | Insert in user registration flow (E0.3 auth service) — verify it exists or add it |
| Push notification rate limiting | Don't spam — batch "new follower" into hourly digest for popular creators |

---

## Definition of Done

- [ ] Preferences API: get, bulk update, locked cell enforcement
- [ ] Device registration: register, unregister
- [ ] Push sender: respects preferences + DND, sends via FCM
- [ ] ~32 API tests passing
- [ ] Notification preferences screen with 6×3 matrix
- [ ] DND master switch working
- [ ] Locked cell (bookings × WhatsApp) with lock icon + toast
- [ ] FCM token registration on app launch
- [ ] Push triggers wired for new_follower + new_comment
- [ ] Notification preferences accessible from You tab settings
- [ ] `flutter analyze` 0 issues
- [ ] `tsc --noEmit` 0 errors
