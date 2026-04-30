/**
 * Pill primitive — typed wrapper over the `ch-pill-*` CSS utility classes.
 * Used for type labels, status indicators, prices, "FREE" badges, etc.
 *
 * Variants (from WEB-DESIGN-SYSTEM.md §5):
 *   - `default` neutral surface-alt fill, ink text — generic dark pill on light bg
 *   - `coral`   coral accent — "★ Featured", price, FREE, important state
 *   - `glass`   translucent — type label on hero photo (dark backdrop)
 *   - `tint`    coral-tint bg — streak counter, level pill, status indicators
 *   - `ink`     ink fill — generic dark pill (alias of default's bolder form)
 *
 * SSR-safe.
 */

import type { HTMLAttributes, ReactNode } from 'react'

type PillVariant = 'default' | 'coral' | 'glass' | 'tint' | 'ink'

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant
  /** Optional leading dot (used for unread / status indicators). */
  dot?: boolean
  children: ReactNode
}

const VARIANT_CLASS: Record<PillVariant, string> = {
  default: 'ch-pill',
  coral: 'ch-pill ch-pill-coral',
  glass: 'ch-pill ch-pill-glass',
  tint: 'ch-pill ch-pill-tint',
  ink: 'ch-pill ch-pill-ink',
}

export function Pill({
  variant = 'default',
  dot = false,
  children,
  className,
  style,
  ...rest
}: PillProps) {
  const classes = [VARIANT_CLASS[variant], className].filter(Boolean).join(' ')
  return (
    <span className={classes} style={style} {...rest}>
      {dot && (
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: 'currentColor',
            marginRight: 6,
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </span>
  )
}
