-- ═══════════════════════════════════════════════════════════════════
-- Migration 017: Admin Panel (E4.1)
-- SRS: ADM-FR-006, ADM-FR-007, ADM-FR-008
-- Creates admin_role enum, admin_users table, and admin_audit_log
-- (the latter was referenced by services but never created by a prior
-- migration — fixing that here).
-- ═══════════════════════════════════════════════════════════════════

-- ── Role enum ───────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
    CREATE TYPE admin_role AS ENUM (
      'super_admin',
      'content_moderator',
      'support',
      'finance',
      'operations'
    );
  END IF;
END$$;

-- ── admin_users ─────────────────────────────────────────────────
-- Admin staff accounts. Passwords live in Firebase Auth — we only
-- store the firebase_uid + lockout + role metadata here.
CREATE TABLE IF NOT EXISTS admin_users (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  text NOT NULL,
  firebase_uid           text UNIQUE,
  full_name              text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  role                   admin_role NOT NULL,
  is_active              boolean NOT NULL DEFAULT true,
  must_change_password   boolean NOT NULL DEFAULT true,
  failed_login_count     int NOT NULL DEFAULT 0,
  locked_until           timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  created_by             uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  last_login_at          timestamptz,
  password_changed_at    timestamptz,
  deactivated_at         timestamptz
);

-- Case-insensitive email uniqueness (match existing users table style).
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_unique
  ON admin_users (lower(email));

CREATE INDEX IF NOT EXISTS admin_users_role_active_idx
  ON admin_users (role) WHERE is_active = true;

-- ── admin_audit_log ─────────────────────────────────────────────
-- Append-only audit trail. Every admin write should insert one row.
-- Retention: forever (founder decision 2026-04-22).
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_email  text,                               -- denormalized for post-deactivation reads
  action       text NOT NULL,                      -- e.g. 'login', 'takedown_content', 'approve_kyc'
  target_type  text,                               -- 'user' | 'content' | 'booking' | 'kyc' | 'collection' | 'admin' | null
  target_id    text,                               -- string because targets span uuid/text ids
  details      jsonb NOT NULL DEFAULT '{}'::jsonb, -- reason, diff, request-meta
  ip_address   inet,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx
  ON admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_admin_created_idx
  ON admin_audit_log (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx
  ON admin_audit_log (target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_action_idx
  ON admin_audit_log (action, created_at DESC);

-- ── RLS ─────────────────────────────────────────────────────────
-- Both tables are service-role only. The API bypasses RLS with the
-- service role key; there is no client-side Supabase access for
-- admin data.
ALTER TABLE admin_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log   ENABLE ROW LEVEL SECURITY;

-- No policies ⇒ default deny for anon/authenticated. Service role
-- bypasses RLS by design.

-- ── Guard: at least one active super_admin ──────────────────────
-- Prevents the last super_admin from being deactivated, which would
-- lock everyone out of role/user management.
CREATE OR REPLACE FUNCTION guard_last_super_admin()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  other_active_count int;
BEGIN
  -- Only guard transitions where a super_admin becomes unusable.
  IF TG_OP = 'UPDATE'
     AND OLD.role = 'super_admin'
     AND OLD.is_active = true
     AND (NEW.is_active = false OR NEW.role <> 'super_admin') THEN
    SELECT COUNT(*) INTO other_active_count
    FROM admin_users
    WHERE role = 'super_admin'
      AND is_active = true
      AND id <> OLD.id;

    IF other_active_count = 0 THEN
      RAISE EXCEPTION
        'cannot deactivate or demote the last active super_admin (id=%)', OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_users_guard_last_super_admin ON admin_users;
CREATE TRIGGER admin_users_guard_last_super_admin
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION guard_last_super_admin();
