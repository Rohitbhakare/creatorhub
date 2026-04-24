import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell } from '../../../components/AppShell'
import { KycActions } from '../../../components/KycActions'
import { serverFetch, ApiRequestError } from '../../../lib/server-api'

export const metadata: Metadata = { title: 'KYC submission' }

interface KycSubmission {
  user_id: string
  status: string
  pan_name: string
  aadhaar_name: string
  bank_account_holder: string
  bank_account_number_last4: string
  bank_ifsc: string
  bank_name: string | null
  selfie_url: string
  pan_photo_url: string
  aadhaar_front_url: string
  aadhaar_back_url: string
  rejection_reasons: Array<{ field: string; reason: string }> | null
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

async function loadKyc(
  userId: string,
): Promise<
  { detail: KycSubmission } | { notFound: true } | { error: string }
> {
  try {
    const detail = await serverFetch<KycSubmission>(
      `/api/v1/admin/kyc/${userId}`,
    )
    return { detail }
  } catch (err) {
    if (err instanceof ApiRequestError) {
      if (err.status === 404) return { notFound: true }
      return { error: err.message }
    }
    return { error: 'Failed to load KYC submission.' }
  }
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-xs uppercase tracking-wide"
        style={{ color: 'var(--color-text-subtle)' }}
      >
        {label}
      </span>
      <span className={`text-sm ${mono === true ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  const isApproved = status === 'approved' || status === 'verified'
  const tone = isApproved
    ? 'var(--color-success)'
    : status === 'pending'
      ? 'var(--color-warning)'
      : status === 'rejected'
        ? 'var(--color-error)'
        : 'var(--color-text-muted)'
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium text-white"
      style={{ backgroundColor: tone }}
    >
      {status}
    </span>
  )
}

function DocLink({
  href,
  label,
}: {
  href: string
  label: string
}): React.JSX.Element {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium border"
      style={{ borderColor: 'var(--color-border-strong)' }}
    >
      {label} ↗
    </a>
  )
}

export default async function KycDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}): Promise<React.JSX.Element> {
  const { userId } = await params
  const result = await loadKyc(userId)

  if ('notFound' in result) {
    return (
      <AppShell>
        <div className="flex flex-col gap-4">
          <Link href="/kyc" className="text-sm underline w-fit">
            ← Back to KYC queue
          </Link>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No KYC submission for user <code>{userId}</code>.
          </p>
        </div>
      </AppShell>
    )
  }

  if ('error' in result) {
    return (
      <AppShell>
        <div className="flex flex-col gap-4">
          <Link href="/kyc" className="text-sm underline w-fit">
            ← Back to KYC queue
          </Link>
          <div
            role="alert"
            className="border rounded-md p-3 text-sm"
            style={{
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-error)',
            }}
          >
            {result.error}
          </div>
        </div>
      </AppShell>
    )
  }

  const k = result.detail
  const actionable = k.status === 'pending'

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Link href="/kyc" className="text-sm underline w-fit">
          ← Back to KYC queue
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">KYC submission</h1>
            <div className="flex items-center gap-2">
              <StatusBadge status={k.status} />
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Submitted{' '}
                {new Date(k.submitted_at).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          {actionable && <KycActions userId={k.user_id} />}
        </div>

        <section
          className="flex flex-col gap-3 border rounded-lg p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Identity
          </h2>
          <p
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            PAN and Aadhaar numbers are stored as one-way hashes. Verify
            by comparing the name on file against the uploaded documents
            below.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Row label="PAN name" value={k.pan_name} />
            <Row label="Aadhaar name" value={k.aadhaar_name} />
          </div>
        </section>

        <section
          className="flex flex-col gap-3 border rounded-lg p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Bank
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Row label="Account holder" value={k.bank_account_holder} />
            <Row label="Bank name" value={k.bank_name ?? '—'} />
            <Row label="IFSC" value={k.bank_ifsc} mono />
            <Row
              label="Account number"
              value={`••••${k.bank_account_number_last4}`}
              mono
            />
          </div>
        </section>

        <section
          className="flex flex-col gap-3 border rounded-lg p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Documents
          </h2>
          <p
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Links open through a server-side redirect; the actual
            storage URL is not exposed to the browser.
          </p>
          <div className="flex flex-wrap gap-2">
            <DocLink
              href={`/kyc-doc/${k.user_id}/selfie`}
              label="Selfie"
            />
            <DocLink
              href={`/kyc-doc/${k.user_id}/pan`}
              label="PAN document"
            />
            <DocLink
              href={`/kyc-doc/${k.user_id}/aadhaar-front`}
              label="Aadhaar (front)"
            />
            <DocLink
              href={`/kyc-doc/${k.user_id}/aadhaar-back`}
              label="Aadhaar (back)"
            />
          </div>
        </section>

        {k.status !== 'pending' && (
          <section
            className="flex flex-col gap-3 border rounded-lg p-5"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Review
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Row
                label="Reviewed at"
                value={
                  k.reviewed_at !== null
                    ? new Date(k.reviewed_at).toLocaleString('en-IN')
                    : '—'
                }
              />
              <Row label="Reviewed by" value={k.reviewed_by ?? '—'} />
              {k.rejection_reasons !== null && k.rejection_reasons.length > 0 && (
                <div className="md:col-span-2">
                  <Row
                    label="Rejection reason"
                    value={k.rejection_reasons
                      .map((r) => r.reason)
                      .join('; ')}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        <Row label="User ID" value={k.user_id} mono />
      </div>
    </AppShell>
  )
}
