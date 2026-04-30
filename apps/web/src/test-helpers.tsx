/**
 * Test helpers for widget-style component tests.
 *
 * `renderWithProviders` wraps a component in the same global providers
 * the real app uses (sign-in modal context) so interactive components
 * that call useSignInModal() don't blow up in isolation.
 */
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import { SignInModalProvider } from '@/components/auth/sign-in-modal-provider'
import type { ReactElement, ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

function AllProviders({ children }: ProvidersProps) {
  return <SignInModalProvider>{children}</SignInModalProvider>
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export the rest of testing-library so tests have a single import.
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
