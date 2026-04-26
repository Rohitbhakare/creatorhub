import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────

vi.mock('../lib/supabase.js', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))

import { supabase } from '../lib/supabase.js'
import {
  getNearYouSection,
  getVerticalSection,
  getDiscoverSection,
  getForYouSection,
  getFollowingSection,
  getHeroForTab,
  updateUserCity,
} from './feed.service.js'

// ─── Helpers ──────────────────────────────────────────────────────

type ChainMock = {
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  not: ReturnType<typeof vi.fn>
  is: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  then: (resolve: (v: unknown) => unknown) => Promise<unknown>
}

function mockChain(resolved: unknown): ChainMock {
  const chain: ChainMock = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolved),
    then: (resolve) => Promise.resolve(resolved).then(resolve),
  }
  return chain
}

const CITY = { id: 'in.mh.pune', name: 'Pune', state: 'Maharashtra', lat: 18.52, lng: 73.86 }

const CONTENT_ROW = {
  id: 'c1',
  type: 'post',
  title: 'Spiti trip',
  vertical: 'travel',
  pricing_model: 'free',
  price_paisa: 0,
  like_count: 5,
  starting_city_id: 'in.mh.pune',
  user_id: 'u1',
  fallback_level: 0,
}

const CREATOR = { id: 'u1', display_name: 'Riya', username: 'riya', avatar_url: null }

// Cities lookup result — shared across tests where a row has a non-null
// starting_city_id so enrichItems fires a cities batch.
const CITY_LOOKUP = [{ id: 'in.mh.pune', name: 'Pune' }]

// ─── getNearYouSection ────────────────────────────────────────────

describe('getNearYouSection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('falls back to popular-across-India when user has no current_city_id', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: { current_city_id: null }, error: null }) as never)
      // popular-across-India content query
      .mockReturnValueOnce(mockChain({ data: [], error: null }) as never)

    const result = await getNearYouSection('user-1')
    expect(result.items).toEqual([])
    expect(result.fallback_level).toBe(3)
    expect(result.label).toBe('Popular across India')
  })

  it('falls back to popular-across-India for guest with no city_id', async () => {
    vi.mocked(supabase.from)
      // popular-across-India content query only (no getUserLocation call)
      .mockReturnValueOnce(mockChain({ data: [], error: null }) as never)

    const result = await getNearYouSection(null)
    expect(result.fallback_level).toBe(3)
    expect(result.label).toBe('Popular across India')
  })

  it('returns items with level 0 on exact city match', async () => {
    // 1. users query → has current_city_id
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: { current_city_id: 'in.mh.pune' }, error: null }) as never)
      // 2. cities query → lat/lng for getUserLocation
      .mockReturnValueOnce(mockChain({ data: CITY, error: null }) as never)
      // 3. enrichItems: creators lookup
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)
      // 4. enrichItems: cities lookup (for tags.location_label)
      .mockReturnValueOnce(mockChain({ data: CITY_LOOKUP, error: null }) as never)

    // rpc → waterfall returns rows at level 0
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: Array(5).fill(CONTENT_ROW), error: null } as never)

    const result = await getNearYouSection('user-1')
    expect(result.fallback_level).toBe(0)
    expect(result.label).toBe('Weekend trips from Pune')
    expect(result.items).toHaveLength(5)
    expect(result.fallback_cities).toEqual([])
  })

  it('includes fallback_cities when level is 1', async () => {
    const row1 = { ...CONTENT_ROW, fallback_level: 1 }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: { current_city_id: 'in.mh.pune' }, error: null }) as never)
      .mockReturnValueOnce(mockChain({ data: CITY, error: null }) as never)
      // fallback cities lookup (for banner)
      .mockReturnValueOnce(mockChain({ data: [{ id: 'in.mh.nashik', name: 'Nashik' }], error: null }) as never)
      // enrichItems: creators
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)
      // enrichItems: cities (tag lookup)
      .mockReturnValueOnce(mockChain({ data: CITY_LOOKUP, error: null }) as never)

    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: Array(5).fill(row1), error: null } as never)

    const result = await getNearYouSection('user-1')
    expect(result.fallback_level).toBe(1)
    expect(result.label).toBe('Trips around you')
    expect(result.fallback_cities).toContain('Nashik')
  })

  it('returns level-3 label when waterfall returns empty', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: { current_city_id: 'in.mh.pune' }, error: null }) as never)
      .mockReturnValueOnce(mockChain({ data: CITY, error: null }) as never)

    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [], error: null } as never)

    const result = await getNearYouSection('user-1')
    expect(result.items).toEqual([])
    expect(result.fallback_level).toBe(3)
    expect(result.label).toBe('Popular across India')
  })

  it('falls back to popular-across-India when rpc fails AND fallback content query is empty', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: { current_city_id: 'in.mh.pune' }, error: null }) as never)
      .mockReturnValueOnce(mockChain({ data: CITY, error: null }) as never)
      // city-match fallback content query (rpc failed) — empty
      .mockReturnValueOnce(mockChain({ data: [], error: null }) as never)
      // popular-across-India content query
      .mockReturnValueOnce(mockChain({ data: [], error: null }) as never)

    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: { message: 'DB fail' } } as never)

    const result = await getNearYouSection('user-1')
    expect(result.fallback_level).toBe(3)
    expect(result.label).toBe('Popular across India')
  })
})

// ─── getVerticalSection ───────────────────────────────────────────

describe('getVerticalSection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns content items for a vertical', async () => {
    const contentChain = mockChain({ data: [CONTENT_ROW], error: null })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(contentChain as never)
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)
      .mockReturnValueOnce(mockChain({ data: CITY_LOOKUP, error: null }) as never)

    const items = await getVerticalSection('travel')
    expect(items).toHaveLength(1)
    expect(items[0]!.title).toBe('Spiti trip')
    expect(items[0]!.creator?.display_name).toBe('Riya')
  })

  it('returns empty array when no content exists', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: [], error: null }) as never)

    const items = await getVerticalSection('travel')
    expect(items).toEqual([])
  })

  it('throws db-error when query fails', async () => {
    const chain = mockChain({ data: null, error: { message: 'fail' } })
    vi.mocked(supabase.from).mockReturnValueOnce(chain as never)

    await expect(getVerticalSection('travel')).rejects.toMatchObject({ status: 500 })
  })
})

// ─── getDiscoverSection ───────────────────────────────────────────

describe('getDiscoverSection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns creators when no userId provided', async () => {
    const discoverRow = {
      user_id: 'u2',
      vertical: 'stories',
      users: { id: 'u2', display_name: 'Aditya', username: 'aditya', avatar_url: null, is_creator: true },
    }
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain({ data: [discoverRow], error: null }) as never,
    )

    const creators = await getDiscoverSection(null)
    expect(creators).toHaveLength(1)
    expect(creators[0]!.display_name).toBe('Aditya')
    expect(creators[0]!.vertical).toBe('stories')
  })

  it('excludes user verticals when userId is provided', async () => {
    // verticals query for the user
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: [{ vertical: 'travel' }], error: null }) as never)
      // discover creators query
      .mockReturnValueOnce(mockChain({ data: [], error: null }) as never)

    const creators = await getDiscoverSection('user-1')
    expect(creators).toEqual([])
  })

  it('dedupes creators that appear in multiple verticals', async () => {
    const rows = [
      { user_id: 'u2', vertical: 'stories', users: { id: 'u2', display_name: 'Aditya', username: 'a', avatar_url: null, is_creator: true } },
      { user_id: 'u2', vertical: 'offbeat', users: { id: 'u2', display_name: 'Aditya', username: 'a', avatar_url: null, is_creator: true } },
    ]
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain({ data: rows, error: null }) as never)

    const creators = await getDiscoverSection(null)
    expect(creators).toHaveLength(1)
  })

  it('throws db-error when query fails', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain({ data: null, error: { message: 'fail' } }) as never,
    )

    await expect(getDiscoverSection(null)).rejects.toMatchObject({ status: 500 })
  })
})

// ─── updateUserCity ───────────────────────────────────────────────

describe('updateUserCity', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when city not found', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain({ data: null, error: { message: 'not found' } }) as never,
    )

    await expect(updateUserCity('u1', 'bad-city')).rejects.toMatchObject({ status: 404 })
  })

  it('returns city on success', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain({ data: CITY, error: null }) as never,
    )
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: null } as never)

    const result = await updateUserCity('u1', CITY.id)
    expect(result).toMatchObject({ id: CITY.id, name: 'Pune' })
  })

  it('uses fallback update when rpc update_user_city fails', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: CITY, error: null }) as never) // city lookup
      .mockReturnValueOnce(mockChain({ data: null, error: null }) as never) // fallback users update

    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: { message: 'rpc fail' } } as never)

    const result = await updateUserCity('u1', CITY.id)
    expect(result.name).toBe('Pune')
  })
})

// ─── getForYouSection ─────────────────────────────────────────────

describe('getForYouSection', () => {
  beforeEach(() => vi.clearAllMocks())

  const followedRow = {
    id: 'c1', type: 'post', title: 'Followed trip', vertical: 'travel',
    pricing_model: 'free', price_paisa: 0, like_count: 10,
    comment_count: 2, duration_minutes: null, starting_city_id: 'in.mh.pune',
    cover_image_url: null, user_id: 'u1', published_at: '2026-04-10T00:00:00Z',
  }

  const verticalRow = {
    id: 'c2', type: 'self_paced_itinerary', title: 'Popular guide', vertical: 'travel',
    pricing_model: 'paid', price_paisa: 29900, like_count: 500,
    comment_count: 15, duration_minutes: 240, starting_city_id: 'in.mh.pune',
    cover_image_url: null, user_id: 'u2', published_at: '2026-03-15T00:00:00Z',
  }

  it('merges follows + verticals with followed content boosted over same-like vertical', async () => {
    // Followed piece has weight=2, likes=10 → score 30
    // Competing vertical piece has weight=1, likes=10 → score 20
    const followedOnly = { ...followedRow, id: 'f1', like_count: 10 }
    const verticalOnly = { ...verticalRow, id: 'v1', like_count: 10 }

    vi.mocked(supabase.from)
      // 1. follows query → user follows u1
      .mockReturnValueOnce(mockChain({ data: [{ following_id: 'u1' }], error: null }) as never)
      // 2. followed-content query (Promise.all leg 1)
      .mockReturnValueOnce(mockChain({ data: [followedOnly], error: null }) as never)
      // 3. user_active_verticals query (Promise.all leg 2)
      .mockReturnValueOnce(mockChain({ data: [{ vertical: 'travel' }], error: null }) as never)
      // 4. vertical-content query
      .mockReturnValueOnce(mockChain({ data: [verticalOnly], error: null }) as never)
      // 5. enrichItems → users
      .mockReturnValueOnce(mockChain({ data: [CREATOR, { ...CREATOR, id: 'u2', display_name: 'Arjun' }], error: null }) as never)
      // 6. enrichItems → cities (both rows have starting_city_id)
      .mockReturnValueOnce(mockChain({ data: CITY_LOOKUP, error: null }) as never)

    const items = await getForYouSection('user-1')
    expect(items).toHaveLength(2)
    expect(items[0]!.id).toBe('f1')
    expect(items[1]!.id).toBe('v1')
  })

  it('dedupes by id preferring followed weight over vertical weight', async () => {
    const followedSame = { ...followedRow, id: 'dup', like_count: 10 }
    const verticalSame = { ...verticalRow, id: 'dup', like_count: 10 }

    vi.mocked(supabase.from)
      // 1. follows
      .mockReturnValueOnce(mockChain({ data: [{ following_id: 'u1' }], error: null }) as never)
      // 2. followed-content
      .mockReturnValueOnce(mockChain({ data: [followedSame], error: null }) as never)
      // 3. user_active_verticals
      .mockReturnValueOnce(mockChain({ data: [{ vertical: 'travel' }], error: null }) as never)
      // 4. vertical-content (same id, lower weight → deduped out)
      .mockReturnValueOnce(mockChain({ data: [verticalSame], error: null }) as never)
      // 5. enrichItems → users
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)
      // 6. enrichItems → cities
      .mockReturnValueOnce(mockChain({ data: CITY_LOOKUP, error: null }) as never)

    const items = await getForYouSection('user-1')
    expect(items).toHaveLength(1)
    expect(items[0]!.creator?.id).toBe('u1') // from followed row, not vertical's u2
  })

  it('falls back to popular when no follows and no verticals', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: [], error: null }) as never) // follows empty
      .mockReturnValueOnce(mockChain({ data: [], error: null }) as never) // verticals empty
      .mockReturnValueOnce(mockChain({ data: [verticalRow], error: null }) as never) // popular fallback
      .mockReturnValueOnce(mockChain({ data: [{ ...CREATOR, id: 'u2' }], error: null }) as never)
      .mockReturnValueOnce(mockChain({ data: CITY_LOOKUP, error: null }) as never)

    const items = await getForYouSection('user-1')
    expect(items).toHaveLength(1)
    expect(items[0]!.title).toBe('Popular guide')
  })

  it('throws db-error when follows query fails', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: null, error: { message: 'fail' } }) as never)

    await expect(getForYouSection('user-1')).rejects.toMatchObject({ status: 500 })
  })
})

// ─── getFollowingSection ──────────────────────────────────────────

describe('getFollowingSection', () => {
  beforeEach(() => vi.clearAllMocks())

  const followedRow = {
    id: 'c1', type: 'post', title: 'Followed trip', vertical: 'travel',
    pricing_model: 'free', price_paisa: 0, like_count: 10,
    comment_count: 2, duration_minutes: null, starting_city_id: null,
    cover_image_url: null, user_id: 'u1', published_at: '2026-04-10T00:00:00Z',
  }

  it('returns empty when user follows nobody', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: [], error: null }) as never)

    const items = await getFollowingSection('user-1')
    expect(items).toEqual([])
  })

  it('attaches creator info to followed content', async () => {
    vi.mocked(supabase.from)
      // 1. follows query
      .mockReturnValueOnce(mockChain({ data: [{ following_id: 'u1' }], error: null }) as never)
      // 2. content query
      .mockReturnValueOnce(mockChain({ data: [followedRow], error: null }) as never)
      // 3. enrichItems → users (starting_city_id is null so cities is skipped)
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)

    const items = await getFollowingSection('user-1')
    expect(items).toHaveLength(1)
    expect(items[0]!.creator?.display_name).toBe('Riya')
  })

  it('throws db-error when query fails', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: null, error: { message: 'fail' } }) as never)

    await expect(getFollowingSection('user-1')).rejects.toMatchObject({ status: 500 })
  })
})

// ─── getHeroForTab ────────────────────────────────────────────────

describe('getHeroForTab', () => {
  beforeEach(() => vi.clearAllMocks())

  const row = {
    id: 'c1', type: 'post', title: 'Hero', vertical: 'travel',
    pricing_model: 'free', price_paisa: 0, like_count: 99,
    comment_count: 3, duration_minutes: null, starting_city_id: null,
    cover_image_url: null, user_id: 'u1', published_at: '2026-04-15T00:00:00Z',
  }

  it('returns first item from following tab', async () => {
    vi.mocked(supabase.from)
      // 1. follows query
      .mockReturnValueOnce(mockChain({ data: [{ following_id: 'u1' }], error: null }) as never)
      // 2. content query
      .mockReturnValueOnce(mockChain({ data: [row], error: null }) as never)
      // 3. enrichItems → users
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)

    const hero = await getHeroForTab('user-1', 'following')
    expect(hero?.title).toBe('Hero')
  })

  it('returns null when following tab is empty', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: [], error: null }) as never)

    const hero = await getHeroForTab('user-1', 'following')
    expect(hero).toBeNull()
  })

  it('falls back to popular-across-India when near_you user has no city', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: { current_city_id: null }, error: null }) as never)
      // popular-across-India fallback
      .mockReturnValueOnce(mockChain({ data: [row], error: null }) as never)
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)

    const hero = await getHeroForTab('user-1', 'near_you')
    expect(hero?.id).toBe('c1')
  })

  it('returns first for_you item via fallback path', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: [], error: null }) as never) // follows
      .mockReturnValueOnce(mockChain({ data: [], error: null }) as never) // verticals
      .mockReturnValueOnce(mockChain({ data: [row], error: null }) as never) // popular
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)

    const hero = await getHeroForTab('user-1', 'for_you')
    expect(hero?.id).toBe('c1')
  })
})

// ─── FeedTags enrichment (row-2 context chips) ────────────────────
// Covers DISC-FR-023a: budget_tier / read_time_min / location_label /
// season / trip_style / audience attached to every FeedContentItem via
// enrichItems. Exercised through getVerticalSection because it is the
// thinnest path that hits enrichItems with a single row.

describe('FeedTags enrichment', () => {
  beforeEach(() => vi.clearAllMocks())

  // Mobile should always get a tags object — omitting it would force clients
  // to null-guard the outer object.
  it('always attaches a tags object to every feed item', async () => {
    const row = {
      id: 'x1', type: 'post', title: 'A post', vertical: 'travel',
      pricing_model: 'free', price_paisa: 0, like_count: 0, comment_count: 0,
      duration_minutes: null, starting_city_id: null, cover_image_url: null,
      user_id: 'u1', published_at: null, facets: null, body: null,
    }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: [row], error: null }) as never)
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)
      // no cities chain — starting_city_id is null so enrichItems skips cities

    const items = await getVerticalSection('travel')
    expect(items[0]!.tags).toBeDefined()
    expect(items[0]!.tags).toEqual(
      expect.objectContaining({
        season: null,
        trip_style: null,
        audience: null,
        budget_tier: null,      // post → null (free social content)
        read_time_min: null,    // body is null → omitted
        location_label: null,
      }),
    )
  })

  it('derives budget_tier from price_paisa buckets', async () => {
    const freeRow = {
      id: 'f1', type: 'self_paced_itinerary', title: 'Free guide', vertical: 'travel',
      pricing_model: 'free', price_paisa: 0, like_count: 0, comment_count: 0,
      duration_minutes: null, starting_city_id: null, cover_image_url: null,
      user_id: 'u1', published_at: null, facets: {}, body: null,
    }
    const midRow = { ...freeRow, id: 'm1', pricing_model: 'paid', price_paisa: 150_000 }
    const hiRow = { ...freeRow, id: 'h1', pricing_model: 'paid', price_paisa: 800_000 }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: [freeRow, midRow, hiRow], error: null }) as never)
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)

    const items = await getVerticalSection('travel')
    const byId = new Map(items.map((i) => [i.id, i]))
    expect(byId.get('f1')!.tags.budget_tier).toBe('free')
    expect(byId.get('m1')!.tags.budget_tier).toBe('₹₹')
    expect(byId.get('h1')!.tags.budget_tier).toBe('₹₹₹₹')
  })

  it('resolves location_label from the cities batch lookup', async () => {
    const withCity = {
      id: 'c1', type: 'self_paced_itinerary', title: 'Trip', vertical: 'travel',
      pricing_model: 'free', price_paisa: 0, like_count: 0, comment_count: 0,
      duration_minutes: null, starting_city_id: 'in.mh.pune', cover_image_url: null,
      user_id: 'u1', published_at: null, facets: {}, body: null,
    }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: [withCity], error: null }) as never)
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)
      .mockReturnValueOnce(mockChain({ data: [{ id: 'in.mh.pune', name: 'Pune' }], error: null }) as never)

    const items = await getVerticalSection('travel')
    expect(items[0]!.tags.location_label).toBe('Pune')
  })

  it('returns null location_label when starting_city_id is missing', async () => {
    const noCity = {
      id: 'n1', type: 'self_paced_itinerary', title: 'Trip', vertical: 'travel',
      pricing_model: 'free', price_paisa: 0, like_count: 0, comment_count: 0,
      duration_minutes: null, starting_city_id: null, cover_image_url: null,
      user_id: 'u1', published_at: null, facets: {}, body: null,
    }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: [noCity], error: null }) as never)
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)

    const items = await getVerticalSection('travel')
    expect(items[0]!.tags.location_label).toBeNull()
  })

  it('reflects content.facets.season when valid', async () => {
    const row = {
      id: 's1', type: 'self_paced_itinerary', title: 'Trip', vertical: 'travel',
      pricing_model: 'free', price_paisa: 0, like_count: 0, comment_count: 0,
      duration_minutes: null, starting_city_id: null, cover_image_url: null,
      user_id: 'u1', published_at: null,
      facets: { season: 'monsoon', trip_style: 'adventure', audience: 'solo' },
      body: null,
    }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: [row], error: null }) as never)
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)

    const items = await getVerticalSection('travel')
    expect(items[0]!.tags.season).toBe('monsoon')
    expect(items[0]!.tags.trip_style).toBe('adventure')
    expect(items[0]!.tags.audience).toBe('solo')
  })

  it('returns null season when facets JSONB contains garbage', async () => {
    const row = {
      id: 'g1', type: 'self_paced_itinerary', title: 'Trip', vertical: 'travel',
      pricing_model: 'free', price_paisa: 0, like_count: 0, comment_count: 0,
      duration_minutes: null, starting_city_id: null, cover_image_url: null,
      user_id: 'u1', published_at: null,
      facets: { season: 'not_a_real_season', trip_style: 42, audience: null },
      body: null,
    }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: [row], error: null }) as never)
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)

    const items = await getVerticalSection('travel')
    expect(items[0]!.tags.season).toBeNull()
    expect(items[0]!.tags.trip_style).toBeNull()
    expect(items[0]!.tags.audience).toBeNull()
  })

  it('derives read_time_min from body for posts and nulls budget_tier', async () => {
    // 250 words → ceil(250/200) = 2 min
    const body = 'word '.repeat(250).trim()
    const post = {
      id: 'p1', type: 'post', title: 'A long post', vertical: 'travel',
      pricing_model: 'free', price_paisa: 0, like_count: 0, comment_count: 0,
      duration_minutes: null, starting_city_id: null, cover_image_url: null,
      user_id: 'u1', published_at: null, facets: {}, body,
    }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: [post], error: null }) as never)
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)

    const items = await getVerticalSection('travel')
    expect(items[0]!.tags.read_time_min).toBe(2)
    expect(items[0]!.tags.budget_tier).toBeNull()
  })

  it('uses duration_minutes for itinerary read_time_min', async () => {
    const itin = {
      id: 'i1', type: 'self_paced_itinerary', title: 'Day trip', vertical: 'travel',
      pricing_model: 'free', price_paisa: 0, like_count: 0, comment_count: 0,
      duration_minutes: 180, starting_city_id: null, cover_image_url: null,
      user_id: 'u1', published_at: null, facets: {}, body: null,
    }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ data: [itin], error: null }) as never)
      .mockReturnValueOnce(mockChain({ data: [CREATOR], error: null }) as never)

    const items = await getVerticalSection('travel')
    expect(items[0]!.tags.read_time_min).toBe(180)
  })
})
