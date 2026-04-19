/**
 * Payout Notifications Service — E2.12 T15.
 *
 * Four lifecycle notifications:
 *   1. payouts_enabled       — linked account activated
 *   2. payout_processed      — payout completed (money landed)
 *   3. payout_failed         — reversal/failure (action required)
 *   4. payout_action_required — linked account needs_clarification / rejected
 *
 * Channels: FCM push (via push.service) + SendGrid email (via email.service).
 * Category: `bookings_trips` — respects user preferences; DND bypassed only for
 * failures (action-required) per NOT-FR-005.
 *
 * Fire-and-forget: never throws. All callers can invoke safely.
 */

import { supabase } from '../lib/supabase.js'
import { sendPush } from './push.service.js'
import { sendEmail } from './email.service.js'
import { getPreferences } from './notification.service.js'

type Row = Record<string, unknown>

function formatRupees(paisa: number): string {
  const rupees = paisa / 100
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees)
}

async function fetchUser(userId: string): Promise<{
  email: string | null
  displayName: string | null
} | null> {
  const { data } = await supabase
    .from('users')
    .select('email, display_name')
    .eq('id', userId)
    .maybeSingle()
  if (!data) return null
  const d = data as Row
  return {
    email: (d.email as string | null) ?? null,
    displayName: (d.display_name as string | null) ?? null,
  }
}

async function emailEnabledFor(userId: string): Promise<boolean> {
  try {
    const prefs = await getPreferences(userId)
    const pref = prefs.find(
      (p) => p.category === 'bookings_trips' && p.channel === 'email',
    )
    return pref ? pref.enabled : true
  } catch {
    return true
  }
}

// ─── 1. Payouts enabled (linked account activated) ───────────

export async function notifyPayoutsEnabled(userId: string): Promise<void> {
  try {
    await sendPush(userId, {
      type: 'payouts_enabled',
      category: 'bookings_trips',
      title: 'Payouts enabled',
      body: 'Your bank account is verified. Payouts will now land in your account after bookings complete.',
      targetRoute: '/studio/earnings',
    })

    const user = await fetchUser(userId)
    if (!user?.email) return
    if (!(await emailEnabledFor(userId))) return

    const name = user.displayName ?? 'Creator'
    await sendEmail({
      to: user.email,
      subject: 'Your CreatorHub payouts are enabled',
      htmlBody: `
        <p>Hi ${name},</p>
        <p>Good news — your bank account is verified and payouts are now enabled for your CreatorHub account.</p>
        <p>After each booking completes, funds settle to your account within 1–2 business days (minus a 48-hour dispute window).</p>
        <p>You can see all your payouts anytime in <a href="https://creatorhub.in/studio/earnings">Studio → Earnings</a>.</p>
        <p>— The CreatorHub Team</p>
      `,
      textBody: `Hi ${name},\n\nYour bank account is verified and payouts are now enabled. Funds settle 1–2 business days after each booking completes (after a 48-hour dispute window).\n\nSee your payouts: https://creatorhub.in/studio/earnings\n\n— The CreatorHub Team`,
    })
  } catch (err) {
    console.error('[payout-notif] notifyPayoutsEnabled failed', userId, err)
  }
}

// ─── 2. Payout processed (completed) ─────────────────────────

export async function notifyPayoutProcessed(
  userId: string,
  opts: { amountPaisa: number; tdsPaisa: number; bookingTitle: string | null },
): Promise<void> {
  try {
    const net = opts.amountPaisa - opts.tdsPaisa
    const netRupees = formatRupees(net)
    const titleSuffix = opts.bookingTitle ? ` for ${opts.bookingTitle}` : ''

    await sendPush(userId, {
      type: 'payout_processed',
      category: 'bookings_trips',
      title: `₹${netRupees} sent to your bank`,
      body: `Your payout${titleSuffix} is on its way. It usually reflects within a few hours.`,
      targetRoute: '/studio/earnings',
    })

    const user = await fetchUser(userId)
    if (!user?.email) return
    if (!(await emailEnabledFor(userId))) return

    const name = user.displayName ?? 'Creator'
    const tdsLine = opts.tdsPaisa > 0
      ? `<p>Amount: ₹${formatRupees(opts.amountPaisa)} &nbsp;·&nbsp; TDS: ₹${formatRupees(opts.tdsPaisa)} &nbsp;·&nbsp; <strong>Net: ₹${netRupees}</strong></p>`
      : `<p><strong>Net: ₹${netRupees}</strong></p>`

    await sendEmail({
      to: user.email,
      subject: `Payout sent — ₹${netRupees}`,
      htmlBody: `
        <p>Hi ${name},</p>
        <p>Your payout${titleSuffix ? ` for <em>${opts.bookingTitle}</em>` : ''} has been sent to your bank.</p>
        ${tdsLine}
        <p>Funds usually reflect within a few hours, depending on your bank.</p>
        <p>Full history: <a href="https://creatorhub.in/studio/earnings">Studio → Earnings</a>.</p>
        <p>— The CreatorHub Team</p>
      `,
      textBody: `Hi ${name},\n\nYour payout of ₹${netRupees}${titleSuffix} has been sent to your bank. Funds usually reflect within a few hours.\n\nSee history: https://creatorhub.in/studio/earnings`,
    })
  } catch (err) {
    console.error('[payout-notif] notifyPayoutProcessed failed', userId, err)
  }
}

// ─── 3. Payout failed ────────────────────────────────────────

export async function notifyPayoutFailed(
  userId: string,
  opts: { reason: string | null; bookingTitle: string | null },
): Promise<void> {
  try {
    await sendPush(userId, {
      type: 'payout_failed',
      category: 'bookings_trips',
      title: 'Payout failed',
      body: opts.reason
        ? `Your payout could not be processed: ${opts.reason}. Tap for next steps.`
        : 'Your payout could not be processed. Tap for next steps.',
      targetRoute: '/studio/earnings',
    })

    const user = await fetchUser(userId)
    if (!user?.email) return
    // Failures bypass email preference — this is action-required.

    const name = user.displayName ?? 'Creator'
    const reasonLine = opts.reason
      ? `<p>Reason reported by our payments partner: <em>${opts.reason}</em></p>`
      : ''

    await sendEmail({
      to: user.email,
      subject: 'Action required — payout failed',
      htmlBody: `
        <p>Hi ${name},</p>
        <p>A payout ${opts.bookingTitle ? `for <em>${opts.bookingTitle}</em> ` : ''}could not be processed.</p>
        ${reasonLine}
        <p>We've put the amount back on hold so nothing is lost. Please check <a href="https://creatorhub.in/studio/earnings">Studio → Earnings</a> and verify your bank details in <a href="https://creatorhub.in/kyc">KYC</a> if anything looks wrong.</p>
        <p>If you think this is a mistake, reply to this email and we'll help sort it out.</p>
        <p>— The CreatorHub Team</p>
      `,
      textBody: `Hi ${name},\n\nA payout${opts.bookingTitle ? ` for ${opts.bookingTitle}` : ''} could not be processed.${opts.reason ? ` Reason: ${opts.reason}.` : ''}\n\nThe amount is on hold — nothing is lost. Please check Studio → Earnings (https://creatorhub.in/studio/earnings) and verify your KYC (https://creatorhub.in/kyc).`,
    })
  } catch (err) {
    console.error('[payout-notif] notifyPayoutFailed failed', userId, err)
  }
}

// ─── 4. Linked account action required ───────────────────────

export async function notifyLinkedAccountActionRequired(
  userId: string,
  opts: { reason: 'needs_clarification' | 'rejected' | 'suspended' },
): Promise<void> {
  try {
    const subjectByReason: Record<typeof opts.reason, string> = {
      needs_clarification: 'Bank verification needs more info',
      rejected: 'Bank verification was rejected',
      suspended: 'Payouts are paused',
    }
    const bodyByReason: Record<typeof opts.reason, string> = {
      needs_clarification:
        'Your KYC needs a few more details before we can enable payouts.',
      rejected:
        'Your KYC was rejected. Tap to review and resubmit.',
      suspended:
        'Your payouts are temporarily paused. Open CreatorHub for details.',
    }

    await sendPush(userId, {
      type: 'payout_action_required',
      category: 'bookings_trips',
      title: subjectByReason[opts.reason],
      body: bodyByReason[opts.reason],
      targetRoute: '/kyc',
    })

    const user = await fetchUser(userId)
    if (!user?.email) return
    // Action-required emails bypass preference.

    const name = user.displayName ?? 'Creator'
    await sendEmail({
      to: user.email,
      subject: `Action required — ${subjectByReason[opts.reason]}`,
      htmlBody: `
        <p>Hi ${name},</p>
        <p>${bodyByReason[opts.reason]}</p>
        <p>Please open <a href="https://creatorhub.in/kyc">KYC</a> in the CreatorHub app to continue.</p>
        <p>Paid bookings will be held until this is resolved.</p>
        <p>— The CreatorHub Team</p>
      `,
      textBody: `Hi ${name},\n\n${bodyByReason[opts.reason]}\n\nOpen https://creatorhub.in/kyc to continue. Paid bookings will be held until this is resolved.`,
    })
  } catch (err) {
    console.error(
      '[payout-notif] notifyLinkedAccountActionRequired failed',
      userId,
      err,
    )
  }
}
