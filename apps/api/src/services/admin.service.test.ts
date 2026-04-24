import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn() }
  return { supabase: mockSupabase }
})

import {
  searchUsers,
  getUserDetail,
  suspendUser,
  unsuspendUser,
  takedownContent,
  getContentForModeration,
  listPendingKyc,
  getKycSubmission,
  getAuditLog,
} from './admin.service.js'
import { supabase } from '../lib/supabase.js'

// ─── Mock helpers ──────────────────────────────────────────────

function mockChain(data: unknown, error: unknown = null, count: number | null = null) {
  const resolvedVal = { data, error, count }
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────

const USER_ID = 'user-admin-001'
const ADMIN_ID = 'admin-001'
const CONTENT_ID = 'content-admin-001'

beforeEach(() => {
  vi.resetAllMocks()
})

// ── searchUsers ────────────────────────────────────────────────

describe('searchUsers', () => {
  it('returns matching users for a query', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain([
        {
          id: USER_ID,
          username: 'testuser',
          display_name: 'Test User',
          email: 'test@example.com',
          phone: '+919876543210',
          is_suspended: false,
          is_creator: true,
          kyc_status: 'verified',
          created_at: '2026-01-01T00:00:00Z',
        },
      ]) as never,
    )

    const results = await searchUsers('testuser', 20)

    expect(results).toHaveLength(1)
    expect(results[0]?.id).toBe(USER_ID)
    expect(results[0]?.username).toBe('testuser')
    expect(results[0]?.is_creator).toBe(true)
  })

  it('returns empty array when no users match', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    const results = await searchUsers('nonexistent@example.com', 20)

    expect(results).toHaveLength(0)
  })

  it('throws db-error when query fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'query failed' }) as never)

    await expect(searchUsers('query', 20)).rejects.toThrow('Failed to search users')
  })
})

// ── getUserDetail ──────────────────────────────────────────────

describe('getUserDetail', () => {
  it('returns user detail including follower counts', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain({
        id: USER_ID,
        username: 'testuser',
        display_name: 'Test User',
        email: 'test@example.com',
        phone: '+919876543210',
        is_suspended: false,
        is_creator: true,
        kyc_status: 'verified',
        follower_count: 120,
        following_count: 45,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      }) as never,
    )

    const detail = await getUserDetail(USER_ID)

    expect(detail.id).toBe(USER_ID)
    expect(detail.follower_count).toBe(120)
    expect(detail.following_count).toBe(45)
    expect(detail.kyc_status).toBe('verified')
  })

  it('throws not-found when user does not exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(getUserDetail(USER_ID)).rejects.toThrow('User not found')
  })

  it('throws db-error on database failure', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'db error' }) as never)

    await expect(getUserDetail(USER_ID)).rejects.toThrow('Failed to fetch user detail')
  })
})

// ── suspendUser ────────────────────────────────────────────────

describe('suspendUser', () => {
  it('suspends a user and writes audit log', async () => {
    const fromMock = vi.mocked(supabase.from)
    // update users
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // insert audit log
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(suspendUser(USER_ID, ADMIN_ID, 'Spam violation')).resolves.toBeUndefined()

    expect(fromMock).toHaveBeenCalledWith('users')
    expect(fromMock).toHaveBeenCalledWith('admin_audit_log')
  })

  it('throws db-error when update fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'update failed' }) as never)

    await expect(suspendUser(USER_ID, ADMIN_ID, 'Reason')).rejects.toThrow('Failed to suspend user')
  })
})

// ── unsuspendUser ──────────────────────────────────────────────

describe('unsuspendUser', () => {
  it('unsuspends a user and writes audit log', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(unsuspendUser(USER_ID, ADMIN_ID)).resolves.toBeUndefined()

    expect(fromMock).toHaveBeenCalledWith('users')
    expect(fromMock).toHaveBeenCalledWith('admin_audit_log')
  })

  it('throws db-error when update fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'update failed' }) as never)

    await expect(unsuspendUser(USER_ID, ADMIN_ID)).rejects.toThrow('Failed to unsuspend user')
  })
})

// ── takedownContent ────────────────────────────────────────────

describe('takedownContent', () => {
  it('sets content status to removed and writes audit log', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(takedownContent(CONTENT_ID, ADMIN_ID, 'Inappropriate content')).resolves.toBeUndefined()

    expect(fromMock).toHaveBeenCalledWith('content')
    expect(fromMock).toHaveBeenCalledWith('admin_audit_log')
  })

  it('throws db-error when update fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'update failed' }) as never)

    await expect(takedownContent(CONTENT_ID, ADMIN_ID, 'Reason')).rejects.toThrow('Failed to take down content')
  })
})

// ── getContentForModeration ────────────────────────────────────

describe('getContentForModeration', () => {
  it('returns content with creator username and reports count', async () => {
    const fromMock = vi.mocked(supabase.from)
    // content fetch
    fromMock.mockReturnValueOnce(
      mockChain({
        id: CONTENT_ID,
        type: 'post',
        title: 'Test Post',
        status: 'published',
        user_id: USER_ID,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      }) as never,
    )
    // creator fetch
    fromMock.mockReturnValueOnce(mockChain({ username: 'testuser' }) as never)
    // reports count
    fromMock.mockReturnValueOnce(mockChain(null, null, 3) as never)

    const detail = await getContentForModeration(CONTENT_ID)

    expect(detail.id).toBe(CONTENT_ID)
    expect(detail.creator_username).toBe('testuser')
    expect(detail.reports_count).toBe(3)
    expect(detail.type).toBe('post')
  })

  it('throws not-found when content does not exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(getContentForModeration(CONTENT_ID)).rejects.toThrow('Content not found')
  })
})

// ── listPendingKyc ─────────────────────────────────────────────

describe('listPendingKyc', () => {
  it('returns pending KYC items with pagination', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain([
        {
          creator_id: USER_ID,
          pan_name: 'Test Creator',
          submitted_at: '2026-04-01T10:00:00Z',
          users: { username: 'testcreator', display_name: 'Test Creator' },
        },
      ]) as never,
    )

    const { items, nextCursor } = await listPendingKyc({ limit: 20 })

    expect(items).toHaveLength(1)
    expect(items[0]?.user_id).toBe(USER_ID)
    expect(items[0]?.username).toBe('testcreator')
    expect(nextCursor).toBeNull()
  })

  it('returns nextCursor when there are more items than limit', async () => {
    const fromMock = vi.mocked(supabase.from)
    // Return limit+1 items to trigger cursor
    const rows = Array.from({ length: 3 }, (_, i) => ({
      creator_id: `user-${i.toString()}`,
      pan_name: `User ${i.toString()}`,
      submitted_at: `2026-04-0${(i + 1).toString()}T10:00:00Z`,
      users: { username: `user${i.toString()}`, display_name: `User ${i.toString()}` },
    }))
    fromMock.mockReturnValueOnce(mockChain(rows) as never)

    const { items, nextCursor } = await listPendingKyc({ limit: 2 })

    expect(items).toHaveLength(2)
    expect(nextCursor).not.toBeNull()
  })
})

// ── getKycSubmission ───────────────────────────────────────────

describe('getKycSubmission', () => {
  it('returns full KYC submission for a user', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain({
        creator_id: USER_ID,
        status: 'pending',
        pan_name: 'Test User',
        aadhaar_name: 'Test User',
        bank_account_holder: 'Test User',
        bank_account_number_last4: '3210',
        bank_ifsc: 'HDFC0001234',
        bank_name: 'HDFC Bank',
        selfie_url: 'https://storage.example.com/selfie.jpg',
        pan_photo_url: 'https://storage.example.com/pan.jpg',
        aadhaar_front_url: 'https://storage.example.com/aadhaar-front.jpg',
        aadhaar_back_url: 'https://storage.example.com/aadhaar-back.jpg',
        rejection_reasons: null,
        submitted_at: '2026-04-10T10:00:00Z',
        reviewed_at: null,
        reviewed_by: null,
      }) as never,
    )

    const submission = await getKycSubmission(USER_ID)

    expect(submission.user_id).toBe(USER_ID)
    expect(submission.pan_name).toBe('Test User')
    expect(submission.aadhaar_name).toBe('Test User')
    expect(submission.bank_account_number_last4).toBe('3210')
    expect(submission.status).toBe('pending')
    expect(submission.rejection_reasons).toBeNull()
  })

  it('throws not-found when no submission exists', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(getKycSubmission(USER_ID)).rejects.toThrow('KYC submission not found')
  })
})

// ── getAuditLog ────────────────────────────────────────────────

describe('getAuditLog', () => {
  it('returns audit log entries in descending order + hydrates admin email', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain([
        {
          id: 'audit-001',
          admin_id: ADMIN_ID,
          action: 'suspend_user',
          target_type: 'user',
          target_id: USER_ID,
          details: { reason: 'spam' },
          created_at: '2026-04-10T12:00:00Z',
        },
      ]) as never,
    )
    fromMock.mockReturnValueOnce(
      mockChain([{ id: ADMIN_ID, email: 'mod@creatorhub.in' }]) as never,
    )

    const { items, nextCursor } = await getAuditLog({ limit: 20 })

    expect(items).toHaveLength(1)
    expect(items[0]?.action).toBe('suspend_user')
    expect(items[0]?.admin_id).toBe(ADMIN_ID)
    expect(items[0]?.admin_email).toBe('mod@creatorhub.in')
    expect(nextCursor).toBeNull()
  })

  it('filters by adminId when provided', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    const { items } = await getAuditLog({ adminId: ADMIN_ID, limit: 20 })

    expect(items).toHaveLength(0)
    expect(fromMock).toHaveBeenCalledWith('admin_audit_log')
  })

  it('throws db-error on database failure', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'db error' }) as never)

    await expect(getAuditLog({})).rejects.toThrow('Failed to fetch audit log')
  })
})
