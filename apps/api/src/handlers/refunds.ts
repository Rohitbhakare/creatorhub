/**
 * Refund handlers — thin layer: validate → call service → respond.
 *
 * Routes:
 *   GET  /content/:id/refund-policy        — get policy (public)
 *   PUT  /content/:id/refund-policy        — set policy (creator only)
 *   POST /bookings/:id/cancel              — buyer cancels
 *   POST /bookings/:id/cancel-by-creator   — creator cancels
 *   GET  /bookings/:id/refund              — get refund status
 */

import type { Context } from 'hono'
import { AppError } from '../errors/AppError.js'
import {
  getRefundPolicy,
  setRefundPolicy,
  cancelBookingByBuyer,
  cancelBookingByCreator,
  getRefundStatus,
} from '../services/refund.service.js'
import type { PolicyType } from '../services/refund.service.js'

const VALID_POLICY_TYPES: PolicyType[] = ['flexible', 'moderate', 'strict']

// ─── GET /content/:id/refund-policy ──────────────────────────────────────────

export async function handleGetRefundPolicy(c: Context): Promise<Response> {
  const contentId = c.req.param('id')

  if (!contentId) {
    throw new AppError('validation-failed', 400, 'Content ID is required')
  }

  const policy = await getRefundPolicy(contentId)

  return c.json({
    success: true,
    data: { policy_type: policy },
  })
}

// ─── PUT /content/:id/refund-policy ──────────────────────────────────────────

export async function handleSetRefundPolicy(c: Context): Promise<Response> {
  const contentId = c.req.param('id')
  const userId = c.get('userId') as string

  if (!contentId) {
    throw new AppError('validation-failed', 400, 'Content ID is required')
  }

  let body: { policy_type?: unknown }
  try {
    body = await c.req.json() as { policy_type?: unknown }
  } catch {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  }

  if (
    typeof body.policy_type !== 'string' ||
    !VALID_POLICY_TYPES.includes(body.policy_type as PolicyType)
  ) {
    throw new AppError('validation-failed', 400, 'policy_type must be one of: flexible, moderate, strict', [
      {
        field: 'policy_type',
        message: 'Must be one of: flexible, moderate, strict',
        code: 'invalid_enum_value',
      },
    ])
  }

  await setRefundPolicy(contentId, userId, body.policy_type as PolicyType)

  return c.json({
    success: true,
    data: { policy_type: body.policy_type },
  })
}

// ─── POST /bookings/:id/cancel ────────────────────────────────────────────────

export async function handleCancelByBuyer(c: Context): Promise<Response> {
  const bookingId = c.req.param('id')
  const userId = c.get('userId') as string

  if (!bookingId) {
    throw new AppError('validation-failed', 400, 'Booking ID is required')
  }

  let reason: string | undefined
  try {
    const body = await c.req.json() as { reason?: unknown }
    if (typeof body.reason === 'string' && body.reason.trim()) {
      reason = body.reason.trim()
    }
  } catch {
    // Body is optional — ignore parse errors
  }

  const { refundAmountPaisa, refundId } = await cancelBookingByBuyer(
    bookingId,
    userId,
    reason,
  )

  return c.json({
    success: true,
    data: {
      cancelled: true,
      refund_amount_paisa: refundAmountPaisa,
      refund_id: refundId,
    },
  })
}

// ─── POST /bookings/:id/cancel-by-creator ────────────────────────────────────

export async function handleCancelByCreator(c: Context): Promise<Response> {
  const bookingId = c.req.param('id')
  const userId = c.get('userId') as string

  if (!bookingId) {
    throw new AppError('validation-failed', 400, 'Booking ID is required')
  }

  let body: { reason?: unknown }
  try {
    body = await c.req.json() as { reason?: unknown }
  } catch {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  }

  if (typeof body.reason !== 'string' || !body.reason.trim()) {
    throw new AppError('validation-failed', 400, 'reason is required for creator cancellation', [
      { field: 'reason', message: 'Reason is required', code: 'required' },
    ])
  }

  await cancelBookingByCreator(bookingId, userId, body.reason.trim())

  return c.json({
    success: true,
    data: { cancelled: true },
  })
}

// ─── GET /bookings/:id/refund ─────────────────────────────────────────────────

export async function handleGetRefundStatus(c: Context): Promise<Response> {
  const bookingId = c.req.param('id')

  if (!bookingId) {
    throw new AppError('validation-failed', 400, 'Booking ID is required')
  }

  const refundStatus = await getRefundStatus(bookingId)

  if (!refundStatus) {
    throw new AppError('not-found', 404, 'No refund found for this booking')
  }

  return c.json({
    success: true,
    data: {
      status: refundStatus.status,
      amount_paisa: refundStatus.amountPaisa,
    },
  })
}
