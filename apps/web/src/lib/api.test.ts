import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatPrice, fetchCreatorProfile, fetchContentDetail } from './api'

// ── formatPrice ───────────────────────────────────────────────────────────────

describe('formatPrice', () => {
  it('returns FREE when isFree is true', () => {
    expect(formatPrice(650000, true)).toBe('FREE')
  })

  it('returns FREE when priceInPaisa is 0 regardless of isFree flag', () => {
    expect(formatPrice(0, false)).toBe('FREE')
  })

  it('formats ₹1 (minimum, 100 paisa)', () => {
    expect(formatPrice(100, false)).toBe('₹1')
  })

  it('formats ₹500 (50,000 paisa)', () => {
    expect(formatPrice(50000, false)).toBe('₹500')
  })

  it('formats ₹6,500 (6,50,000 paisa) with Indian locale comma', () => {
    expect(formatPrice(650000, false)).toBe('₹6,500')
  })

  it('formats ₹25,000 (2,500,000 paisa)', () => {
    expect(formatPrice(2500000, false)).toBe('₹25,000')
  })

  it('formats ₹1,00,000 (10,000,000 paisa) — Indian lakh formatting', () => {
    expect(formatPrice(10000000, false)).toBe('₹1,00,000')
  })
})

// ── fetchCreatorProfile ───────────────────────────────────────────────────────

describe('fetchCreatorProfile', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns null when API responds with a non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 404 }))
    expect(await fetchCreatorProfile('nonexistent')).toBeNull()
  })

  it('returns null on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))
    expect(await fetchCreatorProfile('any')).toBeNull()
  })

  it('returns null when response data field is null', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: null }), { status: 200 })
    )
    expect(await fetchCreatorProfile('any')).toBeNull()
  })

  it('returns the creator profile on success', async () => {
    const profile = {
      id: 'test-creator-001',
      username: 'testcreator',
      displayName: 'Rohit Travels',
      bio: 'Travel stories from the road.',
      avatarUrl: null,
      coverUrl: null,
      vertical: 'travel',
      followerCount: 1234,
      contentCount: 8,
      averageRating: 4.7,
      isCreator: true,
    }
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: profile }), { status: 200 })
    )
    expect(await fetchCreatorProfile('testcreator')).toEqual(profile)
  })
})

// ── fetchContentDetail ────────────────────────────────────────────────────────

describe('fetchContentDetail', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns null when API responds with a non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 404 }))
    expect(await fetchContentDetail('nonexistent-id')).toBeNull()
  })

  it('returns null on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))
    expect(await fetchContentDetail('any-id')).toBeNull()
  })

  it('returns null when response data field is null', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: null }), { status: 200 })
    )
    expect(await fetchContentDetail('any-id')).toBeNull()
  })

  it('returns free content detail on success', async () => {
    const content = {
      id: 'content-002',
      type: 'post' as const,
      title: 'Sunrise at Kedarnath',
      description: 'A breathtaking sunrise.',
      body: 'The air was cold...',
      coverImageUrl: null,
      priceInPaisa: 0,
      isFree: true,
      startsAt: null,
      endsAt: null,
      creator: {
        id: 'test-creator-001',
        username: 'testcreator',
        displayName: 'Rohit Travels',
        avatarUrl: null,
        vertical: 'travel',
      },
    }
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: content }), { status: 200 })
    )
    expect(await fetchContentDetail('content-002')).toEqual(content)
  })

  it('returns paid content detail on success', async () => {
    const content = {
      id: 'content-001',
      type: 'itinerary' as const,
      title: 'Bali in 5 Days',
      description: 'A curated 5-day travel plan.',
      body: null,
      coverImageUrl: null,
      priceInPaisa: 650000,
      isFree: false,
      startsAt: null,
      endsAt: null,
      creator: {
        id: 'test-creator-001',
        username: 'testcreator',
        displayName: 'Rohit Travels',
        avatarUrl: null,
        vertical: 'travel',
      },
    }
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: content }), { status: 200 })
    )
    expect(await fetchContentDetail('content-001')).toEqual(content)
  })
})
