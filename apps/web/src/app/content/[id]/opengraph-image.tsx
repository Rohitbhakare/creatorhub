/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import { ImageResponse } from 'next/og'
import { fetchContentDetail } from '@/lib/api'
import { extractContentId } from '@/lib/slug'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'CreatorHub story'

interface Props {
  params: Promise<{ id: string }>
}

/**
 * Server-rendered Open Graph card for content detail pages.
 * Replaces the bare cover-image OG that we used before — this version has
 * a coral accent kicker, the title in Fraunces, and creator + city in the
 * footer. 1200×630 PNG, generated on demand and cached at the edge.
 */
export default async function ContentOgImage({ params }: Props) {
  const { id: rawId } = await params
  const id = extractContentId(rawId)
  const content = id ? await fetchContentDetail(id) : null

  const title = content?.title ?? 'CreatorHub'
  const subtitle = content?.creator
    ? `${content.creator.displayName}${content.city ? ` · ${content.city}` : ''}`
    : 'Travel stories worth saving'
  const cover = content?.coverImageUrl

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
            style={{
              position: 'absolute',
              inset: 0,
              objectFit: 'cover',
            }}
          />
        ) : null}
        {/* Dark gradient overlay for legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: cover
              ? 'linear-gradient(180deg, rgba(20,20,26,0.10) 0%, rgba(20,20,26,0.78) 100%)'
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
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              creator<span style={{ fontStyle: 'italic', fontWeight: 500 }}>hub</span>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#E15A41',
              }}
            >
              {(content?.type ?? 'story').toUpperCase()}
            </span>
            <h1
              style={{
                fontSize: 72,
                fontWeight: 600,
                lineHeight: 1.05,
                margin: 0,
                maxWidth: 1000,
                letterSpacing: '-0.02em',
              }}
            >
              {title.length > 100 ? `${title.slice(0, 97)}…` : title}
            </h1>
            <p
              style={{
                fontSize: 28,
                margin: 0,
                opacity: 0.92,
              }}
            >
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    ) as any,
    { ...size },
  )
}
