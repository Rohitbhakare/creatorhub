# High-Level Design (HLD) — CreatorHub

**Version:** 1.0
**Date:** 2026-04-12
**Status:** Draft — awaiting founder review

---

## 1. System Overview

CreatorHub is a mobile-first travel social platform with a thin API layer, managed database, and minimal web presence for SEO.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│                                                              │
│   ┌──────────┐    ┌──────────────┐    ┌───────────────┐     │
│   │  Flutter  │    │   Next.js    │    │  Next.js      │     │
│   │  Mobile   │    │   Web (SSR)  │    │  Admin Web    │     │
│   │  iOS/Andr │    │  mini-site   │    │  /admin/*     │     │
│   └─────┬─────┘    └──────┬───────┘    └───────┬───────┘     │
│         │                 │                     │             │
└─────────┼─────────────────┼─────────────────────┼─────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE                               │
│              CDN + DNS + Rate Limiting                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Hono API    │  │   Supabase   │  │   Firebase   │
│  (Fly.io)    │  │   Postgres   │  │   Services   │
│              │  │   + PostGIS  │  │              │
│  - Auth      │  │              │  │  - Auth (OTP)│
│  - Content   │  │  - RLS       │  │  - Storage   │
│  - Bookings  │  │  - tsvector  │  │  - FCM       │
│  - Payments  │  │  - Cron jobs │  │              │
│  - Places    │  │              │  │              │
│    proxy     │  │              │  │              │
└──────┬───────┘  └──────────────┘  └──────────────┘
       │
       ├──────────────┐
       ▼              ▼
┌──────────┐  ┌──────────────┐
│ Razorpay │  │   External   │
│ Gateway  │  │   APIs       │
│ + Route  │  │              │
│ (escrow) │  │  - Places    │
│          │  │  - Perspective│
│          │  │  - Vision    │
│          │  │  - WhatsApp  │
│          │  │  - SendGrid  │
└──────────┘  └──────────────┘
```

---

## 2. Component Architecture

### 2.1 Hono API Server (apps/api)

The API is a **stateless TypeScript service** running on Fly.io. It handles all business logic, external integrations, and serves as the single backend for both Flutter and Next.js.

```
Request → Cloudflare → Fly.io → Hono
                                  │
                                  ├─ Middleware chain:
                                  │   cors → rateLimit → authenticate → validate
                                  │
                                  ├─ Route → Handler → Service → DB Query
                                  │
                                  └─ Response (JSON)
```

**Why Hono over Express:** Lighter (~14KB), faster cold starts on Fly.io, built-in TypeScript, Web Standard APIs (portable to Edge if needed later).

**Responsibilities:**
- Firebase JWT verification
- Business logic (booking state machine, tax calculations, payout logic)
- Google Places API proxy (key never exposed to client)
- Razorpay webhook processing
- KYC submission handling
- Content moderation orchestration (Perspective API, Vision SafeSearch)
- Media upload URL generation (Firebase Storage signed URLs)

**Does NOT handle:**
- Static file serving (Cloudflare CDN / Firebase Storage)
- Real-time connections (not needed for MVP)
- Background job scheduling (Supabase cron / pg_cron)

### 2.2 Flutter Mobile App (apps/mobile)

```
┌─────────────────────────────────────────────┐
│                 Flutter App                  │
│                                              │
│  ┌────────┐  ┌────────────┐  ┌───────────┐ │
│  │ Screens │  │ Providers  │  │ Services  │ │
│  │ (UI)    │←─│ (State)    │←─│ (API/IO)  │ │
│  └────────┘  └────────────┘  └─────┬─────┘ │
│                                     │       │
│  ┌────────────────┐  ┌─────────────┴──┐    │
│  │ GoRouter       │  │ API Client     │    │
│  │ (Navigation)   │  │ (HTTP → Hono)  │    │
│  └────────────────┘  └────────────────┘    │
│                                              │
│  ┌────────────────┐  ┌────────────────┐     │
│  │ Theme          │  │ Secure Storage │     │
│  │ (Design System)│  │ (Tokens)       │     │
│  └────────────────┘  └────────────────┘     │
└──────────────────────────────────────────────┘
```

**State Management:** Riverpod
- Chosen for: compile-time safety, testability, no BuildContext dependency, auto-dispose
- Alternative considered: Bloc (rejected: more boilerplate, less suited for solo dev velocity)

**Navigation:** GoRouter
- Declarative routes, deep link support, redirect guards for auth

**Architecture Pattern:** Feature-first folders
```
lib/
├── features/
│   ├── auth/         # screens, providers, services for auth
│   ├── feed/         # home feed feature
│   ├── content/      # create/view content
│   ├── booking/      # booking flow
│   ├── profile/      # user profile
│   ├── studio/       # creator dashboard
│   └── saved/        # wishlists
├── shared/
│   ├── components/   # reusable widgets
│   ├── theme/        # colors, typography, spacing
│   └── utils/        # formatPrice, formatDuration
└── app/              # app widget, router, providers
```

### 2.3 Next.js Web App (apps/web) — MVP Minimal

SSR-only public pages. No client-side auth, no interactive features.

```
apps/web/src/app/
├── page.tsx                          # / — marketing home
├── [vertical]/[username]/page.tsx    # /travel/riya — creator mini-site (SSR)
├── content/[id]/page.tsx             # /content/abc — detail page (SSR)
├── terms/page.tsx                    # legal pages
├── privacy/page.tsx
└── community-guidelines/page.tsx
```

**Data fetching:** Server components fetch from Hono API using service-to-service calls (no auth needed for public data).

### 2.4 Supabase Postgres

**Role:** Primary data store. All tables, RLS policies, indexes, cron jobs.

**Key design decisions:**
- **Direct SQL** — no ORM. Supabase JS client for CRUD, `supabase.rpc()` for complex queries.
- **PostGIS** — nearest-neighbor queries for "Near You" feed section (`ST_DWithin`)
- **tsvector** — full-text search for MVP (migrate to Meilisearch at V1)
- **RLS** — Row-Level Security on all tables. API uses service role key (bypasses RLS) for admin operations. Client never directly accesses Supabase.
- **pg_cron** — scheduled jobs (search history cleanup, payout processing)

### 2.5 Firebase Services

| Service | Purpose | How Used |
|---------|---------|----------|
| **Firebase Auth** | Phone OTP + Social Login | Flutter SDK for OTP flow → issues JWT → Hono verifies with firebase-admin |
| **Firebase Storage** | Media files (images, KYC docs) | Hono generates signed upload URLs → Flutter uploads directly → Hono stores the path |
| **FCM** | Push notifications | Hono sends via firebase-admin SDK → Flutter receives natively |

**Why Firebase Auth over Supabase Auth:** Better phone OTP support in India (MSG91 integration, DLT compliance handled), proven at scale with Indian phone numbers.

---

## 3. Data Flows

### 3.1 Authentication Flow

```
Flutter                    Firebase Auth              Hono API              Supabase
  │                            │                        │                     │
  ├─ Enter phone ────────────► │                        │                     │
  │                            ├─ Send OTP (MSG91) ──►  │                     │
  │  ◄─── OTP on phone ───────┤                        │                     │
  ├─ Enter OTP ──────────────► │                        │                     │
  │                            ├─ Verify ───►           │                     │
  │  ◄─── Firebase JWT ───────┤                        │                     │
  ├─ POST /auth/register ─────┼───────────────────────► │                     │
  │  (with Firebase JWT)       │                        ├─ Verify JWT         │
  │                            │                        ├─ Upsert user ─────► │
  │                            │                        │  ◄── user record ───┤
  │  ◄─── Session token ──────┼────────────────────────┤                     │
  │                            │                        │                     │
  │  (store in Secure Storage) │                        │                     │
```

### 3.2 Content Creation Flow

```
Flutter                    Hono API              Supabase            Firebase Storage
  │                           │                     │                     │
  ├─ POST /content/draft ───► │                     │                     │
  │  (title, vertical, type)  ├─ INSERT draft ────► │                     │
  │  ◄── draft ID ───────────┤                     │                     │
  │                           │                     │                     │
  ├─ Upload images ──────────┼─────────────────────┼───────────────────► │
  │  (signed URL)             │                     │                     │
  │  ◄── image URLs ─────────┼─────────────────────┼─────────────────── ┤
  │                           │                     │                     │
  ├─ PUT /content/:id ──────► │                     │                     │
  │  (add images, spots, etc) ├─ UPDATE content ──► │                     │
  │                           │                     │                     │
  ├─ POST /content/:id/      │                     │                     │
  │  publish ────────────────►├─ Validate           │                     │
  │                           ├─ Check KYC (if paid)│                     │
  │                           ├─ Moderate text ───► Perspective API       │
  │                           ├─ Moderate images ─► Vision SafeSearch     │
  │                           ├─ UPDATE status ───► │                     │
  │  ◄── published ──────────┤                     │                     │
```

### 3.3 Booking & Payment Flow

```
Flutter              Hono API           Razorpay          Supabase
  │                     │                  │                 │
  ├─ POST /bookings ──► │                  │                 │
  │  (content_id, date) ├─ Check seats     │                 │
  │                     ├─ Hold seat ─────►│                 │── INSERT booking_intent
  │                     ├─ Create order ──►│                 │
  │  ◄── order_id ──────┤                  │                 │
  │                     │                  │                 │
  ├─ Open Razorpay ─────┼─────────────────►│                 │
  │  Checkout            │                  │                 │
  │  (UPI / Card / etc)  │                  │                 │
  │  ◄── payment done ──┼──────────────────┤                 │
  │                     │                  │                 │
  │                     │  ◄── webhook ────┤                 │
  │                     ├─ Verify sig      │                 │
  │                     ├─ Idempotent chk  │                 │
  │                     ├─ Confirm ──────────────────────────►── UPDATE booking
  │                     ├─ Hold in escrow  │                 │   (status: confirmed)
  │                     │  (Razorpay Route)│                 │
  │  ◄── confirmation ──┤                  │                 │
  │                     │                  │                 │
  │  ... experience completes ...          │                 │
  │                     │                  │                 │
  │                     ├─ Wait 48h        │                 │── Dispute window
  │                     ├─ Release payout ►│                 │
  │                     │  (Route transfer)│                 │
  │                     ├─ Deduct TDS (1%) │                 │
  │                     ├─ Record payout ──────────────────► │── INSERT payout
```

### 3.4 Feed Query Flow

```
Flutter                    Hono API                     Supabase (PostGIS)
  │                           │                             │
  ├─ GET /feed               │                             │
  │  ?lat=&lng=&verticals=   │                             │
  │ ────────────────────────► │                             │
  │                           ├─ Section: "Near You"        │
  │                           │  ST_DWithin(geom, $1, 50km)│
  │                           │ ──────────────────────────► │
  │                           │  ◄── content within 50km ──┤
  │                           │                             │
  │                           ├─ Section: "Travel Creators" │
  │                           │  WHERE vertical = 'travel'  │
  │                           │  AND user_id IN (followed)  │
  │                           │ ──────────────────────────► │
  │                           │  ◄── content ──────────────┤
  │                           │                             │
  │                           ├─ Section: "Stories"          │
  │                           │  WHERE vertical = 'stories' │
  │                           │ ──────────────────────────► │
  │                           │  ◄── content ──────────────┤
  │                           │                             │
  │                           ├─ Assemble sections          │
  │  ◄── { sections: [...] } ┤                             │
```

---

## 4. Deployment Architecture

### MVP (Weeks 1-12)

```
┌──────────────────────────────────────────┐
│              Cloudflare                   │
│     DNS + CDN + DDoS + Rate Limit        │
└────────────┬─────────────────────────────┘
             │
     ┌───────┴───────┐
     ▼               ▼
┌─────────┐    ┌──────────┐
│ Fly.io  │    │  Vercel  │
│ (Hono)  │    │ (Next.js)│
│         │    │          │
│ 1 inst  │    │ Serverl. │
│ 256MB   │    │          │
└────┬────┘    └──────────┘
     │
     ├─────────────────────┐
     ▼                     ▼
┌──────────┐        ┌───────────┐
│ Supabase │        │ Firebase  │
│ Free/Pro │        │ Spark/    │
│          │        │ Blaze     │
│ Postgres │        │           │
│ PostGIS  │        │ Auth      │
│ pg_cron  │        │ Storage   │
│          │        │ FCM       │
└──────────┘        └───────────┘
```

**Costs (MVP estimate):**
- Fly.io: ~$5/mo (1 shared-cpu, 256MB)
- Supabase: Free tier → Pro ($25/mo) at ~Week 3
- Firebase: Spark (free) → Blaze (pay-as-you-go, ~$5-20/mo for storage)
- Vercel: Free tier (hobby, fine for minimal SSR pages)
- Cloudflare: Free tier
- **Total: ~$35-50/mo**

### V1 Scale-Up

- Fly.io: 2 instances, 512MB each, auto-scale
- Supabase Pro with connection pooling
- Upstash Redis for rate limiting + caching
- Meilisearch Cloud for search
- **Total: ~$100-150/mo**

---

## 5. API Architecture

### 5.1 Middleware Chain

```
Every request passes through (in order):

1. CORS          → origin whitelist
2. Rate Limiter  → per-IP or per-user limits
3. Request Logger→ structured JSON (method, path, duration)
4. Auth          → authenticate | optionalAuthenticate
5. Validator     → Zod schema on body/params/query
6. Handler       → thin (validate → service → respond)
7. Error Handler → catches AppError → RFC 9457 response
```

### 5.2 Handler → Service → Query Pattern

```typescript
// Route
app.post('/api/v1/itineraries', authenticate, requireCreator, createItinerary)

// Handler (thin — no business logic)
async function createItinerary(c: Context) {
  const body = createItinerarySchema.parse(await c.req.json())
  const userId = c.get('userId')
  const result = await itineraryService.create(userId, body)
  c.header('Location', `/api/v1/itineraries/${result.id}`)
  return c.json({ success: true, data: result }, 201)
}

// Service (business logic, testable)
const itineraryService = {
  async create(userId: string, input: CreateItineraryInput) {
    // validate business rules, call DB, handle side effects
    return await db.itineraries.insert({ user_id: userId, ...input })
  }
}

// DB Query (raw SQL via Supabase client)
const db = {
  itineraries: {
    async insert(data) {
      const { data: row, error } = await supabase
        .from('content')
        .insert(data)
        .select()
        .single()
      if (error) throw new AppError('db-error', 500, error.message)
      return row
    }
  }
}
```

### 5.3 Endpoint Groups

| Group | Base Path | Auth | Key Endpoints |
|-------|-----------|------|---------------|
| Health | `/healthz`, `/readyz` | None | Liveness, readiness |
| Auth | `/api/v1/auth` | None/Optional | OTP request, verify, register, refresh |
| Users | `/api/v1/users` | Required | Profile CRUD, follow/unfollow |
| Content | `/api/v1/content` | Required/Optional | CRUD, publish, draft, list |
| Itineraries | `/api/v1/itineraries` | Required/Optional | Spots CRUD, detail |
| Feed | `/api/v1/feed` | Optional | Section-based feed |
| Search | `/api/v1/search` | Optional | tsvector query |
| Bookings | `/api/v1/bookings` | Required | Create, cancel, list |
| Reviews | `/api/v1/reviews` | Required | Create, list |
| KYC | `/api/v1/kyc` | Required + Creator | Submit, status, resubmit |
| Places | `/api/v1/places` | Required + Creator | Autocomplete, details (proxy) |
| Notifications | `/api/v1/notifications` | Required | Preferences, list |
| Saved Lists | `/api/v1/saved-lists` | Required | CRUD, add/remove items |
| Webhooks | `/api/v1/webhooks` | Signature verify | Razorpay events |

---

## 6. Database Architecture

### 6.1 Core Tables (see SRS §5 for full DDL)

```
users ─────────────┐
  │                 │
  ├── content ──────┼── itinerary_days ── itinerary_spots
  │     │           │
  │     ├── likes   │
  │     ├── comments│
  │     └── bookings ── booking_financials ── payments ── refunds
  │                 │
  ├── follows       │
  ├── saved_lists ──┼── saved_list_items
  ├── kyc_submissions
  ├── user_social_accounts
  └── user_notification_preferences
  
cities (seeded, ~4000 Indian cities with PostGIS POINT)
vertical_sub_categories (seeded, 3-level taxonomy)
cancellation_policy_versions (seeded, 3 policies)
```

### 6.2 Key Indexes

- `content(user_id)` — creator's content list
- `content(vertical, status)` — feed queries
- `content(location GIST)` — PostGIS nearest-neighbor
- `content(tsvector)` — full-text search (GIN)
- `bookings(user_id, status)` — user's bookings
- `follows(follower_id)` + `follows(following_id)` — social graph
- `cities(location GIST)` — nearest city lookup

### 6.3 Multi-Vertical Schema Strategy

Content uses a **single table** with a `vertical` enum and `vertical_data` JSONB column:

```sql
CREATE TABLE content (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type content_type NOT NULL,          -- post | self_paced_itinerary | scheduled_experience | event
  vertical vertical_type NOT NULL,     -- travel | stories | food | fitness | ...
  vertical_data JSONB DEFAULT '{}',    -- vertical-specific fields
  sub_category_id UUID,                -- 3-level taxonomy
  -- ... common fields (title, description, images, etc.)
);
```

This avoids table-per-vertical while keeping queries fast (indexed `vertical` enum).

---

## 7. Security Architecture

See `.claude/instructions/infosec.md` for implementation rules.

### 7.1 Auth Chain

```
Firebase Phone OTP → Firebase JWT → Hono verifyIdToken → App Session
                                                           │
                                           ┌───────────────┼────────────┐
                                           ▼               ▼            ▼
                                      authenticate   requireCreator  requireKYC
                                      (any user)     (is_creator)   (kyc_status)
```

### 7.2 Data Protection Layers

| Layer | What | How |
|-------|------|-----|
| Transit | All traffic | TLS 1.2+ (Cloudflare) |
| Rest (DB) | All data | Supabase AES-256 disk encryption |
| Rest (KYC) | PAN/Aadhaar docs | Envelope encryption (app KMS key) |
| Rest (OAuth) | Social tokens | AES-256-GCM envelope encryption |
| Hashing | PAN/Aadhaar numbers | SHA-256 (for dedup, never stored raw) |
| Access | DB rows | Supabase RLS policies |
| API keys | Places, Firebase, Razorpay | Server-side only, secrets manager |

---

## 8. Scalability Strategy

### MVP (1,000 concurrent users)

- Single Fly.io instance handles all API traffic
- Supabase Free/Pro tier handles DB load
- No caching layer needed
- No search service needed (tsvector sufficient)

### V1 (10,000 concurrent users)

- Fly.io auto-scale to 2-3 instances
- Supabase Pro with connection pooling (PgBouncer)
- Upstash Redis: rate limiting, OTP codes, feed caching
- Meilisearch Cloud: full-text search offloaded from Postgres

### V2 (50,000 concurrent users)

- Fly.io 4-6 instances across regions
- Supabase Pro with read replicas
- CDN-cached SSR pages (ISR with 60s revalidation)
- Background job queue (BullMQ or Supabase Edge Functions)

---

## 9. Monitoring & Observability

| Tool | What | When |
|------|------|------|
| **Sentry** | Error tracking, performance monitoring | All exceptions, slow transactions |
| **PostHog** | Product analytics, feature flags | User events (sign up, publish, book) |
| **Fly.io Metrics** | CPU, memory, request count | Infrastructure health |
| **Supabase Dashboard** | DB connections, query performance | Database health |
| **Structured Logs** | JSON request/response logs | Debugging, audit trail |

### Health Checks

- `/healthz` — liveness (process alive, returns 200 immediately)
- `/readyz` — readiness (DB connected, Firebase initialized, returns 200 or 503)
- Used by: Fly.io health checks, CI/CD deployment verification

---

## 10. Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| ADR-001 | Flutter over React Native | Founder preference, single codebase, Dart type safety |
| ADR-002 | Hono over Express | 14KB bundle, faster cold starts on Fly.io, Web Standard APIs |
| ADR-003 | Supabase direct SQL, no ORM | Avoid ORM abstraction tax, full control over queries, RLS native |
| ADR-004 | Firebase Auth over Supabase Auth | Better phone OTP in India, MSG91/DLT compliance |
| ADR-005 | Riverpod for state management | Compile-time safe, auto-dispose, testable without BuildContext |
| ADR-006 | GoRouter for navigation | Declarative, deep link support, redirect guards |
| ADR-007 | Feature-first folder structure | Scales with feature count, clear ownership boundaries |
| ADR-008 | Cursor pagination, not offset | Stable with concurrent inserts, required for infinite scroll |
| ADR-009 | Fly.io over Railway/Render | Closest to AWS in simplicity, good cold start, global edge |
| ADR-010 | Vercel for Next.js | Free tier sufficient for MVP, zero-config SSR deployment |
| ADR-011 | Custom Next.js admin over Retool | First-party UX, same-origin cookies, full audit coverage, matches design system |

---

## 11. Admin panel (E4.1)

A custom Next.js 15 App Router admin console at
`admin.creatorhub.in`. Replaces the earlier Retool surface (E2.8)
which spoke to the same Hono API via a shared `x-admin-secret`
header. E4.1 adds a session-cookie auth model and migrates every
endpoint; the secret bypass stays live for a 2-week cutover window
and is removed by T23.

### 11.1 Deployment topology

```
Browser (admin user)
     │
     │  HTTPS, first-party cookie (ch_admin_session, HttpOnly+Secure+SameSite=Strict)
     ▼
┌──────────────────────────────┐
│  Fly.io: creatorhub-admin    │      Same 6PN network + public URL
│  Next.js 15 (standalone)     │  →   ┌──────────────────────────────┐
│  region=bom, 512mb           │      │  Fly.io: creatorhub-api      │
│                              │      │  Hono 4, region=bom, 256mb   │
│  - Edge middleware (cookie   │      │                              │
│    presence gate)            │      │  - adminAuth.routes          │
│  - /api/proxy/[...path]      │─────▶│  - admins.routes             │
│    catch-all → Hono          │      │  - admin.routes (legacy,     │
│  - Server components call    │      │    dualAdminAuth)            │
│    Hono directly via         │      │  - editorial.routes          │
│    serverFetch()             │      │  - search-analytics.routes   │
│  - /healthz (public)         │      │  - dashboard.routes          │
└──────────────────────────────┘      └──────────────────────────────┘
```

Both apps live on Fly.io in the `bom` region with shared networking
but separate public URLs. The admin app never speaks to Supabase or
Firebase directly — every operation is an authenticated call to the
Hono API.

### 11.2 Auth model

1. **Login:** `POST /api/v1/admin/auth/login` verifies an email +
   password against `admin_users.password_hash` (bcrypt, cost 12),
   checks `is_active`, and sets a signed JWT in the
   `ch_admin_session` cookie. Cookie scope:
   - `HttpOnly` — no JS access
   - `Secure` — HTTPS only
   - `SameSite=Strict` — no cross-site leak
   - 8-hour expiry, rolling
   - Signed with `ADMIN_SESSION_SECRET` (64-byte random, rotated
     per incident or quarterly).

2. **Every request:** `requireAdminRole([roles])` middleware
   re-reads `admin_users` by ID from the JWT, re-checks
   `is_active`, and confirms the row's `role` is in the allow list.
   **JWT claims are not trusted** as the authoritative source for
   role/active — the DB is. A deactivated admin's next request
   fails regardless of token expiry.

3. **Dual-auth (transitional, T5–T23):** legacy `x-admin-secret`
   header still authorizes the `/api/v1/admin/*` surface (minus
   session-only paths: `/auth`, `/admins`, `/collections`,
   `/analytics/search`, `/dashboard`). Retool keeps working while
   ops teams re-train on the new UI. T23 deletes the
   `dualAdminAuth` middleware and the secret.

4. **Role matrix:**

   | Role | Surface |
   |------|---------|
   | `super_admin` | Everything incl. `/admins` |
   | `content_moderator` | Content takedown, collections, featuring, user suspend |
   | `support` | Users, KYC |
   | `finance` | Bookings, refunds, payouts |
   | `operations` | Read-only dashboard / audit / analytics |

### 11.3 Data flow — same-origin proxy

The browser never calls the Hono API directly. All client-side
requests go through the Next.js catch-all proxy:

```
Browser  ──fetch('/api/proxy/admin/users/search')──▶  Next.js route handler
                                                        │
                                                        │ forwards:
                                                        │   - method, body
                                                        │   - Cookie header
                                                        │
                                                        ▼
                                                    Hono API
                                                        │
                                                        │ response +
                                                        │ Set-Cookie (relayed)
                                                        ▼
                                                    Next.js → browser
```

This keeps the cookie first-party (no `SameSite=None`), lets the
Hono API be the sole source of truth for cookie issuance, and
avoids CORS entirely on hot paths.

**Server components** bypass the proxy and call Hono via
`serverFetch()` — it reads the incoming `Cookie` header from the
Next.js request context and forwards it unchanged. This gives SSR
pages access to the API without a double hop.

### 11.4 Audit log

Every state-changing admin action writes one row to
`admin_audit_log` via a fire-and-forget `recordAdminAudit()` call
after the DB transaction commits. Failed audit writes log to
Sentry but never fail the parent request — the mutation is the
contract, the audit is the breadcrumb.

Schema:

```sql
admin_audit_log (
  id             uuid pk,
  admin_id       uuid fk → admin_users.id,
  action         text,       -- e.g. 'user.suspend', 'content.takedown'
  target_type    text,       -- 'user', 'content', 'booking', ...
  target_id      uuid,
  reason         text,       -- required for destructive actions
  details        jsonb,      -- before/after diff
  created_at     timestamptz default now(),
  ip_address     inet,
  user_agent     text
)
```

Cursor pagination (base64url of `{createdAt, id}`) via
`GET /api/v1/admin/audit-log`. Non-super_admins see only their
own rows (server-side scoping in `getAuditLog()`); super_admins see
everything.

### 11.5 Session secret rotation

`ADMIN_SESSION_SECRET` can be rotated via
`fly secrets set ADMIN_SESSION_SECRET=<new> --app creatorhub-admin`.
Rotating invalidates **all** live admin sessions (no support for
dual-key verification yet). Quarterly rotation is policy; on-
incident rotation is expected if any admin session is suspected
compromised.

### 11.6 Deploy + runbook

- Provisioning, DNS, secrets: [E4.1 DEPLOY.md](../epics/E4.1-admin-custom/DEPLOY.md)
- Day-to-day playbooks: [E4.1 RUNBOOK.md](../epics/E4.1-admin-custom/RUNBOOK.md)
- Endpoint contracts: tags `Admin Auth`, `Admins`, `Admin Users`,
  `Admin Content`, `Admin KYC`, `Admin Bookings`, `Admin Payouts`,
  `Admin Editorial`, `Admin Analytics`, `Admin Audit`,
  `Admin Dashboard` in [openapi.yaml](openapi.yaml).
