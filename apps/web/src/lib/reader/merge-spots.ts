import type { ItinerarySpot } from '@/lib/api/types'

/**
 * Output block types the reader page iterates to compose the magazine view.
 * Markdown chunks are passed to <MarkdownBody>; spot blocks to <InlineSpotCard>.
 */
export type ReaderBlock =
  | { kind: 'markdown'; body: string; dayNumber: number | null }
  | { kind: 'spot'; spot: ItinerarySpot }

const SPOT_INTERVAL_PARAGRAPHS = 2

/**
 * Server-side helper for E5.3 T5: merges itinerary body markdown with spots
 * so spot cards appear interleaved with body paragraphs at their day-position.
 *
 * Algorithm:
 * 1. Split body into paragraph-blocks (`\n\n`).
 * 2. Walk blocks; track active day via `# Day N` / `## Day N` headings.
 * 3. After every SPOT_INTERVAL_PARAGRAPHS paragraphs of the active day,
 *    drop the next spot belonging to that day. Any spots left when the day
 *    changes (or body ends) are dumped before the day boundary.
 * 4. Markdown chunks are emitted with their `dayNumber` so the renderer
 *    can use them as `[data-day-anchor="N"]` targets for <ReaderChrome>.
 */
export function mergeSpotsIntoBody(
  body: string | null | undefined,
  spots: readonly ItinerarySpot[],
): ReaderBlock[] {
  const sortedSpots = [...spots].sort(
    (a, b) => a.dayNumber - b.dayNumber || a.orderIndex - b.orderIndex,
  )

  if (!body || body.trim().length === 0) {
    if (sortedSpots.length === 0) return []
    const out: ReaderBlock[] = []
    const byDay = new Map<number, ItinerarySpot[]>()
    for (const s of sortedSpots) {
      const list = byDay.get(s.dayNumber) ?? []
      list.push(s)
      byDay.set(s.dayNumber, list)
    }
    for (const [day, ds] of [...byDay.entries()].sort((a, b) => a[0] - b[0])) {
      out.push({
        kind: 'markdown',
        body: `## Day ${String(day)}`,
        dayNumber: day,
      })
      for (const spot of ds) out.push({ kind: 'spot', spot })
    }
    return out
  }

  const out: ReaderBlock[] = []
  const blocks = body.split(/\n{2,}/)
  let currentDay: number | null = null
  let paragraphsSinceLastSpot = 0
  const remaining = [...sortedSpots]
  let buffer: string[] = []

  const flushBufferToDay = (day: number | null): void => {
    if (buffer.length === 0) return
    out.push({ kind: 'markdown', body: buffer.join('\n\n'), dayNumber: day })
    buffer = []
  }

  const dropOneSpotForDay = (day: number): void => {
    const i = remaining.findIndex((s) => s.dayNumber === day)
    if (i === -1) return
    flushBufferToDay(day)
    out.push({ kind: 'spot', spot: remaining.splice(i, 1)[0] as ItinerarySpot })
    paragraphsSinceLastSpot = 0
  }

  const flushRemainingForDay = (day: number): void => {
    while (remaining.length > 0 && remaining[0]?.dayNumber === day) {
      flushBufferToDay(day)
      out.push({ kind: 'spot', spot: remaining.shift() as ItinerarySpot })
    }
    paragraphsSinceLastSpot = 0
  }

  for (const block of blocks) {
    const t = block.trimStart()
    const dayMatch = /^#{1,3}\s+Day\s+(\d+)/i.exec(t)
    if (dayMatch) {
      if (currentDay !== null) flushRemainingForDay(currentDay)
      flushBufferToDay(currentDay)
      currentDay = parseInt(dayMatch[1] ?? '0', 10)
      paragraphsSinceLastSpot = 0
      buffer.push(block)
      continue
    }
    if (t.startsWith('#')) {
      buffer.push(block)
      continue
    }
    buffer.push(block)
    paragraphsSinceLastSpot += 1
    if (
      currentDay !== null &&
      paragraphsSinceLastSpot >= SPOT_INTERVAL_PARAGRAPHS &&
      remaining.some((s) => s.dayNumber === currentDay)
    ) {
      dropOneSpotForDay(currentDay)
    }
  }

  flushBufferToDay(currentDay)
  if (currentDay !== null) flushRemainingForDay(currentDay)
  if (remaining.length > 0) {
    for (const spot of remaining) out.push({ kind: 'spot', spot })
  }

  return out
}
