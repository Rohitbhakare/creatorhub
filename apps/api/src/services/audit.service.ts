import { supabase } from '../lib/supabase.js'

export type AuditEventType =
  | 'sign_in'
  | 'sign_out'
  | 'sign_up'
  | 'token_refresh'
  | 'phone_changed'
  | 'device_added'

type AuditMetadata = Record<string, unknown>

/**
 * Log an audit event. Fire-and-forget — never throws.
 * Never log tokens, OTP codes, or PII in metadata.
 */
export async function logAuditEvent(
  userId: string | null,
  eventType: AuditEventType,
  metadata: AuditMetadata = {},
  ip?: string | null,
  userAgent?: string | null,
): Promise<void> {
  try {
    await supabase.from('audit_events').insert({
      user_id: userId,
      event_type: eventType,
      ip_address: ip ?? null,
      user_agent: userAgent ?? null,
      metadata,
    })
  } catch {
    // Audit logging must never throw — fire and forget
    console.error('[audit] failed to log event:', eventType)
  }
}

/**
 * Extract client IP from request headers.
 * Handles Fly.io/Cloudflare proxy chain.
 */
export function extractIp(headers: Headers): string | null {
  return (
    headers.get('fly-client-ip') ??
    headers.get('cf-connecting-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null
  )
}
