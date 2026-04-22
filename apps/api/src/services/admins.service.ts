// Admin-user management service (E4.1, T6).
//
// Operations — all super_admin-only. Route layer enforces the guard;
// the service assumes the caller is authorized.
//
//   - createAdmin     → provision Firebase credential + insert row
//   - listAdmins      → profiles ordered by created_at desc
//   - updateAdmin     → partial patch (role, is_active)
//   - resetAdminPassword → regenerate temp, set must_change_password
//
// Invariants enforced here + at DB layer:
//   - Email uniqueness (case-insensitive) — unique index in 017
//   - Last active super_admin cannot be demoted/deactivated — DB
//     trigger `guard_last_super_admin` raises; we translate to 409
//   - Password never persisted on our side; Firebase holds the hash

import { firebaseAuth } from '../lib/firebase.js'
import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import {
  generateTempPassword,
  getAdminProfile,
} from './admin-auth.service.js'
import type { AdminProfile, AdminRole } from '@creatorhub/shared'

const ADMIN_PROFILE_COLUMNS =
  'id, email, full_name, role, is_active, must_change_password, last_login_at, created_at'

// ─── Create ────────────────────────────────────────────────────

export interface CreateAdminInput {
  email: string
  full_name: string
  role: AdminRole
}

export interface CreatedAdminResult {
  admin: AdminProfile
  tempPassword: string // one-time display — not persisted on our side
}

/**
 * Provision a new admin. Steps are sequenced so a mid-flight failure
 * leaves the system in a recoverable state:
 *   1. Check email uniqueness (fast-fail, avoids an orphan Firebase user)
 *   2. Generate temp password
 *   3. Create/reset the Firebase credential
 *   4. Insert the admin_users row (firebase_uid linked)
 *   5. If (4) fails, disable the Firebase user so it cannot be reused
 *
 * The temp password is returned in the response exactly once — the
 * caller (super_admin) shares it out-of-band. We do not store it.
 */
export async function createAdmin(
  input: CreateAdminInput,
  createdBy: string,
): Promise<CreatedAdminResult> {
  const email = input.email.trim().toLowerCase()
  const fullName = input.full_name.trim()

  // 1. Uniqueness check before we touch Firebase.
  const { data: existing, error: existingErr } = await supabase
    .from('admin_users')
    .select('id')
    .ilike('email', email)
    .maybeSingle()
  if (existingErr) {
    console.error('[admins.create] lookup failed:', existingErr.message)
    throw new AppError('db-error', 500, 'Failed to check admin uniqueness')
  }
  if (existing) {
    throw new AppError('conflict', 409, 'An admin with this email already exists')
  }

  const tempPassword = generateTempPassword()

  // 2. Provision Firebase — reuse existing auth user if one already
  //    exists for this email (common after a soft delete in a prior
  //    deactivation + re-add cycle).
  let firebaseUid: string
  try {
    const existingFb = await firebaseAuth.getUserByEmail(email).catch(() => null)
    if (existingFb) {
      await firebaseAuth.updateUser(existingFb.uid, {
        password: tempPassword,
        disabled: false,
      })
      firebaseUid = existingFb.uid
    } else {
      const created = await firebaseAuth.createUser({ email, password: tempPassword })
      firebaseUid = created.uid
    }
  } catch (err) {
    console.error('[admins.create] firebase provision failed:', (err as Error).message)
    throw new AppError('internal', 500, 'Failed to provision Firebase credential')
  }

  // 3. Insert the admin_users row. If this fails, disable the
  //    Firebase user to keep it from being used without a DB row.
  const { data: inserted, error: insertErr } = await supabase
    .from('admin_users')
    .insert({
      email,
      firebase_uid: firebaseUid,
      full_name: fullName,
      role: input.role,
      is_active: true,
      must_change_password: true,
      created_by: createdBy,
    })
    .select(ADMIN_PROFILE_COLUMNS)
    .single()

  if (insertErr) {
    console.error('[admins.create] supabase insert failed:', insertErr.message)
    // Best-effort rollback — disable the Firebase user so the dangling
    // credential is not usable.
    try {
      await firebaseAuth.updateUser(firebaseUid, { disabled: true })
    } catch (rollbackErr) {
      console.error(
        '[admins.create] rollback disable failed:',
        (rollbackErr as Error).message,
      )
    }
    throw new AppError('db-error', 500, 'Failed to create admin row')
  }

  return {
    admin: inserted as AdminProfile,
    tempPassword,
  }
}

// ─── List ──────────────────────────────────────────────────────

export async function listAdmins(): Promise<AdminProfile[]> {
  const { data, error } = await supabase
    .from('admin_users')
    .select(ADMIN_PROFILE_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admins.list] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to list admins')
  }
  return data as AdminProfile[]
}

// ─── Update ────────────────────────────────────────────────────

export interface UpdateAdminInput {
  role?: AdminRole
  is_active?: boolean
}

/**
 * Update an admin's role and/or active state. DB trigger
 * `guard_last_super_admin` rejects attempts to strand the panel with
 * zero active super_admins — we translate that Postgres error into a
 * 409 conflict.
 */
export async function updateAdmin(
  id: string,
  patch: UpdateAdminInput,
): Promise<AdminProfile> {
  const updates: Record<string, unknown> = {}
  if (patch.role !== undefined) updates['role'] = patch.role
  if (patch.is_active !== undefined) {
    updates['is_active'] = patch.is_active
    updates['deactivated_at'] = patch.is_active ? null : new Date().toISOString()
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('validation-failed', 400, 'No fields to update')
  }

  const { data, error } = await supabase
    .from('admin_users')
    .update(updates)
    .eq('id', id)
    .select(ADMIN_PROFILE_COLUMNS)
    .maybeSingle()

  if (error) {
    // Trigger rejection text from guard_last_super_admin (see
    // migration 017). Translate to a clear 409.
    if (error.message.includes('last active super_admin')) {
      throw new AppError(
        'conflict',
        409,
        'Cannot demote or deactivate the last active super_admin',
      )
    }
    console.error('[admins.update] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to update admin')
  }
  if (!data) throw new AppError('not-found', 404, 'Admin not found')

  return data as AdminProfile
}

// ─── Reset password ───────────────────────────────────────────

export interface ResetPasswordResult {
  admin: AdminProfile
  tempPassword: string
}

/**
 * Generate a new temp password, push it to Firebase, and force
 * must_change_password=true. Returns the temp so the super_admin can
 * share it out-of-band (one-time display).
 */
export async function resetAdminPassword(
  targetId: string,
): Promise<ResetPasswordResult> {
  const { data: row, error: lookupErr } = await supabase
    .from('admin_users')
    .select('id, firebase_uid, is_active')
    .eq('id', targetId)
    .maybeSingle()

  if (lookupErr) {
    console.error('[admins.resetPassword] lookup failed:', lookupErr.message)
    throw new AppError('db-error', 500, 'Failed to look up admin')
  }
  if (!row) throw new AppError('not-found', 404, 'Admin not found')
  if (!row.is_active) {
    throw new AppError(
      'conflict',
      409,
      'Cannot reset password for an inactive admin — reactivate first',
    )
  }

  const firebaseUid = row.firebase_uid as string | null
  if (!firebaseUid) {
    throw new AppError(
      'internal',
      500,
      'Admin has no Firebase credential linked — contact engineering',
    )
  }

  const tempPassword = generateTempPassword()

  try {
    await firebaseAuth.updateUser(firebaseUid, {
      password: tempPassword,
      disabled: false,
    })
  } catch (err) {
    console.error('[admins.resetPassword] firebase update failed:', (err as Error).message)
    throw new AppError('internal', 500, 'Failed to rotate Firebase credential')
  }

  const { error: updateErr } = await supabase
    .from('admin_users')
    .update({
      must_change_password: true,
      failed_login_count: 0,
      locked_until: null,
    })
    .eq('id', targetId)

  if (updateErr) {
    console.error('[admins.resetPassword] supabase update failed:', updateErr.message)
    throw new AppError(
      'db-error',
      500,
      'Password rotated but failed to flag must_change_password',
    )
  }

  return {
    admin: await getAdminProfile(targetId),
    tempPassword,
  }
}
