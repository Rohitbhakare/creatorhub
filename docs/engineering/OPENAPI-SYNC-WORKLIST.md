# OpenAPI sync worklist

> Live state via `pnpm --filter api openapi:drift`. This file is a
> human-readable triage of what to clean up. The drift checker is the
> source of truth — re-run it before starting work to see the current
> count.

## How to use

```bash
pnpm --filter api openapi:drift
```

Pick one bucket from the table below, open
`docs/engineering/openapi.yaml`, and add the missing operations one by
one. Use existing entries (e.g. `POST /api/v1/auth/sign-in`) as a copy
template for request/response schemas. The drift count drops as you go.

## Stale spec entries — remove first (5)

These routes were removed from code but still appear in `openapi.yaml`.
Strip them from the spec entirely:

| Method | Path | Likely replacement in code |
|---|---|---|
| `PATCH` | `/api/v1/users/me` | `PUT /api/v1/users/me` |
| `POST` | `/api/v1/media/confirm` | likely consolidated into `/api/v1/media/upload` flow |
| `POST` | `/api/v1/uploads/signed-url` | replaced by `/api/v1/media/...` |
| `PUT` | `/api/v1/onboarding/location` | replaced by `PUT /api/v1/onboarding/city` |
| `PUT` | `/api/v1/users/me/phone` | currently no code path; phone changes happen via OTP flow |

## In-code-missing-from-spec — by domain (123 total)

Tackle in domain chunks. Each row lists count; M1-critical ones are
flagged for the matching epic so they ship synced when the epic ships.

| Domain | Missing | Epic context |
|---|---|---|
| `experiences` | 17 | E5.4 booking flow + studio creation |
| `content` | 11 | E5.3 reader + E5.5 publishing |
| `bookings` | 11 | E5.4 |
| `discover` | 10 | E5.2 |
| `users` | 7 | E5.6 / E5.7 profile |
| `events` | 7 | E5.4 (group events + RSVPs) |
| `reviews` | 6 | M2 — defer until reviews ship |
| `dpdpa` | 6 | M0 compliance — sync now |
| `studio` | 5 | E5.7 |
| `saved-lists` | 5 | E5.8 (saved tab) |
| `kyc` | 5 | E5.7 |
| `admin` | 5 | E2.8 internal — lower priority |
| `notifications` | 4 | E5.8 |
| `waitlist` | 3 | E5.4 |
| `tax` | 3 | M0 compliance — sync now |
| `onboarding` | 3 | E5.6 |
| `media` | 3 | E5.5 |
| `feed` | 3 | E5.1 |
| `comments` | 2 | M2 |
| `booking-intents` | 2 | E5.4 |
| `reports` | 1 | M2 (T&S) |
| `moderation` | 1 | M2 (T&S) |
| `analytics` | 1 | E2.8 admin |

## Suggested phasing

1. **This week** (M0 compliance + small wins): strip 5 stale + sync `dpdpa` (6) + `tax` (3) + `onboarding` (3) + `feed` (3) = 20 entries / ~2 hours.
2. **As epics ship**: each E5.X PR includes the spec entries for the routes it touches. A reviewer can run `pnpm --filter api openapi:drift` before merge to catch regressions.
3. **Parallel cleanup track**: a contributor picks one un-shipped domain per sitting (`bookings`, `experiences`, etc.) until drift hits zero.

## Known limitations of the drift checker

- Best-effort prefix resolution: a route file whose `const X = new Hono()` local var doesn't match its `app.route('/api/v1/X', X)` import name relies on a filename fallback (looks for `<X>.routes.ts`). Files that break both conventions show up with `Handler endpoints` not in the right prefix bucket.
- Method + path only — request bodies, response schemas, error responses, and auth requirements are not compared. A route can be listed in the spec with the wrong shape and the checker will pass.
- Hono middleware-as-string-literal calls (rare) can produce false "in-code" matches. The current filter (must start with `/`) catches most.
