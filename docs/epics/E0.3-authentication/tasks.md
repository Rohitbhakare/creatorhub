# E0.3 — Tasks

## T1: Firebase Admin SDK Setup
**Files:** `apps/api/src/lib/firebase.ts`, `apps/api/src/lib/supabase.ts`
**SRS:** IAM-FR-001 (server-side JWT verification)
**Acceptance:** Firebase Admin SDK initialized from service account. Supabase client initialized with service role key. Both export typed singletons. Config loaded from env vars.
**Edge cases:**
- Service account JSON must come from env var (never committed)
- Graceful error if Firebase credentials missing at startup (fail loud in readyz)
- Supabase URL and keys validated on startup

## T2: Auth Middleware
**Files:** `apps/api/src/middleware/authenticate.ts`, `apps/api/src/middleware/requireCreator.ts`, `apps/api/src/middleware/requireKYC.ts`
**SRS:** IAM-FR-001, IAM-FR-010
**Acceptance:** `authenticate` verifies Bearer JWT via firebase-admin, sets `userId` on context. `optionalAuthenticate` passes with `userId: null` if no token. `requireCreator` checks `is_creator`. `requireKYC` checks `kyc_status === 'verified'`. All return proper error responses (401/403).
**Edge cases:**
- Expired token → 401 with `token-expired` error type
- Malformed token (not a JWT) → 401 with `invalid-token`
- Valid Firebase token but user doesn't exist in DB → create user automatically (IAM-FR-001)
- Missing Authorization header with `authenticate` → 401
- Missing Authorization header with `optionalAuthenticate` → proceed with null userId
- `requireCreator` after `optionalAuthenticate` → 401 (must be authenticated first)

## T3: Auth Routes & Handlers
**Files:** `apps/api/src/routes/auth.routes.ts`, `apps/api/src/handlers/auth.ts`
**SRS:** IAM-FR-001, IAM-FR-002, IAM-FR-005
**Acceptance:** `POST /api/v1/auth/register` — upserts user, returns tokens. `POST /api/v1/auth/refresh` — refreshes session. `POST /api/v1/auth/sign-out` — revokes refresh token. All follow OpenAPI spec exactly.
**Edge cases:**
- Register: new user → 201 with Location header; existing user → 200
- Register: extract phone from Firebase token (not from request body)
- Register: handle both Phone and Social provider tokens
- Refresh: expired refresh token → 401
- Refresh: reuse of revoked refresh token → 401 + log security event
- Sign-out: idempotent (no error if already signed out)
- Rate limit: 10 req/min on auth endpoints

## T4: Auth Service & Token Management
**Files:** `apps/api/src/services/auth.service.ts`, `apps/api/src/utils/tokens.ts`
**SRS:** IAM-FR-002
**Acceptance:** Service handles user upsert (INSERT ON CONFLICT UPDATE), generates app session tokens (JWT signed with app secret), manages refresh token rotation. Token expiry: access=1h, refresh=90d mobile / 30d web.
**Edge cases:**
- Token signing key must be ≥256 bits (env var)
- Refresh token stored as SHA-256 hash in DB (not plain text)
- On refresh: old token revoked, new pair issued (rotation)
- Multi-device: each device gets its own refresh token
- `last_login_at` updated on every successful auth
- `device_info` logged in `user_devices` table

## T5: Flutter Auth — Phone OTP Screen
**Files:** `apps/mobile/lib/features/auth/screens/phone_otp_screen.dart`, `apps/mobile/lib/features/auth/providers/auth_provider.dart`
**SRS:** IAM-FR-001
**Acceptance:** Phone input with +91 prefix. OTP auto-detection. 6-digit input with auto-advance. Resend timer (30s). Error states for invalid number, wrong OTP, max attempts, rate limited.
**Edge cases:**
- Phone validation: exactly 10 digits after +91
- OTP resend: greyed out for 30s, max 3 resends per 10 min
- Auto-fill from SMS (Android SMS Retriever API)
- Max 5 verify attempts → lockout message with timer
- Rate limited by server → show "Too many attempts, try again in X minutes"
- Network error during OTP send → retry button, no spinner
- Back button during OTP → confirm "Cancel sign in?"

## T6: Flutter Auth — Social Login
**Files:** `apps/mobile/lib/features/auth/screens/social_login_buttons.dart`
**SRS:** IAM-FR-005, IAM-FR-012
**Acceptance:** "Continue with Google" button (Android + iOS). "Continue with Apple" button (iOS only). OAuth permissions transparency card shown before redirect. On success, calls `/auth/register` with Firebase token.
**Edge cases:**
- Google sign-in: handle user cancellation gracefully (no error screen)
- Apple sign-in: handle first-time (email provided) vs subsequent (email hidden)
- OAuth card: must show before every OAuth redirect, not just first time
- Network error during OAuth → snackbar with retry
- If social login returns phone already registered → link accounts flow (or error)

## T7: Flutter Auth State & Token Storage
**Files:** `apps/mobile/lib/features/auth/providers/auth_state.dart`, `apps/mobile/lib/features/auth/services/auth_service.dart`, `apps/mobile/lib/features/auth/services/secure_storage.dart`
**SRS:** IAM-FR-002, IAM-FR-010
**Acceptance:** Riverpod auth state provider with states: `loading`, `authenticated`, `unauthenticated`, `guest`. Tokens stored in `flutter_secure_storage`. Auto-refresh before expiry. Transparent token attachment on API calls.
**Edge cases:**
- App launch: check for stored tokens → validate → set state
- Token expired on launch: attempt silent refresh → if fails, redirect to login
- Secure storage empty: set `unauthenticated` state
- Guest mode: no tokens stored, API calls use `optionalAuthenticate` endpoints only
- Token refresh race condition: mutex/lock to prevent concurrent refresh calls
- Biometric lock: not in MVP, but secure_storage supports it later

## T8: Soft Auth Wall Component
**Files:** `apps/mobile/lib/shared/components/soft_auth_wall.dart`
**SRS:** IAM-FR-011
**Acceptance:** Bottom sheet triggered on protected actions (book, save, follow, comment, like, publish). Context-aware subheading from caller props. "Not now" dismisses. Sign up / Sign in buttons. Consistent with design system.
**Edge cases:**
- Props must be sanitized before interpolation (no raw HTML/script)
- "Not now" → dismiss, re-triggers on next protected action (not sticky)
- Already authenticated → never shows (guard in the trigger function)
- If user signs up from wall → persist any device-local saves (ONB offer)
- Animation: slide up 240ms (design system spec)
- Accessibility: focus trap while open, dismiss via swipe down or button

## T9: Rate Limiting Middleware
**Files:** `apps/api/src/middleware/rateLimit.ts`
**SRS:** api.md rate limit rules
**Acceptance:** Rate limiting using in-memory store (MVP) or Redis. Auth endpoints: 10 req/min. General endpoints: 100 req/min. Returns 429 with `Retry-After` header.
**Edge cases:**
- Rate limit key: IP for unauthenticated, userId for authenticated
- OTP send: 5 per phone per hour (separate from general auth limit)
- Burst allowance: use sliding window, not fixed window
- Rate limit headers on all responses: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Distributed rate limiting deferred to V1 (Redis required)

## T10: Audit Event Logging
**Files:** `apps/api/src/services/audit.service.ts`
**SRS:** IAM-FR-002, IAM-FR-009 (phone change audit)
**Acceptance:** `logAuditEvent(userId, eventType, metadata)` function. Events: `sign_in`, `sign_out`, `sign_up`, `token_refresh`, `phone_changed`, `device_added`. Metadata includes IP, user-agent, device info.
**Edge cases:**
- Audit logging must never throw (fire-and-forget, catch all errors)
- Never log tokens, OTP codes, or PII in metadata
- IP address: extract from `X-Forwarded-For` (behind Cloudflare/Fly proxy)
- Audit events written with service role (bypass RLS)
