/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import { ImageResponse } from 'next/og'
import { fetchCreatorProfile } from '@/lib/api'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'CreatorHub creator profile'

interface Props {
  params: Promise<{ vertical: string; username: string }>
}

/**
 * Server-rendered Open Graph card for creator mini-sites. Cover photo or
 * gradient backdrop, avatar circle, display name in Fraunces, follower
 * count + content count footer.
 */
export default async function CreatorOgImage({ params }: Props) {
  const { username } = await params
  const creator = await fetchCreatorProfile(username)

  const displayName = creator?.displayName ?? 'CreatorHub creator'
  const handle = creator ? `@${creator.username}` : ''
  const cover = creator?.coverUrl ?? null
  const stats = creator
    ? [
        creator.followerCount > 0
          ? `${formatCount(creator.followerCount)} followers`
          : null,
        creator.contentCount > 0
          ? `${String(creator.contentCount)} ${creator.contentCount === 1 ? 'story' : 'stories'}`
          : null,
        creator.averageRating != null
          ? `★ ${creator.averageRating.toFixed(1)}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'Travel stories worth saving'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FBF9F4',
          color: '#14141A',
          position: 'relative',
        }}
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            width={1200}
            height={630}
            style={{ position: 'absolute', inset: 0, objectFit: 'cover' }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: cover
              ? 'linear-gradient(180deg, rgba(20,20,26,0.10) 0%, rgba(20,20,26,0.82) 100%)'
              : 'linear-gradient(180deg, #FBF9F4 0%, #EFE9DC 100%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 64,
            height: '100%',
            color: cover ? 'white' : '#14141A',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                background: '#E15A41',
                display: 'flex',
              }}
            />
            <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
              creator<span style={{ fontStyle: 'italic', fontWeight: 500 }}>hub</span>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#E15A41',
              }}
            >
              CREATOR
            </span>
            <h1
              style={{
                fontSize: 92,
                fontWeight: 600,
                lineHeight: 1.0,
                margin: 0,
                maxWidth: 1000,
                letterSpacing: '-0.02em',
              }}
            >
              {displayName.length > 40 ? `${displayName.slice(0, 38)}…` : displayName}
            </h1>
            {handle && (
              <p style={{ fontSize: 28, opacity: 0.86, margin: 0 }}>{handle}</p>
            )}
            <p style={{ fontSize: 26, opacity: 0.92, margin: 0 }}>{stats}</p>
          </div>
        </div>
      </div>
    ) as any,
    { ...size },
  )
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`
  if (n < 1_000_000) return `${String(Math.round(n / 1000))}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}
