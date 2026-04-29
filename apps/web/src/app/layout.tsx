import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import { getTheme, getCoralHue } from '@/lib/theme'
import { RouteFocus } from '@/components/a11y/route-focus'
import { CommandPalette } from '@/components/discover/command-palette'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: {
    default: 'CreatorHub — Travel Stories Worth Saving',
    template: '%s | CreatorHub',
  },
  description:
    'Discover authentic travel stories, itineraries, and live experiences from local creators across India. Save what inspires, book what calls.',
  metadataBase: new URL(process.env.SITE_URL ?? 'https://creatorhub.in'),
  applicationName: 'CreatorHub',
  generator: 'Next.js',
  openGraph: {
    type: 'website',
    siteName: 'CreatorHub',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@creatorhub_in',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: { canonical: '/' },
  formatDetection: { telephone: false, email: false, address: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0f12' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [theme, coral] = await Promise.all([getTheme(), getCoralHue()])

  return (
    <html
      lang="en"
      data-theme={theme}
      data-coral={coral}
      className={`${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body>
        <a href="#main-content" className="ch-skip-link">
          Skip to main content
        </a>
        <RouteFocus />
        <CommandPalette />
        {children}
      </body>
    </html>
  )
}
