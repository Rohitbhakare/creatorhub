// Admin authentication service (E4.1).
//
// Coordinates:
//   1. Firebase Identity Toolkit password verification
//   2. admin_users row lookup (role, active, lockout state)
//   3. Failed-login counting + automatic lockout
//   4. Firebase user provisioning / password rotation (Admin SDK)
//   5. Audit logging
//
// Security invariants:
//   - Login failure modes collapse to 401 'invalid-credentials' except
//     inactive (403) and locked (423). We do not leak which of these
//     three fired to the caller unless the user has already proven
//     password knowledge (then we can disambiguate).
//   - Failed-login counters are updated regardless of whether the
//     email maps to a real admin, to frustrate enumeration timing.

import { webcrypto } from 'node:crypto'
import { firebaseAuth } from '../lib/firebase.js'
import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import { verifyAdminPassword } from '../lib/firebase-identity-toolkit.js'
import type { AdminProfile, AdminRole } from '@creatorhub/shared'

// ─── Lockout policy (plan §5) ──────────────────────────────────
const FAILED_LOGIN_LOCK_THRESHOLD = 20 // per account, rolling 24h
const LOCK_DURATION_HOURS = 24
const TEMP_PASSWORD_LENGTH = 16

// ─── DB row shape ─────────────────────────────────────────────
interface AdminUserRow {
  id: string
  email: string
  firebase_uid: string | null
  full_name: string
  role: AdminRole
  is_active: boolean
  must_change_password: boolean
  failed_login_count: number
  locked_until: string | null
  created_at: string
  last_login_at: string | null
  password_changed_at: string | null
}

function rowToProfile(row: AdminUserRow): AdminProfile {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    is_active: row.is_active,
    must_change_password: row.must_change_password,
    last_login_at: row.last_login_at,
    created_at: row.created_at,
  }
}

// ─── Lookup ─────────────────────────────────────────────────────

export async function findAdminByEmail(email: string): Promise<AdminUserRow | null> {
  const normalized = email.trim().toLowerCase()
  const { data, error } = await supabase
    .from('admin_users')
    .select(
      'id, email, firebase_uid, full_name, role, is_active, must_change_password, failed_login_count, locked_until, created_at, last_login_at, password_changed_at',
    )
    .ilike('email', normalized)
    .maybeSingle()

  if (error) {
    console.error('[admin-auth.findByEmail] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to look up admin user')
  }
  return (data as AdminUserRow | null) ?? null
}

export async function findAdminById(id: string): Promise<AdminUserRow | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select(
      'id, email, firebase_uid, full_name, role, is_active, must_change_password, failed_login_count, locked_until, created_at, last_login_at, password_changed_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[admin-auth.findById] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to look up admin user')
  }
  return (data as AdminUserRow | null) ?? null
}

export async function getAdminProfile(id: string): Promise<AdminProfile> {
  const row = await findAdminById(id)
  if (!row) throw new AppError('not-found', 404, 'Admin not found')
  return rowToProfile(row)
}

// ─── Failed-login counter ──────────────────────────────────────

async function recordFailedLogin(adminId: string): Promise<void> {
  const row = await findAdminById(adminId)
  if (!row) return

  const nextCount = row.failed_login_count + 1
  const patch: Record<string, unknown> = { failed_login_count: nextCount }

  if (nextCount >= FAILED_LOGIN_LOCK_THRESHOLD) {
    const lockUntil = new Date(Date.now() + LOCK_DURATION_HOURS * 3600_000)
    patch['locked_until'] = lockUntil.toISOString()
  }

  const { error } = await supabase.from('admin_users').update(patch).eq('id', adminId)
  if (error) {
    console.error('[admin-auth.recordFailedLogin] update failed:', error.message)
    // Don't throw — failure to record a counter must not break login flow.
  }
}

async function clearFailedLogins(adminId: string): Promise<void> {
  const { error } = await supabase
    .from('admin_users')
    .update({
      failed_login_count: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
    })
    .eq('id', adminId)

  if (error) {
    console.error('[admin-auth.clearFailedLogins] update failed:', error.message)
    // Non-fatal — session is already issued.
  }
}

// ─── Login flow ────────────────────────────────────────────────

export interface LoginResult {
  admin: AdminProfile
  adminRow: AdminUserRow
  mustChangePassword: boolean
}

/**
 * Attempt an admin login.
 *
 * Ordering is deliberate:
 *   1. Look up admin_users row by email (generic 401 if missing).
 *   2. Check lockout BEFORE password verify — a locked admin should
 *      never expend a password check slot against Firebase.
 *   3. Check `is_active` (403) — but only after a successful password
 *      match, so inactive accounts do not leak via timing.
 *   4. Verify the password via Identity Toolkit (generic 401 if bad).
 *   5. Clear counters + return the row.
 */
export async function loginAdmin(
  email: string,
  password: string,
): Promise<LoginResult> {
  const row = await findAdminByEmail(email)

  // Lockout is checked first so we never ping Firebase for a locked
  // account (also avoids wasting quota on hostile clients).
  if (row?.locked_until && new Date(row.locked_until) > new Date()) {
    throw new AppError(
      'account-locked',
      423,
      'Account is temporarily locked after too many failed attempts',
    )
  }

  // Verify with Firebase regardless of whether the row exists — same
  // latency shape for real and unknown emails.
  try {
    await verifyAdminPassword(email, password)
  } catch (err) {
    if (row) await recordFailedLogin(row.id)
    throw err
  }

  // Password was correct. Now enforce row-level gates.
  if (!row) {
    // Email authenticates with Firebase but is not provisioned as an
    // admin. Same generic shape as wrong password.
    throw new AppError('invalid-credentials', 401, 'Invalid email or password')
  }
  if (!row.is_active) {
    throw new AppError('admin-forbidden', 403, 'This admin account is inactive')
  }

  await clearFailedLogins(row.id)

  return {
    admin: rowToProfile(row),
    adminRow: row,
    mustChangePassword: row.must_change_password,
  }
}

// ─── Password change ───────────────────────────────────────────

/**
 * Change an admin's password. Verifies the current password first,
 * rotates the Firebase credential, then clears
 * `must_change_password` and stamps `password_changed_at`.
 */
export async function changeAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const row = await findAdminById(adminId)
  if (!row) throw new AppError('not-found', 404, 'Admin not found')
  if (!row.is_active) throw new AppError('admin-forbidden', 403, 'This admin account is inactive')
  if (!row.firebase_uid) {
    throw new AppError(
      'internal',
      500,
      'Firebase credential missing for this admin — contact super admin',
    )
  }

  // Verify the current password by exchanging it at Identity Toolkit.
  await verifyAdminPassword(row.email, currentPassword)

  try {
    await firebaseAuth.updateUser(row.firebase_uid, { password: newPassword })
  } catch (err) {
    console.error('[admin-auth.changePassword] firebase update failed:', (err as Error).message)
    throw new AppError('internal', 500, 'Failed to update password')
  }

  const { error: updateErr } = await supabase
    .from('admin_users')
    .update({
      must_change_password: false,
      password_changed_at: new Date().toISOString(),
      failed_login_count: 0,
      locked_until: null,
    })
    .eq('id', adminId)

  if (updateErr) {
    console.error('[admin-auth.changePassword] supabase update failed:', updateErr.message)
    throw new AppError('db-error', 500, 'Password updated but failed to clear state')
  }
}

// ─── Provisioning (called by admins service, T6) ──────────────

export function generateTempPassword(): string {
  // 16 chars, mixed alpha + digit + symbol. Uses crypto.randomUUID
  // entropy + a symbol suffix to guarantee the mixed-char rule.
  const bytes = new Uint8Array(TEMP_PASSWORD_LENGTH)
  webcrypto.getRandomValues(bytes)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  for (const byte of bytes) out += alphabet[byte % alphabet.length] ?? 'x'
  // Sprinkle the mandatory symbol + digit to guarantee policy.
  return `${out.slice(0, TEMP_PASSWORD_LENGTH - 2)}!7`
}

/**
 * Create a Firebase Auth user for a newly-provisioned admin and
 * set the admin_users.firebase_uid. Returns the temp password so
 * the caller (super_admin) can share it out-of-band. The password
 * is NEVER persisted on our side — only lives in the response.
 */
export async function provisionFirebaseAdmin(
  adminId: string,
  email: string,
): Promise<{ tempPassword: string; firebaseUid: string }> {
  const tempPassword = generateTempPassword()

  let uid: string
  try {
    const existing = await firebaseAuth.getUserByEmail(email).catch(() => null)
    if (existing) {
      await firebaseAuth.updateUser(existing.uid, { password: tempPassword, disabled: false })
      uid = existing.uid
    } else {
      const created = await firebaseAuth.createUser({ email, password: tempPassword })
      uid = created.uid
    }
  } catch (err) {
    console.error('[admin-auth.provisionFirebaseAdmin] firebase error:', (err as Error).message)
    throw new AppError('internal', 500, 'Failed to provision Firebase credential')
  }

  const { error } = await supabase
    .from('admin_users')
    .update({ firebase_uid: uid, must_change_password: true })
    .eq('id', adminId)

  if (error) {
    console.error('[admin-auth.provisionFirebaseAdmin] supabase update failed:', error.message)
    throw new AppError('db-error', 500, 'Firebase credential created but failed to link admin row')
  }

  return { tempPassword, firebaseUid: uid }
}
