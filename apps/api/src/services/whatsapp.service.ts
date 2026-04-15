import { supabase } from '../lib/supabase.js'
import { getPreferences } from './notification.service.js'

// ─── Meta Cloud API ───────────────────────────────────────────
// POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages

const META_API_BASE = 'https://graph.facebook.com/v18.0'

// ─── sendWhatsApp ─────────────────────────────────────────────

/**
 * Send a WhatsApp template message via Meta Cloud API.
 * Fire-and-forget — never throws. All errors are caught and logged.
 */
export async function sendWhatsApp(
  toPhone: string,       // E.164 format: +919876543210
  templateName: string,  // Approved WhatsApp template name
  params: string[],      // Template variable values in order
): Promise<void> {
  try {
    const token = process.env['WHATSAPP_TOKEN']
    const phoneNumberId = process.env['WHATSAPP_PHONE_NUMBER_ID']

    if (!token || !phoneNumberId) {
      console.warn('[whatsapp] WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured — skipping')
      return
    }

    // Strip leading + from E.164 for Meta API (expects digits only)
    const toNumber = toPhone.startsWith('+') ? toPhone.slice(1) : toPhone

    const body = {
      messaging_product: 'whatsapp',
      to: toNumber,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components:
          params.length > 0
            ? [
                {
                  type: 'body',
                  parameters: params.map((value) => ({ type: 'text', text: value })),
                },
              ]
            : [],
      },
    }

    const res = await fetch(`${META_API_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[whatsapp] Meta API error:', res.status, errText)
    }
  } catch (err) {
    // Fire-and-forget — never propagate WhatsApp errors to callers
    console.error('[whatsapp] Failed to send template', templateName, 'to', toPhone, err)
  }
}

// ─── sendBookingConfirmation ──────────────────────────────────

/**
 * Send a booking confirmation WhatsApp message to the buyer.
 * Template: 'booking_confirmation'
 * Params: [buyerName, experienceTitle, startDate, totalAmount]
 */
export async function sendBookingConfirmation(userId: string, bookingId: string): Promise<void> {
  try {
    // Check user WhatsApp preference for bookings_trips
    const prefs = await getPreferences(userId)
    const pref = prefs.find(
      (p) => p.category === 'bookings_trips' && p.channel === 'whatsapp',
    )
    // bookings_trips + whatsapp is locked ON — but we still respect the preference row if it exists
    if (pref && !pref.enabled) {
      return
    }

    // Fetch user details (phone + display name)
    const { data: user } = await supabase
      .from('users')
      .select('phone, display_name')
      .eq('id', userId)
      .maybeSingle()

    if (!user?.phone) {
      console.warn('[whatsapp] No phone number for user', userId)
      return
    }

    // Fetch booking with content details
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, total_paisa, start_date, content(title)')
      .eq('id', bookingId)
      .maybeSingle()

    if (!booking) {
      console.warn('[whatsapp] Booking not found', bookingId)
      return
    }

    const buyerName = (user.display_name as string | null) ?? 'Traveler'
    const content = booking.content as unknown as { title: string | null } | null
    const experienceTitle = content?.title ?? 'Your Experience'
    const startDate = booking.start_date != null
      ? new Date(booking.start_date as string).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'TBD'
    const totalAmount = formatPaisa(booking.total_paisa as number)

    await sendWhatsApp(
      user.phone as string,
      'booking_confirmation',
      [buyerName, experienceTitle, startDate, totalAmount],
    )
  } catch (err) {
    // Fire-and-forget
    console.error('[whatsapp] Failed to send booking confirmation for booking', bookingId, err)
  }
}

// ─── Internal helpers ─────────────────────────────────────────

function formatPaisa(paisa: number): string {
  const rupees = Math.floor(paisa / 100)
  return `₹${rupees.toLocaleString('en-IN')}`
}
