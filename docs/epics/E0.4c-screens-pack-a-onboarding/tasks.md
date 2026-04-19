# E0.4c — Tasks

Each task = one screen (or one shared primitive gap). Order is ship-order from `CreatorHub Redesign.html`. Every task must end with tests green + `flutter analyze` clean before the next starts.

**Decisions applied (founder, 2026-04-19):**
- A1 hero uses a coral gradient placeholder (no photo asset).
- A2b WhatsApp OTP button is rendered **disabled** (opacity 0.4 + no-op onTap); real MSG91 channel is a backlog item.
- New screen **A2c Name** added between OTP and Location as Step 1 of 5. `onboardingProvider` gets a `firstName: String?` field.
- A6 "Today's read" card couples to a real recommendation source now (see T7).
- SoftAuthSheet lives at `lib/features/auth/widgets/soft_auth_sheet.dart`. All 5 guest-gated actions (save / follow / book / comment / like) wire it.

---

## T0 — Shared primitives gap-fill (prerequisite)

Audit `lib/shared/components/` against Pack A needs. Add what's missing; do NOT rebuild what already exists.

**Likely additions (confirm by read):**
- `Steps` — N-of-N top progress bar (`steps.dart`). Used on A3/A4/A5/A6.
- `Toggle` — v2-styled switch (coral track when on). Used on A3. (Flutter `Switch` may already fit — wrap only if tokens diverge.)
- `Chip` — pill button for city list (A3). Dark-ink selected state; hairline-strong border rest state.
- `Button` variant `dark` — full-ink fill for "Follow" (A5). Check current `Button` variants first.
- `Button` variant `text` — link-style text-only (A7 "Keep browsing as guest"). May already exist as `ghost`; confirm.
- `AppHeader` — back-arrow + title bar (A2, A2b). May already exist; confirm.
- `SoftAuthSheet` — NOT built here, this is T8.

**Acceptance:** every primitive needed by A1–A7 either already exists or lands in T0 with a widget test + docstring. No styling hex literals; tokens from `AppColors`.

---

## T1 — A1 Welcome

**File:** `lib/features/onboarding/screens/welcome_screen.dart` (rewrite body)
**Source:** `pack-a-onboarding.jsx` → `S_Welcome` (lines 17–44)

**Layout:**
- 420dp hero **coral gradient placeholder** (no image asset): linear gradient from `AppColors.primary` at top → `AppColors.primaryDeep` at bottom-right, with a 25% darkness overlay applied like `Colors.black.withOpacity(0.18)` to keep eyebrow/headline legible. Rounded bottom edges off; full-bleed to status bar.
- Content pane starts at `top: 340` with upward fade `transparent 0% → AppColors.surface 30%`.
- Eyebrow: `Text('CREATORHUB', mono 11sp, primary, 0.18em, uppercase, 600w)`.
- Display H1: `RichText` with `Fraunces 40sp 0.98lh 500w -0.018em`; split into ink line + italic-coral line "is a chapter.".
- Body: 14sp 1.55lh inkSoft.
- Buttons: primary "Get started" + ghost "I already have an account" (both `Button.size.lg full: true`).
- Footer: 11sp inkMuted centered "By continuing you agree to Terms & Privacy." + line break + language roadmap.

**Test:** `welcome_screen_test.dart` — hero gradient renders (no Image.asset), H1 contains both strings, tap primary → fires `onboarding.start()` callback (stub in test).

---

## T2 — A2 Phone sign-in

**File:** `lib/features/auth/screens/phone_otp_screen.dart` (phone step)
**Source:** `S_Phone` (lines 47–88)

**Layout:**
- `AppHeader(back: true, title: 'Sign in')`.
- Display H2 `"What's your number?"` + 13sp muted subcopy.
- `Field(label: 'Mobile number', required: true)` containing: country chip `🇮🇳 +91 ▼` (44dp height, 8dp radius, hairlineStrong border) side-by-side with `AppInput(placeholder: '98765 43210')`.
- Primary "Send code" w/ `arrowRight` trailing icon.
- Divider row with "OR" chip (11sp mono caps, inkMuted).
- Outline Google + Apple buttons stacked.

**Test:** `phone_step_test.dart` — valid 10-digit input enables button; invalid disables; tap → calls `authService.sendOtp(+91, phone)`.

---

## T3 — A2b OTP verify

**File:** `lib/features/auth/screens/phone_otp_screen.dart` (otp step)
**Source:** `S_Otp` (lines 91–137)

**Layout:**
- `AppHeader(back: true, title: 'Verify')`.
- Display H2 "Enter the code".
- Subcopy `"Sent to +91 98765 43210 · Change"` — "Change" is coral 600w, taps → back to phone step.
- 6× digit boxes, each 56dp height, 10dp radius, 1.5dp border. Focus state: ink border. Filled: ink border. Rest: hairlineStrong.
- Resend timer "Resend in 0:42" inkMuted 12sp.
- "Get code via WhatsApp" text button rendered **disabled** (opacity 0.4, onTap: null). Backlog item noted in TRACKING.md.
- Primary "Verify" (disabled until 6 digits).
- Info block on `surfaceAlt`: info icon + 12sp inkSoft text "3 failed attempts locks this number for 15 min." + coral "Need help?".

**Test:** `otp_step_test.dart` — typing 6 digits enables Verify; tap Verify calls `authService.verifyOtp(code)`. WhatsApp text button is non-interactive (onTap null).

---

## T3a — A2c Profile bootstrap (new screen)

**File (new):** `lib/features/onboarding/screens/profile_bootstrap_screen.dart`
**Router entry:** `/onboarding/profile` — first step after successful OTP verify (or OAuth complete). Existing `phone_otp_screen.dart` + OAuth success handlers route here before `/onboarding/location`.

**State additions:** `OnboardingProvider` gains `username: String?`, `firstName: String?`, `email: String?`, `emailVerified: bool`, + setters and email-verify methods.

**API audit (do first):**
- `GET /users/check-username?u=<handle>` — add if missing (lightweight endpoint; returns 200/409).
- `POST /users/me/profile` (or PATCH) — persist username + firstName + email.
- `POST /users/me/email/send-code` + `POST /users/me/email/verify` — email verify.

**Layout:**
- `Steps(current: 1, total: 5)`.
- Mono eyebrow "STEP 1 OF 5".
- Display H2 "Let's set up your profile".
- 13sp inkMuted subcopy "Pick a handle people will know you by.".
- `Field(label: 'Username', required: true)` with `AppInput(prefix: '@', placeholder: 'ananya')` + trailing inline state icon (✓ / ✗) + helper text showing availability or format error.
- `Field(label: 'First name', required: true)` with `AppInput(placeholder: 'Aarav')`.
- `Field(label: 'Email (optional)', required: false)` with `AppInput(placeholder: 'aarav@example.com', keyboardType: emailAddress)` + 12sp helper "We'll send a code to verify.".
- Sticky bottom bar: `Back` + `Continue`.

**Behavior:**
- Username input debounced 300ms → calls `checkUsername`. While checking: spinner in trailing slot (actually, use shimmer per ui-ux rule — mini skeleton dot row). Valid + available: green ✓. Taken: red ✗ + 3 variant suggestions rendered as tappable `Chip`s below the field.
- First name: live trim; disabled until ≥2 chars.
- Email optional. On blur, format check (`RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')`). If invalid → red helper text.
- Continue: if email empty → persist profile via `setProfile()` → `context.go('/onboarding/location')`. If email present → `sendEmailVerifyCode()` → `showModalBottomSheet(EmailVerifyCodeSheet)` → on success `emailVerified=true` + route to location; on "Skip for now" clear email and route to location.
- **OAuth path:** if `authState.provider == 'google' | 'apple'`, prefill firstName + email on screen mount; set `emailVerified=true`; hide email verify sheet (email already trusted).

**EmailVerifyCodeSheet widget (inside profile_bootstrap_screen.dart or adjacent file):**
- Visual pattern matches A2b OTP (6 digit boxes, 56dp, 10dp radius).
- Title "Verify your email" + subcopy "Sent to <email>".
- Resend after 30s cooldown.
- "Skip for now" text button clears email + dismisses sheet.

**Tests (`profile_bootstrap_screen_test.dart`):**
- Username debounce calls checkUsername; taken state renders 3 suggestions.
- Continue disabled until username available + firstName ≥ 2 chars.
- Email empty → Continue persists + routes to location (no sheet).
- Email present + valid → Continue shows verify sheet.
- OAuth prefill path → email field disabled + greyed with "Verified" chip; verify sheet never shown.

**Router update:** In `lib/app/router.dart`, add `/onboarding/profile` route. Change post-OTP redirect and OAuth-complete redirect to `/onboarding/profile` when `onboardingProvider.username == null`.

**SRS note:** Username field is not explicit in current SRS IAM-FR-005. Add SRS clause (e.g. IAM-FR-005a) during T3a: username format rules, uniqueness requirement, debounce, server check. Same for email-verify-code flow.

---

## T4 — A3 Home base (location)

**File:** `lib/features/onboarding/screens/location_screen.dart`
**Source:** `S_OnbLocation` (lines 141–186)

**Layout:**
- `Steps(current: 2, total: 5)` at top 52dp padding.
- Mono caps eyebrow "STEP 2 OF 5".
- Display H2 "Where do you call home?".
- Search `AppInput(icon: magnifyingGlass, placeholder: 'City or state')`.
- Horizontal wrap of 8 city `Chip` (Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Pune, Kolkata, Goa). Selected = ink fill / surface text.
- `surfaceAlt` tip card: `mapPin` icon + "Use precise location?" strong ink + description muted + `Toggle`.
- Sticky bottom bar: `Back` outline + `Continue` primary (full-width with arrowRight).

**Test:** `location_screen_test.dart` — tap chip selects it; tap Continue fires `onboardingProvider.setHomeBase(city)`.

---

## T5 — A4 Interests (verticals)

**File:** `lib/features/onboarding/screens/vertical_picker_screen.dart`
**Source:** `S_OnbVerticals` (lines 189–251)

**Layout:**
- `Steps(current: 3, total: 5)`.
- Mono eyebrow "STEP 3 OF 5" + display H2 "What pulls you in?" + muted subcopy "Pick at least 3. We'll keep learning.".
- 2-column grid of 8 `SelectionTile`s (88dp height): Travel, Food, Culture, Adventure, Wildlife, Music, Photography, Learning. Each has phosphor icon + label.
- Counter text `"{n} of 8 selected · minimum 3"` inkMuted 12sp.
- Sticky bottom bar `Back` + `Continue` (Continue disabled until n ≥ 3).

**Test:** `vertical_picker_screen_test.dart` — selecting 3 tiles enables Continue; counter updates; selected tiles show coral border + check badge (reuse SelectionTile test patterns).

---

## T6 — A5 Suggested creators

**File:** `lib/features/onboarding/screens/suggested_creators_screen.dart`
**Source:** `S_OnbCreators` (lines 254–302)

**Layout:**
- `Steps(current: 4, total: 5)`.
- Mono eyebrow + display H2 "Follow 3 to begin." + muted subcopy "Handpicked from your cities & interests.".
- Scrollable list (not grid): each row = 44dp avatar (colored initial) + name (14sp 600w) + meta `"{city} · {cat} · {followers}"` (12sp muted) + Follow button (`variant: dark` for rest, `variant: ghost` for following).
- Divider hairline between rows.
- Sticky bottom: `Skip` outline + `Follow 3 & continue` primary.

**Test:** `suggested_creators_screen_test.dart` — tap Follow toggles state; Continue disabled until 3 following; Skip fires `onboardingProvider.skipCreators()`.

---

## T7 — A6 Celebrate

**File:** `lib/features/onboarding/screens/celebration_screen.dart`
**Source:** `S_OnbCelebrate` (lines 305–341)

**Layout:**
- Scaffold background = `AppColors.bg` (not surface).
- `Steps(current: 5, total: 5)`.
- Pill "CHAPTER 1 · YOU" — `primaryTint` bg + `primaryDeep` text + mono caps 10sp 700w.
- Display H1 44sp 0.96lh: `"Welcome aboard, / {firstName}."` with coral italic on name. `firstName` from `onboardingProvider.state.firstName ?? 'there'` (per Q1 answer).
- Body 14sp 1.55lh inkSoft — dynamic copy with city + follow count + verticals.
- `AppCard(pad: 14)`: 40dp `primaryTint` tile with `compass` icon + "Today's read" 13sp 600w + recommendation preview 12sp muted + trailing caret. **Couples now** (per Q5) to `feedProvider.firstRecommendation()` — audit during T7 whether such a provider exists; if not, add a thin `todaysReadProvider` that calls whatever API is closest (e.g. `GET /feed?limit=1&filter=itinerary`). If the API is not yet implemented, ship the provider returning `AsyncValue.loading → error → shimmer card` but skeleton-styled, so it's real coupling rather than hardcoded copy.
- Primary "Open my feed" with arrowRight.

**Test:** `celebration_screen_test.dart` — renders with stub first-name; recommendation card renders skeleton under AsyncValue.loading, data under AsyncValue.data, hides card gracefully under AsyncValue.error; CTA navigates to `/home`.

---

## T8 — A7 Soft Auth Wall (new widget)

**File:** `lib/features/auth/widgets/soft_auth_sheet.dart` + `showSoftAuthSheet(context, trigger)` helper
**Source:** `S_AuthWall` (lines 345–381)

**Behavior:**
- Bottom sheet (uses `showModalBottomSheet` with custom `shape` + `backgroundColor: AppColors.surface`).
- Background screen dimmed to opacity 0.35 (use `barrierColor: Colors.black.withOpacity(0.35)`).
- Title "Save this postcard?" (or context-dependent per trigger — see below).
- Postcard row: 52dp `primaryTint` tile with bookmark icon + snippet title (14sp 600w) + context (12sp muted). Hairline divider below.
- Body copy (13sp inkSoft 1.55lh): `"You need an account to save postcards, follow creators, and book experiences. 30 seconds."` with "30 seconds." in strong ink.
- Stacked CTAs: primary "Continue with phone" (icon: phone), outline "Continue with Google", outline "Continue with Apple", text "Keep browsing as guest".

**Trigger API (per Q3 answer):**
```dart
enum SoftAuthTrigger { save, follow, book, comment, like }

Future<void> showSoftAuthSheet(
  BuildContext context, {
  required SoftAuthTrigger trigger,
  String? snippetTitle,
  String? snippetContext,
});
```

- Title varies per trigger ("Save this postcard?" / "Follow this creator?" / "Book this experience?" / etc).
- Phone CTA pushes `/auth` route with returnTo set to current location.
- Guest CTA dismisses the sheet.

**Integration (all 5 guest-gated actions per founder Q3):**
- `features/saved/widgets/save_to_list_sheet.dart` — guard with `if (authState.isGuest) return showSoftAuthSheet(context, trigger: .save, ...)`.
- `features/social/widgets/engagement_bar.dart` — guard follow + like on tap.
- `features/social/providers/comments_provider.dart` (or the comment compose widget) — guard comment submit.
- `features/booking/screens/booking_review_screen.dart` — guard on entry (pre-pay).
- Each trigger passes a contextual title + snippet to the sheet so the copy matches the action.

**Test:** `soft_auth_sheet_test.dart` — renders with each trigger, primary CTA navigates to `/auth`, guest CTA dismisses.

---

## T9 — Boot + review gate + commit

- iOS simulator cold boot: complete A1 → A6 flow, trigger A7 from save action.
- `flutter analyze` — 0 new issues.
- `flutter test` — full suite green.
- `pnpm test` (API) — unchanged, re-verify green.
- 4-step review gate: edge cases → security → architecture → code quality. Record findings in `tracking.md`.
- Single commit to `dev` after review-gate pass. Per founder git workflow.

---

## Edge cases to watch

- **A2 phone input masking.** The JSX shows "98765 43210" with a mid-space. Confirm formatting is a mask, not a literal. Use `filteringTextInputFormatter` to enforce digits + auto-insert space after 5 digits.
- **A2b OTP autofill.** iOS AutoFill should still work — don't block it by over-customizing the input row.
- **A3 "Use precise location" toggle.** Tapping on requires permission request via `geolocator`. If denied, show snackbar; do NOT block continuing.
- **A4 min-3 enforcement.** Counter shows "X of 8 selected · minimum 3" even at 4+; the "minimum 3" suffix disappears once n ≥ 3 per JSX? (Confirm — JSX always shows it. Keep.)
- **A5 Skip.** Skip is valid per SRS. Do not force 3 follows. But the primary button is disabled until 3 are selected.
- **A6 long first name.** Display H1 wraps naturally; test with a 14-char name.
- **A7 backdrop tap.** Tapping backdrop does NOT dismiss (user must explicitly pick "Keep browsing as guest") to prevent accidental dismissal mid-flow. Confirm with founder.
- **A7 return path.** After successful sign-in via the sheet, return user to the exact screen they were on (not the home feed). Use GoRouter's `returnTo` query param.

---

## Definition of Done (per CLAUDE.md epic completion rules)

- [ ] All 8 screens + 1 sheet widget match v2 JSX visually
- [ ] Tests green: `flutter test` + `pnpm test` + API `/healthz` 200
- [ ] `flutter analyze` adds 0 new issues
- [ ] `tsc --noEmit` clean (no backend changes, should be no-op)
- [ ] iOS simulator boot: A1 → A6 completes; A7 triggers from save without crash
- [ ] 4-step review gate recorded in `tracking.md`
- [ ] Pre-commit checklist in `tracking.md` filled
- [ ] One commit pushed to `dev`
- [ ] `docs/epics/TRACKING.md` updated with E0.4c row + test counts
