import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '../../lib/session'
import { ChangePasswordForm } from '../../components/ChangePasswordForm'

export const metadata: Metadata = { title: 'Change password' }

export default async function ChangePasswordPage(): Promise<React.JSX.Element> {
  const admin = await getCurrentAdmin()
  if (admin === null) redirect('/login')

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="flex flex-col items-center gap-8 w-full">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-semibold">Change password</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {admin.must_change_password
              ? 'Set a new password to continue.'
              : 'Rotate your password.'}
          </p>
        </div>
        <ChangePasswordForm />
      </div>
    </main>
  )
}
