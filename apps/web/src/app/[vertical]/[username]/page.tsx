import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchCreatorProfile, formatPrice } from '@/lib/api'

interface Props {
  params: Promise<{ vertical: string; username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const creator = await fetchCreatorProfile(username)

  if (!creator) {
    return { title: 'Creator not found' }
  }

  const bio = creator.bio ?? ''
  const description = bio.length > 160 ? bio.slice(0, 157) + '...' : bio

  return {
    title: `${creator.displayName} on CreatorHub`,
    description:
      description || `Discover travel experiences by ${creator.displayName} on CreatorHub.`,
    openGraph: {
      title: `${creator.displayName} on CreatorHub`,
      description:
        description || `Discover travel experiences by ${creator.displayName} on CreatorHub.`,
      images: creator.avatarUrl ? [creator.avatarUrl] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${creator.displayName} on CreatorHub`,
      description:
        description || `Discover travel experiences by ${creator.displayName} on CreatorHub.`,
    },
  }
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  itinerary: 'Itinerary',
  experience: 'Experience',
  event: 'Event',
}

export default async function CreatorMiniSitePage({ params }: Props) {
  const { vertical, username } = await params
  const creator = await fetchCreatorProfile(username)

  if (!creator) {
    notFound()
  }

  const deepLink = `creatorhub://creator/${username}`
  const appStoreUrl = 'https://apps.apple.com/app/creatorhub'
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=in.creatorhub'

  // Suppress unused variable warning — vertical is part of route but not used in UI
  void vertical

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

      {/* Hero — Cover */}
      <section className="relative">
        <div
          className="relative w-full h-48 md:h-64 overflow-hidden"
          style={{ backgroundColor: '#E5E0D7' }}
        >
          {creator.coverUrl ? (
            <Image
              src={creator.coverUrl}
              alt={`${creator.displayName} cover photo`}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: '#C9C3B6' }} />
          )}
        </div>

        {/* Avatar + Info */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="relative -mt-12 mb-4">
            <div
              className="w-24 h-24 rounded-full border-4 overflow-hidden"
              style={{ borderColor: 'var(--color-linen)', backgroundColor: '#E5E0D7' }}
            >
              {creator.avatarUrl ? (
                <Image
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-bold"
                  style={{ backgroundColor: '#C9C3B6', color: '#6B6660' }}
                >
                  {creator.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <h1 className="font-serif text-3xl font-bold leading-tight mb-1" style={{ color: '#2C2823' }}>
            {creator.displayName}
          </h1>
          <p className="text-sm mb-3" style={{ color: '#9C9689' }}>
            @{creator.username}
          </p>
          {creator.bio && (
            <p className="text-base leading-relaxed mb-5" style={{ color: '#6B6660' }}>
              {creator.bio}
            </p>
          )}

          {/* Stats Row */}
          <div
            className="flex items-center gap-6 py-4 border-t border-b"
            style={{ borderColor: '#E5E0D7' }}
          >
            <div className="text-center">
              <span className="block text-xl font-semibold" style={{ color: '#2C2823' }}>
                {creator.followerCount.toLocaleString('en-IN')}
              </span>
              <span className="text-xs" style={{ color: '#9C9689' }}>
                Followers
              </span>
            </div>
            <div className="w-px h-8" style={{ backgroundColor: '#E5E0D7' }} />
            <div className="text-center">
              <span className="block text-xl font-semibold" style={{ color: '#2C2823' }}>
                {creator.contentCount.toLocaleString('en-IN')}
              </span>
              <span className="text-xs" style={{ color: '#9C9689' }}>
                Posts
              </span>
            </div>
            {creator.averageRating !== null && creator.averageRating > 0 && (
              <>
                <div className="w-px h-8" style={{ backgroundColor: '#E5E0D7' }} />
                <div className="text-center">
                  <span className="block text-xl font-semibold" style={{ color: '#2C2823' }}>
                    {creator.averageRating.toFixed(1)}&nbsp;★
                  </span>
                  <span className="text-xs" style={{ color: '#9C9689' }}>
                    Rating
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Content Grid */}
      {creator.content && creator.content.length > 0 && (
        <section className="max-w-2xl mx-auto px-4 py-6">
          <h2 className="font-serif text-2xl font-semibold mb-4" style={{ color: '#2C2823' }}>
            Content
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {creator.content.map((item) => (
              <Link
                key={item.id}
                href={`/content/${item.id}`}
                className="group rounded-xl overflow-hidden border transition-shadow hover:shadow-md"
                style={{ borderColor: '#E5E0D7', backgroundColor: '#FFFFFF' }}
              >
                <div className="relative w-full aspect-video" style={{ backgroundColor: '#E5E0D7' }}>
                  {item.coverImageUrl ? (
                    <Image
                      src={item.coverImageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full" style={{ backgroundColor: '#C9C3B6' }} />
                  )}
                  <span
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: '#2C2823', color: '#FAF7F4' }}
                  >
                    {CONTENT_TYPE_LABELS[item.type] ?? item.type}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold line-clamp-2 mb-1" style={{ color: '#2C2823' }}>
                    {item.title}
                  </p>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: item.isFree ? '#1D9E75' : '#E15A41' }}
                  >
                    {formatPrice(item.priceInPaisa, item.isFree)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* App Download Footer */}
      <footer className="mt-8 py-10 px-4 text-center border-t" style={{ borderColor: '#E5E0D7' }}>
        <p className="font-serif text-xl font-semibold mb-2" style={{ color: '#2C2823' }}>
          Discover more on the app
        </p>
        <p className="text-sm mb-6" style={{ color: '#9C9689' }}>
          Follow {creator.displayName} and book experiences directly.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <a
            href={appStoreUrl}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition-opacity hover:opacity-80"
            style={{ borderColor: '#2C2823', color: '#2C2823', backgroundColor: '#FFFFFF' }}
          >
            App Store
          </a>
          <a
            href={playStoreUrl}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#2C2823' }}
          >
            Google Play
          </a>
        </div>
        <div className="mt-8 pt-6 border-t" style={{ borderColor: '#E5E0D7' }}>
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
        </div>
      </footer>
    </div>
  )
}
