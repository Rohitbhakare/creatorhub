# E5.0 — Web Foundation (v3 Reskin Series)

> **Series:** First epic in the M2.5 — Web v3 Parity series (E5.0 → E5.8).
> **Goal:** Land every reusable primitive, chrome shell, motion utility, design-token surface, and a11y wiring that the remaining 8 epics will depend on. **No screen rewrites in this epic.**
> **SRS refs:** WEB-MOTION-FR-100..105, WEB-A11Y-FR-106..110, WEB-NFR-001..011, WEB-AUTH-FR-021 (CSRF), DISC-FR-007 (sitemap)
> **Wireframes:** see §3
> **Depends on:** none (this epic is the dependency for E5.1..E5.8)
> **Master plan:** [`/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md`](/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md)

---

## 1. Overview

The Next.js web app at `apps/web/` has 32 routes scaffolded but doesn't match the v3 wireframes and doesn't yet implement the 97 web FRs added in SRS v1.5. Eight subsequent epics (E5.1 Home, E5.2 Discover, E5.3 Reader, E5.4 Booking, E5.5 Publish, E5.6 Auth, E5.7 KYC/Profile/Studio, E5.8 Gam/Notif) will rebuild each pack to match v3.

This epic ships the foundation those epics share: a primitive library (`<Btn>`, `<Pill>`, `<Tag>`, `<XPChip>`, `<StreakChip>`, `<Ring>`, `<InitialAvatar>`), layout primitives (`<PageShell>`, `<TwoColLayout>`, `<ReaderLayout>`), a motion token library (`lib/motion.ts`) with `useReducedMotion` gating, chrome alignment for `<WebHeader>` and `<RightRail>` per v3, a11y bedrock (skip link, focus-visible coral ring, `aria-live` toast region, axe-core CI), CSRF middleware, sitemap/robots, and a doc-sync pass (CLAUDE.md v2→v3 reference correction, `apps/web/CLAUDE.md` MVP-scope update).

Nothing visible to end users changes in this epic except the chrome polish — the value is enabling E5.1..E5.8 to ship cleanly.

---

## 2. SRS Requirements

| ID | Requirement | Notes / Scope Decisions |
|----|-------------|------------------------|
| WEB-MOTION-FR-100 | Add `framer-motion@11` to web; orchestration only, not layout; code-split per route | Lib lands; verified in `next build` |
| WEB-MOTION-FR-101 | Page transitions via `AnimatePresence` (fade + slide 8px, 220ms easeOut) | Existing `<PageTransition>` consumes new tokens |
| WEB-MOTION-FR-102 | Scroll reveals via `whileInView` (opacity 0→1, y 8→0, 180ms, stagger 40ms, max 8) | Existing `<ScrollReveal>` consumes new tokens |
| WEB-MOTION-FR-103 | Cursor microinteractions (card hover tilt ±2°, disabled on touch) | Token library exposes `tiltAngle`; consumers in E5.1+ |
| WEB-MOTION-FR-104 | Optimistic motion (animate success instantly, snap back on fail) | Pattern documented; consumers in E5.1+ |
| WEB-MOTION-FR-105 | Reduced-motion fallback gated by `useReducedMotion()` | Every motion variant gated; tested with DevTools emulation |
| WEB-A11Y-FR-106 | WCAG 2.2 AA; axe-core CI 0 critical | Script wired warn-only; tightens in E5.1 |
| WEB-A11Y-FR-107 | Keyboard shortcuts (`/`, `Cmd+K`, `J/K`, `?`) | Hooks landed; `Cmd+K` consumer in E5.2 |
| WEB-A11Y-FR-108 | `<main>`, `<nav>`, `<aside>` correct on every page; `aria-live="polite"` for toasts | Toast region in root layout |
| WEB-A11Y-FR-109 | Focus moves to `<h1>` on route change | Existing `<RouteFocus>` verified |
| WEB-A11Y-FR-110 | Reduced-motion + high-contrast media queries respected; high-contrast strips coral except locked spots 1, 4, 5 | CSS + token enforcement |
| WEB-NFR-001..005 | LCP < 2.0s p75, INP < 200ms, CLS < 0.05, JS bundle < 180KB gzip per route, TTFB < 400ms | Baselines captured; not all targets met yet |
| WEB-NFR-006 | Responsive breakpoints (<768 / 768-1079 / 1080-1439 / 1440-1919 / ≥1920) | Layout primitives enforce |
| WEB-NFR-007 | httpOnly Secure SameSite=Lax session cookie; 30-day rolling, idle 24h | Already E0.3; verified |
| WEB-NFR-008 | CSRF double-submit cookie + Origin header check on mutating Server Actions | New `apps/web/middleware.ts` |
| WEB-NFR-009 | Cloudflare rate limits (60r/min unauth · 600/60 authed) | Already provisioned at edge; doc only |
| WEB-AUTH-FR-021 | CSRF defense | Implemented via WEB-NFR-008 middleware |
| DISC-FR-007 | SEO for public pages (sitemap.xml) | New `apps/web/src/app/sitemap.ts` + `robots.ts` |

---

## 3. Wireframes Referenced

| Wireframe file | Relevant section / component | What to verify |
|----------------|------------------------------|----------------|
| `docs/01_wireframes/v3/project/pack-w-chrome.jsx` | WHeader, WBtn, WPhoto, WAvatar, WPill | Top-nav layout, search-pill width, user-menu placement, notifications bell, theme indicator stub |
| `docs/01_wireframes/v3/project/components-primitives.jsx` | Btn, Pill, Tag, XPChip, StreakChip, Ring, Avatar | Variant matrix, padding, radii, hover states |
| `docs/01_wireframes/v3/project/components-chrome.jsx` | TopNav, BottomNav, Sheet | Mobile-web parity for tablet < 768px |
| `docs/01_wireframes/v3/project/design-system.jsx` | Token matrix (themes × type × coral × radii × density) | Confirm CSS vars + TS mirror match wireframe expectations |
| `docs/01_wireframes/v3/project/pack-ds-reference.jsx` | DS reference page | Use as oracle for visual sampling matrix |
| `docs/01_wireframes/v3/project/CreatorHub Redesign (standalone).html` | Intro section + DS reference at bottom | Live render; cross-check at 5 breakpoints |
| `docs/01_wireframes/v3/WEB-DESIGN-SYSTEM.md` | All sections | Living source-of-truth — already in repo |

---

## 4. Dependencies

| Dependency | Type | Status | What we need from it |
|------------|------|--------|----------------------|
| E0.4 / E0.4b Design System | Epic | DONE | Color tokens, type scales — already exposed in `globals.css` + `design-tokens.ts` |
| E0.3 Authentication | Epic | DONE | Session cookie attrs (httpOnly Secure SameSite=Lax) — verified, not changed |
| E2.10 Web Minimal | Epic | DONE | Existing route shells, JSON-LD, OG metadata pattern |
| Cloudflare WAF / rate limits | Infra | LIVE | Edge rate limits already enforced (60/10 unauth · 600/60 authed) |

No new external dependencies. `framer-motion@11` added to `apps/web/package.json` only.

---

## 5. Architecture Decisions

| Decision | Chosen approach | Rejected alternative | Rationale |
|----------|----------------|---------------------|-----------|
| Motion library | `framer-motion@11` | `motion-one` (lighter), `react-spring`, hand-rolled CSS | SRS-locked (WEB-MOTION-FR-100); ecosystem familiarity; orchestration features (`AnimatePresence`, `useScroll`) needed by E5.3 reader |
| Primitive lib structure | Wrapper components on existing `ch-*` CSS classes | Headless-UI / Radix wholesale | Existing CSS-token system already covers visual surface; primitives only add a typed React API |
| CSRF strategy | Double-submit cookie + Origin header check, edge middleware | Synchronizer token + per-action token | Simpler; no state; matches WEB-AUTH-FR-021 spec verbatim |
| Layout primitives | `<PageShell>` + `<TwoColLayout>` + `<ReaderLayout>` (component-level) | Tailwind utility classes only | Component-level lets us version layout changes and run prop validation; complementary to existing `ch-page-grid` etc. |
| Sitemap generation | Next.js `app/sitemap.ts` static export at build | Dynamic SSR sitemap per request | Routes are stable; rebuild on deploy; simpler |
| axe-core in CI | warn-only in E5.0; blocking from E5.1 onward | block from day 1 | Pre-existing legacy violations exist; need a "clean from new code" baseline first |

---

## 6. Database

No DB changes. This epic is pure web/lib work.

---

## 7. API Contract

No API changes. New CSRF middleware reads cookies + Origin header, no new endpoints. Sitemap reads existing public-content endpoints.

---

## 8. Test Plan

| Layer | Coverage | Tooling |
|-------|----------|---------|
| Unit (primitives) | Snapshot per primitive variant | Vitest + React Testing Library |
| Unit (motion) | `useReducedMotion` gate behavior | Vitest |
| Integration (CSRF) | Mutation without cookie → 403; with cookie + matching Origin → 200 | Vitest + Next.js test route |
| Integration (sitemap) | Lists all public routes; excludes /admin and authed routes | Vitest |
| A11y | axe-core scan on `/` and `/u/:username` (legacy routes) | `pnpm exec axe http://localhost:3004/...` (manual, CI later) |
| Bundle | `pnpm build` output captured in tracking.md | Next.js bundle analyzer |
| Visual | Screenshot at 5 breakpoints of `/`, `/u/:username` (no expected diff except chrome polish) | Manual + commit to `screens/` |
| Boot | `pnpm dev` → `localhost:3004` 200 | Manual |

Coverage gate: 70%+ on `lib/motion.ts` and primitives; SSR tests for sitemap/robots.

---

## 9. Edge Cases

- SSR/CSR theme-cookie hydration mismatch on first request
- `prefers-reduced-motion` toggled mid-animation (must downgrade live)
- Focus trap when keyboard-only Tab from URL bar (skip link must be the first focusable target)
- CSRF cookie missing on first-ever request (set on response; verify next mutation succeeds)
- CSRF cookie name conflict with Razorpay/Firebase cookies (verify before name)
- Theme-cookie absence → falls back to Paper theme without flash
- axe pre-existing violations in legacy routes (separate from new primitives — must not block)
- Bundle scan false-positives on env-var names that look like secrets

---

## 10. InfoSec Review

| Concern | Mitigation |
|---------|------------|
| CSRF on Server Actions | Double-submit cookie + Origin header check (this epic) |
| Click-jacking | `X-Frame-Options: DENY` header in `next.config.ts` |
| XSS | React escapes by default; flag any raw-HTML escape hatch in code review |
| Mixed content | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` |
| Referrer leakage | `Referrer-Policy: strict-origin-when-cross-origin` |
| 3rd-party permissions | `Permissions-Policy: camera=(), microphone=(), geolocation=(self)` |
| Inlined secrets in client bundle | CI scan after `pnpm build` greps `.next/static/**` for known secret patterns |
| CSP | `script-src 'self' 'nonce-{nonce}' https://checkout.razorpay.com https://*.firebaseio.com https://api.mapbox.com; ...` (per E5.4 / E5.6 / reader needs) |

OWASP-top-10 sweep handled by `/review-security` step.

---

## 11. Governance

- ADR drafted at `docs/engineering/adr/0001-framer-motion.md` (this epic)
- CLAUDE.md updated to point at v3 wireframes (this epic, T8)
- `apps/web/CLAUDE.md` MVP scope updated to reflect SRS v1.5 (this epic, T8)
- Coral CI lint rule landed warn-only (this epic; tightened in E5.3)
- WEB-DESIGN-SYSTEM.md gets new entries for Btn/Pill/Tag/XPChip/StreakChip/Ring/InitialAvatar primitives
- Master TRACKING.md gets a new "M2.5 — Web v3 Parity" section + 9 rows (E5.0..E5.8)

---

## 12. Tasks

See [tasks.md](tasks.md). Tracking lives in [tracking.md](tracking.md).

---

## 13. Definition of Done

- [ ] All 10 tasks (T1..T10) checked
- [ ] `pnpm --filter web typecheck` 0 errors
- [ ] `pnpm --filter web lint` 0 errors
- [ ] `pnpm --filter web test` green
- [ ] `pnpm --filter web build` succeeds; bundle deltas captured in tracking.md
- [ ] Web app boots: `pnpm dev` → `localhost:3004` renders home without runtime error
- [ ] axe-core scan: 0 critical violations on `/` and `/u/<username>`
- [ ] 4-step review gate passed (edge cases → security → architecture → code quality)
- [ ] tracking.md pre-commit checklist filled in
- [ ] Commit + push to `dev`
- [ ] Master TRACKING.md row updated to `DONE`
