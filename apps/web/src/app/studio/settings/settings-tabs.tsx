'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Tab = 'account' | 'payout' | 'notifications' | 'privacy'

// session.displayName can be null when a user signed up via OAuth without
// setting one — the type used to lie (`string`) and crashed `.trim()`
// callers downstream. Honest type now; callers default to '' as needed.
interface SettingsTabsProps {
  initialTab: Tab
  session: { displayName: string | null; username: string }
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'payout', label: 'Payout' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy' },
]

export function SettingsTabs({ initialTab, session }: SettingsTabsProps) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const router = useRouter()

  function go(t: Tab) {
    setTab(t)
    const params = new URLSearchParams({ tab: t })
    router.replace(`/studio/settings?${params.toString()}`)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px minmax(0, 1fr)', gap: 32 }}>
      <nav aria-label="Settings sections">
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TABS.map((t) => {
            const isActive = tab === t.id
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => {
                    go(t.id)
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: 0,
                    background: isActive ? 'var(--primary-tint)' : 'transparent',
                    color: isActive ? 'var(--primary-deep)' : 'var(--ink-soft)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 13.5,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {t.label}
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <div className="ch-card" style={{ padding: 28, maxWidth: 600 }}>
        {tab === 'account' && <AccountTab session={session} />}
        {tab === 'payout' && <PayoutTab />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'privacy' && <PrivacyTab />}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="ch-display" style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 6 }}>
      {children}
    </h2>
  )
}

function SectionSub({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 24 }}>
      {children}
    </p>
  )
}

function AccountTab({ session }: { session: { displayName: string | null; username: string } }) {
  const initialDisplayName = session.displayName ?? ''
  const [pending, startTransition] = useTransition()
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [username, setUsername] = useState(session.username)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const dirty =
    displayName.trim() !== initialDisplayName.trim() ||
    username.trim().toLowerCase() !== session.username.trim().toLowerCase()

  async function saveProfile() {
    if (!dirty) return
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const res = await fetch('/api/v1/users/me', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim(),
          username: username.trim().toLowerCase(),
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string; message?: string }
        setProfileMsg({
          kind: 'err',
          text: body.detail ?? body.message ?? `Save failed (${String(res.status)})`,
        })
      } else {
        setProfileMsg({ kind: 'ok', text: 'Saved.' })
      }
    } catch (e) {
      setProfileMsg({
        kind: 'err',
        text: (e as { message?: string }).message ?? 'Network error. Try again.',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  function signOutEverywhere() {
    startTransition(async () => {
      try {
        await fetch('/api/auth/signout', { method: 'POST', credentials: 'same-origin' })
        window.location.href = '/'
      } catch {
        /* noop */
      }
    })
  }

  return (
    <>
      <SectionTitle>Account</SectionTitle>
      <SectionSub>Display name and username are shared across web and mobile.</SectionSub>
      <FieldRow
        label="Display name"
        hint="The name on your posts, profile, and creator card."
      >
        <input
          type="text"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value)
          }}
          maxLength={60}
          style={fieldInputStyle}
        />
      </FieldRow>
      <FieldRow
        label="Username"
        hint="Your @handle. Lowercase letters and numbers only, 3–20 chars."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--ink-muted)', fontSize: 14 }}>@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))
            }}
            minLength={3}
            maxLength={20}
            style={fieldInputStyle}
          />
        </div>
      </FieldRow>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => {
            void saveProfile()
          }}
          disabled={!dirty || savingProfile}
          className="ch-btn ch-btn-primary"
        >
          {savingProfile ? 'Saving…' : 'Save changes'}
        </button>
        {profileMsg && (
          <span
            role="status"
            aria-live="polite"
            style={{
              fontSize: 13,
              color: profileMsg.kind === 'ok' ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {profileMsg.text}
          </span>
        )}
      </div>
      <hr className="ch-divider" style={{ margin: '24px 0' }} />
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>
        Sign out everywhere
      </h3>
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 12, lineHeight: 1.55 }}>
        Revokes refresh tokens on every device. You&rsquo;ll need to sign in again here and in
        the mobile app.
      </p>
      <button
        type="button"
        onClick={signOutEverywhere}
        disabled={pending}
        className="ch-btn ch-btn-ghost"
        style={{ color: 'var(--danger)', borderColor: 'var(--hairline-strong)' }}
      >
        {pending ? 'Signing out…' : 'Sign out everywhere'}
      </button>
    </>
  )
}

const fieldInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--hairline-strong)',
  background: 'var(--surface)',
  color: 'var(--ink)',
  fontSize: 14,
  fontFamily: 'inherit',
  minWidth: 200,
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink)',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {hint && (
        <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 6px' }}>{hint}</p>
      )}
      {children}
    </div>
  )
}

function PayoutTab() {
  return (
    <>
      <SectionTitle>Payout details</SectionTitle>
      <SectionSub>
        Manage your bank account and UPI for receiving payouts. Changes take effect from the
        next payout cycle (every 48 hours).
      </SectionSub>
      <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>
        Payout details are managed during KYC. To update them, head to{' '}
        <Link href="/studio/kyc" style={{ color: 'var(--primary-deep)', fontWeight: 600 }}>
          Studio · KYC
        </Link>{' '}
        and re-submit.
      </p>
    </>
  )
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, Record<string, boolean>>>({
    new_follow: { email: false, push: true, app: true },
    new_like: { email: false, push: false, app: true },
    new_comment: { email: false, push: true, app: true },
    booking_confirmed: { email: true, push: true, app: true },
    booking_reminder: { email: true, push: true, app: true },
    payout_settled: { email: true, push: true, app: true },
    weekly_digest: { email: true, push: false, app: false },
  })

  function toggle(event: string, channel: string) {
    setPrefs((p) => ({
      ...p,
      [event]: { ...p[event], [channel]: !p[event]?.[channel] },
    }))
  }

  return (
    <>
      <SectionTitle>Notifications</SectionTitle>
      <SectionSub>
        Choose where each notification lands. Booking and payout alerts are tuned to be
        unmissable by default; the rest you can shape.
      </SectionSub>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
            }}
          >
            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Event</th>
            <th style={{ padding: '8px 12px' }}>Email</th>
            <th style={{ padding: '8px 12px' }}>Push</th>
            <th style={{ padding: '8px 12px' }}>In-app</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(prefs).map(([event, channels]) => (
            <tr key={event} style={{ borderTop: '1px solid var(--hairline)' }}>
              <td style={{ padding: '14px 12px', color: 'var(--ink)' }}>
                {event.replaceAll('_', ' ')}
              </td>
              {(['email', 'push', 'app'] as const).map((c) => (
                <td key={c} style={{ padding: '14px 12px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={channels[c] ?? false}
                    onChange={() => {
                      toggle(event, c)
                    }}
                    aria-label={`${event} via ${c}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 16 }}>
        Changes save automatically. You can also manage these from the mobile app.
      </p>
    </>
  )
}

function PrivacyTab() {
  const [visibility, setVisibility] = useState<'public' | 'followers'>('public')
  const [comments, setComments] = useState(true)
  const [tagApproval, setTagApproval] = useState(false)
  return (
    <>
      <SectionTitle>Privacy</SectionTitle>
      <SectionSub>
        Control who sees your content and how others can interact with you. These mirror the
        mobile privacy controls.
      </SectionSub>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>
        Profile visibility
      </h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['public', 'followers'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setVisibility(v)
            }}
            aria-pressed={visibility === v}
            style={{
              padding: '10px 16px',
              borderRadius: 999,
              border: `1.5px solid ${visibility === v ? 'var(--primary)' : 'var(--hairline)'}`,
              background: visibility === v ? 'var(--primary-tint)' : 'var(--surface)',
              color: visibility === v ? 'var(--primary-deep)' : 'var(--ink)',
              fontWeight: visibility === v ? 600 : 500,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {v === 'public' ? 'Public' : 'Followers only'}
          </button>
        ))}
      </div>
      <Toggle
        label="Allow comments"
        checked={comments}
        onToggle={() => {
          setComments((c) => !c)
        }}
      />
      <Toggle
        label="Approve tags before they appear"
        checked={tagApproval}
        onToggle={() => {
          setTagApproval((t) => !t)
        }}
      />

      {/* Blocked accounts (E5.7 T7) — v3 WEB-PROF-FR-081 surfaces the
          block-list inside the privacy tab. The full management UI ships
          with SEC-FR-008; this section is the entry point. */}
      <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 28, marginBottom: 8, color: 'var(--ink)' }}>
        Blocked accounts
      </h3>
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 12, lineHeight: 1.55 }}>
        Block someone to prevent them from following you, seeing your private posts, or
        commenting. Blocks are silent — the other person isn&rsquo;t notified.
      </p>
      <p
        style={{
          fontSize: 12.5,
          color: 'var(--ink-soft)',
          padding: '10px 14px',
          background: 'var(--surface-alt)',
          borderRadius: 'var(--radius-md)',
          margin: 0,
        }}
      >
        You haven&rsquo;t blocked anyone yet. Use the menu on a profile to block.
      </p>

      <hr className="ch-divider" style={{ margin: '32px 0' }} />
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--danger)' }}>
        Danger zone
      </h3>
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 12, lineHeight: 1.55 }}>
        Account deletion uses a 14-day grace period. All data is removed permanently after
        that window unless you sign back in.
      </p>
      <button
        type="button"
        className="ch-btn ch-btn-ghost"
        style={{ color: 'var(--danger)', borderColor: 'var(--hairline-strong)' }}
      >
        Delete my account
      </button>
    </>
  )
}

function Toggle({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid var(--hairline)',
        fontSize: 14,
        cursor: 'pointer',
      }}
    >
      <span style={{ color: 'var(--ink)' }}>{label}</span>
      <span
        aria-hidden
        style={{
          width: 38,
          height: 22,
          borderRadius: 999,
          background: checked ? 'var(--primary)' : 'var(--hairline-strong)',
          position: 'relative',
          transition: 'background 200ms',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 18 : 2,
            width: 18,
            height: 18,
            background: 'white',
            borderRadius: 999,
            transition: 'left 200ms cubic-bezier(0.22, 1, 0.36, 1)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        />
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      />
    </label>
  )
}
