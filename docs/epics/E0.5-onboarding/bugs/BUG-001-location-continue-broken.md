# BUG-001 — Location screen "Continue" does nothing after city selection

**Epic:** E0.5 Onboarding
**Screen:** Location capture (`/onboarding/location`)
**Severity:** P0 — Blocks entire onboarding flow
**Status:** FIXED (2026-04-15)
**Reported:** 2026-04-15

---

## Description

After selecting a city on the "Where are you based?" screen, tapping "Continue" calls the API (`PUT /api/v1/onboarding/city`) and calls `advanceStep()` in the onboarding provider, but does NOT navigate to the next screen (`/onboarding/verticals`). The user is stuck on the location screen.

## Root Cause

`_onContinue()` in `location_screen.dart:143` calls `ref.read(onboardingProvider.notifier).advanceStep()` which increments the internal step counter from 1 to 2, but there is no `context.go('/onboarding/verticals')` or equivalent navigation call after the API succeeds.

The onboarding screens are separate GoRouter routes (`/onboarding/location`, `/onboarding/verticals`, etc.), and no part of the app listens to `onboardingProvider.currentStep` to trigger navigation. The state change is invisible to the router.

## Steps to Reproduce

1. Launch app → Sign in with phone OTP
2. Land on "Where are you based?" screen
3. Search for a city (e.g., "Pune") → Select it
4. Tap "Continue"
5. **Expected:** Navigate to vertical picker screen (`/onboarding/verticals`)
6. **Actual:** Nothing happens. User stays on location screen.

## Fix

In `location_screen.dart` `_onContinue()`, after `advanceStep()`, add:

```dart
if (mounted) {
  context.go('/onboarding/verticals');
}
```

Same pattern needs to be verified on all onboarding screens:
- `location_screen.dart` → should navigate to `/onboarding/verticals`
- `vertical_picker_screen.dart` → should navigate to `/onboarding/creators`
- `suggested_creators_screen.dart` → should navigate to `/onboarding/celebration`
- `celebration_screen.dart` → should navigate to `/` (home feed)

## Affected Files

- `apps/mobile/lib/features/onboarding/screens/location_screen.dart`
- Potentially: `vertical_picker_screen.dart`, `suggested_creators_screen.dart`, `celebration_screen.dart`

## SRS Reference

- ONB-FR-002: Location capture (mandatory) — user cannot proceed without `current_city_id`
- ONB-FR-003: Vertical interests — next step after location
