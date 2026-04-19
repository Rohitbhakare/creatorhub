# E0.4c — Pack A Screen Redesign (Onboarding & Auth)

**Status:** DRAFT — awaiting founder approval
**Branch target:** `dev`
**Design bundle:** `w01JFq8Uf4fdUVBje9Q9kw` → `docs/01_wireframes/v2/`
**Ship order source:** `docs/01_wireframes/v2/project/CreatorHub Redesign.html` (Pack A is first)
**Depends on:** E0.4b (DONE — tokens + primitives live in `lib/shared/components/`)

---

## Why this epic exists

E0.4b landed the **foundation** of the v2 "Pure White + Coral" design: tokens (`colors.dart`), shadow stacks, and the primitives `AppCard`, `SelectionTile`, `Btn`, `AppInput`, plus a rewritten `MainShell` bottom nav. It did **not** redesign existing screen layouts.

The v2 handoff bundle (`docs/01_wireframes/v2/`) specifies the **full screen-by-screen redesign** in 9 packs (A → I). Pack A ships first per `CreatorHub Redesign.html`. This epic covers **only** Pack A — the 8 onboarding/auth screens — against the canonical v2 source (`pack-a-onboarding.jsx`). No new functionality: every screen already exists in some form in `apps/mobile/lib/features/{auth,onboarding}/`. This is a **visual refresh**, not a logic rewrite.

---

## Scope — 9 screens

Source of truth: `docs/01_wireframes/v2/project/pack-a-onboarding.jsx`. Screen IDs match SRS IAM-FR-XXX. **A2c Name is a new screen not present in the v2 JSX** — added per founder decision (Q1) to capture the user's first name post-signup so A6 celebrate can personalize, and so the user's profile has a name from day one. It occupies "Step 1 of 5" (the slot implicit in the JSX, which starts at "Step 2 of 5" on location).

| Pack ID | Screen | SRS | Current Flutter file |
|---------|--------|-----|----------------------|
| A1 | `S_Welcome` | IAM-FR-001 (first run) | `features/onboarding/screens/welcome_screen.dart` |
| A2 | `S_Phone` | IAM-FR-002/003 (phone input) | `features/auth/screens/phone_otp_screen.dart` (phone step) |
| A2b | `S_Otp` | IAM-FR-004 (OTP verify) | `features/auth/screens/phone_otp_screen.dart` (otp step) |
| **A2c** | **Name (new)** | IAM-FR-005 (profile bootstrap) | **new: `features/onboarding/screens/name_screen.dart`** |
| A3 | `S_OnbLocation` | IAM-FR-006 (home base) | `features/onboarding/screens/location_screen.dart` |
| A4 | `S_OnbVerticals` | IAM-FR-007 (interests) | `features/onboarding/screens/vertical_picker_screen.dart` |
| A5 | `S_OnbCreators` | IAM-FR-008 (bootstrap follows) | `features/onboarding/screens/suggested_creators_screen.dart` |
| A6 | `S_OnbCelebrate` | IAM-FR-010 (first-run done) | `features/onboarding/screens/celebration_screen.dart` |
| A7 | `S_AuthWall` | IAM-FR-011 (soft sign-in sheet) | *(none — new sheet widget)* |

### A2c Profile bootstrap spec (expanded per founder 2026-04-19)

One screen, three stacked fields, Pack A visual language:

**Fields on A2c:**
1. **Username** (required, unique) — 3–20 chars, lowercase `[a-z0-9_.]`, must start with a letter. Debounced uniqueness check calls `GET /users/check-username?u=<handle>` (audit if endpoint exists during T3a; add it to the API if not). Inline validation states: typing → idle, valid format + available → green ✓, format bad → red error, taken → red "taken" + suggest 3 variants.
2. **First name** (required) — free text, trimmed length ≥ 2.
3. **Email** (optional) — empty by default. Format validated on blur. If provided, triggers email-verify sub-flow before A3.

**Auth-source branching:**
- **Phone signup:** all 3 fields empty.
- **Google/Apple signup:** prefill `firstName` + `email` from OAuth token. Email is marked verified (skip verify sub-flow). User still picks a username.

**Email verify sub-flow (only if user enters an email):**
On Continue → show a `showModalBottomSheet` verify sheet with 6-digit code input (matches A2b OTP visual pattern). Code sent via SendGrid. Three outcomes: (a) verified → dismiss sheet → route to A3, (b) user taps "Skip for now" → clear email, route to A3, (c) resend after 30s cooldown. Verification method = **6-digit code** (matches phone OTP pattern; no external link clicks — keeps user in-flow).

**Layout:**
- `Steps(current: 1, total: 5)` at top.
- Mono eyebrow "STEP 1 OF 5".
- Display H2 "Let's set up your profile" (matches Pack A H2 voice).
- 13sp inkMuted subcopy "Pick a handle people will know you by.".
- `Field(label: 'Username', required: true)` with `AppInput(prefix: '@', placeholder: 'ananya')` + inline availability state (✓ green / red "taken, try ananya_2").
- `Field(label: 'First name', required: true)` with `AppInput(placeholder: 'Aarav')`.
- `Field(label: 'Email (optional)', required: false)` with `AppInput(placeholder: 'aarav@example.com', keyboardType: emailAddress)` + 12sp muted helper "We'll send a code to verify.".
- Sticky bottom bar: `Back` outline + `Continue` primary. Continue disabled until username available + firstName ≥ 2 chars. Email is optional; if present, must pass format check.

**State additions to `OnboardingProvider`:**
- `username: String?`
- `firstName: String?`
- `email: String?`
- `emailVerified: bool` (true if from OAuth, false by default for phone signup)
- `setProfile({username, firstName, email})`
- `sendEmailVerifyCode()` / `verifyEmailCode(String code)` methods

**API touchpoints (audit during T3a, wire what exists):**
- `GET /users/check-username?u=<handle>` — debounced 300ms on input.
- `POST /users/me/profile` (or `PATCH`) — persist on Continue.
- `POST /users/me/email/send-code` — phone-signup email verify flow.
- `POST /users/me/email/verify` — code check.

**Sub-question deferred to T3a detailing:**
If the user already has a server-assigned username from firebase signup, do we still let them rename on A2c? (Recommend: yes, A2c is the first time they see it. The OAuth fallback username should be treated as a suggestion, editable.)

Renumber downstream steps: A3 → Step 2 of 5, A4 → Step 3 of 5, A5 → Step 4 of 5, A6 → Step 5 of 5 (already matches JSX).

### Out of scope (deferred)

- Packs B–I (Discover, Detail, Booking, Publishing, KYC, You, Studio, Web) — each becomes its own epic per the HTML ship order.
- New business logic. Auth/OTP service, onboarding state machine, and routing stay as-is. Only visual layout and copy change.
- Backend changes. No API or schema work.

---

## Design deltas per screen (v1 → v2)

Each delta comes from a direct read of `pack-a-onboarding.jsx` cross-referenced with the current Flutter implementation.

### A1 Welcome
- **New:** 420dp hero photo with dusk-tone gradient → surface fade; "CREATORHUB" eyebrow in mono caps; display H1 `"Every journey / is a chapter."` (italic coral on "is a chapter."); 14dp body copy; primary + ghost buttons stacked; ToS + language roadmap footer (हिंदी · मराठी · தமிழ் · বাংলা coming soon).
- **Remove:** any current gradient/orb treatments that don't match the hero photo + fade.

### A2 Phone
- **New:** `AppHeader` with back arrow + "Sign in"; display H2 `"What's your number?"`; 13dp muted subcopy; `🇮🇳 +91 ▼` country chip + number input side-by-side; primary "Send code" w/ `arrowRight` icon; "or" divider; outline "Continue with Google" / "Continue with Apple" stacked.
- **Remove:** any social-first layout (phone is primary per v2).

### A2b OTP
- **New:** 6 digit boxes at 56dp height, 10dp radius, mono 24dp 600-weight; "Change" link in coral on +91 phone line; "Resend in 0:42" + "Get code via WhatsApp" text button; info block on `surfaceAlt` about 3-attempt lock + "Need help?" in coral.

### A3 Location
- **New:** 5-step progress bar at top (`Steps current={2} total={5}`); "Step 2 of 5" eyebrow mono caps; display H2; search input with `magnifyingGlass` icon; horizontal chip row of 8 cities (selected = dark ink fill with surface text); bottom tip card on `surfaceAlt` with `mapPin` icon + `Toggle` "Use precise location?"; sticky bottom bar with `Back` + `Continue`.

### A4 Verticals
- **New:** `Steps current={3} total={5}`; 2×N grid of selection tiles at 88dp height with icon + label + coral halo + coral check badge on selected (per C-26 SelectionTile); selection counter `3 of 8 selected · minimum 3`.
- **Reuse:** `SelectionTile` primitive from E0.4b. No new styling needed.

### A5 Creators
- **New:** `Steps current={4} total={5}`; row list (no grid) with 44dp avatar + name + "city · cat · followers" meta line + Follow/Following button (`variant=dark` vs `ghost`); scrollable center area; sticky bottom bar with `Skip` + `Follow 3 & continue`.

### A6 Celebrate
- **New:** on `bg` (not `surface`) to feel like a canvas; `Steps current={5} total={5}`; "CHAPTER 1 · YOU" pill in `primaryTint` + `primaryDeep` mono caps; display 44dp `"Welcome aboard, / Aarav."` with coral italic name; `AppCard` with `compass` icon tile + "Today's read" + creator preview + caret; primary "Open my feed".

### A7 Auth Wall (new widget)
- **New:** `SoftAuthSheet` — bottom sheet with title "Save this postcard?", postcard-preview row (52dp coral-tint bookmark tile + snippet title + context), 13dp body copy with "30 seconds." in ink strong, stacked primary phone + outline Google + outline Apple + text "Keep browsing as guest".
- Triggered by guest-gated actions (save, follow, book). Not bound to a route — renders over current screen with backdrop at opacity 0.35 behind.

---

## Engineering approach

1. **Token adherence.** Every color comes from `AppColors` (already populated in E0.4b). No hex literals in new code.
2. **Primitive reuse.** `Btn` → `Button` (variants: primary, outline, ghost, dark, text), `Card` → `AppCard`, `SelectionTile` for A4 tiles, `AppInput` for text fields. If a primitive is missing a needed variant (e.g. `Button.variant.dark` for "Follow" pill, or a `Steps` progress widget, or a `Toggle` switch styled to v2, or a `Chip` for city chips), add it to `lib/shared/components/` **once** with a minimum-surface API.
3. **Don't mirror React structure.** Flutter screens get their own composition. The React `pack-a-onboarding.jsx` is a visual spec — dimensions, colors, copy, spacing. Translate intent, not AST.
4. **Copy strings.** All UI copy (button labels, headings, empty-state text, error tooltips) comes verbatim from `pack-a-onboarding.jsx`. Strings live inline for now (no l10n until a later epic); Indian-language footer in A1 is static text.
5. **Router/state untouched.** Existing `onboarding_provider.dart` + `auth_provider.dart` + GoRouter routes stay. This epic only rewrites screen widgets + adds the `SoftAuthSheet`.
6. **Phosphor icons.** Use `PhosphorIconsRegular`/`Bold` names matching the JSX `Icon name=` props (`mountains`, `forkKnife`, `bookOpen`, `barbell`, `sun`, `musicNotes`, `camera`, `graduationCap`, `compass`, `caretRight`, `caretDown`, `arrowRight`, `magnifyingGlass`, `mapPin`, `bookmark`, `info`, `check`).
7. **Images.** Pack A uses a hero photo on A1 (dusk tone). Source TBD — see open question Q3.

---

## Delivery order within the epic

Per ship-first-what-users-hit-first: A1 → A2 → A2b → A3 → A4 → A5 → A6 → A7. Each screen lands as an independent task with its own tests. A7 (auth wall) comes last because it's the only new widget.

---

## Acceptance criteria (epic-level)

- All 8 screens render pixel-close to `pack-a-onboarding.jsx` when boot-compared against the JSX rendered in a browser (spot-check, not automated).
- Zero hex literals in new screen code — all colors from `AppColors`.
- Every pressable element has `HapticFeedback` (per ui-ux.md § haptic rule).
- Skeleton shimmer, not spinners, anywhere that was using `CircularProgressIndicator` (carry-over from E0.4b rule).
- `flutter analyze` adds 0 new issues.
- `flutter test` green for all existing + new widget tests.
- 4-step review gate passes (edge cases → security → architecture → code quality).
- iOS simulator cold boot: onboarding flow A1 → A6 completes without crash.

---

## Founder decisions (2026-04-19)

| # | Decision | Impact |
|---|----------|--------|
| Q1 | **Add a name-capture step** after signup. New screen A2c "What should we call you?" becomes Step 1 of 5. A6 binds `firstName` from onboarding state. | +1 screen (T2a), +1 field on `onboardingProvider`, +API update if we persist first name to profile |
| Q2 | **Coral gradient placeholder** for A1 hero. No photo asset bundling. | Simpler; no asset-licensing or picking required |
| Q3 | **All 5 soft-auth triggers**: save / follow / book / comment / like. | T8 wires 5 integration points, not 2 |
| Q4 | WhatsApp OTP button **disabled** for now. Add to a "later" todo list. | Button renders disabled with 0.4 opacity; note added to `docs/epics/TRACKING.md` backlog |
| Q5 | A6 "Today's read" card **couples now** to a recommendation source. | Need to check if `feedProvider.firstRecommendation()` exists; if not, add a thin provider or wire to whatever feed API we have |
| Q6 | SoftAuthSheet lives at **`lib/features/auth/widgets/soft_auth_sheet.dart`** with a `showSoftAuthSheet(context, trigger)` helper. | As recommended |

---

## Out of this epic (explicit)

- No new backend endpoints, no migrations, no OpenAPI changes.
- No E2E / Patrol scenario rewrites (existing onboarding_scenarios already exercise A1→A6 logic; visuals don't need E2E coverage beyond "no crash on boot").
- No analytics events beyond what's already wired.
- No web counterpart — `pack-i-website.jsx` is a separate later epic.

---

## Estimate

9 screens × ~half-day each + 1 new `SoftAuthSheet` widget with 5 integration points (~1.5 days) + A6 feed coupling (~0.5 day) + tests + review gate ≈ **6 days** solo with Opus in plan-approve-build cadence.

---

## Backlog items spawned by this epic

Captured here until we pick a ticket tool; will promote to `docs/epics/TRACKING.md` backlog section at epic close.

1. **WhatsApp OTP via MSG91** — A2b button is disabled for now. Wire the real channel when MSG91 WhatsApp template is configured. Link back to A2b test (enable the button + test real delivery).
2. **A6 recommendation coupling** — if the feed recommendation source is a stub in this epic, revisit when Pack B Home Feed lands and swap in the real provider.
3. **Cut-(c) SelectionTile migration** (inherited from E0.4b) — 6 surfaces still need SelectionTile: Create sheet, Discover filter sheet, Publish wizard, KYC intro, Booking pay-method, Onboarding suggested creators (audit whether creators qualify).
