import { describe, it, expect } from 'vitest'
import { buildIcs } from './ics.js'

describe('buildIcs', () => {
  it('emits a valid VCALENDAR/VEVENT envelope with required fields', () => {
    const ics = buildIcs({
      uid: 'b-001',
      summary: 'Konkan in 4 quiet days',
      startsAt: '2026-06-15T03:00:00Z',
      organizerName: 'Aanya Ravi',
      organizerEmail: 'aanya@creatorhub.in',
    })
    expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/)
    expect(ics).toMatch(/VERSION:2\.0\r\n/)
    expect(ics).toMatch(/BEGIN:VEVENT\r\n/)
    expect(ics).toMatch(/UID:b-001@creatorhub\.in\r\n/)
    expect(ics).toMatch(/DTSTART:20260615T030000Z\r\n/)
    expect(ics).toMatch(/DTEND:20260615T050000Z\r\n/) // default +2h
    expect(ics).toMatch(/SUMMARY:Konkan in 4 quiet days\r\n/)
    expect(ics).toMatch(/END:VEVENT\r\n/)
    expect(ics).toMatch(/END:VCALENDAR\r\n$/)
  })

  it('escapes commas, semicolons, and backslashes per RFC-5545', () => {
    const ics = buildIcs({
      uid: 'x',
      summary: 'Coffee, beach; backslash\\here',
      startsAt: '2026-06-15T03:00:00Z',
      organizerName: 'A',
      organizerEmail: 'a@x.com',
    })
    expect(ics).toMatch(/SUMMARY:Coffee\\, beach\\; backslash\\\\here\r\n/)
  })

  it('escapes newlines in description', () => {
    const ics = buildIcs({
      uid: 'x',
      summary: 'Trip',
      description: 'Line one\nLine two',
      startsAt: '2026-06-15T03:00:00Z',
      organizerName: 'A',
      organizerEmail: 'a@x.com',
    })
    expect(ics).toMatch(/DESCRIPTION:Line one\\nLine two\r\n/)
  })

  it('omits LOCATION when not provided', () => {
    const ics = buildIcs({
      uid: 'x',
      summary: 'Trip',
      startsAt: '2026-06-15T03:00:00Z',
      organizerName: 'A',
      organizerEmail: 'a@x.com',
    })
    expect(ics).not.toMatch(/LOCATION:/)
  })

  it('includes ATTENDEE only when attendeeEmail is set', () => {
    const without = buildIcs({
      uid: 'x',
      summary: 'Trip',
      startsAt: '2026-06-15T03:00:00Z',
      organizerName: 'A',
      organizerEmail: 'a@x.com',
    })
    expect(without).not.toMatch(/ATTENDEE;/)
    const withAttendee = buildIcs({
      uid: 'x',
      summary: 'Trip',
      startsAt: '2026-06-15T03:00:00Z',
      organizerName: 'A',
      organizerEmail: 'a@x.com',
      attendeeEmail: 'rider@example.com',
      attendeeName: 'Rider Khanna',
    })
    expect(withAttendee).toMatch(/ATTENDEE;CN=Rider Khanna;RSVP=TRUE:mailto:rider@example\.com/)
  })

  it('uses CRLF line endings throughout', () => {
    const ics = buildIcs({
      uid: 'x',
      summary: 'Trip',
      startsAt: '2026-06-15T03:00:00Z',
      organizerName: 'A',
      organizerEmail: 'a@x.com',
    })
    // No bare LF anywhere.
    const bareLfs = ics.split('').filter((c, i) => c === '\n' && ics[i - 1] !== '\r').length
    expect(bareLfs).toBe(0)
  })

  it('folds long lines at 75 octets per RFC-5545 §3.1', () => {
    const longSummary = 'X'.repeat(120)
    const ics = buildIcs({
      uid: 'x',
      summary: longSummary,
      startsAt: '2026-06-15T03:00:00Z',
      organizerName: 'A',
      organizerEmail: 'a@x.com',
    })
    // Find the SUMMARY line — should be split across at least 2 physical lines,
    // and each continuation should start with a single space.
    const summaryStart = ics.indexOf('SUMMARY:')
    const after = ics.slice(summaryStart)
    const lines = after.split('\r\n')
    const summaryLine = lines[0]
    expect(summaryLine?.length).toBeLessThanOrEqual(75)
    expect(lines[1]?.startsWith(' ')).toBe(true)
  })
})
