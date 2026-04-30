import type { MetadataRoute } from 'next'
import { apiFetchPublic } from '@/lib/api-client'
import { contentSlugId } from '@/lib/slug'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://creatorhub.in'

interface RawSitemapEntry {
  kind: 'content' | 'creator'
  id: string
  slug: string | null
  vertical: string | null
  username: string | null
  updatedAt: string
}

interface SitemapResponse {
  entries: RawSitemapEntry[]
}

/**
 * Dynamic sitemap. Static routes (home + legal + landing pages) plus every
 * public+published content page and every creator mini-site, fetched once
 * per build/revalidate from the API. Bots crawl this; search ranking
 * follows. The static routes are listed first so a temporary API failure
 * still yields a valid sitemap.
 */
export const revalidate = 3600 // 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/discover`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/creators`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/community-guidelines`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  let dynamic: MetadataRoute.Sitemap = []
  try {
    const data = await apiFetchPublic<SitemapResponse>('/api/v1/feed/sitemap', {
      next: { revalidate: 3600 },
    })
    if (data?.entries) {
      dynamic = data.entries.flatMap((entry): MetadataRoute.Sitemap => {
        const lastModified = parseDate(entry.updatedAt)
        if (entry.kind === 'content') {
          // We don't have the title here — pass empty so contentSlugId
          // falls through to the slug-or-id branch. Real titles get
          // baked into URLs at click-through time.
          const url = entry.slug
            ? `${BASE_URL}/content/${entry.slug}`
            : `${BASE_URL}/content/${contentSlugId('', entry.id, null)}`
          return [
            {
              url,
              lastModified,
              changeFrequency: 'weekly' as const,
              priority: 0.7,
            },
          ]
        }
        if (entry.username) {
          const vertical = entry.vertical ?? 'travel'
          return [
            {
              url: `${BASE_URL}/${vertical}/${entry.username}`,
              lastModified,
              changeFrequency: 'weekly' as const,
              priority: 0.6,
            },
          ]
        }
        return []
      })
    }
  } catch {
    // Sitemap should never 500. Static routes alone are still valid.
  }

  return [...staticRoutes, ...dynamic]
}

function parseDate(s: string | null | undefined): Date {
  if (!s) return new Date()
  const d = new Date(s)
  return isNaN(d.getTime()) ? new Date() : d
}
