import { describe, it, expect } from 'vitest'
import robots from './robots'

describe('robots', () => {
  const out = robots()

  it('exposes a sitemap pointer', () => {
    expect(out.sitemap).toMatch(/\/sitemap\.xml$/)
  })

  function firstRule() {
    const r = Array.isArray(out.rules) ? out.rules[0] : out.rules
    if (!r) throw new Error('robots() returned no rules')
    return r
  }

  it('allows the root path for all crawlers', () => {
    const rule = firstRule()
    expect(rule.userAgent).toBe('*')
    expect(rule.allow).toEqual(['/'])
  })

  it('disallows authed routes, auth flows, admin, and API', () => {
    const rule = firstRule()
    const disallow = (rule.disallow ?? []) as string[]
    for (const path of [
      '/saved',
      '/bookings',
      '/studio',
      '/publish',
      '/you',
      '/quests',
      '/notifications',
      '/onboarding',
      '/signin',
      '/signup',
      '/forgot-password',
      '/admin',
      '/api/',
    ]) {
      expect(disallow).toContain(path)
    }
  })
})
