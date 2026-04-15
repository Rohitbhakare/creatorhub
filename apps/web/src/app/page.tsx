import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'CreatorHub — Travel Stories & Experiences by Local Creators',
  description:
    'Discover authentic travel stories, book unique experiences, and connect with local creators across India. Download the CreatorHub app.',
  openGraph: {
    title: 'CreatorHub — Travel Stories & Experiences by Local Creators',
    description:
      'Discover authentic travel stories, book unique experiences, and connect with local creators across India.',
    type: 'website',
  },
}

const APP_STORE_URL = 'https://apps.apple.com/app/creatorhub'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=in.creatorhub'

const FEATURES = [
  {
    icon: '📖',
    title: 'Authentic Stories',
    description:
      'Read travel stories from creators who have actually been there — not generic listicles, but real experiences.',
  },
  {
    icon: '🗺️',
    title: 'Book Experiences',
    description:
      'Find and book curated experiences, itineraries, and events led by trusted local creators.',
  },
  {
    icon: '🤝',
    title: 'Meet Local Creators',
    description:
      'Follow creators who know the places you want to visit. Get tips, itineraries, and insider knowledge.',
  },
]

const CONTENT_TYPES = [
  {
    label: 'Posts',
    description: 'Short travel stories, tips, and moments from the road.',
    badge: 'Free',
    badgeColor: '#1D9E75',
  },
  {
    label: 'Itineraries',
    description: 'Day-by-day travel plans you can follow at your own pace.',
    badge: 'Free & Paid',
    badgeColor: '#6B6660',
  },
  {
    label: 'Experiences',
    description: 'Scheduled group experiences led in person by a local creator.',
    badge: 'Paid',
    badgeColor: '#E15A41',
  },
  {
    label: 'Events',
    description: 'One-off gatherings, meetups, and special occasions.',
    badge: 'Free & Paid',
    badgeColor: '#6B6660',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-linen)' }}>
      {/* Top Bar */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: '#E5E0D7' }}
      >
        <span className="font-serif text-2xl font-bold" style={{ color: '#2C2823' }}>
          CreatorHub
        </span>
        <nav className="flex items-center gap-4 text-sm" style={{ color: '#6B6660' }}>
          <Link href="/terms" className="hover:underline hidden sm:inline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline hidden sm:inline">
            Privacy
          </Link>
          <a
            href={APP_STORE_URL}
            className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#E15A41' }}
          >
            Download App
          </a>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="px-6 py-16 md:py-24 text-center max-w-3xl mx-auto">
          <h1
            className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-6"
            style={{ color: '#2C2823', lineHeight: '1.18' }}
          >
            Travel stories, real experiences.
          </h1>
          <p className="text-lg md:text-xl leading-relaxed mb-10" style={{ color: '#6B6660' }}>
            Discover and book with creators who&rsquo;ve been there. Authentic guides, curated
            itineraries, and live experiences — all in one place.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <a
              href={APP_STORE_URL}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E15A41' }}
            >
              Download on App Store
            </a>
            <a
              href={PLAY_STORE_URL}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold border transition-opacity hover:opacity-80"
              style={{ borderColor: '#2C2823', color: '#2C2823', backgroundColor: '#FFFFFF' }}
            >
              Get on Google Play
            </a>
          </div>
        </section>

        {/* Features Section */}
        <section
          className="py-16 px-6 border-t"
          style={{ borderColor: '#E5E0D7', backgroundColor: '#F2EEE8' }}
        >
          <div className="max-w-4xl mx-auto">
            <h2
              className="font-serif text-3xl font-semibold text-center mb-10"
              style={{ color: '#2C2823' }}
            >
              Why CreatorHub?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl p-6 border"
                  style={{ borderColor: '#E5E0D7', backgroundColor: '#FFFFFF' }}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#2C2823' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B6660' }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content Types Showcase */}
        <section className="py-16 px-6 border-t" style={{ borderColor: '#E5E0D7' }}>
          <div className="max-w-4xl mx-auto">
            <h2
              className="font-serif text-3xl font-semibold text-center mb-3"
              style={{ color: '#2C2823' }}
            >
              Everything you need to travel better
            </h2>
            <p className="text-center text-base mb-10" style={{ color: '#9C9689' }}>
              Four content types designed for the whole travel journey.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CONTENT_TYPES.map((ct) => (
                <div
                  key={ct.label}
                  className="flex items-start gap-4 p-5 rounded-2xl border"
                  style={{ borderColor: '#E5E0D7', backgroundColor: '#FFFFFF' }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-semibold" style={{ color: '#2C2823' }}>
                        {ct.label}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: ct.badgeColor + '1A', color: ct.badgeColor }}
                      >
                        {ct.badge}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#6B6660' }}>
                      {ct.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* App Download CTA */}
        <section
          className="py-16 px-6 text-center border-t"
          style={{ borderColor: '#E5E0D7', backgroundColor: '#F2EEE8' }}
        >
          <div className="max-w-lg mx-auto">
            <h2
              className="font-serif text-3xl font-semibold mb-3"
              style={{ color: '#2C2823' }}
            >
              Ready to explore?
            </h2>
            <p className="text-base mb-8" style={{ color: '#6B6660' }}>
              Download CreatorHub and start following creators who inspire your next journey.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <a
                href={APP_STORE_URL}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#E15A41' }}
              >
                App Store
              </a>
              <a
                href={PLAY_STORE_URL}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold border transition-opacity hover:opacity-80"
                style={{ borderColor: '#2C2823', color: '#2C2823', backgroundColor: '#FFFFFF' }}
              >
                Google Play
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t" style={{ borderColor: '#E5E0D7' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif text-lg font-bold" style={{ color: '#2C2823' }}>
            CreatorHub
          </span>
          <div className="flex items-center gap-6 text-xs" style={{ color: '#9C9689' }}>
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/community-guidelines" className="hover:underline">
              Community Guidelines
            </Link>
          </div>
          <p className="text-xs" style={{ color: '#9C9689' }}>
            &copy; {new Date().getFullYear()} CreatorHub
          </p>
        </div>
      </footer>
    </div>
  )
}
