import { describe, it, expect } from 'vitest'
import { mergeSpotsIntoBody } from './merge-spots'
import type { ItinerarySpot } from '@/lib/api/types'

function spot(id: string, dayNumber: number, orderIndex: number, name = `Spot ${id}`): ItinerarySpot {
  return {
    id,
    dayNumber,
    orderIndex,
    name,
    description: null,
    lat: null,
    lng: null,
    distanceFromPreviousKm: null,
    durationFromPreviousMin: null,
    thumbnailUrl: null,
  }
}

describe('mergeSpotsIntoBody', () => {
  it('returns [] when both body and spots are empty', () => {
    expect(mergeSpotsIntoBody('', [])).toEqual([])
    expect(mergeSpotsIntoBody(null, [])).toEqual([])
  })

  it('synthesises a Day-N heading + spots when body is empty', () => {
    const blocks = mergeSpotsIntoBody('', [spot('a', 1, 1), spot('b', 2, 1)])
    expect(blocks).toHaveLength(4) // 2 markdown headings + 2 spots
    expect(blocks[0]).toEqual({ kind: 'markdown', body: '## Day 1', dayNumber: 1 })
    expect(blocks[1]?.kind).toBe('spot')
    expect(blocks[2]).toEqual({ kind: 'markdown', body: '## Day 2', dayNumber: 2 })
  })

  it('drops a spot every 2 paragraphs of the active day', () => {
    const body = '# Day 1\n\np1.\n\np2.\n\np3.\n\np4.'
    const blocks = mergeSpotsIntoBody(body, [spot('a', 1, 1), spot('b', 1, 2)])
    // After p1 + p2 → drop spot a; after p3 + p4 → drop spot b.
    const kinds = blocks.map((b) => b.kind)
    // sequence: markdown(day-heading + p1 + p2), spot, markdown(p3 + p4), spot
    expect(kinds).toEqual(['markdown', 'spot', 'markdown', 'spot'])
    const md = blocks[0]
    if (md?.kind === 'markdown') {
      expect(md.dayNumber).toBe(1)
    } else {
      throw new Error('expected first block to be markdown')
    }
  })

  it('flushes remaining spots before crossing a day boundary', () => {
    const body = '# Day 1\n\np1.\n\n# Day 2\n\np2.'
    const blocks = mergeSpotsIntoBody(body, [
      spot('a', 1, 1),
      spot('b', 1, 2),
      spot('c', 2, 1),
    ])
    // p1 alone is < SPOT_INTERVAL, so spots a + b get flushed when Day 2 hits.
    const order = blocks.map((b) => (b.kind === 'spot' ? `s:${b.spot.id}` : `md:${String(b.dayNumber)}`))
    // expect: md:1 (heading + p1), s:a, s:b, md:2 (heading + p2), s:c
    expect(order).toEqual(['md:1', 's:a', 's:b', 'md:2', 's:c'])
  })

  it('preserves spot order_index within a day', () => {
    const body = '# Day 1\n\np1.\n\np2.\n\np3.\n\np4.'
    const blocks = mergeSpotsIntoBody(body, [
      spot('z', 1, 3),
      spot('y', 1, 2),
      spot('x', 1, 1),
    ])
    const spotIds = blocks.filter((b) => b.kind === 'spot').map((b) => (b as { spot: ItinerarySpot }).spot.id)
    expect(spotIds).toEqual(['x', 'y', 'z'])
  })

  it('appends spots with no matching day at the end with null dayNumber chunks', () => {
    const body = '# Day 1\n\np1.\n\np2.'
    const blocks = mergeSpotsIntoBody(body, [
      spot('a', 1, 1),
      spot('orphan', 99, 1),
    ])
    const lastIsSpot = blocks[blocks.length - 1]
    expect(lastIsSpot?.kind).toBe('spot')
    if (lastIsSpot?.kind === 'spot') {
      expect(lastIsSpot.spot.id).toBe('orphan')
    }
  })

  it('handles single-day itinerary with no day headings (treats spots as orphan tail)', () => {
    const body = 'p1.\n\np2.\n\np3.'
    const blocks = mergeSpotsIntoBody(body, [spot('a', 1, 1)])
    // No day headings → currentDay never set → spot lands as orphan tail.
    const kinds = blocks.map((b) => b.kind)
    expect(kinds).toEqual(['markdown', 'spot'])
  })
})
