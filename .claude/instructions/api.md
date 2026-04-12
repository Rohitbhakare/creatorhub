# API Instructions

> Read this before writing any API code. Non-negotiable rules for every endpoint.

## Stack

- **Framework:** Hono (TypeScript) on Fly.io / Railway
- **Database:** Supabase Postgres (direct SQL via `@supabase/supabase-js` — no ORM)
- **Auth:** Firebase Phone OTP → JWT verified server-side
- **Validation:** Zod schemas in `packages/shared/src/schemas/`
- **Spec:** Every endpoint MUST exist in `docs/engineering/openapi.yaml` (OpenAPI 3.1.0) before implementation

---

## 1. REST Principles

### Resource-Oriented URLs

```
# Good — resources are nouns, plural
GET    /api/v1/itineraries
GET    /api/v1/itineraries/:id
POST   /api/v1/itineraries
PUT    /api/v1/itineraries/:id
DELETE /api/v1/itineraries/:id

# Good — sub-resources for ownership
GET    /api/v1/itineraries/:id/spots
POST   /api/v1/itineraries/:id/spots

# Good — actions as sub-resources when CRUD doesn't fit
POST   /api/v1/itineraries/:id/publish
POST   /api/v1/bookings/:id/cancel

# Bad — verbs in path, query-based actions
GET    /api/v1/getItinerary?id=123
POST   /api/v1/createBooking
```

### HTTP Semantics

| Method | Purpose | Idempotent | Body |
|--------|---------|------------|------|
| GET | Read resource(s) | Yes | No |
| POST | Create resource / trigger action | No | Yes |
| PUT | Full replace of resource | Yes | Yes |
| PATCH | Partial update | No | Yes |
| DELETE | Remove resource (soft-delete) | Yes | No |

### Status Codes — Use Correctly

| Code | When |
|------|------|
| 200 | Successful GET, PUT, PATCH, DELETE |
| 201 | Successful POST that created a resource (include `Location` header) |
| 204 | Successful DELETE with no body |
| 400 | Validation failed (Zod errors) |
| 401 | No token or token expired |
| 403 | Token valid but insufficient permissions (not creator, not owner, KYC incomplete) |
| 404 | Resource not found |
| 409 | Conflict (duplicate username, seat already held) |
| 422 | Request understood but business rule violated (e.g., booking own experience) |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error (log to Sentry, never expose internals) |

### Stateless

- No server-side sessions. Every request carries its own auth (Bearer JWT).
- No sticky sessions. Any server instance handles any request.
- Transient state (OTP codes, seat holds) goes in Supabase or Redis, never in memory.

---

## 2. Path Versioning

All routes prefixed with `/api/v1/`. No exceptions.

```typescript
const v1 = app.basePath('/api/v1')
v1.route('/itineraries', itineraryRoutes)
v1.route('/bookings', bookingRoutes)
```

When v2 is needed (breaking changes only), mount `/api/v2/` alongside v1. Keep v1 alive until all clients migrate. Deprecate with `Sunset` header (RFC 8594).

---

## 3. Request & Response Shapes

### Success Response (all endpoints)

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 142
  }
}
```

- `meta` only on paginated endpoints
- `data` is the resource or array of resources
- Single resource: `"data": { "id": "...", ... }`
- Collection: `"data": [ { ... }, { ... } ]`

### Error Response (RFC 9457 Problem Details)

```json
{
  "success": false,
  "error": {
    "type": "https://creatorhub.in/errors/validation-failed",
    "title": "Validation Failed",
    "status": 400,
    "detail": "Title must be between 3 and 200 characters.",
    "instance": "/api/v1/itineraries",
    "errors": [
      {
        "field": "title",
        "message": "String must contain at least 3 character(s)",
        "code": "too_small"
      }
    ]
  }
}
```

- `type`: URI identifying the error type (use app-specific error catalog)
- `title`: Human-readable summary (same for all instances of this type)
- `status`: HTTP status code (duplicated for convenience)
- `detail`: Human-readable explanation specific to this occurrence
- `instance`: The request path
- `errors`: Array of field-level errors (validation only)
- Content-Type: `application/problem+json` for errors

### Pagination

Cursor-based for feeds and lists (not offset — offset breaks on inserts):

```
GET /api/v1/itineraries?cursor=eyJ...&limit=20
```

Response includes:

```json
{
  "meta": {
    "next_cursor": "eyJ...",
    "has_more": true,
    "per_page": 20
  }
}
```

### Link Headers (RFC 8288)

For paginated responses and resource relations:

```
Link: </api/v1/itineraries?cursor=eyJ...>; rel="next",
      </api/v1/itineraries>; rel="self"
```

For created resources:

```
Location: /api/v1/itineraries/abc123
```

---

## 4. Security — Every Endpoint

### Authentication Middleware

```typescript
// Required auth — returns 401 if no valid token
app.use('/api/v1/*', authenticate)

// Per-route: optional auth for guest browsing
app.get('/api/v1/itineraries/:id', optionalAuthenticate, getItinerary)

// Creator-only endpoints
app.post('/api/v1/itineraries', authenticate, requireCreator, createItinerary)
```

### Rules

- Every endpoint MUST use `authenticate` or `optionalAuthenticate` — no unprotected routes
- `requireCreator` checks `user.is_creator === true`
- `requireKYC` checks `user.kyc_status === 'approved'` (for publishing paid content)
- Firebase JWT verified server-side via `firebase-admin` — never trust client-decoded tokens
- Rate limiting on all endpoints: 100 req/min general, 10 req/min on auth endpoints
- All SQL queries use parameterized statements — never string concatenation
- Validate ALL input with Zod before processing (including path params and query params)
- Never expose internal IDs, stack traces, or DB errors in responses
- Google Places API key stays server-side — proxy through `/api/v1/places/*`

### CORS

```typescript
app.use(cors({
  origin: ['https://creatorhub.in', 'http://localhost:3000'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))
```

---

## 5. Health Check Endpoints

Two endpoints, outside auth middleware, for K8s probes and CI/CD:

```typescript
// Liveness — is the process alive?
// K8s: livenessProbe, CI/CD: deployment smoke test
// Returns 200 if the server process is running. No dependency checks.
app.get('/healthz', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Readiness — can it serve traffic?
// K8s: readinessProbe
// Checks DB connection and critical dependencies.
app.get('/readyz', async (c) => {
  const checks = {
    database: false,
    firebase: false,
  }
  try {
    await supabase.from('cities').select('id').limit(1)
    checks.database = true
  } catch {}
  try {
    await firebaseAdmin.auth().verifyIdToken // just check SDK is initialized
    checks.firebase = true
  } catch {}
  
  const ready = Object.values(checks).every(Boolean)
  return c.json(
    { status: ready ? 'ready' : 'degraded', checks, timestamp: new Date().toISOString() },
    ready ? 200 : 503
  )
})
```

- `/healthz` and `/readyz` are NOT prefixed with `/api/v1/` — they're infra endpoints
- No auth required on health endpoints
- K8s config: `livenessProbe` → `/healthz`, `readinessProbe` → `/readyz`
- CI/CD: hit `/readyz` after deploy, wait for 200 before marking deployment complete

---

## 6. API Lifecycle

### Development Stages

```
Draft (OpenAPI spec) → Implemented → Tested → Deployed (staging) → Released (prod)
```

### Versioning & Deprecation

- **Non-breaking changes** (add field, add endpoint): no version bump, deploy directly
- **Breaking changes** (remove field, change shape, rename): bump to v2, run both versions
- **Deprecation**: add `Sunset: <date>` header + `Deprecation: true` header on old version
- **Removal**: minimum 90 days after Sunset header added (for MVP, can be shorter — 30 days)

### Changelog

Maintain `CHANGELOG.md` in `apps/api/` with:

```markdown
## [Unreleased]

### Added
- POST /api/v1/itineraries/:id/spots — add spot to itinerary

### Changed
- GET /api/v1/feed — added `vertical` filter parameter

### Deprecated
- GET /api/v1/experiences — use /api/v1/content?type=scheduled_experience

### Removed
- (nothing yet)
```

---

## 7. File & Code Structure

```
apps/api/src/
├── index.ts              # Hono app setup, middleware, health checks
├── routes/
│   ├── auth.routes.ts    # /api/v1/auth/*
│   ├── content.routes.ts # /api/v1/content/*, /api/v1/itineraries/*, etc.
│   ├── bookings.routes.ts
│   ├── feed.routes.ts
│   ├── places.routes.ts  # Google Places proxy
│   └── users.routes.ts
├── handlers/             # Request handlers (thin — validate, call service, respond)
├── services/             # Business logic (testable, no HTTP context)
├── db/
│   ├── queries/          # Raw SQL query functions (parameterized)
│   └── migrations/       # Supabase migrations
├── middleware/
│   ├── authenticate.ts   # Firebase JWT verification
│   ├── requireCreator.ts
│   ├── requireKYC.ts
│   ├── rateLimit.ts
│   ├── validate.ts       # Zod validation middleware
│   └── errorHandler.ts   # Global error handler (RFC 9457 format)
├── errors/
│   └── AppError.ts       # Custom error class with type, status, detail
└── utils/
    ├── money.ts          # Paisa conversion, tax calculations
    └── pagination.ts     # Cursor encode/decode
```

### Handler Pattern

Handlers are thin — validate input, call service, format response:

```typescript
// handlers/itineraries.ts
export const createItinerary = async (c: Context) => {
  const body = await c.req.json()
  const validated = createItinerarySchema.parse(body)
  const userId = c.get('userId')
  
  const itinerary = await itineraryService.create(userId, validated)
  
  c.header('Location', `/api/v1/itineraries/${itinerary.id}`)
  return c.json({ success: true, data: itinerary }, 201)
}
```

### Service Pattern

Services contain business logic, are HTTP-agnostic, testable:

```typescript
// services/itinerary.service.ts
export const create = async (userId: string, input: CreateItineraryInput) => {
  // Business logic here — validation, DB writes, side effects
  const { data, error } = await supabase
    .from('content')
    .insert({ user_id: userId, type: 'self_paced_itinerary', ...input })
    .select()
    .single()

  if (error) throw new AppError('db-error', 500, 'Failed to create itinerary')
  return data
}
```

---

## 8. Amounts & Money

- ALL monetary amounts stored and transmitted in **paisa** (integer) — never rupees (float)
- API accepts paisa, returns paisa
- Client is responsible for display formatting (`₹6,500` = `650000` paisa)
- Tax calculations in paisa with Math.round() — no floating point
- GST: `Math.round(baseAmountPaisa * 0.18)`
- Platform fee: `Math.round(baseAmountPaisa * feeRate)`
- TDS: `Math.round(creatorPayoutPaisa * 0.01)`

---

## 9. Error Handling

### AppError Class

```typescript
class AppError extends Error {
  constructor(
    public type: string,     // e.g., 'validation-failed', 'not-found'
    public status: number,   // HTTP status code
    public detail: string,   // Human-readable explanation
    public errors?: FieldError[] // Field-level errors (validation)
  ) {
    super(detail)
  }
}
```

### Global Error Handler

```typescript
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({
      success: false,
      error: {
        type: `https://creatorhub.in/errors/${err.type}`,
        title: ERROR_TITLES[err.type],
        status: err.status,
        detail: err.detail,
        instance: c.req.path,
        ...(err.errors && { errors: err.errors }),
      }
    }, err.status as StatusCode)
  }

  // Unexpected error — log to Sentry, return generic 500
  Sentry.captureException(err)
  return c.json({
    success: false,
    error: {
      type: 'https://creatorhub.in/errors/internal',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred.',
      instance: c.req.path,
    }
  }, 500)
})
```

---

## 10. Logging

- **Structured JSON logs** (not console.log strings)
- Log: request method, path, status, duration, userId (if authed), error details
- Never log: passwords, tokens, PAN numbers, Aadhaar numbers, bank details, full request bodies
- Use Hono's built-in logger middleware + Sentry for errors
- Log levels: `info` (request/response), `warn` (rate limited, deprecated endpoint hit), `error` (500s, unhandled)
