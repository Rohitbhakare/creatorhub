# CreatorHub Web — Design System

> Last updated 2026-04-29. Source of truth: [`apps/web/src/app/globals.css`](../../../apps/web/src/app/globals.css) (CSS vars) and [`apps/web/src/lib/design-tokens.ts`](../../../apps/web/src/lib/design-tokens.ts) (TS mirror). Wireframe basis: v3 packs in [`docs/01_wireframes/v3/project/`](project/).

This document describes the locked rules. If you have to invent a value (a one-off `padding: 13px`), stop and add it to the scale — or use the next nearest token.

---

## 1. Colors

### Themes

Four themes selected via cookie + `data-theme` on `<html>`:

| Theme | Bg | Surface | Use |
|---|---|---|---|
| **Paper White** (default) | `#F7F7F5` | `#FFFFFF` | SRS-locked launch theme |
| Snow | `#F5F7FA` | `#FFFFFF` | Cooler whites, slightly techy |
| Bone | `#F4F1EA` | `#FBF9F4` | Warmer off-white, paper feel |
| Ink Night | `#0E0F12` | `#17181C` | Dark counterpart, coral stays |

### Semantic ramp (Paper)

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#16161A` | Body text, primary headings, icons |
| `--ink-soft` | `#3A3A40` | Secondary text, italic pull-quotes |
| `--ink-muted` | `#7A7A82` | Meta text, mono kickers, captions |
| `--ink-faint` | `#B4B4BA` | Disabled states, hairline emphasis |
| `--hairline` | `#E8E6E1` | Card borders, dividers |
| `--hairline-strong` | `#D8D5CE` | Input borders, emphasised dividers |
| `--surface` | `#FFFFFF` | Card background, sheet background |
| `--surface-alt` | `#F2F1EE` | Sunken rows, search pills, toolbars |
| `--surface-sunk` | `#ECEAE5` | Info blocks, code blocks |

### Coral — the **only** decorative accent (SRS C-17)

| Token | Hex | Use |
|---|---|---|
| `--primary` | `#E15A41` | Primary CTAs, active nav indicator, save-state on, critical signals |
| `--primary-deep` | `#B9401E` | Hover state for primary CTAs, link emphasis on light bg |
| `--primary-tint` | `#FCEBE6` | Coral-tinted halo on selection, badge backgrounds |

**Allow-list** — coral is permitted in exactly these places:

1. Primary CTAs (Book, Publish, Save changes)
2. Active bookmark / save icon (filled state)
3. Location pin (city pin chip, results destination)
4. Active nav indicator (top-nav underline, sidebar pill)
5. Critical unread signals (notification badge, active filter count, inbox bullet dot)
6. **(Web only)** XP / streak progress fill, level-up burst — _user state, not chrome_
7. **(Web only)** Reading-progress bar in immersive reader — _content state, not chrome_

Anything else **must not** be coral. Photography is exempt.

### Functional states

| Token | Use |
|---|---|
| `--success` `#1D9E75` | Confirmed, settled, ✓ states |
| `--warning` `#BA7517` | Pending review, refund pending |
| `--danger` `#C2362F` | Error toast, danger zone, KYC rejected |
| `--info` `#185FA5` | Live SSE pings, in-progress booking |

---

## 2. Spacing — 4 px base

```ts
import { spacing } from '@/lib/design-tokens'
spacing.lg // 16
```

| Symbol | px | Use |
|---|---|---|
| `xs` | 4 | Icon-text gaps, pill internal gap |
| `sm` | 8 | Chip rail gaps, button group gaps |
| `md` | 12 | Card internal gaps, paragraph separation |
| `lg` | 16 | Card padding, section internal padding |
| `xl` | 24 | Card-to-card gaps, between editorial blocks |
| `2xl` | 32 | Page side gutters, hero internal padding |
| `3xl` | 40 | Section vertical separation |
| `4xl` | 56 | Editorial section spacing on home |
| `5xl` | 80 | Hero band padding, footer padding |
| `6xl` | 120 | Ultrawide outer gutter |

**Rule:** never use a value not on this scale. If you need 13px, you almost always meant `md` (12) or `lg` (16).

---

## 3. Layout

### Page caps

| Constant | px | Used by |
|---|---|---|
| `PAGE_MAX_WIDTH` | **1640** | Home, discover, header, footer, content reader |
| `PAGE_GUTTER` | 32 | Default desktop side padding |
| `RIGHT_RAIL_WIDTH` | 296 | Home + content authed two-col layout |
| `STUDIO_SIDEBAR_WIDTH` | 220 | Studio shell |

The wireframes spec 1240 but live monitors at 1920+ leave too much dead margin. Bumped to 1640 for desktop; revert to 1240 only if a specific page can't sustain content density at 1640.

### Breakpoints (WEB-NFR-006)

```
mobile     <  768   1-col, stacked
tablet     768-1079 2-col grids drop, search pill collapses
desktop    1080-1439 full chrome + right rail
wide       1440-1919 hero feature scales up
ultrawide  >= 1920  centered with extra outer gutter
```

### Two-column home / content layout

```
┌──────────────────────────────┬─────────────┐
│   1fr (centered max 1640px)  │   296px     │
│   hero / sections / bento    │ right rail  │
└──────────────────────────────┴─────────────┘
gap: 40px (3xl)
```

### Content reader with itinerary

```
┌──────────┬──────────────────┬─────────────┐
│  200px   │  1fr (max 720px) │   280px     │
│ day nav  │  body            │ animated map│
└──────────┴──────────────────┴─────────────┘
gap: 48px
```

---

## 4. Type

| Family | Use | Variable |
|---|---|---|
| Fraunces | Display H1-H3, post body, italics | `var(--font-serif)` |
| Inter / Geist | UI, body, captions | `var(--font-sans)` |
| JetBrains Mono | Mono kickers, code, timestamps | `var(--font-mono)` |

### Display scale (Fraunces, weight 600, line-height 1.05, tracking -0.02em)

| Symbol | px | Use |
|---|---|---|
| `xs` | 22 | Card titles |
| `sm` | 26 | Bento tile titles |
| `md` | 32 | Bento feature, mini-site name |
| `lg` | 40 | Page H1 |
| `xl` | 56 | Hero feature title |
| `2xl` | 72 | Landing hero |

### Body scale (Inter)

| Symbol | px | Use |
|---|---|---|
| `xxs` | 10 | Mono kicker label |
| `xs` | 11 | Stat label, footnote |
| `sm` | 12 | Meta text, chip text, caption |
| `md` | 13.5 | Default UI body, button label |
| `base` | 14 | Global body |
| `lg` | 15 | Emphasised body |
| `xl` | 17 | Sub-headline, lede |

**Italic rules:**
- _Pull-quotes_ — Fraunces italic, weight 400, 22px on cards / 28px on reader
- _Coral italic accent_ — used 1× per heading max ("Travel stories *worth* saving")

---

## 5. Component rules

### Buttons

Three variants only. Don't invent a fourth.

| Variant | Use | Example |
|---|---|---|
| `ch-btn-primary` | Primary action — at most one per visible region | Sign up, Book, Publish, Save changes |
| `ch-btn-ink` | Strong secondary — black/ink fill | "Read this →" on hero |
| `ch-btn-ghost` | Tertiary — outlined | "Sign in", "Skip", "Cancel" |

All buttons are pill-shaped (`radius: 999`). Tap targets ≥ 44×44 dp on mobile.

### Cards

`.ch-card` — background `--surface`, 1px `--hairline`, `--shadow-md`, `--radius-lg`.
Default elevation is **raised** (SRS C-18). Use `--shadow-sm` only for inline rows that don't need lift.

### Pills

`.ch-pill` — 4px vertical / 10px horizontal, 11px mono caps, letter-spacing 0.06em.

| Variant | Use |
|---|---|
| `ch-pill-coral` | "★ Featured", price, FREE, important state |
| `ch-pill-glass` | Type label on hero photo (translucent on dark backdrop) |
| `ch-pill-tint` | Streak counter, level pill, status indicators |
| `ch-pill-ink` | Generic dark pill on light backgrounds |

### Action button alignment in horizontal label-action rows

When you have a label on the left and actions on the right (e.g. guest location prompt, section header with "See all →", footer hairline row):

```tsx
display: 'flex',
justifyContent: 'space-between', // ← required, not 'flex-start'
alignItems: 'center',
gap: 16,
flexWrap: 'wrap',

// label group: flex grow zero, shrink one (won't push the button right)
flex: '0 1 480px',

// action group: flex none (sits at the right edge)
flex: '0 0 auto',
justifyContent: 'flex-end',
```

**Anti-pattern** (caught 2026-04-29): using `flex: '1 1 auto'` on the action group makes it expand to fill, which centers buttons in their flex track. The buttons _appear_ right-of-label but a wide screen pushes them to the middle. Always pin actions with `flex: '0 0 auto'`.

---

## 6. Motion (WEB-MOTION FRs 100-105)

### Easing curves

```ts
import { easing } from '@/lib/design-tokens'

easing.easeOut   // [0.22, 1, 0.36, 1]   — entrance, default
easing.easeInOut // [0.65, 0, 0.35, 1]  — state changes
easing.spring    // {stiffness: 280, damping: 26} — confetti, press
```

### Durations

| Symbol | ms | Use |
|---|---|---|
| `micro` | 120 | Flick / tap response, ring burst start |
| `chip` | 180 | Chip select, button hover, scale-on-press |
| `page` | 220 | Page transitions, modal scale-in |
| `drawer` | 300 | Side-drawers, sheet slide-up, accordion |
| `hero` | 480 | Once-only entrance reveals |

### Reduced motion (WEB-MOTION-FR-105, WEB-A11Y-FR-110)

Every animation is gated by `useReducedMotion()`. The reduced variant should:
- Replace transforms with opacity-only
- Cap duration at ~100ms
- Skip parallax + sticky scroll bindings
- Replace confetti with a single coral check fade-in

### Scroll-trigger reveals (WEB-MOTION-FR-102)

Use the shared `<ScrollReveal>` wrapper. Stagger ≤ 40ms. Only the first 8 items in a list animate; the rest snap.

---

## 7. Z-index ladder

```ts
import { z } from '@/lib/design-tokens'
```

```
0    base
1    raised cards on hover
20   sticky chip rail
30   sticky web header
40   guest prompt banner
90   modal scrim
100  command palette (Cmd+K)
```

Never invent a new layer. If you need one above 100, you're probably layering a tooltip — use a portal.

---

## 8. Coral re-lock for web (FR-locked)

Per SRS v1.5 §6.1, the web extends mobile's 5-spot coral allow-list to **7** spots. The two web-only additions are:

6. XP / streak progress fill, level-up burst — _user state_
7. Reading-progress bar in the immersive reader — _content state_

These are user-state and content-state indicators where graying them out would make them invisible against the monochrome layout. The discipline still holds for chrome (nav, cards, dividers). If a reviewer asks "why is this coral?" and the answer isn't one of the 7 numbered rules above, change it to ink.

---

## 9. Accessibility floor (WEB-A11Y FRs 106-110)

- WCAG 2.2 AA contrast ratios — paper theme passes by construction
- Focus ring: 2px coral solid + 2px offset, applied via `:focus-visible`
- Skip link "Skip to main content" wired into root layout (CSS-only show on focus)
- Route-change focus moves to the page `<h1>` via `RouteFocus` client component
- High-contrast media query strips coral except locked spots 1, 4, 5

---

## 9.5 Primitives — typed React wrappers

Land in `apps/web/src/components/ui/`. Use these instead of reaching for raw `ch-*` classes — they enforce the variant matrix at the type level.

| Primitive | Use | File |
|---|---|---|
| `<Btn>` / `<BtnLink>` | Three variants (primary / ink / ghost), three sizes (sm / md / lg), `loading`, `block`, leading + trailing icons. `<BtnLink>` renders Next.js `<Link>` for navigation. | [btn.tsx](../../../apps/web/src/components/ui/btn.tsx) |
| `<Pill>` | Five variants (default / coral / glass / tint / ink), optional leading dot. Wraps `ch-pill-*`. | [pill.tsx](../../../apps/web/src/components/ui/pill.tsx) |
| `<Tag>` | Inline hashtag / category label, three tones (default / tint / ink). Quieter than `<Pill>`. | [tag.tsx](../../../apps/web/src/components/ui/tag.tsx) |
| `<InitialAvatar>` | Two-letter initials in the locked taupe gradient. Replaces four hand-rolled copies (content-card, web-header, hero-feature, comments). | [initial-avatar.tsx](../../../apps/web/src/components/ui/initial-avatar.tsx) |
| `<Ring>` | SVG circular progress ring. Coral fill for quest progress (allow-list spot 6). | [ring.tsx](../../../apps/web/src/components/ui/ring.tsx) |
| `<XPChip>` | Composes `<Pill variant="tint">` + `<Ring>`. Level + xp/max + accessible label. | [xp-chip.tsx](../../../apps/web/src/components/ui/xp-chip.tsx) |
| `<StreakChip>` | Flame glyph + day count, dimmed when streak is at risk. | [streak-chip.tsx](../../../apps/web/src/components/ui/streak-chip.tsx) |

### Layout primitives

| Primitive | Use | File |
|---|---|---|
| `<PageShell>` | Centered max-1640 / 32px-gutter wrapper. Renders as `<main>` by default; pass `flush` to drop gutters for full-bleed heroes. | [page-shell.tsx](../../../apps/web/src/components/ui/page-shell.tsx) |
| `<TwoColLayout>` | Main + 296px right rail. Wraps `.ch-page-grid` with `<aside aria-label>` semantic. Pass `rail={null}` to skip the aside. | [two-col-layout.tsx](../../../apps/web/src/components/ui/two-col-layout.tsx) |
| `<ReaderLayout>` | 200/720/280 three-col reader. `dayNav={null}` collapses to two columns; `aside={null}` collapses to one. Wraps `.ch-reader-grid`. | [reader-layout.tsx](../../../apps/web/src/components/ui/reader-layout.tsx) |

### Motion library

[`@/lib/motion`](../../../apps/web/src/lib/motion.ts) exposes `easing` (easeOut / easeInOut / spring), `secs(durationKey)` for ms→s conversion, `pageVariants` + `revealVariants` (with `…Reduced` counterparts), and `transitionFor(reduced, key, ease)` which honors `useReducedMotion()` automatically. Pair with framer-motion's `useReducedMotion()` hook at the call site.

---

## 10. Adding a new component — the checklist

1. Does an existing primitive cover this? (`ch-card`, `ch-btn-*`, `ch-pill-*`)
2. Are all colors semantic vars (`var(--ink)`)? Never raw hex.
3. Are all paddings on the spacing scale? (xs/sm/md/lg/xl/2xl/3xl/…)
4. Are all radii on the radius scale?
5. Is the interaction motion gated by `useReducedMotion`?
6. Does the component degrade to keyboard-only navigation?
7. Does the component look right at all 5 breakpoints?

If any answer is no, fix that before merging.
