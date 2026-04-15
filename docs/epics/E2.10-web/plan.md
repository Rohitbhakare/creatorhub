# E2.10 — Web (Minimal MVP: SSR Pages)

> **SRS refs:** WEB-FR-001–013, DISC-FR-007
> **Wireframe refs:** Screen 09 (mini-site desktop), Screen 10 (home page)
> **Depends on:** E1.6 (profiles), E1.2 (posts — content to display)
> **Platform:** Next.js 14+ App Router (TypeScript)
> **Scope:** SSR-only. No auth, no interactive features. SEO + WhatsApp preview cards.

---

## Market Research — Creator Landing Pages

### Linktree / Bento.me
- **Simple:** Photo + bio + links grid. Fast loading. Clean design.
- **SEO:** Minimal — mostly just the creator's name and links.

### Substack / Medium
- **SSR:** Author pages are server-rendered. Full content list. OG metadata for social sharing.
- **Performance:** Fast — ISR with 60s revalidation.

### Airbnb Host Pages
- **Rich:** Photo, bio, reviews, listings. Trust signals (identity verified, response rate).
- **Structured data:** Schema.org Person + TouristTrip.

### CreatorHub Approach
- **Creator mini-site:** `/{vertical}/{username}` — SSR with ISR (60s). Hero with avatar + bio + stats. Content grid with filter tabs. Trust signals section. Structured data + OG metadata.
- **Home page:** `/` — Marketing page. Featured creators + trips. How it works. Creator CTA.
- **Content detail pages:** `/posts/:slug`, `/itineraries/:slug`, `/events/:slug` — SSR for WhatsApp preview cards + SEO.
- **Legal pages:** `/terms`, `/privacy`, `/community-guidelines`.

---

## Task Breakdown

| ID | Task | Platform | Est. Tests |
|----|------|----------|-----------|
| T1 | Creator mini-site SSR page (`/{vertical}/{username}`) | Web | — |
| T2 | Mini-site hero section (avatar, bio, stats, trust signals) | Web | — |
| T3 | Mini-site content grid with filter tabs + counts | Web | — |
| T4 | Mini-site responsive breakpoints (desktop/tablet/mobile) | Web | — |
| T5 | Mini-site sticky header on mobile (< 640px) | Web | — |
| T6 | Public home page SSR (`/`) | Web | — |
| T7 | Home page sections (hero, featured creators, featured trips, how it works, CTA) | Web | — |
| T8 | Content detail SSR pages (post, itinerary, event) | Web | — |
| T9 | OG metadata + Schema.org structured data (all pages) | Web | — |
| T10 | Legal pages (terms, privacy, community guidelines) | Web | — |
| T11 | Sitemap.xml generation | Web | — |
| T12 | Core Web Vitals optimization (LCP < 2.5s, CLS < 0.1) | Web | — |
| T13 | API endpoints for public SSR data (creator profile, content list, featured) | API | ~10 |

**Estimated total: ~10 API tests** (most web pages consume existing API endpoints)

## Definition of Done

- [ ] Creator mini-site renders at `/{vertical}/{username}`
- [ ] Home page renders at `/` with featured content
- [ ] Content detail pages render with OG metadata (WhatsApp previews work)
- [ ] Legal pages live
- [ ] Sitemap.xml generated
- [ ] Core Web Vitals: LCP < 2.5s
- [ ] Responsive: 3 breakpoints working
- [ ] Structured data validates in Google Rich Results Test
