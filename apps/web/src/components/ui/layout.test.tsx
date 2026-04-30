import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PageShell } from './page-shell'
import { TwoColLayout } from './two-col-layout'
import { ReaderLayout } from './reader-layout'

describe('PageShell', () => {
  it('renders as <main> by default with the ch-container class', () => {
    const { container } = render(<PageShell>x</PageShell>)
    const el = container.firstChild as HTMLElement
    expect(el.tagName).toBe('MAIN')
    expect(el.className).toContain('ch-container')
  })

  it('drops the container class in flush mode', () => {
    const { container } = render(<PageShell flush>x</PageShell>)
    const el = container.firstChild as HTMLElement
    expect(el.className).not.toContain('ch-container')
  })

  it('honors a custom element via `as` prop', () => {
    const { container } = render(<PageShell as="section">x</PageShell>)
    expect((container.firstChild as HTMLElement).tagName).toBe('SECTION')
  })
})

describe('TwoColLayout', () => {
  it('renders main + aside with correct landmark labels', () => {
    const { container, getByRole } = render(
      <TwoColLayout main={<p>main</p>} rail={<p>rail</p>} />,
    )
    expect((container.firstChild as HTMLElement).className).toContain('ch-page-grid')
    expect(getByRole('complementary', { name: 'Side rail' })).toBeInTheDocument()
  })

  it('omits the aside when rail is null', () => {
    const { container, queryByRole } = render(<TwoColLayout main={<p>main</p>} rail={null} />)
    expect(queryByRole('complementary')).toBeNull()
    expect(container.querySelectorAll('aside')).toHaveLength(0)
  })
})

describe('ReaderLayout', () => {
  it('renders all three columns with correct landmarks', () => {
    const { container, getByRole } = render(
      <ReaderLayout
        dayNav={<p>days</p>}
        body={<p>body</p>}
        aside={<p>aside</p>}
      />,
    )
    expect(getByRole('navigation', { name: 'Days' })).toBeInTheDocument()
    expect(getByRole('complementary', { name: 'Reader sidebar' })).toBeInTheDocument()
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('ch-reader-grid')
    expect(wrapper.className).not.toContain('no-days')
  })

  it('applies the no-days modifier when dayNav is null', () => {
    const { container } = render(
      <ReaderLayout dayNav={null} body={<p>body</p>} aside={<p>aside</p>} />,
    )
    expect((container.firstChild as HTMLElement).className).toContain(
      'ch-reader-grid--no-days',
    )
  })

  it('applies the no-aside modifier when aside is null', () => {
    const { container } = render(
      <ReaderLayout dayNav={null} body={<p>body</p>} aside={null} />,
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('ch-reader-grid--no-days')
    expect(wrapper.className).toContain('ch-reader-grid--no-aside')
    expect(wrapper.querySelectorAll('aside')).toHaveLength(0)
    expect(wrapper.querySelectorAll('nav')).toHaveLength(0)
  })
})
