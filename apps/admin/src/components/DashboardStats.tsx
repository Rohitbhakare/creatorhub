import Link from 'next/link'

interface StatCardProps {
  label: string
  value: number | null
  href: string
  tone?: 'default' | 'warn'
}

function StatCard({
  label,
  value,
  href,
  tone = 'default',
}: StatCardProps): React.JSX.Element {
  const display = value === null ? '—' : value.toLocaleString('en-IN')
  const warn = tone === 'warn' && value !== null && value > 0

  return (
    <Link
      href={href}
      className="border rounded-lg p-5 flex flex-col gap-2 transition-colors hover:bg-[var(--color-surface-muted)]"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <span
        className="text-xs uppercase tracking-wide"
        style={{ color: 'var(--color-text-subtle)' }}
      >
        {label}
      </span>
      <span
        className="text-2xl font-semibold"
        style={{ color: warn ? 'var(--color-coral)' : 'var(--color-text)' }}
      >
        {display}
      </span>
    </Link>
  )
}

export function DashboardStats({
  pendingKyc,
  openReports,
  takedownsToday,
  payoutsQueued,
}: {
  pendingKyc: number | null
  openReports: number | null
  takedownsToday: number | null
  payoutsQueued: number | null
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Pending KYC"
        value={pendingKyc}
        href="/kyc"
        tone="warn"
      />
      <StatCard
        label="Open Reports"
        value={openReports}
        href="/moderation"
        tone="warn"
      />
      <StatCard
        label="Takedowns Today"
        value={takedownsToday}
        href="/audit"
      />
      <StatCard
        label="Payouts Queued"
        value={payoutsQueued}
        href="/payouts"
      />
    </div>
  )
}
