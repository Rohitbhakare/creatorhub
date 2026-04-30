# CLAUDE.md — Web (Next.js)

> Context for AI sessions working on the web app. Read `.claude/instructions/ui-ux.md` and `docs/01_wireframes/v3/WEB-DESIGN-SYSTEM.md` before writing any UI code.

## What This App Is

The full-feature web client for CreatorHub. SRS v1.5 expanded the M0 "minimal SSR pages only" scope to **full feature parity with mobile** plus two web-only surfaces (gamification, immersive storytelling). 97 web FRs land across 14 sub-domains in the **M2.5 Web v3 Parity** epic series (E5.0 → E5.8) — see `docs/epics/TRACKING.md`.

## In Scope (SRS v1.5)

Authenticated home feed · 13-filter discover · Cmd/Ctrl+K search overlay · immersive content reader (Magazine + Compact modes) · 4-step booking flow + Razorpay desktop hosted page · creator studio (analytics + content + bookings + reviews + payouts) · publishing wizard (4 content types) · KYC web flow · profile + settings · notification centre + web push · saved + social actions · gamification (quests/streaks/levels/leaderboard) · Framer Motion-driven page transitions and microinteractions.

## Out of Scope (web V2)

Native apps · PWA install / offline · multi-currency / i18n · web DMs (deep-link to mobile) · real-time collaborative editing in publishing.

## Routes

| Route | Owner epic | Notes |
|-------|-----------|-------|
| `/` | E5.1 | Magazine home — chapter hero + bento + right-rail dock |
| `/discover`, `/discover/results` | E5.2 | Cmd+K search + 13-filter drawer |
| `/content/[id]` | E5.3 | Magazine + Compact reader |
| `/u/[username]` | E2.10 (DONE) | Creator mini-site — SSR, public, JSON-LD |
| `/booking/[intentId]`, `/bookings` | E5.4 | 4-step desktop wizard |
| `/publish`, `/publish/[type]` | E5.5 | TipTap composer |
| `/signin`, `/signup`, `/forgot-password` | E5.6 | 3-tab auth + OAuth + OTP |
| `/onboarding/*` | E5.6 | Welcome → city → sub-cats |
| `/studio/*` | E5.7 | Dashboard + content + bookings + reviews + payouts + settings + KYC |
| `/you` | E5.7 | Profile + settings |
| `/quests`, `/notifications`, `/saved` | E5.8 | Gam + notif + saved tabs |
| `/terms`, `/privacy`, `/community-guidelines` | E2.10 (DONE) | Legal markdown |
| `/admin/*` | E2.8 | Admin panel — protected, server-rendered |

## Stack

- **Framework:** Next.js 15+ App Router (TypeScript)
- **Styling:** Tailwind CSS v4 + CSS custom properties (`globals.css`)
- **Fonts:** `next/font/google` — Inter (sans) + Fraunces (serif)
- **Motion:** `framer-motion@12` — orchestration only, code-split per route (WEB-MOTION-FR-100)
- **Data:** Server components fetch from Hono API; mutations via Server Actions
- **Rendering:** SSR by default; `"use client"` is permitted where motion or interaction requires it (WEB-A11Y-FR-105 reduced-motion gate, optimistic UI, Cmd+K palette, etc.)

## Key Rules

- Pages are Server Components by default; opt-in to `"use client"` only when an interactive primitive (motion, form state, refs) needs it
- `generateMetadata()` on every public-facing page for SEO
- JSON-LD structured data on content detail + creator mini-site pages
- All data fetching server-side via `fetch()` to the Hono API; never expose API keys client-side
- Mutations use Server Actions; CSRF defense lives in `middleware.ts` (WEB-NFR-008)
- Performance targets: LCP < 2.0s, INP < 200ms, CLS < 0.05, JS bundle ≤ 180KB gzip per route (WEB-NFR-001..004)
- Coral usage strictly per `WEB-DESIGN-SYSTEM.md` 7-spot allow-list — out-of-list = blocking review issue
- A11y: WCAG 2.2 AA non-negotiable; `axe-core` 0 critical violations on every route the epic touches; `prefers-reduced-motion` respected on every animation; high-contrast media query strips coral except locked spots 1, 4, 5

## Reusable primitives (E5.0 — Web Foundation)

Use these instead of inlining classes / styles. See `docs/01_wireframes/v3/WEB-DESIGN-SYSTEM.md` §9.5 for the full index.

- `<Btn>`, `<BtnLink>` — three variants (primary / ink / ghost), three sizes, loading + leading/trailing icons
- `<Pill>`, `<Tag>` — status indicators, type labels, hashtags
- `<InitialAvatar>` — locked taupe gradient initials
- `<Ring>` — circular progress (coral fill = allow-list spot 6)
- `<XPChip>`, `<StreakChip>` — gamification chips
- `<PageShell>`, `<TwoColLayout>`, `<ReaderLayout>` — page-level layout wrappers
- `<ToastRegion>`, `pushToast()` — site-wide aria-live toast bus

Motion tokens live in `@/lib/motion`: `easing.easeOut/easeInOut/spring`, `secs(durationKey)`, `pageVariants` + `revealVariants` (with `…Reduced` counterparts), `transitionFor(reduced, key)`.

## File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (fonts, theme cookie, skip link, toast region)
│   ├── globals.css             # Tailwind + CSS vars + utility classes
│   ├── page.tsx                # / home (E5.1 rebuild)
│   ├── content/[id]/page.tsx   # Content detail (E5.3 rebuild)
│   ├── u/[username]/page.tsx   # Creator mini-site (E2.10 — DONE)
│   ├── …                       # See route table above
│   ├── sitemap.ts              # Dynamic sitemap.xml
│   └── robots.ts               # Public crawl rules
├── components/
│   ├── ui/                     # E5.0 primitives (Btn, Pill, Ring, layouts, toast)
│   ├── chrome/                 # WebHeader, RightRail, WebFooter, StudioSidebar
│   ├── content/, reader/, discover/, feed/, social/, auth/, a11y/
├── lib/
│   ├── motion.ts               # Motion tokens (E5.0)
│   ├── csrf.ts                 # CSRF helpers (E5.0)
│   ├── design-tokens.ts        # TS mirror of CSS vars
│   ├── api/, session, slug, theme, …
└── middleware.ts               # CSRF + auth gate + theme cookie + request id
```

## Running Locally

```bash
cd apps/web
pnpm dev      # starts on localhost:3004
pnpm test     # vitest run (widget + node tests)
pnpm typecheck
pnpm lint
```
