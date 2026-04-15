# E1.6 — Profiles: Task Breakdown

## API Tasks

| ID | Task | SRS | Edge Cases |
|----|------|-----|------------|
| T1 | `profile.service.ts` — getPublicProfile(userId, viewerId?): fetch user + verticals + city + content counts + is_following flag | PROF-FR-001 | User not found → 404. Viewer is self → is_following: false. Deleted user → 404 |
| T2 | `profile.service.ts` — updateProfile(userId, data): update display_name, bio, email, avatar_url | PROF-FR-002, PROF-FR-006 | Empty display_name → 422. Bio > 280 chars → 422. Email invalid format → 422 |
| T3 | `profile.service.ts` — updateUsername(userId, username): validate + 30-day cooldown check | PROF-FR-007 | Username taken → 409. Invalid format → 422. Changed < 30 days ago → 429 with retry date. Reserved words (admin, api, www, help, support) → 422 |
| T4 | `profile.service.ts` — getProfileCompletion(userId): compute % from: has avatar, has name, has bio, has city, follows >= 3 | PROF-FR-001 | New user → 0-20%. Return list of missing items |
| T5 | `profile.service.ts` — becomeCreator(userId): set is_creator=true | — | Already creator → no-op. Return updated profile |
| T6 | Profile handlers + routes: GET /users/:id, PUT /users/me, PUT /users/me/username | PROF-FR-001, 002 | :id must be valid UUID → 400. Auth required for PUT |
| T7 | Zod schemas: updateProfileSchema, updateUsernameSchema | — | — |

## Mobile Tasks

| ID | Task | SRS | Edge Cases |
|----|------|-----|------------|
| T8 | Bottom tab navigation shell — 5 tabs: Home, Search (placeholder), Create+, Studio (placeholder), You | DD-029 | Create+ opens content type picker. Active tab = coral icon. Labels always visible |
| T9 | You Tab screen — hero card (avatar, name, @username, bio, stats), profile completion card, become creator CTA, settings list | PROF-FR-001 | Empty state: ghost name "Add your name", dashed avatar ring, bio prompt |
| T10 | Profile view screen — same hero card layout but for other users, with Follow/Following button | PROF-FR-001 | Not found → error state. Self → redirect to You tab |
| T11 | Edit profile screen — form: display_name, bio, email, avatar tap-to-change | PROF-FR-002, 006 | Dirty state detection → discard prompt on back. Validation inline |
| T12 | Username editor (creator only) — field with cooldown display | PROF-FR-007 | Show "Change available on {date}" if within 30-day window |
| T13 | Profile providers — profileProvider, editProfileProvider | — | Optimistic update for avatar |
| T14 | Wire profile into router — /profile/:id, You tab, edit profile sheet | — | — |

## Test Tasks

| ID | Task | Target |
|----|------|--------|
| T15 | `profile.service.test.ts` — getPublicProfile, updateProfile, updateUsername (cooldown), getProfileCompletion, becomeCreator | 20+ tests |
| T16 | Flutter You Tab widget test — rendering states, settings tap targets | 10+ tests |
