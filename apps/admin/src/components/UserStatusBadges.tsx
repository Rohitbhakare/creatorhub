interface BadgeProps {
  label: string
  color: string
  background: string
}

function Badge({ label, color, background }: BadgeProps): React.JSX.Element {
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{ color, backgroundColor: background }}
    >
      {label}
    </span>
  )
}

function kycBadge(status: string | null): BadgeProps | null {
  if (status === null || status === 'not_started') return null
  if (status === 'verified') {
    return {
      label: 'KYC verified',
      color: '#FFFFFF',
      background: 'var(--color-success)',
    }
  }
  if (status === 'pending') {
    return {
      label: 'KYC pending',
      color: '#FFFFFF',
      background: 'var(--color-warning)',
    }
  }
  if (status === 'rejected' || status === 'expired') {
    return {
      label: `KYC ${status}`,
      color: '#FFFFFF',
      background: 'var(--color-error)',
    }
  }
  return null
}

export function UserStatusBadges({
  isSuspended,
  isCreator,
  kycStatus,
}: {
  isSuspended: boolean
  isCreator: boolean
  kycStatus: string | null
}): React.JSX.Element {
  const kyc = kycBadge(kycStatus)
  return (
    <div className="flex flex-wrap items-center gap-1">
      {isSuspended && (
        <Badge
          label="Suspended"
          color="#FFFFFF"
          background="var(--color-error)"
        />
      )}
      {isCreator && (
        <Badge
          label="Creator"
          color="#FFFFFF"
          background="var(--color-coral)"
        />
      )}
      {kyc !== null && <Badge {...kyc} />}
      {!isSuspended && !isCreator && kyc === null && (
        <span
          className="text-xs"
          style={{ color: 'var(--color-text-subtle)' }}
        >
          —
        </span>
      )}
    </div>
  )
}
