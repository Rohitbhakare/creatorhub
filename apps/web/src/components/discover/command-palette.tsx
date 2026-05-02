'use client'

import { lazy, Suspense, useEffect, useState } from 'react'

/**
 * Lightweight loader for the command palette. Mounted globally in the root
 * layout so the Cmd/Ctrl+K and `/` keyboard shortcuts always work — but
 * the heavy implementation (framer-motion + suggestion fetcher + 400+
 * lines of JSX) is only fetched after the user actually triggers it.
 *
 * Without this split the palette adds ~30-50KB to every initial route
 * bundle even on routes that aren't search-driven (legal pages, /signin,
 * etc.). Splitting keeps `/discover` and `/u/[username]` under their
 * 180KB budget (WEB-NFR-004).
 */

const CommandPaletteImpl = lazy(() =>
  import('./command-palette-impl').then((m) => ({ default: m.CommandPaletteImpl })),
)

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  // We keep a separate `armed` flag so the impl chunk only starts loading
  // after the *first* trigger. Subsequent triggers reuse the loaded chunk
  // and the open/close cycle is identical to the un-split version.
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setArmed(true)
        setOpen((p) => !p)
        return
      }
      if (e.key === '/' && !isInputFocused()) {
        e.preventDefault()
        setArmed(true)
        setOpen(true)
      }
    }
    // Custom event: lets server-rendered chrome (e.g. the header search icon)
    // request the palette without re-implementing the open-state plumbing.
    function onOpenEvent() {
      setArmed(true)
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('ch:open-command-palette', onOpenEvent)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('ch:open-command-palette', onOpenEvent)
    }
  }, [])

  if (!armed) return null

  return (
    <Suspense fallback={null}>
      <CommandPaletteImpl
        open={open}
        onClose={() => {
          setOpen(false)
        }}
      />
    </Suspense>
  )
}

function isInputFocused(): boolean {
  const a = document.activeElement
  if (!a) return false
  const tag = a.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || (a as HTMLElement).isContentEditable
}
