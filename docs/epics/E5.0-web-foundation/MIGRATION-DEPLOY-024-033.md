# Deploy plan: migrations 024 → 033

> Mobile-app impact assessment + step-by-step deploy. Read before pasting any SQL.

## Mobile-app impact: zero on every migration except 033 (managed risk)

The mobile app reads/writes through the Hono API; it never touches the DB directly. So the impact rule is: **does the migration change the API contract or break a column the API returns?**

| # | Migration | What it does | Mobile impact | Why |
|---|---|---|---|---|
| 024 | `split_biking_subcategory` | INSERTs a new sub-cat row, UPDATEs existing content | **None** | Mobile already accepts arbitrary sub-cat strings via `GET /sub-categories` — adding one is additive |
| 025 | `user_travel_subcategories` | `ADD COLUMN travel_sub_categories text[] DEFAULT '{}'` | **None** | New column, default empty. Old mobile builds that don't read it ignore it; the new web onboarding writes it via `PUT /api/v1/users/me/travel-sub-categories` |
| 026 | `seed_travel_destinations` | INSERTs ~50 Maharashtra/Konkan cities | **None** | Pure data; mobile's `GET /cities/nearby` will surface more rows |
| 027 | `search_placeholder_seeds` | UNIQUE constraint on `placeholder_text` + INSERTs | **None** | Mobile reads from `GET /discover/search/popular` — output unchanged |
| 028 | `booking_intents` | NEW table + 4 indexes | **None** | New table accessed via new endpoints (`POST/DELETE /booking-intents`). Old mobile builds don't call them; new mobile already wired (BUNDLE/REDESIGN-001) |
| 029 | `waitlist_entries` | NEW table + 5 indexes | **None** | Same shape as 028 — new endpoints, no break |
| 030 | `itinerary_spot_cover` | `ADD COLUMN cover_url text` + extends `insert_itinerary_spot()` RPC | **None** | New nullable column; old clients reading `itinerary_spots` rows just ignore the field. The RPC change is additive (new optional `p_cover_url` arg) |
| 031 | `content_slug` | `ADD COLUMN slug text` + UNIQUE index + auto-populate trigger | **None** | New nullable column. Mobile detail screens key off `content.id` (UUID), not slug. The slug column gets backfilled lazily via the trigger as content updates flow through |
| 032 | `uuidv7_default` | New `gen_uuid_v7()` function + 16 column DEFAULT swaps | **None** | Existing rows untouched. New rows get v7-shaped UUIDs (still RFC-4122 valid). Mobile parses UUIDs by regex, not by version — both versions match |
| 033 | `session_timeouts` | Per-role `statement_timeout=5s`, `idle_in_transaction=30s`, `lock_timeout=60s` | **Managed risk** | If any mobile-API query is currently slower than 5s under p99 load, it will start returning 57014 (statement timeout) instead of completing. Need pre-deploy check (see below) |

### 033 risk-mitigation step (do this BEFORE pasting 033)

Run this in Supabase SQL Editor on the live DB to find any slow queries already in flight:

```sql
SELECT
  state,
  EXTRACT(EPOCH FROM (now() - query_start))::int AS seconds,
  left(query, 200) AS q
FROM pg_stat_activity
WHERE state IN ('active', 'idle in transaction')
  AND query_start < now() - interval '4 seconds'
  AND application_name LIKE '%PostgREST%' OR application_name LIKE '%supabase%'
ORDER BY seconds DESC
LIMIT 20;
```

If anything legitimate (e.g. a long-running admin export) takes >5s → bump `authenticated` from `5s` to `10s` in 033 before deploying, or move that query to `service_role` (which has 30s).

If only buggy queries are slow → safe to deploy 033 as-is, the timeout becomes a useful circuit-breaker.

## How to deploy

I can't execute these from the dev environment — `apps/api/.env` only carries Supabase JS client credentials (anon key + service role key), neither of which lets me run DDL through the JS client. PostgREST blocks arbitrary `ALTER` / `CREATE`. So either:

### Path A — paste into Supabase SQL Editor (recommended; ~5 minutes)

1. Open the Supabase dashboard → SQL Editor → New query.
2. For each file in this exact order, paste the entire file body, run, confirm "Success":
   ```
   apps/api/src/db/migrations/024_split_biking_subcategory.sql
   apps/api/src/db/migrations/025_user_travel_subcategories.sql
   apps/api/src/db/migrations/026_seed_travel_destinations.sql
   apps/api/src/db/migrations/027_search_placeholder_seeds.sql
   apps/api/src/db/migrations/028_booking_intents.sql
   apps/api/src/db/migrations/029_waitlist_entries.sql
   apps/api/src/db/migrations/030_itinerary_spot_cover.sql
   apps/api/src/db/migrations/031_content_slug.sql
   apps/api/src/db/migrations/032_uuidv7_default.sql        ← run pg_stat_activity check first
   apps/api/src/db/migrations/033_session_timeouts.sql      ← managed risk (see above)
   ```
3. After 032: verify
   ```sql
   SELECT pg_get_functiondef('gen_uuid_v7'::regproc::oid);
   -- Sanity-check a generated v7 UUID has version=7:
   SELECT gen_uuid_v7(), substring(gen_uuid_v7()::text, 15, 1) AS version_nibble;
   -- → version_nibble should be '7'
   ```
4. After 033: verify
   ```sql
   SELECT rolname, rolconfig FROM pg_roles
     WHERE rolname IN ('authenticated','anon','service_role');
   -- Each row's rolconfig should include statement_timeout, idle_in_transaction_session_timeout, lock_timeout
   ```

### Path B — give me `DATABASE_URL` and I'll run them

If you'd rather automate: copy the Supabase dashboard → Settings → Database → Connection string (the **direct connection** string, not the pooler — DDL through the pooler is unreliable). Save it somewhere I can read locally (e.g. paste into chat), and I'll write a `pnpm --filter api migrate` script that walks the directory, runs each file in order, prints a per-file diff of `pg_class` rows, and commits the runner so future deploys are one command.

Path A unblocks you in 5 minutes; Path B is ~30 minutes of script work but pays back every future deploy. Your call.

## Post-deploy smoke checks (mobile + web both)

```bash
# Web
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3004/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3004/discover
curl -s -o /dev/null -w "%{http_code}\n" 'http://localhost:3004/content/dd000000-2000-2000-2000-000000000011'

# API
curl -s http://localhost:3001/healthz   # → 200, JSON body with {"status":"ok"}
curl -s http://localhost:3001/readyz    # → 200, includes db check

# Mobile (Flutter sim)
# Hit /home, /discover, /content/<id>, /you — should render unchanged.
# New routes (waitlist, booking-intents) only fire from new flows so an
# old build won't notice them.
```

If anything breaks: `ALTER ROLE authenticated RESET statement_timeout;` is the fastest panic-revert for 033. For 028/029/030/031 the new tables/columns are additive — leaving them in place doesn't break anything; you only need to revert if the mobile app's old code is somehow now-incompatible (it shouldn't be, but the rollback is `DROP TABLE booking_intents` etc.). Revert SQL is documented in each migration's header comment.
