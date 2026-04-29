# CreatorHub Wireframes &middot; v3 (Pure White + Coral)

> **Source:** Handoff bundle from claude.ai/design — fetched 2026-04-29.
> **Author:** Founder (designer), iterated with Claude Design.
> **Status:** ACTIVE next-version design. Supersedes `v2/` for visual direction.
> **Architecture:** Mobile and web flows in **separate pack files** within a single canvas.

---

## What this is

The third major iteration of CreatorHub wireframes. Built in claude.ai/design over a multi-day session (full transcript at [chats/chat1.md](chats/chat1.md)) and exported as a handoff bundle.

Key changes vs v2:

- **Pure White + Coral design system** locked across all themes (Paper / Snow / Bone / Ink Night)
- **Coral `#E15A41`** is the sole decorative accent (SRS C-17)
- **Card elevation** is `raised` by default with layered shadows (SRS C-18)
- **Selection state** is outline + coral border + coral-tint halo + coral check (SRS C-17.1) — never `bg: ink`
- **Bottom nav** uses coral-pill active indicator + coral FAB (SRS C-19)
- **Mobile and web flows are separate** — mobile packs (`pack-{a..i}-*.jsx`) live alongside web packs (`pack-w-*.jsx`) in the same canvas
- **Live tweaks panel** for theme / type pair / coral hue / radius / density
- **Storytelling threading** baked into itineraries (chapter-based with progress rails) and web home (rotating chapter hero)
- **Light gamification** via XP chip, streak flame, progress ring (subtle, not loud)

---

## How to open

### Quickest — standalone HTML (no server, no build)
Double-click [project/CreatorHub Redesign (standalone).html](project/CreatorHub%20Redesign%20%28standalone%29.html). 2.2 MB, fully offline, works from `file://`. This is what most people want.

### Modular — main HTML loads JSX files
[project/CreatorHub Redesign.html](project/CreatorHub%20Redesign.html). 16 KB, loads `pack-*.jsx` via `<script type="text/babel">`. Useful for editing individual packs. Must be served from a directory that includes all `*.jsx` siblings (double-click works on most modern Macs because Babel standalone resolves relative paths).

### Earlier version
[project/CreatorHub Redesign v0.html](project/CreatorHub%20Redesign%20v0.html) — preserved for reference.

---

## File index

```
docs/01_wireframes/v3/
├── README.md                              ← you are here
├── HANDOFF-README.md                       ← original README from claude.ai/design
├── chats/
│   └── chat1.md                            ← full design conversation (~50 KB, 1300 lines)
└── project/
    ├── CreatorHub Redesign.html            ← modular master (loads JSX)
    ├── CreatorHub Redesign (standalone).html         ← bundled standalone (2.2 MB) ★
    ├── CreatorHub Redesign (standalone-src).html     ← source for the bundle
    ├── CreatorHub Redesign v0.html         ← prior iteration backup
    │
    ├── design-system.jsx                   ← tokens (themes, type pairs, coral hues, radii)
    ├── design-canvas.jsx                   ← scrollable canvas wrapper
    ├── components-primitives.jsx           ← Btn, Card, Input, Tag, XPChip, StreakChip, Ring
    ├── components-chrome.jsx               ← TopNav, BottomNav, Sheet (mobile chrome)
    ├── ios-frame.jsx                       ← iPhone device frame for mobile screens
    │
    ├── pack-a-onboarding.jsx               ← MOBILE  Onboarding & auth (welcome → OTP → interests → celebrate → soft wall)
    ├── pack-b-discover.jsx                 ← MOBILE  Home, discover, search, filter, create, quests
    ├── pack-c-detail.jsx                   ← MOBILE  Itinerary chapters, story reader, experience, save sheet
    ├── pack-d-booking.jsx                  ← MOBILE  Booking review → seat-hold pay → confirm
    ├── pack-e-publish.jsx                  ← MOBILE  Publishing wizard (outline → stops → media → meta → review)
    ├── pack-f-kyc.jsx                      ← MOBILE  KYC (PAN, Aadhaar, selfie, bank, review + 4 status states)
    ├── pack-g-you.jsx                      ← MOBILE  Profile, edit, connected accounts, notifs, my bookings
    ├── pack-h-creator-studio.jsx           ← MOBILE  Public creator page + Studio (insights, payouts, messages)
    ├── pack-i-website.jsx                  ← MOBILE  Web mini-site preview (desktop frame, mobile-side artwork)
    │
    ├── pack-w-chrome.jsx                   ← WEB     Shared web chrome (WHeader, WBtn, WPhoto, WAvatar, WPill)
    ├── pack-w-onboarding.jsx               ← WEB     Welcome, phone, OTP, location, interests, creators, celebrate, soft wall
    ├── pack-w3-home-web.jsx                ← WEB     Magazine home feed (chapter hero, mood selector, bento, map, quest strip)
    ├── pack-w-discover.jsx                 ← WEB     Discover grid, command-palette search, filter modal, create modal
    ├── pack-w-detail.jsx                   ← WEB     Itinerary chapter view, story reader, experience, save modal
    ├── pack-w-booking.jsx                  ← WEB     Booking review → UPI pay → confirm celebration
    ├── pack-w-publish.jsx                  ← WEB     3-step composer (outline → chapter editor with map → publish)
    ├── pack-w-rest.jsx                     ← WEB     KYC (DigiLocker), Profile, Studio dashboard
    │
    ├── pack-ds-reference.jsx               ← Design system reference page (palette, type, buttons, motion, voice)
    │
    ├── debug.png                            ← thumbnail
    └── uploads/                             ← screenshots from earlier wireframes
        ├── 01_welcome.png … 17_onboarding_celebration.png
        ├── reader-magazine.html             ← v2 standalone wireframes
        ├── studio-dashboard.html
        ├── pack-w1-marketing.html
        ├── pack-w3-home-feed.html
        ├── pack-w4-discover-search.html
        ├── pack-w8-publishing-wizard.html
        ├── pack-w10-notifications-saved-social.html
        └── pack-w12-motion-doc.html
```

★ = primary entry point.

---

## Canvas layout

The master HTML renders one giant scrollable canvas with sections in this order:

1. **Intro** — "Pure white. Coral only." + 9-pack chip rail
2. **A · Onboarding & auth** (mobile)
3. **W · Web — onboarding & auth** (web)
4. **W · Web home feed** (new, magazine-style, single column)
5. **W · Web — discover, search, filter, create**
6. **W · Web — detail screens**
7. **W · Web — booking flow**
8. **W · Web — publishing wizard**
9. **W · Web — KYC, You, Studio**
10. **B · Discover & create** (mobile)
11. **C · Detail · chapter storytelling** (mobile)
12. **D · Booking flow** (mobile)
13. **E · Publishing wizard** (mobile)
14. **F · Creator KYC** (mobile)
15. **G · You / Profile** (mobile)
16. **H · Creator · public & Studio** (mobile)
17. **I · Web mini-site** (mobile-rendered desktop preview)
18. **Design system · reference**

---

## Design system snapshot

**Themes** (4) — Paper White (default) · Snow · Bone · Ink Night
**Type pairs** (3) — Editorial (Fraunces + Geist · default) · SRS-locked (Fraunces + Inter) · Sans-first (Geist only)
**Coral hues** (3) — Coral `#E15A41` · Terracotta `#C9502A` · Saffron `#D97B1A`
**Radii** (3) — Sharp · Soft (default) · Round
**Densities** (3) — Compact · Cozy (default) · Spacious

All combinations are switchable live via the **Tweaks** panel (toggle from toolbar).

### Locked SRS clauses (introduced in v3)

- **C-17** Sole decorative accent (coral only; semantic on functional states only)
- **C-17.1** Selection state language (outline → coral border + halo + check; never dark fill)
- **C-18** Card elevation default (raised; flat opt-in)
- **C-19** Bottom nav (coral-pill active + coral FAB + top elevation shadow)
- **C-20** Controlled forms (`readOnly` when no `onChange`)
- **C-21** Default theme (Paper White; Snow / Bone / Ink Night are runtime alternates)

These should be promoted into the SRS doc — see chat transcript section "Master prompt — CreatorHub v2 'Pure White + Coral' · full migration" (line ~600 of `chats/chat1.md`) for a ready-to-paste planning brief.

---

## Relationship to v2

`docs/01_wireframes/v2/` (previous version, my hand-built wireframes) is preserved untouched. v3 is the next-version replacement designed in claude.ai/design.

**Use v3 for any new implementation work.** v2 stays as historical reference.

If you want to bring v2's individual standalone HTML wireframes (`reader-magazine.html`, `studio-dashboard.html`, etc.) into v3 for cross-reference, they're already mirrored under `v3/project/uploads/`.

---

## Implementation guidance

Per the original handoff README ([HANDOFF-README.md](HANDOFF-README.md)):

> The design medium is **HTML/CSS/JS** — these are prototypes, not production code. Your job is to **recreate them pixel-perfectly** in whatever technology makes sense for the target codebase (React, Vue, native, whatever fits). Match the visual output; don't copy the prototype's internal structure unless it happens to fit.

For `apps/web/` (Next.js 15 + Tailwind v4):
- Lift design tokens from [project/design-system.jsx](project/design-system.jsx) into `apps/web/src/app/globals.css` as CSS custom properties
- Recreate the components in [project/components-primitives.jsx](project/components-primitives.jsx) and [project/pack-w-chrome.jsx](project/pack-w-chrome.jsx) as proper React components in `apps/web/src/components/`
- Match each web pack screen-for-screen — start with W home feed (`pack-w3-home-web.jsx`), then onboarding, discover, detail, booking, publish, KYC/You/Studio
- Add `framer-motion` per WEB-MOTION-FR-100 (SRS v1.5)

For `apps/mobile/` (Flutter):
- Treat mobile packs A-I as the visual spec
- Map design tokens into `lib/theme/`
- Recreate each screen as Flutter widgets

---

## Cross-references

- **Chat transcript** — [chats/chat1.md](chats/chat1.md) (1293 lines, full design conversation including 6 design directions explored, 4 themes evaluated, master migration prompt)
- **SRS v1.5 delta** — [../../00_SRS/v1.5/srs-v1.5-delta.md](../../00_SRS/v1.5/srs-v1.5-delta.md) (97 web FRs)
- **Previous wireframes (v2)** — [../v2/web/](../v2/web/) (my hand-built versions, preserved)
- **HLD** — [../../engineering/HLD.md](../../engineering/HLD.md)
