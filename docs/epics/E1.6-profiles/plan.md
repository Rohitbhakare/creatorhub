# E1.6 — Profiles

## Scope

User profile: view own, view others, edit profile. Two states from wireframe: **Follower** (new user, incomplete) and **Creator** (established, verified).

**SRS IDs:** PROF-FR-001, PROF-FR-002, PROF-FR-006, PROF-FR-007, PROF-FR-010
**Deferred to V1:** PROF-FR-003 (web mini-site), PROF-FR-005 (analytics), PROF-FR-008 (social import), PROF-FR-009 (phone change), PROF-FR-011–016 (connected accounts)
**Wireframe:** Screen 12 — You Tab (two states: A. Follower, B. Creator)

## Dependencies

- E0.3 Auth (authenticate middleware) — DONE
- E0.4 Design System (components) — DONE
- E1.1 Content Framework (content counts) — DONE
- E1.7 Social (follow/unfollow) — NOT STARTED, but basic follow exists from onboarding

## Architecture

### API

- `GET /api/v1/users/me` — own profile (already exists)
- `PUT /api/v1/users/me` — update profile (display_name, bio, username, email, avatar_url)
- `GET /api/v1/users/:id` — public profile view (optionalAuthenticate for is_following flag)
- `PUT /api/v1/users/me/avatar` — avatar upload (signed URL → Firebase Storage)
- Username validation: unique, 3-30 chars, `[a-z0-9._]`, not in reserved list, 30-day cooldown

### Mobile

Feature folder: `lib/features/profile/`
- **You Tab** — own profile (replaces placeholder home icon in bottom nav)
- **Profile View Screen** — other users' profiles (navigated from feed cards, creator rows)
- **Edit Profile Screen** — form with dirty-state detection
- **Profile Completion Card** — progress bar with missing items (from wireframe)

## Key Design Decisions

1. **Hero card** on sunken background (#F2EEE8), centered: avatar (84px, dashed ring if incomplete, coral ring if creator), display name (Fraunces 22px), @username, bio (Fraunces italic 13px), stats row (followers/following/saved)
2. **Profile completion card** — progress bar (coral fill), checklist: add photo, add name, add bio, set location, follow 3 creators
3. **Become a creator** CTA card — icon + title + description + coral button
4. **Settings section** — card with rows: Edit Profile, Notifications, Saved, Connected Accounts (M1), Help, Sign Out (destructive red)
5. **Edit profile** — fields: display_name (required), username (creator only, 30-day cooldown), bio (280 chars), email (optional), avatar (tap to change). Dirty-state prompt on navigation away.

## Decisions (LOCKED)

1. **Bottom tab bar** — Build full 5-tab shell now: Home, Search (placeholder), Create+ (opens content picker), Studio (placeholder), You. Active tab = coral icon. Labels always visible.
2. **Avatar upload** — Reuse Firebase Storage signed URL pattern from E1.1.
3. **is_creator** — No manual toggle or CTA. `is_creator` flips to `true` automatically on first successful content publish. Remove "Become a Creator" card from wireframe. Profile shows creator elements (Studio tab, badge) only when `is_creator = true`.
