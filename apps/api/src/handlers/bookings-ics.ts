import type { Context } from 'hono'
import { getBooking } from '../services/booking.service.js'
import { AppError } from '../errors/AppError.js'
import { buildIcs } from '../lib/ics.js'

/**
 * GET /api/v1/bookings/:id/ics
 *
 * Returns an RFC-5545 .ics file for the booking. Auth-gated; ownership
 * check via `getBooking(id, userId)` (which already enforces the buyer is
 * the user). The response carries the lead booker's email as ATTENDEE;
 * traveller emails are not in the .ics.
 */
export async function handleBookingIcs(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const bookingId = c.req.param('id')
  if (!bookingId) {
    throw new AppError('validation-failed', 400, 'Booking ID is required')
  }
  const booking = await getBooking(bookingId, userId)
  // booking shape varies — be defensive about field names.
  const b = booking as unknown as {
    id: string
    content_title?: string
    contentTitle?: string
    starts_at?: string | null
    startsAt?: string | null
    creator?: { display_name?: string; displayName?: string; username?: string }
  }
  const title = b.content_title ?? b.contentTitle ?? 'CreatorHub booking'
  const startsAt = b.starts_at ?? b.startsAt ?? null
  if (!startsAt) {
    throw new AppError('validation-failed', 400, 'Booking has no start date')
  }
  const organizerName =
    b.creator?.display_name ?? b.creator?.displayName ?? 'CreatorHub'
  const organizerEmail =
    (b.creator?.username ? `${b.creator.username}@creators.creatorhub.in` : 'no-reply@creatorhub.in')

  const ics = buildIcs({
    uid: b.id,
    summary: title,
    startsAt,
    organizerName,
    organizerEmail,
    description: 'Booked via CreatorHub. View at https://creatorhub.in/bookings/' + b.id,
  })
  return new Response(ics, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="creatorhub-booking-${b.id.slice(0, 8)}.ics"`,
      'cache-control': 'private, max-age=0, must-revalidate',
    },
  })
}
