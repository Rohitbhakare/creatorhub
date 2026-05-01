import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarkdownBody } from './markdown-body'

const STORY = `# Konkan in 4 quiet days

The ferry from Gateway leaves at 6:30 am. By the time you're across, the city has stopped being the city.

> If you have a week, take ten days. The coast won't budge.

## Where to actually stop

Skip the obvious sights. **Park somewhere** that isn't a parking lot.`

describe('MarkdownBody — drop-cap + pull-quote (E5.3 T3/T4)', () => {
  it('marks the first paragraph (after headings) with .ch-dropcap-host in magazine mode', () => {
    const { container } = render(<MarkdownBody body={STORY} mode="magazine" />)
    const hosts = container.querySelectorAll('.ch-dropcap-host')
    expect(hosts).toHaveLength(1)
    expect(hosts[0]?.textContent).toMatch(/^The ferry/)
  })

  it('does not add drop-cap host in compact mode', () => {
    const { container } = render(<MarkdownBody body={STORY} mode="compact" />)
    expect(container.querySelectorAll('.ch-dropcap-host')).toHaveLength(0)
  })

  it('renders blockquote as <aside class="ch-pull-quote"> in magazine mode', () => {
    const { container } = render(<MarkdownBody body={STORY} mode="magazine" />)
    const aside = container.querySelector('aside.ch-pull-quote')
    expect(aside).not.toBeNull()
    expect(aside?.textContent).toMatch(/take ten days/)
    // No <blockquote> element when in magazine mode.
    expect(container.querySelector('blockquote')).toBeNull()
  })

  it('renders blockquote plain (no coral border, no aside) in compact mode', () => {
    const { container } = render(<MarkdownBody body={STORY} mode="compact" />)
    expect(container.querySelector('aside.ch-pull-quote')).toBeNull()
    const bq = container.querySelector('blockquote')
    expect(bq).not.toBeNull()
    expect(bq?.textContent).toMatch(/take ten days/)
  })

  it('does not put drop-cap on a heading or blockquote', () => {
    const onlyHeading = '# Title\n\nFirst paragraph here.'
    const { container } = render(<MarkdownBody body={onlyHeading} mode="magazine" />)
    const host = container.querySelector('.ch-dropcap-host')
    expect(host).not.toBeNull()
    expect(host?.tagName).toBe('P')
    expect(host?.textContent).toBe('First paragraph here.')
  })

  it('still honors **bold** + *italic* inline tokens', () => {
    render(<MarkdownBody body={STORY} mode="magazine" />)
    expect(screen.getByText('Park somewhere').tagName).toBe('STRONG')
  })

  it('defaults to magazine mode when no mode prop is given', () => {
    const { container } = render(<MarkdownBody body={STORY} />)
    expect(container.querySelectorAll('.ch-dropcap-host')).toHaveLength(1)
    expect(container.querySelector('aside.ch-pull-quote')).not.toBeNull()
  })
})
