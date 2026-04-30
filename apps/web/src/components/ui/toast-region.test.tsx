import { describe, it, expect } from 'vitest'
import { render, act, screen } from '@testing-library/react'
import { ToastRegion, pushToast } from './toast-region'

describe('ToastRegion', () => {
  it('renders an empty polite live region by default', () => {
    render(<ToastRegion />)
    const region = screen.getByRole('region', { name: 'Notifications' })
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region.children).toHaveLength(0)
  })

  it('shows a pushed toast with the right tone marker', () => {
    render(<ToastRegion />)
    act(() => {
      pushToast({ id: 'a', message: 'Saved to your list', tone: 'success', ttl: 0 })
    })
    expect(screen.getByText('Saved to your list')).toBeInTheDocument()
  })

  it('de-duplicates by id', () => {
    render(<ToastRegion />)
    act(() => {
      pushToast({ id: 'dup', message: 'first', tone: 'info', ttl: 0 })
      pushToast({ id: 'dup', message: 'second', tone: 'info', ttl: 0 })
    })
    expect(screen.queryByText('second')).toBeNull()
    expect(screen.getByText('first')).toBeInTheDocument()
  })

  it('caps visible toasts at 3, dropping the oldest', () => {
    render(<ToastRegion />)
    act(() => {
      pushToast({ id: '1', message: 'one', tone: 'info', ttl: 0 })
      pushToast({ id: '2', message: 'two', tone: 'info', ttl: 0 })
      pushToast({ id: '3', message: 'three', tone: 'info', ttl: 0 })
      pushToast({ id: '4', message: 'four', tone: 'info', ttl: 0 })
    })
    expect(screen.queryByText('one')).toBeNull()
    expect(screen.getByText('two')).toBeInTheDocument()
    expect(screen.getByText('three')).toBeInTheDocument()
    expect(screen.getByText('four')).toBeInTheDocument()
  })
})
