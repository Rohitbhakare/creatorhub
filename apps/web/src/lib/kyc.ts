import 'server-only'
import { apiFetch } from './api-client'
import { AppError } from './errors'

export interface KycStatus {
  status: 'not_started' | 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  submittedAt?: string
  reviewedAt?: string
}

interface KycStatusRaw {
  status: 'not_started' | 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  submitted_at?: string
  reviewed_at?: string
}

/**
 * Fetch the current KYC status for the authed user. Returns a `not_started`
 * shape on 404 / unknown errors so the UI can render a coherent state even
 * when the API endpoint isn't deployed yet.
 */
export async function fetchKycStatus(): Promise<KycStatus> {
  try {
    const raw = await apiFetch<KycStatusRaw>(`/api/v1/kyc/status`, {
      next: { revalidate: 0 },
      retries: 1,
      timeoutMs: 4_000,
    })
    return {
      status: raw.status,
      ...(raw.rejection_reason !== undefined ? { rejectionReason: raw.rejection_reason } : {}),
      ...(raw.submitted_at !== undefined ? { submittedAt: raw.submitted_at } : {}),
      ...(raw.reviewed_at !== undefined ? { reviewedAt: raw.reviewed_at } : {}),
    }
  } catch (err) {
    if (err instanceof AppError && err.status === 404) {
      return { status: 'not_started' }
    }
    return { status: 'not_started' }
  }
}
