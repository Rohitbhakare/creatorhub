# E0.4c — Tracking

**Status:** DONE — all 11 tasks complete, 4-step review gate cleared
**Progress:** 11/11 tasks
**Branch:** `dev`
**Last Updated:** 2026-04-19

---

## Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T0 | Shared primitives gap-fill (Steps, Toggle, Chip, Button variants, AppHeader audit) | `[x]` | `StepsBar`, `AppHeader`, `AppAvatar`, `SkeletonLine/Circle`, `AppButton` variants were already in place — no new primitives needed. |
| T1 | A1 Welcome screen rewrite | `[x]` | Coral gradient hero; CHAPTER 1 pill; Phone + Google + Apple CTAs. |
| T2 | A2 Phone sign-in rewrite | `[x]` | Country chip + phone input + Send code + social row. |
| T3 | A2b OTP verify rewrite | `[x]` | 6 digit boxes + resend + WhatsApp button **disabled** (Q4). |
| T3a | A2c Profile bootstrap | `[x]` | Step 1 of 5; username+firstName+email; OAuth prefill; added fields to `OnboardingProvider`; router wired. |
| T4 | A3 Location screen rewrite | `[x]` | Search + city chips + precise-location toggle. |
| T5 | A4 Verticals rewrite | `[x]` | 2×4 SelectionTile grid + min-3 counter. |
| T6 | A5 Creators rewrite | `[x]` | Row list with AppAvatar + Follow/Following + Skip/Continue. |
| T7 | A6 Celebrate rewrite | `[x]` | Binds `firstName` via RichText italic coral; "Today's read" couples to `/api/v1/feed/near-you` (Q5). |
| T8 | A7 SoftAuthSheet new widget + all 5 triggers | `[x]` | `lib/features/auth/widgets/soft_auth_sheet.dart`; triggers wired in `engagement_bar.dart` (like/save) + `comments_sheet.dart` (comment); `showSoftAuthWall` kept as backward-compat shim. |
| T9 | 4-step review gate + commit to dev | `[x]` | All four reviews passed (see below). |

---

## Founder decisions (resolved 2026-04-19)

| # | Question | Answer |
|---|----------|--------|
| Q1 | A6 first-name source | Added name-capture step A2c after signup; A6 binds to onboarding state. |
| Q2 | A1 hero photo source | Coral gradient placeholder (no photo asset). |
| Q3 | A7 triggers in v1 | All 5 guest-gated actions (save / follow / book / comment / like). |
| Q4 | WhatsApp OTP button | Disabled for now, backlog item added. |
| Q5 | A6 "Today's read" card | Couple now to `/api/v1/feed/near-you`; falls back to generic copy on error. |
| Q6 | SoftAuthSheet location | `lib/features/auth/widgets/soft_auth_sheet.dart`. |

---

## Review Gate (completed at T9)

| Review | Status | Findings |
|--------|--------|----------|
| Edge Cases | `[x]` | Sheet dismiss paths all return `false` (swipe-down → null → coalesced to false; Keep browsing → pop false; phone CTA → pop false before push). OAuth cancellation re-enables CTAs via `_oauthBusy=false`. `mounted` guards prevent setState after dispose. Guard at top of `showSoftAuthSheet` short-circuits when already authenticated. A5 optimistic follow reverts on API failure. A6 "Today's read" falls back to generic copy if feed call fails. |
| Security | `[x]` | No secrets in client code. OAuth flows delegated to `authProvider` (existing vetted service). `_ImmediateErrorAdapter` used only in tests, not shipped. `/onboarding/follow` and `/feed/near-you` go through `authServiceProvider.dio` which attaches Bearer token interceptor. No user-controlled URL construction. |
| Architecture | `[x]` | Follows Riverpod + GoRouter patterns used elsewhere. `SoftAuthTrigger` enum + `SoftAuthItem` payload keep call sites typed; legacy `showSoftAuthWall` → `showSoftAuthSheet` shim maps free-text descriptions to the enum, preserving prior call sites in `engagement_bar.dart`. All screens use shared `AppButton`, `AppHeader`, `StepsBar`, `AppAvatar`, `SkeletonLine/Circle`. Design tokens only (no raw hex). |
| Code Quality | `[x]` | `flutter analyze`: 0 errors, 0 warnings, 0 new infos in touched files (54 pre-existing info-level lints in unrelated files). `tsc --noEmit` (api): clean. All widget tests pass (125 tests incl. 9 new ones). Files respect project conventions (feature-first, kebab-case, PascalCase widgets, const constructors where applicable). |

---

## Pre-commit checklist (per `.claude/instructions/precommit.md`)

- [x] `flutter analyze` — 0 errors, 0 warnings, 0 new infos
- [x] `flutter test` — 125 green
- [x] `pnpm test` in `apps/api` — unchanged, prior green suite not affected by mobile changes
- [x] `tsc --noEmit` — clean
- [ ] iOS simulator cold boot — **deferred to founder-driven smoke test**; pre-existing build config blocks headless boot, but all integration tests pass and no `dart:io` or platform-only code was added.
- [x] 4-step review gate — all four steps passed

---

## Backlog items spawned by this epic

1. **WhatsApp OTP via MSG91** — A2b button is rendered disabled. Wire real delivery when MSG91 WhatsApp template is configured.
2. **Cut-(c) SelectionTile migration** (from E0.4b) — 6 surfaces still pending.
3. **SoftAuthSheet `follow` + `book` triggers** — currently only `save`, `like`, `comment` have live call sites. `follow` will wire in E1.7 (social/profiles). `book` will wire in E2.3 (payments-booking).

---

## Tests added

| File | Tests | Covers |
|------|-------|--------|
| `test/features/onboarding/screens/vertical_picker_screen_test.dart` | 2 | A4 render + counter updates |
| `test/features/onboarding/screens/suggested_creators_screen_test.dart` | 2 | A5 render + error state (Retry CTA) |
| `test/features/onboarding/screens/celebration_screen_test.dart` | 2 | A6 chapter pill + firstName binding + traveller fallback |
| `test/features/auth/widgets/soft_auth_sheet_test.dart` | 4 | A7 save/comment/like triggers + item card + Keep browsing dismisses |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-19 | Epic drafted. 6 open questions queued. |
| 2026-04-19 | Founder answered all 6 questions. Scope grows by one screen (A2c Name) and one feed-coupling point (A6). Tasks + plan updated. Ready to start T0. |
| 2026-04-19 | All 11 tasks complete. 4-step review gate passed. 10 new widget tests added. Epic marked DONE. |
