# E0.5 — Tasks

## T1: Welcome Screen
**Files:** `apps/mobile/lib/features/onboarding/screens/welcome_screen.dart`
**SRS:** ONB-FR-001
**Acceptance:** Three entry paths: "Sign up" (primary CTA), "Sign in" (secondary), "Browse as guest" (ghost/text link). App branding/illustration. Only shown on first launch (never again after onboarding completes).
**Edge cases:**
- First launch detection: check local storage for `has_launched` flag
- "Browse as guest" → set auth state to `guest`, navigate to home feed
- "Sign up" and "Sign in" → navigate to phone OTP screen (from E0.3)
- Status bar: transparent, overlaid on illustration
- Animation: subtle fade-in on elements (section entrance preset)

## T2: Progress Bar Component
**Files:** `apps/mobile/lib/features/onboarding/components/onboarding_progress_bar.dart`
**SRS:** ONB-FR-011
**Acceptance:** 5-segment horizontal bar: phone, location, categories, creators, done. Current segment filled with coral, completed segments solid, upcoming segments gray. Animated transition between segments.
**Edge cases:**
- Segments don't have labels (just colored bars, icons optional)
- Animation: width fill 200ms ease-out on step transition
- Must handle direct navigation (not just sequential): if user goes back, segments un-fill
- Responsive: bar spans full width with 16px horizontal padding

## T3: Location Capture Screen
**Files:** `apps/mobile/lib/features/onboarding/screens/location_screen.dart`, `apps/mobile/lib/features/onboarding/providers/location_provider.dart`
**SRS:** ONB-FR-002, ONB-FR-010
**Acceptance:** "Use my location" button triggers system GPS permission. On grant, calls `/cities/nearby` to auto-detect city. Manual city picker with search (fuzzy match). Cannot proceed without city selected. Shows selected city name with change option.
**Edge cases:**
- GPS permission denied → show manual picker immediately (no error screen)
- GPS permission "Don't ask again" → show manual picker, hide GPS button
- GPS returns coordinates but no nearby city found → show manual picker with message
- City search: debounce 300ms, show results as user types
- City search empty results → "No city found. Try a different search."
- Slow network on city search → show skeleton loader in dropdown
- Selected city displayed as chip with X to clear and re-select
- Back button → confirm discard (if city already selected)

## T4: City Search API Endpoint
**Files:** `apps/api/src/routes/cities.routes.ts`, `apps/api/src/handlers/cities.ts`, `apps/api/src/services/city.service.ts`
**SRS:** ONB-FR-010, DD-009
**Acceptance:** `GET /api/v1/cities?q=pun&limit=10` returns matching cities with fuzzy search. `GET /api/v1/cities/nearby?lat=18.52&lng=73.85` returns nearest city. Both follow OpenAPI spec.
**Edge cases:**
- Fuzzy search: use `pg_trgm` similarity or `ILIKE` with prefix matching
- Empty query → return empty array (not all cities)
- Query with special characters → sanitize, don't throw
- No nearby city within 100km → 404
- Results ordered by relevance (similarity score), then population
- Guest access allowed (no auth required)

## T5: Vertical Picker Screen
**Files:** `apps/mobile/lib/features/onboarding/screens/vertical_picker_screen.dart`
**SRS:** ONB-FR-003, ONB-FR-007, ONB-FR-008
**Acceptance:** Grid of 8 verticals, each showing: icon, name, live creator count. Tap to select/deselect. Minimum 3 required to continue. Creator count fetched from API.
**Edge cases:**
- Verticals with 0 creators: show "coming soon", grayed out but still selectable
- Verticals with 1-10 creators: show "soon" with count, selectable
- Verticals with >10 creators: show count normally
- Continue button disabled until ≥3 selected; show "Select at least 3" helper
- Selected state: coral border + checkmark overlay
- Creator counts fetched once and cached for session (not real-time)
- Loading state: skeleton grid while counts load
- Error fetching counts → show verticals without counts (still selectable)

## T6: Verticals API Endpoints
**Files:** `apps/api/src/routes/verticals.routes.ts`, `apps/api/src/handlers/verticals.ts`, `apps/api/src/services/vertical.service.ts`
**SRS:** ONB-FR-007, ONB-FR-003, ONB-FR-008
**Acceptance:** `GET /api/v1/verticals` returns 8 verticals with live creator counts. `PUT /api/v1/onboarding/verticals` saves selected verticals and auto-detects waitlisted ones.
**Edge cases:**
- Creator count query: `COUNT(DISTINCT user_id) FROM content WHERE vertical = $1 AND status = 'published'`
- Waitlisted: verticals with ≤10 published creators automatically added to `user_waitlisted_verticals`
- Idempotent: re-submitting verticals replaces previous selection (DELETE + INSERT)
- Minimum 3 validation on server side (Zod schema)
- Guest access on `GET /verticals` (no auth)

## T7: Suggested Creators Screen
**Files:** `apps/mobile/lib/features/onboarding/screens/suggested_creators_screen.dart`
**SRS:** ONB-FR-004
**Acceptance:** List of creators personalized to selected verticals. Featured creators at top. Follow/unfollow toggle per creator. "Skip" link prominent. Follow creates row immediately (optimistic update).
**Edge cases:**
- No creators available → skip this step entirely (proceed to celebration)
- Featured creators: `featured = true` in users table, sorted first
- Follow is optimistic: update UI immediately, revert on API error
- Bulk follow: allow selecting multiple, then batch API call
- Loading: skeleton list while fetching
- Skip: no follows created, proceed to next step

## T8: Suggested Creators API Endpoint
**Files:** `apps/api/src/routes/onboarding.routes.ts`, `apps/api/src/handlers/onboarding.ts`, `apps/api/src/services/onboarding.service.ts`
**SRS:** ONB-FR-004
**Acceptance:** `GET /api/v1/onboarding/suggested-creators` returns creators matching user's verticals. Featured first. Excludes already-followed.
**Edge cases:**
- Query: creators with ≥1 published content in user's selected verticals
- Sort: featured first, then by follower_count DESC
- Exclude: creators the user already follows
- Limit: default 20, max 50
- Empty result (no creators for these verticals) → return empty array

## T9: Onboarding Complete Flow
**Files:** `apps/mobile/lib/features/onboarding/screens/celebration_screen.dart`, `apps/api/src/handlers/onboarding.ts` (add complete handler)
**SRS:** ONB-FR-005
**Acceptance:** Celebration screen with Lottie animation (~1s). Auto-dismiss after 2 seconds → navigate to home feed. `POST /api/v1/onboarding/complete` sets `onboarding_completed_at`. Server validates prerequisites.
**Edge cases:**
- Server rejects if `current_city_id` is null → 422
- Server rejects if `user_active_verticals` has < 3 → 422
- Celebration plays only once (never on subsequent app launches)
- If animation file fails to load → skip directly to feed (no error)
- GoRouter guard: redirect to onboarding if `onboarding_completed_at` is null
- First feed after onboarding shows onboarding-tasks card at top

## T10: Onboarding State Management
**Files:** `apps/mobile/lib/features/onboarding/providers/onboarding_provider.dart`
**SRS:** ONB-FR-001–011
**Acceptance:** Riverpod provider tracking onboarding progress: current step (1-5), collected data (city, verticals, follows), completion status. Persists across screen transitions. Rehydrates on app restart if incomplete.
**Edge cases:**
- If user kills app mid-onboarding → resume from last completed step on relaunch
- Step 1 (phone) data comes from auth provider (not onboarding provider)
- Step validation: cannot advance to step N without completing step N-1
- "Browse as guest" bypasses onboarding entirely (no steps stored)
- Onboarding data cleared from local state after completion (server is source of truth)

---

## Bugs (Post-Completion)

### BUG-001: Location "Continue" does nothing (P0)
**Files:** `apps/mobile/lib/features/onboarding/screens/location_screen.dart`
**SRS:** ONB-FR-002
**Description:** `_onContinue()` calls `advanceStep()` which updates the provider state, but does NOT navigate to the next route (`/onboarding/verticals`). User is stuck on the location screen.
**Fix:** Add `context.go('/onboarding/verticals')` after `advanceStep()`. Verify same pattern on all onboarding screens (vertical_picker → `/onboarding/creators`, suggested_creators → `/onboarding/celebration`, celebration → `/`).
**Status:** OPEN

---

## Enhancements (Post-Completion, NOT in SRS)

### FEAT-001: Popular cities 3x3 grid with landmark icons
**Files:** `apps/mobile/lib/features/onboarding/screens/location_screen.dart`, new city icon assets
**SRS:** NOT IN SRS — founder-directed UX enhancement to ONB-FR-002
**Description:** Add "POPULAR CITIES" section showing top 10 Indian cities (Mumbai, Delhi-NCR, Bengaluru, Hyderabad, Chandigarh, Ahmedabad, Pune, Chennai, Kolkata, Kochi) in a 3-column grid with city landmark icons. Below that, an "OTHER CITIES" alphabetical list. Selected city shown with green dot + coral highlight. One-tap selection without search.
**Status:** OPEN
