# Wireframes · `<AppName>`

Version: **v1.2** (monochrome design system, 2026-04-08)
Design decisions applied: **DD-001 through DD-028**
Paired SRS: `srs-v1.md` (consolidation to `srs-v1.2.md` pending)

---

## How to use this folder

1. Open **`index.html`** in any browser. That's the entry point — it lists every wireframe with a description and links to individual files.
2. Click any screen card to open that wireframe in a new tab.
3. Each wireframe file is **self-contained** — no build step, no dependencies beyond Google Fonts (loaded from the web). You can open them locally, serve them from any static host, or embed them anywhere.
4. All styling uses **inline CSS + a single shared stylesheet** (`_shared.css`). Your engineer can right-click → inspect any element to grab exact hex values, spacing, and typography. Everything is readable source.

## File structure

```
wireframes/
├── README.md                          ← you are here
├── index.html                         ← browsable landing page (bookmark this)
├── _shared.css                        ← design tokens, phone mockup chrome, reusable components
│
├── screen-01-onboarding.html          ← welcome, categories, milestone
├── screen-02-home-feed.html           ← section-based feed (current)
├── screen-02b-location-picker.html    ← location capture + picker sheet
├── screen-03-discover.html            ← browse, search, filter sheet
│
├── screen-04-experience-scheduled.html ← Airbnb-inspired detail
├── screen-04b-post-detail.html         ← reading experience (Fraunces body)
├── screen-04c-event-detail.html        ← time-bound with date block
├── screen-04d-itinerary-detail.html    ← Roamy-inspired map-first
└── screen-04e-soft-auth-wall.html      ← bottom sheet auth trigger
```

## How to think about these files

These wireframes are the **authoritative visual spec** for the screens they cover. They're not pixel-perfect final designs — they're the last known good layout, spacing, and copy for each screen. If something in a wireframe conflicts with something in the SRS or the changelog, **the SRS wins for requirements** and the **wireframe wins for layout and copy**. When a conflict exists and you're not sure, ask.

Specifically:

- **Color values** — trust the wireframe. Exact hex codes are in `_shared.css`.
- **Typography** — trust the wireframe. Font families, sizes, and line-heights are real values that work.
- **Spacing and layout** — trust the wireframe.
- **Functional requirements** — trust the SRS. The wireframe shows _what_ the user sees; the SRS specifies _what must happen_ on interaction.
- **Content copy** — the wireframe strings ("Check availability", "Get my spot", "Sign in to continue") are final-ish. Treat them as the intended voice. Small edits are fine; wholesale rewrites need discussion.

## What each wireframe covers (and doesn't)

Each file shows:
- The main happy-path state of the screen
- Critical variant states where the design materially changes (e.g., Screen 2 shows both Pune direct-match and Shirdi fallback; Screen 3 shows browse, search, and filter states)
- Annotation cards alongside each phone mockup explaining _why_ each element is there

Each file does NOT show:
- Every loading state, error state, or empty state (those follow the primitives defined in `_shared.css`)
- Every interaction transition (animations are specified in DD-008 / C-20)
- Dark mode (not in MVP scope)
- Tablet or desktop variants (web follows a similar visual language but is rebuilt for wider viewports — separate wireframes to come)

## Engineer handoff notes

### For your Flutter engineer

- **Font loading**: Use `google_fonts` package. Fraunces with variable axis support (`opsz`, `SOFT`) requires at least `google_fonts: ^6.0.0`. Inter is straightforward.
- **Phosphor icons**: Use `phosphor_flutter` package. The wireframes show SVG equivalents but you'll import the real Phosphor icons by name.
- **Animation**: `flutter_animate` package per DD-008 / C-20. Standard parameters:
  - Card press: `.scale(begin: 1.0, end: 0.97, duration: 60ms).then(...)` totalling 120ms
  - Section entrance: `.fadeIn(duration: 200ms).moveY(begin: 8, end: 0, duration: 200ms)` with 80ms stagger
  - Loading shimmer: 1.6s linear loop on warm gradient
- **PostGIS**: Enable on Supabase in Week 1 per C-21. Don't defer. The home feed and location-aware rails depend on it from day one.
- **Google Places**: Server-side proxy only, never expose API key to client (per DD-028). Endpoints: `/api/places/autocomplete`, `/api/places/details`, `/api/places/photos`.

### For your Next.js engineer

- **Font loading**: Use `next/font/google`. Fraunces imported with `axes: ['opsz', 'SOFT']`, Inter with standard weights.
- **Phosphor icons**: `@phosphor-icons/react` package.
- **SSR requirement**: All public content pages (creator mini-sites, detail pages, category landing pages) must ship SSR HTML on first byte for SEO. See DISC-FR-007 in the SRS.
- **Open Graph metadata**: Required on every public content page for WhatsApp preview cards to render correctly. Specifically: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`. See DD-019.
- **Framer Motion**: Animation library per C-20. Keep animations subtle and snappy — we're not building a landing page.

### The five-place coral rule

Coral (`#E15A41`) appears in **exactly five places** across the entire app. This is DD-013, and it's strictly enforced. If you find yourself reaching for coral in any other context, stop and ask:

1. **Primary CTAs** — "Book", "Save", "Continue", "Apply filters", "Get full itinerary"
2. **Active save/bookmark icon** — filled coral when the user has saved an item, ink outline otherwise
3. **Location pin icon** — the map-pin in top bar and in city results
4. **Active bottom tab** — the filled tab icon for the current screen
5. **Overnight stop pin on itinerary maps** — the psychologically-anchoring spot where the user sleeps
6. **Critical unread signals** — notification badge dots, booking-status alerts, destructive confirmation

(Yes, that's technically six — the first five are "user actions and state", the sixth is "critical signals". Call it the five-place rule for brevity.)

**Never use coral for:** section headers, card borders, category tags, rating stars, discount badges, decorative accents, or hover states on non-primary buttons.

## Updating wireframes

Wireframes in this folder are generated by Claude during design sessions. When a design changes:

1. The new version is generated as a new file or replaces the existing file
2. The `index.html` is updated to reflect the change
3. The corresponding DD number is added or updated in the changelog
4. The SRS is updated (or the change is queued for the next consolidation)

If you need to change a wireframe yourself (e.g., for a small copy tweak), edit the HTML directly. The files are hand-readable. Just note in the file's header comment that you edited it and when.

## Known gaps (wireframes not yet drawn)

These screens are in the backlog and will be drawn in subsequent design sessions:

- **Screen 05** · Booking flow (the multi-step flow after tapping "Check availability")
- **Screen 06** · Studio tab active state (creator dashboard)
- **Screen 07** · Publishing wizard for itinerary (spot editor UX)
- **Screen 08** · Experience preview (how a draft looks before publish)
- **Screen 09** · Creator mini-site (public SEO page)
- **Screen 10** · Web home (logged-out marketing)
- **Screen 11** · Saved tab
- **Screen 12** · You tab / profile / settings

When these get drawn, they'll be added to this folder and to the index page automatically.

## Questions or issues

If something in a wireframe is unclear or looks wrong, document it with a comment like `<!-- QUESTION: ... -->` in the HTML and raise it in the next design session. Don't silently change it — drift between wireframes and the SRS is the biggest risk in a solo founder + AI design process.

---

**Last updated:** 2026-04-08
**Maintained by:** Rohit (product) + Claude (design) during weekly wireframe sessions
