import { describe, it, expect } from 'vitest'
import { resolveFilterChips } from './filter-chip-resolver'

describe('resolveFilterChips', () => {
  it('returns no chips for an empty param set', () => {
    expect(resolveFilterChips({})).toEqual([])
  })

  it('renders a Type chip when type is in the allow-list', () => {
    expect(resolveFilterChips({ type: 'post' })).toEqual([{ key: 'type', label: 'Stories' }])
  })

  it('drops unknown type values', () => {
    expect(resolveFilterChips({ type: 'garbage' })).toEqual([])
  })

  it('renders a Vibe chip with the user-typed label as-is', () => {
    expect(resolveFilterChips({ vibe: 'Slow travel' })).toEqual([
      { key: 'vibe', label: 'Slow travel' },
    ])
  })

  it('renders Distance with the km value when valid', () => {
    expect(resolveFilterChips({ distance_km: '50' })).toEqual([
      { key: 'distance_km', label: 'Within 50 km' },
    ])
  })

  it('drops Distance with a value not in [25,50,100,250]', () => {
    expect(resolveFilterChips({ distance_km: '99' })).toEqual([])
  })

  it('renders the search query in quotes', () => {
    expect(resolveFilterChips({ q: 'monsoon' })).toEqual([{ key: 'q', label: '"monsoon"' }])
  })

  it('hides the default Trending sort', () => {
    expect(resolveFilterChips({ sort: 'trending' })).toEqual([])
  })

  it('shows Recent / price sorts as chips', () => {
    expect(resolveFilterChips({ sort: 'recent' })).toEqual([{ key: 'sort', label: 'Recent' }])
    expect(resolveFilterChips({ sort: 'price_asc' })).toEqual([
      { key: 'sort', label: 'Price: low to high' },
    ])
  })

  it('expands CSV multi-select fields into one chip per value', () => {
    expect(resolveFilterChips({ duration_buckets: 'weekend,short' })).toEqual([
      { key: 'duration_buckets', label: 'Duration: Weekend', value: 'weekend' },
      { key: 'duration_buckets', label: 'Duration: Short', value: 'short' },
    ])
  })

  it('renders multiple filter classes together in a stable order', () => {
    const chips = resolveFilterChips({
      type: 'self_paced_itinerary',
      vibe: 'Konkan',
      distance_km: '100',
      sort: 'recent',
      duration_buckets: 'weekend',
    })
    expect(chips.map((c) => c.label)).toEqual([
      'Itineraries',
      'Konkan',
      'Within 100 km',
      'Recent',
      'Duration: Weekend',
    ])
  })

  it('renders starting_city_id as a pretty city name', () => {
    const chips = resolveFilterChips({ starting_city_id: 'in.mh.mumbai' })
    expect(chips).toEqual([{ key: 'starting_city_id', label: 'Mumbai' }])
  })
})
