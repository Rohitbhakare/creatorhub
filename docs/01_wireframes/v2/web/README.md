# CreatorHub Web Wireframes — v1.5

> **Companion to:** `docs/01_wireframes/v2/project/` (mobile packs A–J).
> **SRS source of truth:** `docs/00_SRS/v1.5/srs-v1.5-delta.md` (extends `v1.2/srs-v1.2.md` §4.16 WEB).
> **Status:** Wireframes only — no application code in `apps/web/` is changed by this work.

---

## What this is

The complete desktop + tablet + mobile-web wireframe pack for the authenticated CreatorHub web application — covering full feature parity with mobile (auth, feed, discover, immersive reader, booking, creator studio, publishing wizard, KYC, profile, social) plus two web-first surfaces (gamification + storytelling).

Twelve packs (W1–W12), four standalone showpieces, three shared module files, and one master canvas — all loadable in any modern browser by double-clicking from Finder. No build step. No server.

---

## Packs at a glance

| # | Pack | What it covers | Screens |
|---|---|---|---|
| W1 | Marketing & SEO | Public landing, mini-site, content detail (guest), legal, SEO debug | 5 |
| W2 | Auth & Onboarding | Sign-up, sign-in, magic-link, OTP, sub-cat picker, city, welcome, password reset | 8 |
| W3 | Home Feed | Cold-start, default authed, Following, Posts, sub-cat filtered, see-all, right-rail dock, hover/focus, breakpoint collapse | 10 |
| W4 | Discover & Search | Discover home, Cmd+K overlay, results, 13-filter drawer, chip row, empty, Places autocomplete, collection detail, city rail | 9 |
| **W5** | **Immersive Reader** ★ | Hero parallax, sticky day-nav + body + map, chapter cards, spot hover-expand, save microinteraction, map polyline, progress bar, pull-quotes, share-as-image, compact mode, print, reduced-motion, post/experience/event variants | **15** |
| W6 | Booking Flow | Date picker, pax + add-ons, review, Razorpay redirect, confirmation, failure, SSE seat update, my bookings, booking detail | 9 |
| W7 | Creator Studio | Dashboard, content list, content drawer, bookings table, booking drawer, reviews, payouts ledger, statement download, settings, KYC banner, empty studio, multi-tab broadcast | 12 |
| W8 | Publishing Wizard | Type picker, cover uploader, crop modal, details, body editor, day builder, Places autocomplete, review, preview iframe, confirmation, autosave states, type variants | 12 |
| W9 | Profile, Settings & KYC | Authed profile, settings shell, account, notifications, privacy, connected, travel prefs, danger, KYC start, PAN, selfie, status | 12 |
| W10 | Notifications, Saved, Social | Drawer slide-in, grouped list, push opt-in, saved tabs, follow optimistic, comments, share, empty | 9 |
| **W11** | **Gamification** ★ | Quests hero, ring states, flame states, level-up modal, achievements grid, unlock modal, leaderboard city + national, check-in burst, XP toasts, compact dock, reduced-motion | **12** |
| W12 | Motion Language Reference | Easings, durations, page transitions, list stagger, scroll reveals, cursor tilt, confetti, reduced-motion gating, cheat-sheet | 9 |

★ = showpiece pack (also has a standalone single-file HTML mockup)

**Total: ~120 screens across 12 packs.**

---

## How to open

### Master canvas (all packs)
Double-click [`CreatorHub Web Redesign.html`](./CreatorHub%20Web%20Redesign.html) from Finder. Renders all 12 packs scrollable in one canvas. React 18 + Babel standalone + Framer Motion 11, all loaded via CDN. No server needed.

### Standalone showpieces
Each opens as its own `file://` HTML, no server:

- [`standalone/reader-magazine.html`](./standalone/reader-magazine.html) — immersive itinerary reader
- [`standalone/gamification-quests.html`](./standalone/gamification-quests.html) — quests / streaks / leaderboard
- [`standalone/studio-dashboard.html`](./standalone/studio-dashboard.html) — creator studio analytics
- [`standalone/booking-flow.html`](./standalone/booking-flow.html) — 4-step booking wizard

---

## Tech stack (wireframe runtime)

```
React 18.3.1                — UMD via cdnjs
ReactDOM 18.3.1             — UMD via cdnjs
@babel/standalone 7.29.0    — JSX compilation in-browser
framer-motion 11            — esm.sh module + window.FramerMotion bridge
Inter + Fraunces            — Google Fonts CDN
```

Each `pack-w-*.jsx` is loaded via `<script type="text/babel">` in the master HTML. The master canvas wires Framer Motion to `window.FramerMotion` so JSX scripts can use `motion.div`, `AnimatePresence`, `useScroll`, etc. directly.

---

## Design system (web)

**Tokens** (extend mobile tokens in `project/design-system.jsx`):

| Token | Value | Usage |
|---|---|---|
| `--surface` | `#FAF7F4` | Page background (warm ivory) |
| `--surface-alt` | `#F2EEE8` | Inactive chips, hover backgrounds |
| `--hairline` | `#E5E0D7` | Dividers, card outlines |
| `--line` | `#C9C3B6` | Heavier dividers, sticky nav border |
| `--ink-soft` | `#9C9689` | Metadata, counts, placeholders |
| `--ink-muted` | `#6B6660` | Secondary body |
| `--ink` | `#2C2823` | Primary text, icons |
| `--coral` | `#E15A41` | Accent — locked to **7 contexts** (see below) |

**Typography:**
- **Fraunces** (display serif): titles, drop-caps, pull-quotes, stat numbers
- **Inter** (sans): body, labels, metadata

**Spacing:** 4px base grid. `--s-{xs,sm,md,lg,mlg,xl,xxl} = 4 / 8 / 12 / 16 / 20 / 24 / 32`

**Radii:** 12px cards/buttons/inputs · 20px modals/sheets · 999px pills/chips

---

## Coral lockdown — web (7 contexts)

Mobile is locked to 5 spots in v1.4. Web adds 2 web-only contexts (gamification + reading-progress are user-state indicators, not chrome). **Anywhere else → bug.**

1. **Primary CTAs** (book, publish, save changes, "Show N results")
2. **Active bookmark icon** (filled state)
3. **Location pin** (city pin chip, results destination indicators)
4. **Active nav indicator** (top-bar tab underline, sidebar active item)
5. **Critical unread signals** (notification badge, active-filter count)
6. **(Web only)** XP/streak progress fill + level-up burst — gamification surfaces only
7. **(Web only)** Reading-progress bar in immersive reader — content state, not chrome

Photography is exempt (covers, hero images). Initial avatars use the warm-neutral grayscale palette (no coral).

---

## Responsive grid

| Breakpoint | Range (px) | Cols | Gutter | Margin |
|---|---|---|---|---|
| Mobile | <768 | 4 | 16 | 16 |
| Tablet | 768–1079 | 8 | 20 | 32 |
| Desktop | 1080–1439 | 12 | 24 | 48 |
| Wide | 1440–1919 | 12 | 28 | 80 |
| Ultrawide | ≥1920 | 12 | 32 | 120 (max content 1640) |

---

## Motion language (Framer Motion 11)

**Easings:**
- `easeOut`: `[0.22, 1, 0.36, 1]` — most UI
- `easeInOut`: `[0.65, 0, 0.35, 1]` — drawers, modal scales
- `spring(280, 26)`: gentle (number-rolls, button press)
- `spring(180, 18)`: confetti, level-up

**Standard durations:**
| Tier | ms | Use |
|---|---|---|
| Microflick | 120 | hover, active, fill |
| Chips | 180 | tabs, toggles |
| Page | 220 | route transitions |
| Drawer | 300 | sheets, side panels |
| Hero | 480 | landing reveal |

**Patterns:**
- Page transition: `fadeSlide8` (opacity 0→1 + y 8→0, 220ms easeOut)
- Scroll reveal: `whileInView` once, 60% threshold (opacity 0→1 + y 12→0, stagger 40ms, max 8 items)
- Cursor tilt: `useMotionValue` x/y → ±2° rotate, damped 60ms, **disabled on touch**
- Reduced motion: every variant gated by `useReducedMotion()` → instant state

**Bundle discipline:** Framer Motion is code-split per route in the real Next.js app (WEB-NFR-004 = 180 KB JS budget). For wireframes, we load it once globally via the master canvas.

---

## SRS cross-walk

Every screen in this pack is backed by at least one FR in `docs/00_SRS/v1.5/srs-v1.5-delta.md`. The mapping table lives at the bottom of each pack JSX file (`<PackFooter />` component). Quick reference:

| Pack | Primary FR domain |
|---|---|
| W1 | WEB-FR-001..013 (existing v1.2) |
| W2 | WEB-AUTH-FR-014..022 |
| W3 | WEB-FEED-FR-023..031 |
| W4 | WEB-DISC-FR-032..039 |
| W5 | WEB-READ-FR-040..049 + WEB-STORY-FR-095..099 |
| W6 | WEB-BOOK-FR-050..056 |
| W7 | WEB-STUD-FR-057..066 |
| W8 | WEB-PUB-FR-067..073 |
| W9 | WEB-PROF-FR-078..083 + WEB-KYC-FR-074..077 |
| W10 | WEB-NTF-FR-084..085 + WEB-SAV-FR-086 + WEB-SOC-FR-087..088 |
| W11 | WEB-GAM-FR-089..094 |
| W12 | WEB-MOTION-FR-100..105 |

---

## File index

```
docs/01_wireframes/v2/web/
├── README.md                              ← you are here
├── CreatorHub Web Redesign.html           ← master canvas (loads all packs)
├── design-system-web.jsx                  ← tokens (extends mobile design-system.jsx)
├── motion-language.jsx                    ← Framer Motion variants + easings
├── components-web-chrome.jsx              ← TopNav, Sidebar, RightRail, Footer, BrowserChrome
├── components-web-primitives.jsx          ← Cards, buttons, inputs, modals, tables
├── packs/
│   ├── pack-w-a-marketing.jsx             ← W1
│   ├── pack-w-b-auth-onboarding.jsx       ← W2
│   ├── pack-w-c-home-feed.jsx             ← W3
│   ├── pack-w-d-discover.jsx              ← W4
│   ├── pack-w-e-reader.jsx                ← W5  (showpiece)
│   ├── pack-w-f-booking.jsx               ← W6
│   ├── pack-w-g-studio.jsx                ← W7
│   ├── pack-w-h-publish.jsx               ← W8
│   ├── pack-w-i-profile-settings.jsx      ← W9
│   ├── pack-w-j-notifications-saved-social.jsx  ← W10
│   ├── pack-w-k-gamification.jsx          ← W11 (showpiece)
│   └── pack-w-l-motion-doc.jsx            ← W12
└── standalone/
    ├── reader-magazine.html               ← single-file W5 showpiece
    ├── gamification-quests.html           ← single-file W11 showpiece
    ├── studio-dashboard.html              ← single-file W7 showpiece
    └── booking-flow.html                  ← single-file W6 flow showpiece
```

---

## Open questions for the founder

The plan's "Decisions to Confirm" block has 13 items. The most consequential for these wireframes:

1. **Coral expansion 5 → 7 contexts** — accepted in this pack. Override forces XP fill + reading-progress to use ink (will dampen the gamification + storytelling story).
2. **Ambient audio in the reader (WEB-READ-FR-049)** — not implemented in showpiece pending licensing decision.
3. **Mobile-web breakpoint** — wireframes show fully-responsive layout (no "Open in mobile app" deeplink banner). Override = add banner at `<768px`.
4. **Magazine multi-column body** — implemented at `≥1440px` with explicit column-break indicator.

Any override changes the SRS wording before code is written.