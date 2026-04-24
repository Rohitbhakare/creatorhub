'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// App-wide dark-mode state. The `.dark` class is applied to
// <html> so an inline <script> in layout.tsx can pre-set it before
// React hydrates (avoiding a light-flash for dark-mode users).
// globals.css has `.dark { … }` — any ancestor flips the tokens.

const STORAGE_KEY = 'admin-dark'

interface DarkModeCtx {
  dark: boolean
  toggle: () => void
}

const Ctx = createContext<DarkModeCtx | null>(null)

export function DarkModeShell({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  // Default to false on the server; sync to the already-applied
  // <html> class on mount so state matches what the user sees.
  const [dark, setDark] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    document.documentElement.classList.toggle('dark', dark)
    try {
      window.localStorage.setItem(STORAGE_KEY, dark ? '1' : '0')
    } catch {
      // ignore — private mode etc
    }
  }, [dark, hydrated])

  const value: DarkModeCtx = {
    dark,
    toggle: () => {
      setDark((d) => !d)
    },
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function DarkModeToggle(): React.JSX.Element | null {
  const ctx = useContext(Ctx)
  if (!ctx) return null
  const { dark, toggle } = ctx
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-full border px-3 py-1.5 text-xs font-medium"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border-strong)',
        color: 'var(--color-text)',
      }}
    >
      {dark ? '☀ Light' : '☾ Dark'}
    </button>
  )
}
