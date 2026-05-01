/**
 * RFC-5545 .ics generator (E5.4 T8).
 *
 * Hand-rolled — small enough that pulling a library wasn't worth the dep.
 * Covers VCALENDAR / VEVENT / DTSTART / DTEND / SUMMARY / DESCRIPTION /
 * LOCATION / ORGANIZER / ATTENDEE with proper escapes (`,`, `;`, `\`)
 * and CRLF line endings.
 */

export interface IcsInput {
  uid: string
  summary: string
  description?: string
  startsAt: string // ISO 8601
  endsAt?: string // ISO 8601; defaults to +2h
  location?: string
  organizerName: string
  organizerEmail: string
  attendeeEmail?: string
  attendeeName?: string
}

export function buildIcs(input: IcsInput): string {
  const start = new Date(input.startsAt)
  const end = input.endsAt
    ? new Date(input.endsAt)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const now = new Date()

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CreatorHub//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.uid}@creatorhub.in`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcs(input.summary)}`,
    ...(input.description ? [`DESCRIPTION:${escapeIcs(input.description)}`] : []),
    ...(input.location ? [`LOCATION:${escapeIcs(input.location)}`] : []),
    `ORGANIZER;CN=${escapeIcs(input.organizerName)}:mailto:${input.organizerEmail}`,
    ...(input.attendeeEmail
      ? [
          `ATTENDEE;CN=${escapeIcs(input.attendeeName ?? input.attendeeEmail)};RSVP=TRUE:mailto:${input.attendeeEmail}`,
        ]
      : []),
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  // RFC-5545: CRLF terminators, lines folded at 75 octets.
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

function formatIcsDate(d: Date): string {
  // RFC-5545 UTC: YYYYMMDDTHHMMSSZ
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

function escapeIcs(s: string): string {
  // RFC-5545 §3.3.11: \, \; \\ and \n (literal newline becomes \\n in iCal land).
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n')
}

function foldLine(line: string): string {
  // RFC-5545 §3.1: long lines folded at 75 octets, continuation prefixed with a space.
  if (line.length <= 75) return line
  const out: string[] = []
  let i = 0
  while (i < line.length) {
    if (i === 0) {
      out.push(line.slice(0, 75))
      i = 75
    } else {
      out.push(' ' + line.slice(i, i + 74))
      i += 74
    }
  }
  return out.join('\r\n')
}
