import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

/**
 * Run after every widget test to:
 * - tear down the rendered tree (RTL keeps a global container otherwise)
 * - restore mocks so cross-test contamination can't happen
 */
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// next/navigation is server-only by default; widget tests stub the bits
// our components actually use (useRouter, usePathname). Individual tests
// can override via vi.mock() at the top of the file.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

// next/link in client tests is just an anchor — render the children inside
// an <a> with the given href so role="link" + href assertions work.
vi.mock('next/link', async () => {
  const React = await import('react')
  return {
    default: function MockLink({
      href,
      children,
      ...rest
    }: {
      href: string
      children: React.ReactNode
      [key: string]: unknown
    }) {
      // Strip Next-only props that bare <a> would warn about.
      const {
        prefetch: _prefetch,
        replace: _replace,
        scroll: _scroll,
        shallow: _shallow,
        passHref: _passHref,
        ...anchorProps
      } = rest as Record<string, unknown>
      void _prefetch
      void _replace
      void _scroll
      void _shallow
      void _passHref
      return React.createElement('a', { href, ...anchorProps }, children)
    },
  }
})

// next/image — render as a vanilla img so width/height/src assertions work.
vi.mock('next/image', async () => {
  const React = await import('react')
  return {
    default: function MockImage({
      src,
      alt,
      width,
      height,
      ...rest
    }: {
      src: string
      alt: string
      width?: number | string
      height?: number | string
      [key: string]: unknown
    }) {
      // Drop Next-specific knobs that vanilla <img> doesn't accept.
      const {
        priority: _priority,
        fill: _fill,
        sizes: _sizes,
        unoptimized: _unoptimized,
        loader: _loader,
        placeholder: _placeholder,
        blurDataURL: _blurDataURL,
        quality: _quality,
        ...imgProps
      } = rest as Record<string, unknown>
      void _priority
      void _fill
      void _sizes
      void _unoptimized
      void _loader
      void _placeholder
      void _blurDataURL
      void _quality
      return React.createElement('img', { src, alt, width, height, ...imgProps })
    },
  }
})

// fetch — we want to assert what callers ask for; tests opt-in to
// per-test fetch mocks via vi.spyOn(global, 'fetch').
if (typeof global.fetch === 'undefined') {
  global.fetch = vi.fn()
}

// jsdom doesn't ship IntersectionObserver. Components that scroll-spy
// (e.g. <ReaderChrome> tracking the active day section) call it on mount.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class IO {
    constructor() {
      // no-op
    }
    observe(): void {
      // no-op
    }
    unobserve(): void {
      // no-op
    }
    disconnect(): void {
      // no-op
    }
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
    readonly root: Element | null = null
    readonly rootMargin: string = ''
    readonly thresholds: readonly number[] = []
  }
  globalThis.IntersectionObserver = IO as unknown as typeof IntersectionObserver
}

// jsdom doesn't ship matchMedia. Components that read viewport width
// (e.g. <FilterSheet> for desktop vs bottom-sheet) call it on mount.
if (typeof globalThis.matchMedia === 'undefined') {
  globalThis.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }) as MediaQueryList
}

// requestAnimationFrame is needed by framer-motion in jsdom.
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    return setTimeout(() => {
      cb(performance.now())
    }, 0) as unknown as number
  }
}
