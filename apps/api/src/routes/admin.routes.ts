import { Hono } from 'hono'
import {
  handleSearchUsers,
  handleGetUserDetail,
  handleSuspendUser,
  handleUnsuspendUser,
  handleTakedownContent,
  handleGetContentForModeration,
  handleListPendingKyc,
  handleGetKycSubmission,
  handleProcessRefund,
  handleGetAuditLog,
} from '../handlers/admin.js'

// All routes require x-admin-secret header — checked inside each handler.
// No Firebase auth here — admin routes are Retool-facing, auth via shared secret.

const adminRoutes = new Hono()

// ─── User management ─────────────────────────────────────────
adminRoutes.get('/users/search', handleSearchUsers)
adminRoutes.get('/users/:userId', handleGetUserDetail)
adminRoutes.post('/users/:userId/suspend', handleSuspendUser)
adminRoutes.post('/users/:userId/unsuspend', handleUnsuspendUser)

// ─── Content moderation ──────────────────────────────────────
adminRoutes.get('/content/:contentId', handleGetContentForModeration)
adminRoutes.post('/content/:contentId/takedown', handleTakedownContent)

// ─── KYC queue ───────────────────────────────────────────────
adminRoutes.get('/kyc', handleListPendingKyc)
adminRoutes.get('/kyc/:userId', handleGetKycSubmission)

// ─── Bookings / Refunds ──────────────────────────────────────
adminRoutes.post('/bookings/:bookingId/refund', handleProcessRefund)

// ─── Audit log ───────────────────────────────────────────────
adminRoutes.get('/audit-log', handleGetAuditLog)

export default adminRoutes
