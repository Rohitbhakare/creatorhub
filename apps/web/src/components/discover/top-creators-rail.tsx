import Link from 'next/link'
import Image from 'next/image'
import { FollowButton } from '@/components/social/follow-button'
import type { DiscoverCreator } from '@/lib/api/discover'
import { creatorUrl } from '@/lib/slug'

interface Props {
  creators: DiscoverCreator[]
  label: string
  isAuthenticated: boolean
}

function initials(name: string | null): string {
  if (!name) return '·'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '·'
}

function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`
  return String(count)
}

export function TopCreatorsRail({ creators, label, isAuthenticated }: Props) {
  if (creators.length === 0) return null
  return (
    <section style={{ marginBottom: 40 }}>
      <header style={{ marginBottom: 16 }}>
        <p
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
            marginBottom: 4,
            fontWeight: 700,
          }}
        >
          People
        </p>
        <h2 className="ch-display" style={{ fontSize: 22, color: 'var(--ink)' }}>
          {label}
        </h2>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: 12,
        }}
      >
        {creators.map((c) => {
          const handle = c.username
          const href = handle ? creatorUrl(handle) : '#'
          const displayName = c.displayName ?? c.username ?? 'Creator'
          return (
            <div
              key={c.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '20px 12px',
                borderRadius: 14,
                background: 'var(--surface)',
                border: '1px solid var(--hairline)',
              }}
            >
              <Link
                href={href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  textDecoration: 'none',
                  color: 'var(--ink)',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    position: 'relative',
                    background: 'var(--bg-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 700,
                    color: 'var(--ink-muted)',
                  }}
                >
                  {c.avatarUrl ? (
                    <Image
                      src={c.avatarUrl}
                      alt=""
                      fill
                      sizes="64px"
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  ) : (
                    initials(c.displayName)
                  )}
                </div>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {displayName}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>
                  {formatFollowers(c.followerCount)} followers
                </span>
              </Link>
              <FollowButton
                creatorId={c.id}
                creatorName={displayName}
                initialFollowerCount={c.followerCount}
                isAuthenticated={isAuthenticated}
                size="sm"
                hideCount
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
