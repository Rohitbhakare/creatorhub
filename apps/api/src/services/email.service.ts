import { supabase } from '../lib/supabase.js'
import { getPreferences } from './notification.service.js'

// ─── SendGrid API ─────────────────────────────────────────────
// POST https://api.sendgrid.com/v3/mail/send

const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send'
const FROM_EMAIL = 'noreply@creatorhub.in'
const FROM_NAME = 'CreatorHub'

// ─── sendEmail ────────────────────────────────────────────────

/**
 * Send a transactional email via SendGrid.
 * Fire-and-forget — never throws. All errors are caught and logged.
 */
export async function sendEmail(options: {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
}): Promise<void> {
  try {
    const apiKey = process.env['SENDGRID_API_KEY']
    if (!apiKey) {
      console.warn('[email] SENDGRID_API_KEY not configured — skipping email to', options.to)
      return
    }

    const payload = {
      personalizations: [{ to: [{ email: options.to }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: options.subject,
      content: [
        ...(options.textBody != null
          ? [{ type: 'text/plain', value: options.textBody }]
          : []),
        { type: 'text/html', value: options.htmlBody },
      ],
    }

    const res = await fetch(SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[email] SendGrid error:', res.status, errText)
    }
  } catch (err) {
    // Fire-and-forget — never propagate email errors to callers
    console.error('[email] Failed to send email to', options.to, err)
  }
}

// ─── sendBookingConfirmationEmail ─────────────────────────────

/**
 * Send booking confirmation email to the buyer.
 * Subject: "Booking Confirmed — {experienceTitle}"
 */
export async function sendBookingConfirmationEmail(userId: string, bookingId: string): Promise<void> {
  try {
    // Check user email preference for bookings_trips
    const prefs = await getPreferences(userId)
    const pref = prefs.find((p) => p.category === 'bookings_trips' && p.channel === 'email')
    if (pref && !pref.enabled) return

    // Fetch user details
    const { data: user } = await supabase
      .from('users')
      .select('email, display_name')
      .eq('id', userId)
      .maybeSingle()

    if (!user?.email) {
      console.warn('[email] No email for user', userId)
      return
    }

    // Fetch booking with content details
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, total_paisa, base_price_paisa, platform_fee_paisa, gst_paisa, start_date, content(title)')
      .eq('id', bookingId)
      .maybeSingle()

    if (!booking) {
      console.warn('[email] Booking not found', bookingId)
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

    const basePaisa = booking.base_price_paisa as number
    const platformFeePaisa = booking.platform_fee_paisa as number
    const gstPaisa = booking.gst_paisa as number
    const totalPaisa = booking.total_paisa as number

    const htmlBody = buildBookingConfirmationHtml({
      buyerName,
      experienceTitle,
      startDate,
      basePaisa,
      platformFeePaisa,
      gstPaisa,
      totalPaisa,
      bookingId,
    })

    await sendEmail({
      to: user.email as string,
      subject: `Booking Confirmed — ${experienceTitle}`,
      htmlBody,
      textBody: `Hi ${buyerName},\n\nYour booking for "${experienceTitle}" on ${startDate} is confirmed.\nTotal: ${formatPaisa(totalPaisa)}\nBooking ID: ${bookingId}\n\nSee you on the trail!\n— CreatorHub`,
    })
  } catch (err) {
    console.error('[email] Failed to send booking confirmation for booking', bookingId, err)
  }
}

// ─── sendKycApprovalEmail ─────────────────────────────────────

/**
 * Send KYC approval email.
 * Subject: "KYC Verified — You can now publish paid experiences"
 */
export async function sendKycApprovalEmail(userId: string): Promise<void> {
  try {
    const prefs = await getPreferences(userId)
    const pref = prefs.find((p) => p.category === 'platform_updates' && p.channel === 'email')
    if (pref && !pref.enabled) return

    const { data: user } = await supabase
      .from('users')
      .select('email, display_name')
      .eq('id', userId)
      .maybeSingle()

    if (!user?.email) return

    const buyerName = (user.display_name as string | null) ?? 'Creator'

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>KYC Verified</title></head>
<body style="font-family:sans-serif;background:#f9f9f9;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
    <h1 style="color:#E15A41;font-size:22px;margin-bottom:8px;">KYC Verified ✓</h1>
    <p style="color:#333;line-height:1.6;">Hi ${buyerName},</p>
    <p style="color:#333;line-height:1.6;">
      Great news! Your identity has been verified. You can now create and publish
      paid experiences on CreatorHub and start earning.
    </p>
    <a href="https://creatorhub.in/studio"
       style="display:inline-block;margin-top:16px;padding:12px 24px;background:#E15A41;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
      Go to Studio
    </a>
    <p style="color:#888;font-size:13px;margin-top:24px;">— CreatorHub Team</p>
  </div>
</body>
</html>`

    await sendEmail({
      to: user.email as string,
      subject: 'KYC Verified — You can now publish paid experiences',
      htmlBody,
      textBody: `Hi ${buyerName},\n\nYour KYC has been verified! You can now publish paid experiences.\n\nVisit: https://creatorhub.in/studio\n\n— CreatorHub Team`,
    })
  } catch (err) {
    console.error('[email] Failed to send KYC approval email for user', userId, err)
  }
}

// ─── sendKycRejectionEmail ────────────────────────────────────

/**
 * Send KYC rejection email.
 * Subject: "Action required — KYC verification needs attention"
 */
export async function sendKycRejectionEmail(userId: string, reason: string): Promise<void> {
  try {
    const prefs = await getPreferences(userId)
    const pref = prefs.find((p) => p.category === 'platform_updates' && p.channel === 'email')
    if (pref && !pref.enabled) return

    const { data: user } = await supabase
      .from('users')
      .select('email, display_name')
      .eq('id', userId)
      .maybeSingle()

    if (!user?.email) return

    const buyerName = (user.display_name as string | null) ?? 'Creator'

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>KYC Needs Attention</title></head>
<body style="font-family:sans-serif;background:#f9f9f9;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
    <h1 style="color:#E15A41;font-size:22px;margin-bottom:8px;">Action Required</h1>
    <p style="color:#333;line-height:1.6;">Hi ${buyerName},</p>
    <p style="color:#333;line-height:1.6;">
      We were unable to verify your KYC submission. Here's why:
    </p>
    <blockquote style="border-left:4px solid #E15A41;margin:16px 0;padding:12px 16px;background:#fef3f0;border-radius:0 8px 8px 0;color:#333;">
      ${escapeHtml(reason)}
    </blockquote>
    <p style="color:#333;line-height:1.6;">
      Please resubmit with corrected documents.
    </p>
    <a href="https://creatorhub.in/kyc"
       style="display:inline-block;margin-top:16px;padding:12px 24px;background:#E15A41;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
      Resubmit KYC
    </a>
    <p style="color:#888;font-size:13px;margin-top:24px;">— CreatorHub Team</p>
  </div>
</body>
</html>`

    await sendEmail({
      to: user.email as string,
      subject: 'Action required — KYC verification needs attention',
      htmlBody,
      textBody: `Hi ${buyerName},\n\nWe were unable to verify your KYC.\n\nReason: ${reason}\n\nPlease resubmit at: https://creatorhub.in/kyc\n\n— CreatorHub Team`,
    })
  } catch (err) {
    console.error('[email] Failed to send KYC rejection email for user', userId, err)
  }
}

// ─── Internal helpers ─────────────────────────────────────────

function formatPaisa(paisa: number): string {
  const rupees = Math.floor(paisa / 100)
  return `₹${rupees.toLocaleString('en-IN')}`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildBookingConfirmationHtml(opts: {
  buyerName: string
  experienceTitle: string
  startDate: string
  basePaisa: number
  platformFeePaisa: number
  gstPaisa: number
  totalPaisa: number
  bookingId: string
}): string {
  const { buyerName, experienceTitle, startDate, basePaisa, platformFeePaisa, gstPaisa, totalPaisa, bookingId } = opts

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Booking Confirmed</title></head>
<body style="font-family:sans-serif;background:#f9f9f9;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
    <h1 style="color:#E15A41;font-size:22px;margin-bottom:8px;">Booking Confirmed ✓</h1>
    <p style="color:#333;line-height:1.6;">Hi ${escapeHtml(buyerName)},</p>
    <p style="color:#333;line-height:1.6;">
      Your booking for <strong>${escapeHtml(experienceTitle)}</strong> on ${escapeHtml(startDate)} is confirmed.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-top:20px;">
      <tr>
        <td style="padding:8px 0;color:#555;border-bottom:1px solid #eee;">Base price</td>
        <td style="padding:8px 0;color:#333;text-align:right;border-bottom:1px solid #eee;">${formatPaisa(basePaisa)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#555;border-bottom:1px solid #eee;">Platform fee</td>
        <td style="padding:8px 0;color:#333;text-align:right;border-bottom:1px solid #eee;">${formatPaisa(platformFeePaisa)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#555;border-bottom:1px solid #eee;">GST (18%)</td>
        <td style="padding:8px 0;color:#333;text-align:right;border-bottom:1px solid #eee;">${formatPaisa(gstPaisa)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#111;font-weight:700;">Total paid</td>
        <td style="padding:10px 0;color:#E15A41;font-weight:700;text-align:right;">${formatPaisa(totalPaisa)}</td>
      </tr>
    </table>

    <p style="color:#888;font-size:13px;margin-top:20px;">Booking ID: ${escapeHtml(bookingId)}</p>
    <p style="color:#333;line-height:1.6;margin-top:16px;">See you on the trail!</p>
    <p style="color:#888;font-size:13px;margin-top:8px;">— CreatorHub Team</p>
  </div>
</body>
</html>`
}
