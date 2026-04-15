# E2.10 — Web Minimal — Tracking

> Status: **DONE**
> Detail per task lives here. Master dashboard: `docs/epics/TRACKING.md`.

---

## Status

| Field | Value |
|-------|-------|
| Epic | E2.10 Web Minimal |
| Milestone | M2 |
| Status | `DONE` |
| Plan approved | `[x]` Yes |
| Implementation started | `[x]` Yes |
| Implementation complete | `[x]` Yes |
| Committed | `[x]` Yes — commit `dev` branch |

---

## Task Status

| ID | Task | Agent | Status | Tests | Notes |
|----|------|-------|--------|-------|-------|
| T1 | `apps/web/src/lib/api.ts` (fetchCreatorProfile, fetchContentDetail — SSR helpers with Next.js cache) | Web | `DONE` | — | |
| T2 | Home page `/app/page.tsx` (static marketing, app store CTAs, featured content SSR) | Web | `DONE` | — | |
| T3 | Creator mini-site `/app/[vertical]/[username]/page.tsx` (SSR, OG tags, notFound()) | Web | `DONE` | — | |
| T4 | Content detail `/app/content/[id]/page.tsx` (OG tags for WhatsApp, "Open in App" CTA) | Web | `DONE` | — | |
| T5 | Legal pages `/terms`, `/privacy`, `/community-guidelines` (static MDX, last-updated date) | Web | `DONE` | — | |
| T6 | `sitemap.ts` + `robots.ts` (App Router sitemap + robots.txt generation) | Web | `DONE` | — | |

---

## Pre-Commit Checklist

- `[x]` All tests passing
- `[x]` `tsc --noEmit` — 0 errors
- `[x]` `flutter analyze` — 0 errors (N/A — Web epic)
- `[x]` API boots — `/healthz` 200
- `[x]` Flutter launches — no crash (N/A — Web epic)
- `[x]` Tracking updated

---

## Test Coverage

| File | Tests | Passing |
|------|-------|---------|
| Web SSR pages | — | `[x]` Type check only (no unit tests for static pages) |

---

## Notes

- Web is minimal MVP — SSR pages only. No client-side SPA features.
- OG image generation uses Next.js `ImageResponse` on Edge runtime for fast cold starts.
- Creator mini-site URL format: `/{vertical}/{username}` (e.g., `/travel/rohit`) — matches app deep link scheme.
- All API calls in SSR helpers use `next: { revalidate: 60 }` (1-min ISR cache).
