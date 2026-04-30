import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://creatorhub.in'

/**
 * Allow public surfaces, disallow personal + auth-flow surfaces. Auth pages
 * (/signin /signup) are technically public HTML but we don't want them
 * crawled — they have no canonical content, just a form, and Google will
 * mark the site as low-value if it indexes form pages.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/saved',
          '/bookings',
          '/studio',
          '/publish',
          '/you',
          '/quests',
          '/notifications',
          '/onboarding',
          '/signin',
          '/signup',
          '/forgot-password',
          '/api/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
