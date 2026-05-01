import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CoverCrop } from './cover-crop'

describe('CoverCrop', () => {
  it('renders the upload zone when no value is provided', () => {
    render(<CoverCrop value="" onChange={vi.fn()} />)
    expect(screen.getByText(/Click to upload/)).toBeInTheDocument()
  })

  it('shows the size + format hint', () => {
    render(<CoverCrop value="" onChange={vi.fn()} />)
    expect(
      screen.getByText(/2:1 \(1600 × 800\)\. JPEG \/ PNG \/ WebP only, max 8 MB/),
    ).toBeInTheDocument()
  })

  it('rejects oversized files with an error message', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CoverCrop value="" onChange={onChange} maxBytes={10} />)
    const file = new File(['a'.repeat(20)], 'huge.jpg', { type: 'image/jpeg' })
    // Find the hidden input via its accept attr
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    expect(input).not.toBeNull()
    await user.upload(input, file)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Image too large/,
    )
    expect(onChange).not.toHaveBeenCalled()
  })

  it('exposes the JPEG/PNG/WebP allowlist via the input accept attr', () => {
    render(<CoverCrop value="" onChange={vi.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input.accept).toBe('image/jpeg,image/png,image/webp')
  })
})
