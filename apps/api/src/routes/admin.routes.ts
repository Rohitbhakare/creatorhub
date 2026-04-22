// Admin routes (legacy — pre-E4.1 surface).
//
// Every route uses `dualAdminAuth([...roles])`. During the 2-week
// rollout window this middleware accepts EITHER the legacy
// `x-admin-secret` header (Retool, ops scripts) OR a signed
// `ch_admin_session` cookie whose admin row carries a role in the
// allow list. T23 removes the secret path.
//
// Role assignments here come from plan.md §7:
//   - User search/detail/suspend → support, content_moderator, super_admin
//   - Content moderation/takedown → content_moderator, super_admin
//   - KYC queue + detail → support, super_admin (KYC-FR-032 PII gate)
//   - Refund processing → finance, super_admin
//   - Audit log read → any admin (handler scopes non-super_admins to
//     their own rows — super_admin sees everything)

import { Hono } from 'hono'
import {
  handleSearchUsers,
  handleGetUserDetail,
  handleSuspendUser,
  handleUnsuspendUser,
  handleTakedownContent,
  handleGetContentForModeration,
  handleSearchContent,
  handleListPendingKyc,
  handleGetKycSubmission,
  handleApproveKycSession,
  handleRejectKycSession,
  handleProcessRefund,
  handleGetAdminBookingDetail,
  handleGetAuditLog,
} from '../handlers/admin.js'
import {
  handleFeatureContent,
  handleUnfeatureContent,
  handleFeatureUser,
  handleUnfeatureUser,
} from '../handlers/admin-features.js'
import {
  handleForceReleasePayout,
  handleListAdminPayouts,
  handleGetAdminPayoutDetail,
} from '../handlers/admin-payouts.js'
import { dualAdminAuth } from '../middleware/dualAdminAuth.js'
import { validateBody } from '../middleware/validate.js'
import {
  featureToggleSchema,
  forceReleasePayoutSchema,
} from '@creatorhub/shared'

const adminRoutes = new Hono()

const USER_MGMT_ROLES = ['support', 'content_moderator', 'super_admin'] as const
const MODERATION_ROLES = ['content_moderator', 'super_admin'] as const
const KYC_ROLES = ['support', 'super_admin'] as const
const FINANCE_ROLES = ['finance', 'super_admin'] as const
const AUDIT_ROLES = [
  'super_admin',
  'content_moderator',
  'support',
  'finance',
  'operations',
] as const

// ─── User management ─────────────────────────────────────────
adminRoutes.get('/users/search', dualAdminAuth([...USER_MGMT_ROLES]), handleSearchUsers)
adminRoutes.get('/users/:userId', dualAdminAuth([...USER_MGMT_ROLES]), handleGetUserDetail)
adminRoutes.post('/users/:userId/suspend', dualAdminAuth([...USER_MGMT_ROLES]), handleSuspendUser)
adminRoutes.post('/users/:userId/unsuspend', dualAdminAuth([...USER_MGMT_ROLES]), handleUnsuspendUser)

// ─── Content moderation ──────────────────────────────────────
adminRoutes.get(
  '/content/search',
  dualAdminAuth([...MODERATION_ROLES]),
  handleSearchContent,
)
adminRoutes.get('/content/:contentId', dualAdminAuth([...MODERATION_ROLES]), handleGetContentForModeration)
adminRoutes.post('/content/:contentId/takedown', dualAdminAuth([...MODERATION_ROLES]), handleTakedownContent)

// ─── Editorial features (ADM-FR-011) ─────────────────────────
adminRoutes.post(
  '/content/:contentId/feature',
  dualAdminAuth([...MODERATION_ROLES]),
  validateBody(featureToggleSchema),
  handleFeatureContent,
)
adminRoutes.post(
  '/content/:contentId/unfeature',
  dualAdminAuth([...MODERATION_ROLES]),
  validateBody(featureToggleSchema),
  handleUnfeatureContent,
)
adminRoutes.post(
  '/users/:userId/feature',
  dualAdminAuth([...MODERATION_ROLES]),
  validateBody(featureToggleSchema),
  handleFeatureUser,
)
adminRoutes.post(
  '/users/:userId/unfeature',
  dualAdminAuth([...MODERATION_ROLES]),
  validateBody(featureToggleSchema),
  handleUnfeatureUser,
)

// ─── KYC queue ───────────────────────────────────────────────
adminRoutes.get('/kyc', dualAdminAuth([...KYC_ROLES]), handleListPendingKyc)
adminRoutes.get('/kyc/:userId', dualAdminAuth([...KYC_ROLES]), handleGetKycSubmission)
adminRoutes.post(
  '/kyc/:userId/approve',
  dualAdminAuth([...KYC_ROLES]),
  handleApproveKycSession,
)
adminRoutes.post(
  '/kyc/:userId/reject',
  dualAdminAuth([...KYC_ROLES]),
  handleRejectKycSession,
)

// ─── Bookings / Refunds ──────────────────────────────────────
adminRoutes.get(
  '/bookings/:bookingId',
  dualAdminAuth([...FINANCE_ROLES]),
  handleGetAdminBookingDetail,
)
adminRoutes.post('/bookings/:bookingId/refund', dualAdminAuth([...FINANCE_ROLES]), handleProcessRefund)

// ─── Payouts (ADM-FR-004) ────────────────────────────────────
adminRoutes.get(
  '/payouts',
  dualAdminAuth([...FINANCE_ROLES]),
  handleListAdminPayouts,
)
adminRoutes.get(
  '/payouts/:payoutId',
  dualAdminAuth([...FINANCE_ROLES]),
  handleGetAdminPayoutDetail,
)
adminRoutes.post(
  '/payouts/release',
  dualAdminAuth([...FINANCE_ROLES]),
  validateBody(forceReleasePayoutSchema),
  handleForceReleasePayout,
)

// ─── Audit log ───────────────────────────────────────────────
adminRoutes.get('/audit-log', dualAdminAuth([...AUDIT_ROLES]), handleGetAuditLog)

export default adminRoutes
