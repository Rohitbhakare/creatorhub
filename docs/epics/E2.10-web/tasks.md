# E2.10 — Web Minimal — Tasks

> Epic status: **DONE**
> Plan: `docs/epics/E2.10-web/plan.md`

---

## Task Breakdown

| ID | Task | Platform | Description |
|----|------|----------|-------------|
| T1 | `apps/web/src/lib/api.ts` | Web | SSR helper functions: `fetchCreatorProfile`, `fetchContentDetail` — server-side API calls with Next.js `cache()` and `revalidate` tags |
| T2 | Home page `/app/page.tsx` | Web | Static marketing landing page — value prop, app store CTAs, featured content grid (SSR) |
| T3 | Creator mini-site `/app/[vertical]/[username]/page.tsx` | Web | SSR — creator profile, pinned content, OG tags (og:title, og:image, og:description), `notFound()` on 404 |
| T4 | Content detail `/app/content/[id]/page.tsx` | Web | SSR — experience/itinerary detail, OG tags optimised for WhatsApp share preview, "Open in App" CTA |
| T5 | Legal pages | Web | `/terms`, `/privacy`, `/community-guidelines` — static MDX pages with last-updated date |
| T6 | `sitemap.ts` + `robots.ts` | Web | Next.js 14 App Router sitemap and robots.txt generation; includes creator mini-sites and content pages |

---

## Notes

- No mobile screens for this epic — Web only (Next.js).
- SSR pages must return correct HTTP status codes (200/404) for SEO.
- OG image generation uses Next.js `ImageResponse` (Edge runtime).
