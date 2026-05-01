'use client'

interface BookingForCalendar {
  id: string
  title: string
  startsAt: string
  creatorName: string
}

interface Props {
  booking: BookingForCalendar
  /**
   * Hours the event runs for; .ics defaults to +2h server-side, the
   * external calendar URLs use this value too. Defaults to 2.
   */
  durationHours?: number
}

/**
 * Add-to-calendar dropdown — Google / Apple (.ics) / Outlook + .ics download.
 * Used on the booking confirmation page (E5.4 T8 client side).
 */
export function AddToCalendar({ booking, durationHours = 2 }: Props) {
  const start = new Date(booking.startsAt)
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000)

  const googleUrl = buildGoogleUrl(booking, start, end)
  const outlookUrl = buildOutlookUrl(booking, start, end)
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001'
  const icsHref = `${apiBase}/api/v1/bookings/${encodeURIComponent(booking.id)}/ics`

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <CalLink href={googleUrl} target="_blank" rel="noopener">
        Google Calendar
      </CalLink>
      <CalLink href={outlookUrl} target="_blank" rel="noopener">
        Outlook
      </CalLink>
      <CalLink href={icsHref} download>
        Apple / .ics
      </CalLink>
    </div>
  )
}

function CalLink({
  href,
  children,
  target,
  rel,
  download,
}: {
  href: string
  children: React.ReactNode
  target?: string
  rel?: string
  download?: boolean
}) {
  return (
    <a
      href={href}
      {...(target ? { target } : {})}
      {...(rel ? { rel } : {})}
      {...(download ? { download: '' } : {})}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        border: '1px solid var(--hairline-strong)',
        background: 'var(--surface)',
        color: 'var(--ink)',
        fontSize: 13,
        fontWeight: 500,
        textDecoration: 'none',
      }}
    >
      {children}
    </a>
  )
}

function gcalDate(d: Date): string {
  // Google calendar's `dates` param uses YYYYMMDDTHHMMSSZ.
  const pad = (n: number): string => n.toString().padStart(2, '0')
  return (
    String(d.getUTCFullYear()) +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  )
}

function buildGoogleUrl(b: BookingForCalendar, start: Date, end: Date): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: b.title,
    dates: `${gcalDate(start)}/${gcalDate(end)}`,
    details: `Booking by ${b.creatorName} via CreatorHub. https://creatorhub.in/bookings/${b.id}`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function buildOutlookUrl(b: BookingForCalendar, start: Date, end: Date): string {
  // Outlook web's "deeplink/compose" takes ISO strings.
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: b.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: `Booking by ${b.creatorName} via CreatorHub. https://creatorhub.in/bookings/${b.id}`,
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}
