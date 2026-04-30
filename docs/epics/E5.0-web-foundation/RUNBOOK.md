# E5.0 Operator Runbook

> Items that landed in code but need a human action (DB write, deploy, vendor decision) before they take effect in production. None blocks E5.0 itself; each is a small explicit task.

Generated 2026-05-01 after the post-E5.0 bug-fix + perf sweep.

---

## A. DB writes — pending operator

### A1. Deploy un-applied migrations 024 → 033 to Supabase
**Why:** every migration since the last deploy is a code-level change with no database effect yet. Includes the UUIDv7 default switch (032), session timeouts (033), content slug column (031), spot cover (030), waitlist (029), booking intents (028), search placeholder seeds (027), Maharashtra/Konkan destinations (026), travel-sub-cat array (025), biking split (024).

**How:**
```bash
# From repo root, with apps/api/.env loaded (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
# Each migration is idempotent against an empty target. For an already-deployed
# DB, apply only the un-deployed ones in numeric order.

# Quickest: paste each .sql into the Supabase SQL Editor in order.
# Or via psql with the Supabase pooler connection string:
for f in apps/api/src/db/migrations/024_*.sql apps/api/src/db/migrations/025_*.sql \
         apps/api/src/db/migrations/026_*.sql apps/api/src/db/migrations/027_*.sql \
         apps/api/src/db/migrations/028_*.sql apps/api/src/db/migrations/029_*.sql \
         apps/api/src/db/migrations/030_*.sql apps/api/src/db/migrations/031_*.sql \
         apps/api/src/db/migrations/032_*.sql apps/api/src/db/migrations/033_*.sql; do
  echo "=== applying $f ==="
  psql "$DATABASE_URL" -f "$f"
done
```

**Verify:**
```sql
-- 032 — confirm v7 default + spot-check a content INSERT
SELECT pg_get_functiondef('gen_uuid_v7'::regproc::oid);
SELECT column_default FROM information_schema.columns
  WHERE table_name = 'content' AND column_name = 'id';
-- → should show `gen_uuid_v7()`

-- 033 — confirm role-level timeouts
SELECT rolname, rolconfig FROM pg_roles
  WHERE rolname IN ('authenticated', 'anon', 'service_role');
-- → rolconfig should include statement_timeout, idle_in_transaction_session_timeout, lock_timeout
```

### A2. Re-seed dummy content to drop the 9 dead Unsplash URLs (E5.0/BUG-002)
**Why:** seed file fixed in `ccbb748` but live DB rows still 404 on the home feed.

**How:**
```bash
cd apps/api
pnpm tsx --env-file=.env scripts/seed-dummy-content.ts
```

Idempotent. Only touches the `dd000000-*` UUID range. Production data untouched. ~30 s.

**Verify:** load `http://localhost:3004/` — no `⨯ upstream image response failed` lines in dev log.

---

## B. Deploy verification — needs a staging environment

### B1. (DONE 2026-05-01) — production CSP audit completed

`pnpm build && pnpm start` was run; headers captured via `curl -I`. Findings:

- ✅ All 7 production headers ship: CSP, X-Frame-Options=DENY, X-Content-Type-Options=nosniff, Referrer-Policy=strict-origin-when-cross-origin, HSTS (2 years + preload), Permissions-Policy, X-DNS-Prefetch-Control.
- ✅ CSRF cookie (`ch_csrf`) minted with `Secure; SameSite=Lax`.
- ✅ CSP origins cover all currently-installed third-party scripts: Firebase (`firebaseapp.com`, `gstatic.com`), Google (`accounts.google.com`, `apis.google.com`), Razorpay (`checkout.razorpay.com`), reCAPTCHA (`google.com`).
- ⚠️ **Deploy-time gotcha:** `connect-src` includes the literal `http://localhost:3001` because the prod build inherits `API_BASE_URL` from env at build time. **Set `API_BASE_URL=https://<your-prod-api>` in the deploy env** (Fly.io secrets, Vercel env, etc.) before building for prod, or browsers will refuse to connect to the real API.
- ⏳ Mapbox + PostHog not yet in CSP because not yet installed. Their owner epics (E5.3 reader for Mapbox, future analytics pack for PostHog) will add the origins when those deps land.

Old smoke-test instructions kept below for re-verification after prod deploy.

### B1-original. Verify production CSP doesn't break Razorpay / Firebase / Mapbox
**Why:** [next.config.ts:39-41](apps/web/next.config.ts) ships a strict CSP **only in production**. Dev hides it behind `if (isDev) return []`. Three known origins must be in `script-src` and `frame-src` for auth + payments to work — easy to miss one.

**How:**
1. Build + start in production mode locally:
   ```bash
   cd apps/web
   pnpm build && pnpm start  # listens on 3004
   ```
2. Open the browser DevTools console while exercising:
   - Phone OTP signin flow → look for blocked Firebase / reCAPTCHA scripts
   - Booking flow → look for blocked Razorpay checkout
   - Map tiles → look for blocked Mapbox / Google Maps tiles
3. Any `Refused to load script ...` or `Refused to frame ...` line is a missing CSP origin. Fix in [next.config.ts](apps/web/next.config.ts) and re-test.

### B2. Lighthouse run on the three over-budget routes
**Why:** `/content/[id]` (206 KB), `/discover` (196 KB), `/u/[username]` (196 KB) exceed the 180 KB WEB-NFR-004 budget. Page-level dynamic imports of `<AnimatedMap>`, `<CommentsSection>`, `<EndOfArticleRail>` are the likely fix and properly belong in epics E5.1 / E5.2 / E5.3 (where visual regressions can be screenshot-tested).

**How:** record current Lighthouse scores so subsequent epics can prove regression-free improvement:
```bash
pnpm build && pnpm start
# In another tab:
npx -y @lhci/cli autorun --collect.url=http://localhost:3004/ \
                         --collect.url=http://localhost:3004/discover \
                         --collect.url=http://localhost:3004/u/saanvik \
                         --collect.url=http://localhost:3004/content/dd000000-2000-2000-2000-000000000011
```
Save report under `docs/epics/E5.0-web-foundation/lighthouse-baseline/`.

---

## C. Vendor decisions — no code change yet

### C1. Sentry: yes/no?
**Why:** PostHog is wired client-side, but server-side and unhandled errors don't aggregate anywhere. If error monitoring matters for launch, scaffold `@sentry/nextjs` + add the DSN to `apps/web/.env.local`. ~1 day of work; can ship in a follow-up commit.

**Decide before E5.6 ships** (auth flow is when error visibility starts mattering most).

### C2. Razorpay / WhatsApp / SendGrid / Google Places API keys
**Already in your blocker list per CLAUDE.md.** Restated: every E5.4 (booking) → Razorpay, E5.6 (auth/OTP) → Twilio (or Firebase Phone Auth), E5.7 (KYC) → DigiLocker, search → Google Places. Without these, those epics ship in dev-mock-only mode.

---

## D. Investigation — manual SQL, can't be automated

### D1. EXPLAIN ANALYZE the 5 hottest endpoints
**Why:** indexes were created at table-creation time but services have grown. A `WHERE city_id = ? AND status = 'published' ORDER BY created_at DESC LIMIT 20` with separate indexes on `city_id` and `status` may sequential-scan the sort key — a covering composite index `(city_id, status, created_at DESC)` would fix it. Worth ~half a day if you want to be ready for actual launch traffic.

**How:**
```sql
-- In Supabase SQL Editor, against a representative dataset:
EXPLAIN (ANALYZE, BUFFERS) SELECT … FROM content WHERE … ORDER BY created_at DESC LIMIT 20;
-- Look for: Seq Scan on content (cost > 1 ms), Sort (Method: external merge),
--           Heap Fetch counts >> Index Hits
```

Endpoints to check first: home feed (`/api/v1/feed/sections`), discover results (`/api/v1/discover/category`), creator content list (`/api/v1/creators/:username/content`), user saved (`/api/v1/saved`), bookings list (`/api/v1/bookings`).

### D2. OpenAPI drift — 146 routes undocumented
**Why:** `pnpm --filter api openapi:drift` (added today) reports 146 handler endpoints not in [docs/engineering/openapi.yaml](docs/engineering/openapi.yaml). Some are admin-only and intentional, but many are post-1.3 additions never spec'd.

**How:** triage in batches by domain. The drift checker output is a good worklist. Each entry takes ~5 minutes (path + method + request + response + 2xx/4xx errors) — total ~12 hours to fully sync. Could phase: M1-launch endpoints first (60 entries), admin/internal later.

---

## What I cannot do automatically

| Task | Why it's manual |
|---|---|
| A1 deploy migrations | Needs Supabase service role + your decision on staging vs prod |
| A2 re-seed | Same — runs against live DB |
| B1 CSP audit | Needs a real production build + browser interaction |
| B2 Lighthouse baseline | Same — needs `pnpm start` running |
| C1 Sentry DSN | Vendor account decision |
| D1 EXPLAIN ANALYZE | Needs live DB access + representative query patterns |

Everything in §A–B (deploys + verification) is **before launch**, not before-next-feature. §D items can run in parallel with E5.1 implementation.
