# Wireframes

**Active design: [`v2/`](v2/) — CreatorHub Redesign (Pure White + Coral), April 2026.**
Archived: [`archive/v1/`](archive/v1/) — previous HTML prototypes (retained for historical reference only; do not implement against v1).

---

## v2 — CreatorHub Redesign (canonical)

Source: Claude Design bundle `w01JFq8Uf4fdUVBje9Q9kw`.

| Path | Purpose |
|------|---------|
| [`v2/README.md`](v2/README.md) | Handoff readme — **read first**. |
| [`v2/chats/chat1.md`](v2/chats/chat1.md) | Design chat transcript — the "why" behind the design. |
| [`v2/project/CreatorHub Redesign.html`](v2/project/CreatorHub%20Redesign.html) | Primary design entry point. Enumerates the screen packs (A–I) in ship order. |
| [`v2/project/design-system.jsx`](v2/project/design-system.jsx) | Canonical tokens (palette, type, radius, motion). |
| [`v2/project/components-primitives.jsx`](v2/project/components-primitives.jsx) | Shared primitives: `Btn`, `Tag`, `Card`, `SelectionTile`, etc. |
| [`v2/project/components-chrome.jsx`](v2/project/components-chrome.jsx) | App shell: BottomNav, top bar, sheet chrome. |
| [`v2/project/pack-a-onboarding.jsx`](v2/project/pack-a-onboarding.jsx) | Pack A — Welcome / Phone / OTP / Onboarding / AuthWall. |
| [`v2/project/pack-b-discover.jsx`](v2/project/pack-b-discover.jsx) | Pack B — Home / Discover / Search / Filter / Create / Quests. |
| [`v2/project/pack-c-detail.jsx`](v2/project/pack-c-detail.jsx) | Pack C — Itinerary / Story / Experience / SaveSheet. |
| [`v2/project/pack-d-booking.jsx`](v2/project/pack-d-booking.jsx) | Pack D — BookingReview / Pay / Confirm. |
| [`v2/project/pack-e-publish.jsx`](v2/project/pack-e-publish.jsx) | Pack E — Publishing wizard (Outline → Stops → Media → Meta → Review). |
| [`v2/project/pack-f-kyc.jsx`](v2/project/pack-f-kyc.jsx) | Pack F — KYC Intro / PAN / Aadhaar / Selfie / Bank / Review / Status. |
| [`v2/project/pack-g-you.jsx`](v2/project/pack-g-you.jsx) | Pack G — You / YouEdit / Connected / Notifs / Bookings. |
| [`v2/project/pack-h-creator-studio.jsx`](v2/project/pack-h-creator-studio.jsx) | Pack H — CreatorPublic / StudioHome / Insights / Payouts / Messages / Booking. |
| [`v2/project/pack-i-website.jsx`](v2/project/pack-i-website.jsx) | Pack I — Web mini-site (desktop). |
| [`v2/project/pack-ds-reference.jsx`](v2/project/pack-ds-reference.jsx) | Design-system reference swatches. |
| [`v2/project/uploads/`](v2/project/uploads/) | Screenshots of the *existing* app used as input during design iteration. |

### Ship order (per `CreatorHub Redesign.html`)

1. **A** Onboarding & auth
2. **B** Discover & create
3. **C** Detail · chapter storytelling
4. **D** Booking flow
5. **E** Publishing wizard
6. **F** Creator KYC
7. **G** You / Profile
8. **H** Creator · public & Studio
9. **I** Web mini-site

Implementation is scheduled pack-by-pack; each pack gets its own epic under `docs/epics/`.

---

## For Claude Code / future agents

When implementing any UI feature:

1. **Always refer to `docs/01_wireframes/v2/` first** — it is the canonical design.
2. Start by reading [`v2/README.md`](v2/README.md) and [`v2/chats/chat1.md`](v2/chats/chat1.md).
3. Open [`v2/project/CreatorHub Redesign.html`](v2/project/CreatorHub%20Redesign.html) and then the specific pack JSX for the screen you're building.
4. Follow imports through `design-system.jsx` → `components-primitives.jsx` → `components-chrome.jsx` so tokens and primitives stay consistent.
5. **Do not** implement against `archive/v1/` — it is retained only for history.

Match the visual output; do not copy the prototype's internal React structure. Flutter primitives already live in `apps/mobile/lib/shared/components/` (`AppCard`, `SelectionTile`, `Button`, `AppInput`, etc.).
