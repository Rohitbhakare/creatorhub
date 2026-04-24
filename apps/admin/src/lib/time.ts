// Shared relative-time formatter for admin list rows. Returns
// strings like "just now", "5m ago", "3h ago", "2d ago". The value
// is frozen at render time — lists don't need a live-ticking clock.

export function relativeTime(iso: string | null): string {
  if (iso === null) return 'never'
  const t = new Date(iso).getTime()
  const diff = Date.now() - t
  const mins = Math.round(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${String(mins)}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${String(hrs)}h ago`
  const days = Math.round(hrs / 24)
  return `${String(days)}d ago`
}
