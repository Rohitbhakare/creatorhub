import { Hono } from 'hono'
import { authenticate } from '../middleware/authenticate.js'
import {
  handleGetKycStatus,
  handleSubmitKyc,
  handleResubmitKyc,
  handleApproveKyc,
  handleRejectKyc,
} from '../handlers/kyc.js'

const kycRoutes = new Hono()

// ─── Authenticated user routes ────────────────────────────────
kycRoutes.get('/status', authenticate, handleGetKycStatus)
kycRoutes.post('/submit', authenticate, handleSubmitKyc)
kycRoutes.post('/resubmit', authenticate, handleResubmitKyc)

// ─── Admin routes (x-admin-secret header checked inside handler)
kycRoutes.post('/admin/approve', handleApproveKyc)
kycRoutes.post('/admin/reject', handleRejectKyc)

export default kycRoutes
