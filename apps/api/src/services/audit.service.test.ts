import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must come before importing the service) ───────────────────────

vi.mock('../lib/supabase.js', () => {
  const insert = vi.fn()
  const from = vi.fn(() => ({ insert }))
  return { supabase: { from }, __insertSpy: insert }
})

import { logAuditEvent, extractIp } from './audit.service.js'
import { supabase } from '../lib/supabase.js'

// Shared insert spy reference
// (Typed loosely because vi.mock returns unknown shape in types.)
const insertSpy = (supabase.from() as unknown as { insert: ReturnType<typeof vi.fn> }).insert

// ─── logAuditEvent ─────────────────────────────────────────────────────────

describe('logAuditEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    insertSpy.mockResolvedValue({ data: null, error: null })
  })

  it('inserts into audit_events with all fields', async () => {
    await logAuditEvent('user-1', 'sign_up', { provider: 'phone' }, '1.2.3.4', 'Agent/1.0')

    expect(supabase.from).toHaveBeenCalledWith('audit_events')
    expect(insertSpy).toHaveBeenCalledWith({
      user_id: 'user-1',
      event_type: 'sign_up',
      ip_address: '1.2.3.4',
      user_agent: 'Agent/1.0',
      metadata: { provider: 'phone' },
    })
  })

  it('accepts null userId for anonymous events', async () => {
    await logAuditEvent(null, 'sign_in', {})

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: null, event_type: 'sign_in' }),
    )
  })

  it('defaults metadata to empty object, ip and userAgent to null', async () => {
    await logAuditEvent('user-2', 'sign_out')

    expect(insertSpy).toHaveBeenCalledWith({
      user_id: 'user-2',
      event_type: 'sign_out',
      ip_address: null,
      user_agent: null,
      metadata: {},
    })
  })

  it('never throws when the DB insert throws', async () => {
    insertSpy.mockRejectedValueOnce(new Error('db connection refused'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(
      logAuditEvent('user-3', 'token_refresh', { device_id: 'd1' }),
    ).resolves.toBeUndefined()

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[audit] failed to log event:'),
      'token_refresh',
    )

    errorSpy.mockRestore()
  })

  it('persists event types for each allowed audit value', async () => {
    const types = ['sign_in', 'sign_out', 'sign_up', 'token_refresh', 'phone_changed', 'device_added'] as const

    for (const t of types) {
      await logAuditEvent('u', t)
    }

    expect(insertSpy).toHaveBeenCalledTimes(types.length)
    for (let i = 0; i < types.length; i++) {
      expect(insertSpy).toHaveBeenNthCalledWith(
        i + 1,
        expect.objectContaining({ event_type: types[i] }),
      )
    }
  })
})

// ─── extractIp ─────────────────────────────────────────────────────────────

describe('extractIp', () => {
  it('prefers fly-client-ip over other headers', () => {
    const headers = new Headers({
      'fly-client-ip': '10.1.1.1',
      'cf-connecting-ip': '10.2.2.2',
      'x-forwarded-for': '10.3.3.3',
    })
    expect(extractIp(headers)).toBe('10.1.1.1')
  })

  it('falls back to cf-connecting-ip when fly-client-ip is missing', () => {
    const headers = new Headers({
      'cf-connecting-ip': '10.2.2.2',
      'x-forwarded-for': '10.3.3.3',
    })
    expect(extractIp(headers)).toBe('10.2.2.2')
  })

  it('falls back to first entry of x-forwarded-for when proxy headers are missing', () => {
    const headers = new Headers({ 'x-forwarded-for': '10.3.3.3, 10.4.4.4, 10.5.5.5' })
    expect(extractIp(headers)).toBe('10.3.3.3')
  })

  it('trims whitespace from x-forwarded-for first entry', () => {
    const headers = new Headers({ 'x-forwarded-for': '   10.3.3.3  , 10.4.4.4' })
    expect(extractIp(headers)).toBe('10.3.3.3')
  })

  it('returns null when no forwarding headers are present', () => {
    expect(extractIp(new Headers())).toBeNull()
  })
})
