import { describe, it, expect } from 'vitest'
import { parseMoodParam, scoreItemForMood, rankByMood } from './mood-types'

describe('parseMoodParam', () => {
  it('accepts valid moods', () => {
    expect(parseMoodParam('slow')).toBe('slow')
    expect(parseMoodParam('food')).toBe('food')
  })
  it('rejects unknown values', () => {
    expect(parseMoodParam(null)).toBeNull()
    expect(parseMoodParam(undefined)).toBeNull()
    expect(parseMoodParam('')).toBeNull()
    expect(parseMoodParam('SLOW')).toBeNull()
    expect(parseMoodParam('chill')).toBeNull()
  })
})

describe('scoreItemForMood', () => {
  it('rewards keyword matches', () => {
    const item = { type: 'post' as const, title: 'Tunday Kababi at 7am' }
    expect(scoreItemForMood(item, 'food')).toBeGreaterThan(0)
  })

  it('rewards content-type matches', () => {
    const exp = { type: 'experience' as const, title: 'Random title' }
    const post = { type: 'post' as const, title: 'Random title' }
    // 'high' prefers experiences > posts
    expect(scoreItemForMood(exp, 'high')).toBeGreaterThan(scoreItemForMood(post, 'high'))
  })

  it('rewards short trips for slow mood', () => {
    const short = { type: 'itinerary' as const, title: 'A trip', durationDays: 2 }
    const long = { type: 'itinerary' as const, title: 'A trip', durationDays: 9 }
    expect(scoreItemForMood(short, 'slow')).toBeGreaterThan(scoreItemForMood(long, 'slow'))
  })

  it('rewards long trips for high-octane mood', () => {
    const short = { type: 'itinerary' as const, title: 'A trip', durationDays: 2 }
    const long = { type: 'itinerary' as const, title: 'A trip', durationDays: 9 }
    expect(scoreItemForMood(long, 'high')).toBeGreaterThan(scoreItemForMood(short, 'high'))
  })
})

describe('rankByMood', () => {
  type T = { id: string; type: 'post' | 'itinerary' | 'experience' | 'event'; title: string; durationDays?: number }

  it('moves matching items to the front (stable for ties)', () => {
    const items: T[] = [
      { id: 'a', type: 'itinerary', title: 'Konkan in 4 quiet monsoon days', durationDays: 4 },
      { id: 'b', type: 'post', title: 'Tunday Kababi at 7am' },
      { id: 'c', type: 'experience', title: 'Spiti rider expedition route', durationDays: 9 },
      { id: 'd', type: 'event', title: 'Sufi qawwali at the dargah' },
    ]
    const slow = rankByMood(items, 'slow')
    expect(slow[0]!.id).toBe('a') // matches 'quiet' + 'monsoon' + itinerary type + short
    const food = rankByMood(items, 'food')
    expect(food[0]!.id).toBe('b') // matches 'kabab' + post type
    const high = rankByMood(items, 'high')
    expect(high[0]!.id).toBe('c') // matches 'rider' + 'expedition' + 'route' + experience + long
    const art = rankByMood(items, 'art')
    expect(art[0]!.id).toBe('d') // matches 'qawwali' + event
  })

  it('keeps items in original order when nothing matches the mood', () => {
    const items: T[] = [
      { id: '1', type: 'post', title: 'lorem' },
      { id: '2', type: 'post', title: 'ipsum' },
      { id: '3', type: 'post', title: 'dolor' },
    ]
    const ranked = rankByMood(items, 'art')
    expect(ranked.map((i) => i.id)).toEqual(['1', '2', '3'])
  })

  it('does not mutate the input array', () => {
    const items: T[] = [
      { id: 'a', type: 'post', title: 'random' },
      { id: 'b', type: 'experience', title: 'food walk' },
    ]
    const before = items.map((i) => i.id)
    rankByMood(items, 'food')
    expect(items.map((i) => i.id)).toEqual(before)
  })
})
