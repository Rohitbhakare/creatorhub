import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchContentDetail, formatPrice } from '@/lib/api'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const content = await fetchContentDetail(id)

  if (!content) {
    return { title: 'Content not found' }
  }

  const description = content.description ?? content.body ?? ''
  const truncated = description.length > 160 ? description.slice(0, 157) + '...' : description

  return {
    title: content.title,
    description: truncated || `View this ${content.type} on CreatorHub.`,
    openGraph: {
      title: content.title,
      description: truncated || `View this ${content.type} on CreatorHub.`,
      images: content.coverImageUrl ? [content.coverImageUrl] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: truncated || `View this ${content.type} on CreatorHub.`,
      images: content.coverImageUrl ? [content.coverImageUrl] : [],
    },
  }
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  itinerary: 'Itinerary',
  experience: 'Experience',
  event: 'Event',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function ContentDetailPage({ params }: Props) {
  const { id } = await params
  const content = await fetchContentDetail(id)

  if (!content) {
    notFound()
  }

  const deepLink = `creatorhub://content/${id}`
  const creatorProfileUrl = `/travel/${content.creator.username}`

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-linen)' }}>
      {/* Top Bar */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b"
        style={{ backgroundColor: 'var(--color-linen)', borderColor: '#E5E0D7' }}
      >
        <Link href="/" className="font-serif text-xl font-bold" style={{ color: '#2C2823' }}>
          CreatorHub
        </Link>
        <a
          href={deepLink}
          className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#E15A41' }}
        >
          Open in App
        </a>
      </header>

      <article className="max-w-2xl mx-auto">
        {/* Cover Image */}
        {content.coverImageUrl && (
          <div className="relative w-full" style={{ height: '300px', backgroundColor: '#E5E0D7' }}>
            <Image
              src={content.coverImageUrl}
              alt={content.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        )}

        <div className="px-4 py-6">
          {/* Type badge + price */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: '#2C2823', color: '#FAF7F4' }}
            >
              {CONTENT_TYPE_LABELS[content.type] ?? content.type}
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: content.isFree ? '#1D9E75' : '#E15A41' }}
            >
              {formatPrice(content.priceInPaisa, content.isFree)}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl font-bold leading-tight mb-4" style={{ color: '#2C2823' }}>
            {content.title}
          </h1>

          {/* Creator Row */}
          <div
            className="flex items-center justify-between py-4 mb-4 border-t border-b"
            style={{ borderColor: '#E5E0D7' }}
          >
            <Link href={creatorProfileUrl} className="flex items-center gap-3 group">
              <div
                className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                style={{ backgroundColor: '#E5E0D7' }}
              >
                {content.creator.avatarUrl ? (
                  <Image
                    src={content.creator.avatarUrl}
                    alt={content.creator.displayName}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: '#C9C3B6', color: '#6B6660' }}
                  >
                    {content.creator.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold group-hover:underline" style={{ color: '#2C2823' }}>
                  {content.creator.displayName}
                </p>
                <p className="text-xs" style={{ color: '#9C9689' }}>
                  @{content.creator.username}
                </p>
              </div>
            </Link>
            <Link
              href={creatorProfileUrl}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-opacity hover:opacity-80"
              style={{ borderColor: '#2C2823', color: '#2C2823' }}
            >
              View Profile
            </Link>
          </div>

          {/* Dates for scheduled content */}
          {(content.startsAt || content.endsAt) && (
            <div
              className="flex items-center gap-4 py-3 px-4 rounded-xl mb-4"
              style={{ backgroundColor: '#F2EEE8' }}
            >
              {content.startsAt && (
                <div>
                  <p className="text-xs" style={{ color: '#9C9689' }}>
                    Starts
                  </p>
                  <p className="text-sm font-semibold" style={{ color: '#2C2823' }}>
                    {formatDate(content.startsAt)}
                  </p>
                </div>
              )}
              {content.startsAt && content.endsAt && (
                <div className="w-px h-8" style={{ backgroundColor: '#C9C3B6' }} />
              )}
              {content.endsAt && (
                <div>
                  <p className="text-xs" style={{ color: '#9C9689' }}>
                    Ends
                  </p>
                  <p className="text-sm font-semibold" style={{ color: '#2C2823' }}>
                    {formatDate(content.endsAt)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Body / Description */}
          {content.type === 'post' && content.body ? (
            <div
              className="text-base leading-relaxed whitespace-pre-wrap font-serif mb-6"
              style={{ color: '#2C2823', lineHeight: '1.65' }}
            >
              {content.body}
            </div>
          ) : content.description ? (
            <p className="text-base leading-relaxed mb-6" style={{ color: '#6B6660' }}>
              {content.description}
            </p>
          ) : null}

          {/* CTA */}
          <div
            className="py-6 mt-4 border-t text-center"
            style={{ borderColor: '#E5E0D7' }}
          >
            <p className="text-sm mb-4" style={{ color: '#9C9689' }}>
              {content.isFree
                ? 'Open the app to read more and follow this creator.'
                : 'Book this experience on the CreatorHub app.'}
            </p>
            <a
              href={deepLink}
              className="inline-block px-8 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E15A41' }}
            >
              {content.isFree ? 'Read more in App' : 'Book on CreatorHub'}
            </a>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="py-6 px-4 text-center border-t" style={{ borderColor: '#E5E0D7' }}>
        <div className="flex justify-center gap-4 text-xs" style={{ color: '#9C9689' }}>
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/community-guidelines" className="hover:underline">
            Community Guidelines
          </Link>
        </div>
        <p className="mt-3 text-xs" style={{ color: '#9C9689' }}>
          &copy; {new Date().getFullYear()} CreatorHub. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
