/**
 * Tag primitive — small inline label for hashtags, categories, content
 * facets. Visually quieter than `<Pill>`; lower-case tracking, no
 * mono-caps. Used for `#road-trip`, `#monsoon`, `Editorial`, etc.
 *
 * Default surface is `--surface-alt`; coral variant for the rare "active
 * filter" case. SSR-safe.
 */

import type { HTMLAttributes, ReactNode } from 'react'

type TagTone = 'default' | 'tint' | 'ink'

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone
  /** Hash prefix for hashtag-style tags. Default false. */
  hash?: boolean
  children: ReactNode
}

const TONE_STYLE: Record<TagTone, { bg: string; color: string }> = {
  default: { bg: 'var(--surface-alt)', color: 'var(--ink-soft)' },
  tint: { bg: 'var(--primary-tint)', color: 'var(--primary-deep)' },
  ink: { bg: 'var(--ink)', color: 'var(--surface)' },
}

export function Tag({ tone = 'default', hash = false, children, style, ...rest }: TagProps) {
  const t = TONE_STYLE[tone]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 500,
        background: t.bg,
        color: t.color,
        ...style,
      }}
      {...rest}
    >
      {hash && '#'}
      {children}
    </span>
  )
}
