import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from '../../components/LoginForm'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage(): React.JSX.Element {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="flex flex-col items-center gap-8 w-full">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-semibold">CreatorHub Admin</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Internal operations console
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
