import type { Metadata } from 'next'
import { AppShell } from '../components/AppShell'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage(): React.JSX.Element {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Overview of platform health and queues.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            'Pending KYC',
            'Open Reports',
            'Takedowns Today',
            'Payouts Queued',
          ].map((label) => (
            <div
              key={label}
              className="border rounded-lg p-5 flex flex-col gap-2"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div
                className="text-xs uppercase tracking-wide"
                style={{ color: 'var(--color-text-subtle)' }}
              >
                {label}
              </div>
              <div className="text-2xl font-semibold">—</div>
            </div>
          ))}
        </div>

        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Live metrics land in T14.
        </p>
      </div>
    </AppShell>
  )
}
