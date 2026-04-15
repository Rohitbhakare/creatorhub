import { Hono } from 'hono'
import { authenticate } from '../middleware/authenticate.js'
import {
  handleRequestDeletion,
  handleCancelDeletion,
  handleGetDeletionStatus,
  handleExportUserData,
  handleRecordConsent,
  handleGetConsentStatus,
} from '../handlers/dpdpa.js'

const dpdpaRoutes = new Hono()

// ─── Deletion ─────────────────────────────────────────────────
dpdpaRoutes.post('/deletion/request', authenticate, handleRequestDeletion)
dpdpaRoutes.post('/deletion/cancel', authenticate, handleCancelDeletion)
dpdpaRoutes.get('/deletion/status', authenticate, handleGetDeletionStatus)

// ─── Data Export ──────────────────────────────────────────────
dpdpaRoutes.get('/export', authenticate, handleExportUserData)

// ─── Consent ──────────────────────────────────────────────────
dpdpaRoutes.post('/consent', authenticate, handleRecordConsent)
dpdpaRoutes.get('/consent', authenticate, handleGetConsentStatus)

export default dpdpaRoutes
