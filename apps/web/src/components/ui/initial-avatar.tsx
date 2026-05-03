/**
 * Initial-letter avatar primitive — replaces the four hand-rolled copies
 * scattered across `content-card.tsx`, `web-header.tsx`, `hero-feature.tsx`
 * and `comments-section.tsx`. Per CLAUDE.md (Discover Monochrome v1.4)
 * the gradient palette is locked to a single warm taupe — multiple colour
 * variants would land outside the v3 monochrome + coral discipline.
 *
 * SSR-safe: pure functional component, no hooks.
 */

import type { CSSProperties } from 'react'

interface InitialAvatarProps {
  /** Display name. First letters of up to two words become the initials. */
  name: string
  /** Optional profile image URL. When set, the photo replaces the initials. */
  url?: string | null
  /** Pixel diameter. Coupled to font size (0.42×). Default 40. */
  size?: number
  /** Extra style overrides (e.g. `flex: '0 0 auto'` in a flex parent). */
  style?: CSSProperties
}

/** Two-letter initials, upper-cased, defensively coercing to a non-empty string. */
function initialsFor(name: string): string {
  const letters = name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return letters.length > 0 ? letters : '·'
}

export function InitialAvatar({ name, url, size = 40, style }: InitialAvatarProps) {
  // Round-5 audit caught a blank-white-circle moment between layout and
  // image-paint when `url` is set. Fix: always render the initials beneath
  // and lay the photo on top via background-image on the same wrapper —
  // initials are visible immediately and get covered when the photo loads.
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: 'linear-gradient(135deg, #d4b896, #a07c5a)',
        backgroundImage: url ? `url(${url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-serif)',
        fontWeight: 600,
        fontSize: Math.round(size * 0.42),
        flex: '0 0 auto',
        overflow: 'hidden',
        ...style,
      }}
    >
      {initialsFor(name)}
    </div>
  )
}
