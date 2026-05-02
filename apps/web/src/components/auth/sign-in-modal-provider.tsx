'use client'

import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

// Lazy-loaded modal body — keeps the auth UI (form + framer-motion +
// Firebase phone provider hooks) out of the initial route bundle for every
// page. Same pattern the command palette uses (command-palette.tsx). The
// chunk only loads after the first openSignInModal() call.
const SignInModal = lazy(() =>
  import('./sign-in-modal').then((m) => ({ default: m.SignInModal })),
)

export interface SignInRequest {
  /** Short label of the action being attempted, e.g. "Save “Konkan”", "Like", "Follow Aarav". */
  contextLabel: string
  /** Optional one-line reason shown below the title. */
  reason?: string
  /**
   * Fires after the session cookie is set and the page state is fresh.
   * Use this to complete the deferred action (save, like, follow, book).
   * Note: this runs client-side; the server-side data won't yet reflect the
   * mutation, but the optimistic UI flip will still be correct.
   */
  onSuccess?: () => void
}

interface ModalContextValue {
  /**
   * Open the contextual sign-in modal. Falls back to a hard /signin redirect
   * when the modal can't mount (rare — third-party iframe, cookies blocked).
   */
  openSignInModal: (req: SignInRequest) => void
  /** True when the modal is currently rendered. */
  isOpen: boolean
}

const SignInModalContext = createContext<ModalContextValue | null>(null)

export function useSignInModal(): ModalContextValue {
  const ctx = useContext(SignInModalContext)
  if (!ctx) {
    // Provider not mounted (very unlikely — it's in the root layout). Return
    // a no-op so callers don't crash; the redirect-based fallback in the
    // calling component will fire instead.
    return {
      openSignInModal: () => {
        if (typeof window !== 'undefined') {
          const next = window.location.pathname + window.location.search
          window.location.href = `/signin?next=${encodeURIComponent(next)}`
        }
      },
      isOpen: false,
    }
  }
  return ctx
}

interface ProviderProps {
  children: ReactNode
}

export function SignInModalProvider({ children }: ProviderProps) {
  const [request, setRequest] = useState<SignInRequest | null>(null)

  const openSignInModal = useCallback((req: SignInRequest) => {
    setRequest(req)
  }, [])

  const close = useCallback(() => {
    setRequest(null)
  }, [])

  const value = useMemo<ModalContextValue>(
    () => ({ openSignInModal, isOpen: request !== null }),
    [openSignInModal, request],
  )

  return (
    <SignInModalContext.Provider value={value}>
      {children}
      {request && (
        // Suspense fallback is `null` because the modal opens via user gesture
        // (button click) — a brief no-paint while the chunk loads is fine and
        // matches Cmd+K palette UX. Network is usually warm enough that the
        // user sees the modal in well under a frame.
        <Suspense fallback={null}>
          <SignInModal
            contextLabel={request.contextLabel}
            {...(request.reason !== undefined ? { reason: request.reason } : {})}
            onClose={close}
            onSuccess={() => {
              const cb = request.onSuccess
              close()
              // Defer the callback so the modal is fully unmounted first —
              // avoids race conditions in optimistic UI updates.
              if (cb) setTimeout(cb, 30)
            }}
          />
        </Suspense>
      )}
    </SignInModalContext.Provider>
  )
}
