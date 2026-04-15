# Logging Standards

> Read this before adding any logging to the API or mobile app.

---

## API Logging (Hono)

### Middleware Stack

Request logging is handled by `src/middleware/requestLogger.ts` — do NOT add per-route `console.log` for request/response tracking.

### What Gets Logged Automatically

| Event | Dev | Prod | Format |
|-------|-----|------|--------|
| Every request (method, path, status, duration) | Yes | Yes | `✅ GET /api/v1/cities 200 12ms` |
| Mutation request bodies (POST/PUT/PATCH/DELETE) | Yes | No | `→ POST /api/v1/auth/register body: {...}` |
| AppError (type, status, detail) | Yes | No | `⚠️ AppError [401] invalid-token: ...` |
| Unhandled errors (message + stack trace) | Yes (full stack) | Yes (message only) | `❌ Unhandled error on POST /path: ...` |
| Firebase emulator status | Yes | No | `🔐 Firebase Auth Emulator enabled: localhost:9099` |

### Status Icons

```
✅  2xx — success
⚠️  4xx — client error (bad input, auth failure)
❌  5xx — server error (unhandled, DB failure)
```

### Rules

1. **Never log PII** — no phone numbers, emails, names, tokens, passwords in production logs. In dev, `firebase_token` and `refresh_token` are auto-redacted.

2. **Never log raw tokens** — use `[REDACTED]` or log only the last 8 chars for debugging: `token: ...${token.slice(-8)}`

3. **Use structured context** — when adding debug logs in services, include the operation name:
   ```typescript
   console.error(`[auth.register] DB upsert failed:`, error.message)
   console.error(`[feed.nearYou] RPC call failed:`, error.message)
   ```

4. **Log at the right level:**
   - `console.log` — informational (startup, config, state changes)
   - `console.warn` — degraded but recoverable (fallback triggered, retry)
   - `console.error` — failure requiring attention (DB error, external API down)

5. **Don't log in hot paths** — avoid logging on every DB query or every item in a loop. Log at the boundary (handler entry/exit).

6. **Service errors → throw, don't log** — services should throw `AppError`. The error handler middleware logs it. Don't double-log.
   ```typescript
   // BAD — double log
   console.error('user not found')
   throw new AppError('not-found', 404, 'User not found')

   // GOOD — error handler logs it
   throw new AppError('not-found', 404, 'User not found')
   ```

7. **Exception: unrecoverable context** — log before throwing ONLY when the thrown error loses important context:
   ```typescript
   // OK — the Supabase error details won't survive the AppError
   console.error(`[auth.register] Supabase upsert error:`, upsertError)
   throw new AppError('db-error', 500, 'Failed to create user record')
   ```

### Adding Logs to a New Service

```typescript
// At the top of the function — NOT on every call, only for debug sessions
// Remove or guard behind isDev before shipping

import { env } from '../env.js'
const isDev = env.NODE_ENV === 'development'

// In the service function:
if (isDev) console.log(`[serviceName.method] input:`, sanitizedInput)
```

---

## Mobile Logging (Flutter)

### Rules

1. **Use `debugPrint()`** — never `print()`. `debugPrint` is throttled and stripped from release builds.

2. **Prefix logs with feature area:**
   ```dart
   debugPrint('[Auth] OTP sent for +91$phone');
   debugPrint('[Feed] Loading near-you section for city=$cityId');
   debugPrint('[Onboarding] Step $step complete, advancing');
   ```

3. **Log Dio errors with status + path:**
   ```dart
   } on DioException catch (e) {
     debugPrint('[Auth] API error: ${e.response?.statusCode} ${e.requestOptions.path}');
   }
   ```

4. **Never log tokens or credentials** — redact in debug output.

5. **Use `kDebugMode` guard** for verbose logs:
   ```dart
   if (kDebugMode) {
     debugPrint('[Feed] Response items: ${items.length}');
   }
   ```

---

## Viewing Logs

| Service | Where | Command |
|---------|-------|---------|
| API | Tab 2 terminal | `pnpm dev` output |
| Flutter | Tab 3 terminal | `flutter run` output |
| Firebase Emulator | Tab 1 terminal | `firebase emulators:start` output |
| iOS Simulator system log | Terminal | `xcrun simctl spawn <id> log stream --predicate 'process == "Runner"'` |