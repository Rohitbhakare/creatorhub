// Admin-user management handlers (E4.1, T6).
//
// Endpoints (all gated by `requireAdminRole(['super_admin'])` at route
// layer):
//   POST   /api/v1/admin/admins               → create admin
//   GET    /api/v1/admin/admins               → list admins
//   PATCH  /api/v1/admin/admins/:id           → update role/is_active
//   POST   /api/v1/admin/admins/:id/reset-password → rotate temp
//
// Audit: every mutation writes an entry via `recordAdminAudit`.

import type { Context } from 'hono'
import { AppError } from '../errors/AppError.js'
import {
  createAdmin,
  listAdmins,
  updateAdmin,
  resetAdminPassword,
  type UpdateAdminInput as ServiceUpdateAdminInput,
} from '../services/admins.service.js'
import {
  recordAdminAudit,
  extractRequestMeta,
} from '../services/admin-audit.service.js'
import type {
  CreateAdminInput,
  UpdateAdminInput,
} from '@creatorhub/shared'

function actingAdmin(c: Context): { id: string; email: string } {
  const id = c.get('adminId') as string | undefined
  const email = c.get('adminEmail') as string | undefined
  if (!id || !email) {
    // Guarded by requireAdminRole — should be impossible in practice.
    throw new AppError('internal', 500, 'Admin context missing from request')
  }
  return { id, email }
}

function routeId(c: Context): string {
  const id = c.req.param('id')
  if (id === undefined || id.length === 0) {
    throw new AppError('validation-failed', 400, 'id is required')
  }
  return id
}

// ─── POST /api/v1/admin/admins ────────────────────────────────

export async function handleCreateAdmin(c: Context): Promise<Response> {
  const body = c.get('validatedBody') as CreateAdminInput
  const acting = actingAdmin(c)
  const { ipAddress, userAgent } = extractRequestMeta(c)

  const result = await createAdmin(body, acting.id)

  void recordAdminAudit({
    adminId: acting.id,
    adminEmail: acting.email,
    action: 'create_admin',
    targetType: 'admin',
    targetId: result.admin.id,
    details: {
      email: result.admin.email,
      role: result.admin.role,
    },
    ipAddress,
    userAgent,
  })

  return c.json(
    {
      success: true,
      data: {
        admin: result.admin,
        // One-time display — never logged. Super_admin shares the
        // temp password out-of-band (WhatsApp / Signal / in person).
        temp_password: result.tempPassword,
      },
    },
    201,
  )
}

// ─── GET /api/v1/admin/admins ─────────────────────────────────

export async function handleListAdmins(c: Context): Promise<Response> {
  const admins = await listAdmins()
  return c.json({ success: true, data: admins })
}

// ─── PATCH /api/v1/admin/admins/:id ───────────────────────────

export async function handleUpdateAdmin(c: Context): Promise<Response> {
  const id = routeId(c)
  const body = c.get('validatedBody') as UpdateAdminInput
  const acting = actingAdmin(c)
  const { ipAddress, userAgent } = extractRequestMeta(c)

  // Copy only defined fields — service has exactOptionalPropertyTypes
  // and refuses `{ role: undefined }` as equivalent to an absent role.
  const patch: ServiceUpdateAdminInput = {}
  if (body.role !== undefined) patch.role = body.role
  if (body.is_active !== undefined) patch.is_active = body.is_active

  const admin = await updateAdmin(id, patch)

  void recordAdminAudit({
    adminId: acting.id,
    adminEmail: acting.email,
    action: 'update_admin',
    targetType: 'admin',
    targetId: id,
    details: body,
    ipAddress,
    userAgent,
  })

  return c.json({ success: true, data: admin })
}

// ─── POST /api/v1/admin/admins/:id/reset-password ─────────────

export async function handleResetAdminPassword(c: Context): Promise<Response> {
  const id = routeId(c)
  const acting = actingAdmin(c)
  const { ipAddress, userAgent } = extractRequestMeta(c)

  // Guard against super_admins resetting their own password through
  // this flow — use /auth/change-password instead. Prevents accidental
  // lockout if the super_admin doesn't see the temp password.
  if (id === acting.id) {
    throw new AppError(
      'validation-failed',
      400,
      'Use /auth/change-password to rotate your own password',
    )
  }

  const result = await resetAdminPassword(id)

  void recordAdminAudit({
    adminId: acting.id,
    adminEmail: acting.email,
    action: 'reset_admin_password',
    targetType: 'admin',
    targetId: id,
    ipAddress,
    userAgent,
  })

  return c.json({
    success: true,
    data: {
      admin: result.admin,
      temp_password: result.tempPassword,
    },
  })
}
