-- Migration 033 — Per-role statement + idle-in-transaction timeouts.
--
-- Why: Postgres has no global query timeout by default. A single runaway
-- query (a missing index, a Cartesian join, an unindexed regex) can hold
-- a connection in the Supabase pool indefinitely, blocking other writers
-- behind it. Same goes for an open transaction that never commits — it
-- holds locks and prevents VACUUM from cleaning dead tuples.
--
-- These timeouts are applied at the *role* level, not connection level,
-- so every connection from the API service inherits them automatically.
-- The values are conservative: anything legitimately taking longer than
-- 5 s is either a bug or a job that belongs in a worker, not in a
-- request handler.
--
-- Reversal: `ALTER ROLE authenticator RESET statement_timeout;` etc.
--
-- ─────────────────────────────────────────────────────────────────────
-- Roles affected:
--   - `authenticator`     — Supabase's PostgREST role; serves API requests
--   - `service_role`      — admin/server-side operations (incl. seeds)
--   - `anon` + `authenticated` — public + authed RLS roles
-- ─────────────────────────────────────────────────────────────────────

-- 5 s cap on any single query (request-path SLA: SRS WEB-NFR-005 says
-- TTFB < 400ms p75; 5s is the hard wall, not the target).
ALTER ROLE authenticated SET statement_timeout = '5s';
ALTER ROLE anon SET statement_timeout = '5s';

-- 30 s for service_role: long-running admin migrations occasionally need
-- it. The seed script already runs as service_role and may issue large
-- batched inserts.
ALTER ROLE service_role SET statement_timeout = '30s';

-- 30 s idle-in-transaction: anything holding a lock for half a minute
-- without committing is a bug. Postgres will terminate the session.
ALTER ROLE authenticated SET idle_in_transaction_session_timeout = '30s';
ALTER ROLE anon SET idle_in_transaction_session_timeout = '30s';
ALTER ROLE service_role SET idle_in_transaction_session_timeout = '60s';

-- 60 s lock_timeout: if a query can't acquire its locks within a minute
-- (because another transaction is holding them), give up. Keeps a slow
-- writer from cascading into a pool exhaustion event.
ALTER ROLE authenticated SET lock_timeout = '60s';
ALTER ROLE anon SET lock_timeout = '60s';
ALTER ROLE service_role SET lock_timeout = '120s';

-- These are new-session settings — existing connections keep their old
-- defaults until they reconnect. Supabase's pooler recycles connections
-- frequently, so the new values take effect within minutes of deploy.

COMMENT ON DATABASE postgres IS
  'CreatorHub Postgres. statement_timeout enforced per-role via migration 033.';
