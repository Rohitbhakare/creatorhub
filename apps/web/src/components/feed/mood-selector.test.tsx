import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MoodSelector } from './mood-selector'
import { parseMoodParam } from './mood-types'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('MoodSelector', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('renders 5 mood radios', () => {
    render(<MoodSelector />)
    expect(screen.getAllByRole('radio')).toHaveLength(5)
  })

  it('marks the active mood radio as checked', () => {
    render(<MoodSelector activeMood="food" />)
    const radios = screen.getAllByRole('radio')
    const food = radios.find((r) => r.textContent && r.textContent.includes('Foodie'))
    expect(food).toHaveAttribute('aria-checked', 'true')
  })

  it('clicking a mood pushes ?mood=<id> to the URL', async () => {
    const user = userEvent.setup()
    render(<MoodSelector />)
    await user.click(screen.getByRole('radio', { name: /Slow & quiet/i }))
    expect(pushMock).toHaveBeenCalledOnce()
    expect(pushMock).toHaveBeenCalledWith('/?mood=slow')
  })

  it('clicking the active mood removes ?mood= (toggle off)', async () => {
    const user = userEvent.setup()
    render(<MoodSelector activeMood="art" />)
    await user.click(screen.getByRole('radio', { name: /Art & craft/i }))
    expect(pushMock).toHaveBeenCalledWith('/')
  })
})

describe('parseMoodParam', () => {
  it('accepts valid mood ids', () => {
    expect(parseMoodParam('slow')).toBe('slow')
    expect(parseMoodParam('high')).toBe('high')
    expect(parseMoodParam('food')).toBe('food')
    expect(parseMoodParam('sunrise')).toBe('sunrise')
    expect(parseMoodParam('art')).toBe('art')
  })

  it('rejects unknown / null / empty values', () => {
    expect(parseMoodParam(null)).toBeNull()
    expect(parseMoodParam(undefined)).toBeNull()
    expect(parseMoodParam('')).toBeNull()
    expect(parseMoodParam('chillax')).toBeNull()
    expect(parseMoodParam('SLOW')).toBeNull() // case-sensitive
  })
})
