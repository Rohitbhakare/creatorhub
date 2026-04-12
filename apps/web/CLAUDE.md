# CLAUDE.md — Web (Next.js)

> Context for AI sessions working on the web app. Read `.claude/instructions/ui-ux.md` before writing any UI code.

## What This App Is

Minimal SSR web presence for CreatorHub. MVP scope is public/SEO pages only.

## MVP Scope (what exists here)

| Route | Description |
|-------|-------------|
| `/` | Public home page |
| `/[vertical]/[username]` | Creator mini-site (SSR) |
| `/content/[id]` | Content detail page (SSR, for SEO/WhatsApp sharing) |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |
| `/community-guidelines` | Community guidelines |
| `/admin/*` | Admin panel (protected, server-rendered) — E2.8 |

**NOT in MVP web:** Feed, auth, booking, studio, profile editing, settings → V1

## Stack

- **Framework:** Next.js 15+ App Router (TypeScript)
- **Styling:** Tailwind CSS v4
- **Fonts:** `next/font/google` — Inter (sans) + Fraunces (serif)
- **Data:** Server components fetch from Hono API — no client-side fetching in MVP
- **Rendering:** SSR only — never `"use client"` in MVP pages

## Key Rules

- Every page is a React Server Component (no `"use client"`)
- All data fetching in `page.tsx` via `fetch()` to the Hono API
- `generateMetadata()` on every page for SEO
- JSON-LD structured data on content detail + creator mini-site pages
- LCP target: < 2.5s (measure with Vercel Analytics)

## File Structure

```
src/
└── app/
    ├── layout.tsx                        # Root layout (fonts, metadata)
    ├── globals.css                       # Tailwind + CSS variables
    ├── page.tsx                          # / — home page
    ├── [vertical]/[username]/page.tsx    # Creator mini-site
    ├── content/[id]/page.tsx             # Content detail
    ├── terms/page.tsx
    ├── privacy/page.tsx
    ├── community-guidelines/page.tsx
    └── admin/                            # E2.8 — admin panel
```

## Running Locally

```bash
cd apps/web
pnpm dev    # starts on localhost:3001
```
