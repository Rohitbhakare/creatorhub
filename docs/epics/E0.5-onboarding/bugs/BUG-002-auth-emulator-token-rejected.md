# BUG-002 — Firebase Auth Emulator tokens rejected by API server

**Epic:** E0.3 Authentication / E0.5 Onboarding
**Severity:** P0 — Blocks all authenticated flows in development
**Status:** FIXED (2026-04-15)
**Reported:** 2026-04-15

---

## Description

When using the Firebase Auth Emulator for phone OTP on iOS simulator, the emulator issues tokens. The API server's Firebase Admin SDK (`firebaseAuth.verifyIdToken()`) rejects these tokens because it validates against real Firebase, not the emulator.

## Root Cause

`FIREBASE_AUTH_EMULATOR_HOST=localhost:9099` was not set in `apps/api/.env`. Without this env var, the Firebase Admin SDK ignores the local emulator and validates tokens against production Firebase — which rejects emulator-issued tokens.

## Fix Applied

Added `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099` to `apps/api/.env`.

## Related

- `apps/mobile/lib/main.dart` — calls `useAuthEmulator('localhost', 9099)` in debug mode
- `apps/mobile/lib/features/auth/services/auth_service.dart` — uses emulator REST API for `sendOtp`/`verifyOtp` in debug mode (bypasses native iOS SDK reCAPTCHA crash from missing CLIENT_ID)
- `firebase.json` — Auth emulator configured on port 9099
