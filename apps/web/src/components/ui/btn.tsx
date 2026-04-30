/**
 * Button primitives — typed wrappers over the `ch-btn-*` CSS utility
 * classes defined in `globals.css`. Three variants only (SRS C-17):
 *   - `primary`  coral fill,    "Book", "Publish", "Sign up"
 *   - `ink`      black/ink fill, "Read this →" on hero
 *   - `ghost`    outlined,       "Sign in", "Skip", "Cancel"
 *
 * Two flavors:
 *   - `<Btn>`     → renders a `<button>`. For onClick handlers / Server Action
 *                   form submits.
 *   - `<BtnLink>` → renders a Next.js `<Link>`. For navigation.
 *
 * The API is deliberately narrow: pass `onClick`, `disabled`, `type`,
 * `aria-label`, `title`, `id`. For arbitrary HTML props use the lower-level
 * `ch-btn ch-btn-{variant}` CSS classes directly on a vanilla element.
 *
 * SSR-safe; no hooks, no client boundary.
 */

import Link from 'next/link'
import type { MouseEventHandler, ReactNode } from 'react'

type Variant = 'primary' | 'ink' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface CommonProps {
  variant?: Variant
  size?: Size
  /** Render as full-width block. */
  block?: boolean
  /** Loading state — disables and shows a spinner. */
  loading?: boolean
  /** Optional leading icon. */
  leadingIcon?: ReactNode
  /** Optional trailing icon. */
  trailingIcon?: ReactNode
  /** Accessible label override (use when the visible text is iconic). */
  'aria-label'?: string
  title?: string
  id?: string
  className?: string
  children: ReactNode
}

interface BtnProps extends CommonProps {
  onClick?: MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

interface BtnLinkProps extends CommonProps {
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
  target?: '_blank' | '_self'
  rel?: string
}

const SIZE_PADDING: Record<Size, string> = {
  sm: '6px 12px',
  md: '10px 16px',
  lg: '12px 22px',
}

const SIZE_FONT: Record<Size, number> = {
  sm: 12,
  md: 13.5,
  lg: 15,
}

function shared(p: CommonProps): { classes: string; style: Record<string, unknown> } {
  const variant = p.variant ?? 'primary'
  const size = p.size ?? 'md'
  return {
    classes: ['ch-btn', `ch-btn-${variant}`, p.className].filter(Boolean).join(' '),
    style: {
      padding: SIZE_PADDING[size],
      fontSize: SIZE_FONT[size],
      width: p.block ? '100%' : undefined,
      opacity: p.loading ? 0.7 : undefined,
      cursor: p.loading ? 'wait' : undefined,
    },
  }
}

function Inner({ p }: { p: CommonProps }) {
  return (
    <>
      {p.loading ? <Spinner /> : p.leadingIcon}
      <span>{p.children}</span>
      {!p.loading && p.trailingIcon}
    </>
  )
}

export function Btn(props: BtnProps) {
  const { classes, style } = shared(props)
  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      className={classes}
      style={style}
      disabled={props.loading || props.disabled}
      aria-label={props['aria-label']}
      aria-busy={props.loading || undefined}
      title={props.title}
      id={props.id}
    >
      <Inner p={props} />
    </button>
  )
}

export function BtnLink(props: BtnLinkProps) {
  const { classes, style } = shared(props)
  const computedRel = props.rel ?? (props.target === '_blank' ? 'noopener noreferrer' : undefined)
  // Build the prop bag only with defined values — Next.js Link's strict
  // type signature rejects `prop: undefined` under exactOptionalPropertyTypes.
  const linkProps: Record<string, unknown> = {
    href: props.href,
    className: classes,
    style,
  }
  if (props.onClick) linkProps.onClick = props.onClick
  if (props.target) linkProps.target = props.target
  if (computedRel) linkProps.rel = computedRel
  if (props['aria-label']) linkProps['aria-label'] = props['aria-label']
  if (props.loading) linkProps['aria-busy'] = true
  if (props.title) linkProps.title = props.title
  if (props.id) linkProps.id = props.id

  return (
    <Link {...(linkProps as unknown as React.ComponentProps<typeof Link>)}>
      <Inner p={props} />
    </Link>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden
      style={{
        width: 14,
        height: 14,
        border: '2px solid currentColor',
        borderRightColor: 'transparent',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'ch-spin 0.6s linear infinite',
      }}
    />
  )
}
