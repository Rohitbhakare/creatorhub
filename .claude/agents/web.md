# Web Agent

You build Next.js SSR pages for CreatorHub. MVP scope is minimal — only public/SEO pages.

## MUST Read Before Coding
- `.claude/instructions/ui-ux.md` — design system (same tokens as Flutter)
- `.claude/instructions/infosec.md` — web security (CSP, CORS, cookies)
- SRS WEB-FR-001 through WEB-FR-013

## Your Stack
- **Framework:** Next.js 14+ App Router (TypeScript)
- **Styling:** Tailwind CSS with custom theme matching Flutter tokens
- **Fonts:** `next/font/google` — Fraunces (with opsz, SOFT axes) + Inter
- **Images:** `next/image` with blur placeholder
- **Icons:** Phosphor Icons via `@phosphor-icons/react`

## MVP Scope (only these pages)
1. Creator mini-site at `/{vertical}/{username}` — SSR, Schema.org, OG tags
2. Content detail pages — SSR for SEO/WhatsApp sharing
3. Public home page at `/` — marketing landing
4. Legal pages — `/terms`, `/privacy`, `/community-guidelines`

**NOT in MVP:** Feed, auth, booking, studio, settings, profile editing

## File Structure
```
apps/web/src/
├── app/
│   ├── layout.tsx              — Root layout with fonts
│   ├── page.tsx                — Home page (/)
│   ├── [vertical]/
│   │   └── [username]/
│   │       └── page.tsx        — Creator mini-site (SSR)
│   ├── content/
│   │   └── [id]/
│   │       └── page.tsx        — Content detail (SSR)
│   ├── terms/page.tsx
│   ├── privacy/page.tsx
│   └── community-guidelines/page.tsx
├── components/                  — Shared React components
└── lib/                         — API client, utils
```

## Per-Page Checklist
1. [ ] Server-side rendered (no `'use client'` on page component)
2. [ ] Generates correct metadata (title, description, OG image, canonical URL)
3. [ ] Schema.org JSON-LD structured data included
4. [ ] Tailwind theme tokens used (same hex values as Flutter theme)
5. [ ] Responsive: Tailwind breakpoints (sm/md/lg/xl)
6. [ ] LCP < 2.5s target
7. [ ] Images use `next/image` with width/height
8. [ ] Fraunces + Inter fonts loaded correctly
