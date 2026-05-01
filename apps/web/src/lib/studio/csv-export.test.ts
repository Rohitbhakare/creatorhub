import { describe, it, expect } from 'vitest'
import { payoutsToCsv } from './csv-export'
import type { PayoutRow } from '@/lib/api'

const ROW: PayoutRow = {
  id: 'p1',
  bookingId: 'b-001',
  date: '2026-04-15',
  grossPaisa: 100_000,
  platformFeePaisa: 17_000,
  tdsPaisa: 1_000,
  gstPaisa: 18_000,
  netPaisa: 64_000,
  utr: 'UTR-12345',
  status: 'settled',
}

describe('payoutsToCsv', () => {
  it('emits a header row + one data row per input', () => {
    const csv = payoutsToCsv([ROW])
    const lines = csv.split('\r\n').filter(Boolean)
    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(/^Date,Booking ID,Gross/)
  })

  it('converts paisa to rupees with 2 decimals', () => {
    const csv = payoutsToCsv([ROW])
    expect(csv).toMatch(/1000\.00,170\.00,10\.00,180\.00,640\.00/)
  })

  it('escapes commas in a field with double quotes', () => {
    const evil: PayoutRow = { ...ROW, utr: 'UTR,with,commas' }
    const csv = payoutsToCsv([evil])
    expect(csv).toMatch(/"UTR,with,commas"/)
  })

  it('doubles embedded quotes per RFC-4180', () => {
    const evil: PayoutRow = { ...ROW, utr: 'has "quotes"' }
    const csv = payoutsToCsv([evil])
    expect(csv).toMatch(/"has ""quotes"""/)
  })

  it('uses CRLF line terminators', () => {
    const csv = payoutsToCsv([ROW])
    expect(csv).toMatch(/\r\n/)
    expect(csv.split('\n').filter((l) => !l.endsWith('\r')).every((l) => l === '')).toBe(true)
  })

  it('emits an empty data block when rows is empty (just the header)', () => {
    const csv = payoutsToCsv([])
    expect(csv.trim().split('\r\n')).toHaveLength(1)
  })

  it('handles null UTR', () => {
    const noUtr: PayoutRow = { ...ROW, utr: null }
    const csv = payoutsToCsv([noUtr])
    // Empty field between gst and status
    expect(csv).toMatch(/180\.00,640\.00,,settled/)
  })
})
