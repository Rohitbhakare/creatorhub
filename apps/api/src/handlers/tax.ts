import type { Context } from 'hono'
import { AppError } from '../errors/AppError.js'
import { supabase } from '../lib/supabase.js'
import {
  generateBuyerInvoice,
  getTdsInfo,
  getAnnualTdsSummary,
} from '../services/tax.service.js'

// ─── GET /tax/invoice/:bookingId ──────────────────────────────────────────────

export async function handleGetInvoice(c: Context): Promise<Response> {
  const bookingId = c.req.param('bookingId')
  const userId = c.get('userId') as string

  if (!bookingId) {
    throw new AppError('validation-failed', 400, 'bookingId is required')
  }

  // Verify the requesting user is the buyer before generating the invoice
  const { data: booking } = await supabase
    .from('bookings')
    .select('user_id')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    throw new AppError('not-found', 404, 'Booking not found')
  }

  if (booking.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not have access to this invoice')
  }

  const invoice = await generateBuyerInvoice(bookingId)

  return c.json({ success: true, data: invoice })
}

// ─── GET /tax/tds/:bookingId ──────────────────────────────────────────────────

export async function handleGetTds(c: Context): Promise<Response> {
  const bookingId = c.req.param('bookingId')
  const userId = c.get('userId') as string

  if (!bookingId) {
    throw new AppError('validation-failed', 400, 'bookingId is required')
  }

  const tdsInfo = await getTdsInfo(bookingId, userId)

  return c.json({ success: true, data: tdsInfo })
}

// ─── GET /tax/tds/summary/:financialYear ─────────────────────────────────────

export async function handleGetTdsSummary(c: Context): Promise<Response> {
  const financialYear = c.req.param('financialYear')
  const userId = c.get('userId') as string

  if (!financialYear) {
    throw new AppError('validation-failed', 400, 'financialYear is required')
  }

  const summary = await getAnnualTdsSummary(userId, financialYear)

  return c.json({ success: true, data: summary })
}
