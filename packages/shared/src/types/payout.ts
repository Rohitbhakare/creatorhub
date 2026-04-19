// ─── Payouts (E2.12 Razorpay Route) ─────────────────────────
export type PayoutStatus =
  | 'pending'
  | 'scheduled'
  | 'processing'
  | 'completed'
  | 'failed'

export type PayoutSummary = {
  id: string
  bookingId: string
  amountPaisa: number
  tdsPaisa: number
  status: PayoutStatus
  scheduledAt: string
  processedAt: string | null
  bookingTitle: string | null
  failureReason: string | null
}

export type PayoutListResponse = {
  items: PayoutSummary[]
  nextCursor: string | null
  summary: {
    pendingPaisa: number
    processingPaisa: number
    paidLast30dPaisa: number
  }
}

// ─── Linked Account ─────────────────────────────────────────
export type LinkedAccountStatus =
  | 'created'
  | 'activated'
  | 'suspended'
  | 'deactivated'

export type LinkedAccount = {
  status: LinkedAccountStatus | null
  activatedAt: string | null
  holderName: string | null
  bankAccountMasked: string | null
  bankIfsc: string | null
}
