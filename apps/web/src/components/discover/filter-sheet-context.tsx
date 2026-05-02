'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface FilterSheetCtx {
  isOpen: boolean
  open: () => void
  close: () => void
}

const Ctx = createContext<FilterSheetCtx | null>(null)

/**
 * Wraps `/discover` so the "+ More filters" sidebar button and the FilterSheet
 * share open state without round-tripping through the URL. Pre-fix, opening
 * the sheet wrote `?filters=open` and triggered a 500–1500ms RSC re-render
 * (felt like a full page reload). Now the toggle is pure client state.
 *
 * `initialOpen` lets the page seed it from `?filters=open` on first paint
 * for deep-linking — but subsequent toggles never touch the URL.
 */
export function FilterSheetProvider({
  initialOpen = false,
  children,
}: {
  initialOpen?: boolean
  children: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  return (
    <Ctx.Provider
      value={{
        isOpen,
        open: () => {
          setIsOpen(true)
        },
        close: () => {
          setIsOpen(false)
        },
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useFilterSheet(): FilterSheetCtx {
  const v = useContext(Ctx)
  if (!v) {
    // Guard for components that might mount outside the provider — return
    // a no-op rather than throw, so a stray import doesn't crash the page.
    return { isOpen: false, open: () => {}, close: () => {} }
  }
  return v
}
