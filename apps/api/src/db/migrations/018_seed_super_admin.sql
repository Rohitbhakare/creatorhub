-- ═══════════════════════════════════════════════════════════════════
-- Migration 018: Seed founder as super_admin (E4.1)
-- Inserts the bootstrap super_admin row. The matching Firebase Auth
-- user is provisioned separately by scripts/seed-admin.ts, which
-- reads this row and creates the Firebase credential with a temp
-- password + must_change_password=true.
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO admin_users (email, full_name, role, is_active, must_change_password)
SELECT 'rohitbhakare@gmail.com', 'Rohit Bhakare', 'super_admin', true, true
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users WHERE lower(email) = lower('rohitbhakare@gmail.com')
);
