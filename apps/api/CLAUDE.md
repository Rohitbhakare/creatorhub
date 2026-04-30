# CLAUDE.md — API (Hono)

> Context for AI sessions working on the API. Read `.claude/instructions/api.md` before writing any code.

## What This App Is

The Hono TypeScript API running on Fly.io (Mumbai region). Handles all business logic, external integrations, and serves both the Flutter app and Next.js web.

## Stack

- **Framework:** Hono 4+ (TypeScript, ESM)
- **Runtime:** Node.js 22 via `@hono/node-server`
- **Database:** Supabase Postgres — `src/lib/supabase.ts` (service role, bypasses RLS)
- **Auth:** Firebase Admin — `src/lib/firebase.ts` (server-side JWT verification only)
- **Validation:** Zod schemas from `packages/shared/src/schemas/`
- **Testing:** Vitest + `app.request()` for integration tests (no mocking the DB)

## File Structure

```
src/
├── index.ts              # App setup, middleware chain, health checks, server start
├── env.ts                # Zod env validation — process.exit(1) if invalid
├── lib/
│   ├── supabase.ts       # Supabase service role client singleton
│   └── firebase.ts       # Firebase Admin Auth singleton
├── routes/               # Route definitions — thin, mount handlers
├── handlers/             # Request handlers — validate → call service → respond
├── services/             # Business logic — HTTP-agnostic, testable
├── db/
│   ├── queries/          # Parameterized SQL query functions
│   └── migrations/       # Supabase SQL migrations (numbered: 001_, 002_, ...)
├── middleware/
│   ├── authenticate.ts   # Bearer JWT → userId on context
│   ├── requireCreator.ts # is_creator check
│   ├── requireKYC.ts     # kyc_status === 'verified' check
│   ├── rateLimit.ts      # Per-IP / per-user limits
│   ├── validate.ts       # Zod middleware wrapper
│   └── errorHandler.ts   # Global RFC 9457 error formatter
├── errors/
│   └── AppError.ts       # Custom error class
└── utils/
    ├── money.ts          # Paisa conversions, tax calculations
    └── pagination.ts     # Cursor encode/decode (base64)
```

## Middleware Chain (every request)

```
cors → rateLimit → logger → authenticate|optionalAuthenticate → validate → handler → errorHandler
```

## Key Patterns

- **Handler = thin:** validate input, call service, set headers, respond
- **Service = logic:** business rules, DB writes, side effects — no HTTP context
- **Query = SQL:** parameterized statements via Supabase client — never string concat
- **Money = paisa:** all amounts are BIGINT integers — never float or decimal
- **Errors = AppError:** always throw `AppError`, never raw `Error` in services
- **UUID PK default:** new tables use `DEFAULT gen_uuid_v7()` (defined in migration 032) **unless** the row's creation timestamp is sensitive — financial (bookings, payments, payouts, refunds), KYC/PII, DPDPA submissions, password reset tokens, and admin user records stay on `gen_random_uuid()` (v4). The migration's header comment lists the v4-locked tables explicitly.

## Running Locally

```bash
cp .env.example .env  # fill in values
pnpm dev              # starts on localhost:3000
```
