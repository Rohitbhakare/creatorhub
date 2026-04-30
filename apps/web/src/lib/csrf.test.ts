import { describe, it, expect } from 'vitest'
import {
  CSRF_COOKIE,
  CSRF_HEADER,
  generateCsrfToken,
  isOriginAllowed,
  isSafeMethod,
} from './csrf'

describe('csrf', () => {
  it('exposes constants for cookie + header', () => {
    expect(CSRF_COOKIE).toBe('ch_csrf')
    expect(CSRF_HEADER).toBe('x-csrf-token')
  })

  it.each(['GET', 'HEAD', 'OPTIONS', 'get', 'head'])('marks %s as safe', (m) => {
    expect(isSafeMethod(m)).toBe(true)
  })

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('marks %s as unsafe', (m) => {
    expect(isSafeMethod(m)).toBe(false)
  })

  it('generates 64-hex-char tokens with sufficient entropy', () => {
    const a = generateCsrfToken()
    const b = generateCsrfToken()
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(b).toMatch(/^[0-9a-f]{64}$/)
    expect(a).not.toBe(b)
  })

  describe('isOriginAllowed', () => {
    const ownOrigin = 'https://creatorhub.in'

    it('allows the own origin', () => {
      expect(isOriginAllowed(ownOrigin, null, ownOrigin)).toBe(true)
    })

    it('allows entries from the explicit allow-list', () => {
      expect(
        isOriginAllowed('https://razorpay.com', null, ownOrigin, ['https://razorpay.com']),
      ).toBe(true)
    })

    it('rejects a foreign origin', () => {
      expect(isOriginAllowed('https://attacker.com', null, ownOrigin)).toBe(false)
    })

    it('rejects when only Referer points to a foreign origin', () => {
      expect(isOriginAllowed(null, 'https://attacker.com/page', ownOrigin)).toBe(false)
    })

    it('falls back to Referer when Origin is absent and matches own', () => {
      expect(isOriginAllowed(null, 'https://creatorhub.in/discover', ownOrigin)).toBe(true)
    })

    it('allows when both Origin AND Referer are absent (non-browser tool)', () => {
      expect(isOriginAllowed(null, null, ownOrigin)).toBe(true)
    })

    it('rejects malformed Referer URLs gracefully', () => {
      expect(isOriginAllowed(null, 'not-a-url', ownOrigin)).toBe(false)
    })
  })
})
