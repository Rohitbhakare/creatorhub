-- 021_dpdpa_legal.sql
-- DPDPA & Legal tables: consent_logs + deletion_requests (E2.11)

-- ── consent_logs ──────────────────────────────────────────────────────────────
-- Records every time a user consents to a policy document version.
create table if not exists consent_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  consent_type  text not null check (consent_type in ('terms_of_service', 'privacy_policy', 'content_tnc')),
  version       text not null,
  ip_address    text,
  user_agent    text,
  consented_at  timestamptz not null default now()
);

create index if not exists idx_consent_logs_user_type
  on consent_logs (user_id, consent_type, consented_at desc);

-- ── deletion_requests ─────────────────────────────────────────────────────────
-- Tracks account deletion requests with a 30-day grace period.
create table if not exists deletion_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  status         text not null default 'pending'
                   check (status in ('pending', 'cancelled', 'executed')),
  requested_at   timestamptz not null default now(),
  scheduled_for  timestamptz not null,
  cancelled_at   timestamptz,
  executed_at    timestamptz
);

create unique index if not exists idx_deletion_requests_user
  on deletion_requests (user_id);

create index if not exists idx_deletion_requests_scheduled
  on deletion_requests (scheduled_for)
  where status = 'pending';
