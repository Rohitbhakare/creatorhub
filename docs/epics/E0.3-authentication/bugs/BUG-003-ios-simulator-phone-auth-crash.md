# BUG-003 — iOS simulator crash on phone auth (missing CLIENT_ID)

**Epic:** E0.3 Authentication
**Severity:** P0 — Blocks all phone auth testing on iOS simulator
**Status:** WORKAROUND applied
**Reported:** 2026-04-15

---

## Description

Firebase phone auth crashes with `EXC_BREAKPOINT/SIGTRAP` on iOS simulator when `verifyPhoneNumber` is called. The native Firebase iOS SDK force-unwraps `CLIENT_ID` from `GoogleService-Info.plist` to configure reCAPTCHA fallback (since simulators lack APNs). The field is missing, causing a nil unwrap crash at `PhoneAuthProvider.swift:109`.

## Root Cause

`GoogleService-Info.plist` is missing `CLIENT_ID` and `REVERSED_CLIENT_ID` fields. These are normally present when an OAuth 2.0 Client ID is created for the iOS app in the Google Cloud Console. Without them, `useAuthEmulator` and `setSettings(appVerificationDisabledForTesting: true)` both fail to prevent the native crash.

## Workaround Applied

In debug mode (`kDebugMode`), bypass the native `verifyPhoneNumber` SDK entirely and use the Firebase Auth Emulator's REST API directly:

1. `sendOtp` → `POST http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode`
2. `verifyOtp` → `POST http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber`
3. OTP code is printed in Flutter debug console from emulator's verification codes endpoint

## Permanent Fix (for production)

Create an OAuth 2.0 Client ID in Google Cloud Console:
1. Go to GCP Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID for iOS (bundle ID: `in.creatorhub.creatorhub`)
3. Download updated `GoogleService-Info.plist` with `CLIENT_ID` and `REVERSED_CLIENT_ID`
4. Add `REVERSED_CLIENT_ID` to `Info.plist` → `CFBundleURLTypes` → `CFBundleURLSchemes`

## Affected Files

- `apps/mobile/lib/features/auth/services/auth_service.dart` — emulator REST API methods added
- `apps/mobile/lib/main.dart` — `useAuthEmulator('localhost', 9099)` in debug mode
- `apps/mobile/ios/Runner/GoogleService-Info.plist` — missing CLIENT_ID (root cause)
- `apps/api/.env` — added `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`
