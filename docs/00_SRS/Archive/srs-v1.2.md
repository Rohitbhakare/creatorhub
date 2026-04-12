# Software Requirements Specification (SRS) — `<AppName>`
**Version:** 1.2 (DD-001 through DD-028 applied)
**Date:** 2026-04-08
**Status:** Approved by founder · all wireframing-phase design decisions incorporated
**Author:** Business Analyst (Claude) + Product Owner (Rohit)
**Supersedes:** `srs-v1.md` (v1.1) for current authoritative spec; v1.1 is retained as historical record
**Related:** [`srs-design-decisions-changelog-final.md` → archived](./archive/srs-design-decisions-changelog-final.md), [`creator-platform-pivot.md`](./creator-platform-pivot.md)

> **Reading contract.** This is the single source of truth for Phase 1. If a requirement is not in this SRS, it does not exist for Phase 1. Conflicts with v1.1 or earlier drafts are resolved in favour of this document. Every change from v1.1 is traced to a `DD-NNN` decision in Appendix G.

---

## 0. Document Control

| Field | Value |
|---|---|
| Product | `<AppName>` — text-first creator-and-booking platform · India-launched · travel + stories are the launch verticals |
| Project code | CREATORAPP |
| Phase | Phase 1 (MVP → V1 → V2) |
| Target launch (MVP) | **2026-07-07** (12 weeks from today) |
| Target launch (V1) | **2026-09-15** |
| Target launch (V2) | **2026-11-30** |
| Geography | India only |
| Languages | English only (i18n-ready architecture) |
| Team (start) | 1 founder/engineer (Rohit) |
| Team (by Week 4) | 1 founder + 1 full-stack engineer |
| Legal counsel | Engaged (budget approved) |

### 0.1 Revision history

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0-draft | 2026-04-07 | Claude BA | First consolidated SRS after BA review. Supersedes three draft PRDs. |
| 1.1 | 2026-04-07 | Claude BA | **Creator-platform pivot applied** (DEC-002). Travel reframed as launch vertical. Schema gains `vertical` enum + `vertical_data` JSONB on `content`. ~85% of v1.0 carried over verbatim — see `creator-platform-pivot.md` §7. |
| 1.2 | 2026-04-08 | Claude BA | **28 wireframing-phase design decisions applied (DD-001 through DD-028).** Major changes: Stories added as second MVP vertical; four explicit content types (post, event, scheduled_experience, self_paced_itinerary); section-based home feed replacing For You/Following tabs; monochrome design system with coral as sole accent; mandatory location with nearest-neighbor waterfall; soft auth wall + guest browsing; three-level taxonomy; spot-based Roamy-style itinerary; search history with DPDPA compliance; Google Places API dependency. Appendix B completely rewritten. Appendix F (design system canonical) and Appendix G (DD traceability matrix) added. All changes trace to individual DDs. |

### 0.2 Terminology — requirement IDs

All requirements are identified with a stable ID that **does not change** across versions. Format:

`<AREA>-<TYPE>-<NNN>` — e.g. `IAM-FR-001`, `BOOK-NFR-004`, `TAX-LGL-002`.

- **AREA** — see §4 section codes (IAM, ONB, PROF, CRT, DISC, SOC, BOOK, REV, NTF, GAM, TS, ADM, ANL, TAX)
- **TYPE** — `FR` (functional), `NFR` (non-functional), `LGL` (legal/compliance), `INT` (interface), `DAT` (data), `BR` (business rule)

Every FR also has a **Milestone** tag (`M0`, `M1`, `M2`, `V1`, `V2`, `DEF`) — see §3.

---

## 1. Introduction

### 1.1 Purpose

`<AppName>` exists because **content creators have no durable home on the internet — their work vanishes with the algorithm, lives buried in DMs, and earns through someone else's ad-tech instead of through their own audience.** The creator economy runs on rented land. We are building owned land: a **bookable mini-website for every creator**, durable, SEO-indexed, monetisable, and structured around their actual craft.

We launch with the **travel and stories verticals** because (a) the founder's insight is sharpest in travel, (b) Indian travel creators have no good home today, (c) the booking model maps cleanly to itineraries and guided trips, and (d) Stories provides the on-ramp for writers and creators who are not yet ready for KYC or paid experiences. Once travel proves the wedge (target: 50 paying creators), the platform expands vertical-by-vertical — food, fitness, photography, wellness, music, education — at a cadence of one new vertical per quarter.

This SRS specifies a mobile (Flutter), web (Next.js), and admin platform that does three things at once:

1. Lets creators publish **text-first, structured, persistent** content with media — essentially their own mini-website. The wizard adapts to each vertical (MVP ships travel and stories, but the schema is multi-vertical from day one).
2. Lets followers **discover, read, save, and book** that content with minimum clicks and zero itinerary-hunting.
3. Runs the payments, tax compliance, reviews, and trust/safety rails that are legally required to operate a marketplace in India.

### 1.2 Product vision (one paragraph)

> *"I was in Bali, drowning in Reels, noting itineraries on paper, cross-checking them on Google Maps, hunting for activity bookings on four different sites. I want a place where a creator I trust has already laid out the route, day by day, with the bookings attached — and if I like it, I tap Book. That is what we are building — first for travel, then for every other craft a creator builds an audience around."*

**Vertical strategy.** Travel is the **launch wedge**, not the whole product. The vision is the creator-website-and-booking platform; travel is the proof point. The schema, the wizard architecture, and the discovery surfaces are all designed to hold N verticals from day one — and MVP ships **travel and stories together** (DD-001). No third vertical ships before V1. See `creator-platform-pivot.md` and ADR-009 for the locked rule.

### 1.3 Product scope — in and out

**Verticals (vertical strategy — see ADR-009):**

- **MVP (M0+M1+M2):** travel and stories verticals. (DD-001) The onboarding vertical picker shows all 8 verticals honestly but marks non-MVP verticals with creator count and "soon" indicators. (DD-002)
- **V1+:** third vertical pilot (founder-chosen, likely food or fitness). Full vertical-management UI.
- **V2+:** additional verticals + vertical-management UI in admin.
- **Schema:** multi-vertical from day one (`vertical` enum + `vertical_data` JSONB on `content`). See §5.1.
- **Hard rule:** no third vertical ships before V1. No exceptions. (DEC-002)

**In scope for Phase 1:**

- Mobile app (Flutter, iOS + Android)
- Web app (Next.js, responsive, SEO-first)
- Admin/operations tooling (Supabase Studio + Retool for MVP; custom admin panel for V2)
- Content types: **Post**, **Self-paced Itinerary**, **Scheduled Experience**, **Event** (DD-022)
- Creator mini-site (public profile, SEO-indexed)
- Bookings & escrow payments via Razorpay
- Reviews & ratings
- Follow graph, likes, comments, saves
- Creator KYC (PAN + Aadhaar OTP + bank penny drop)
- Tax compliance (GST, Section 194-O 1% TDS, Form 16A)
- DPDPA 2023 + DPDP Rules 2025 compliance
- IT Act Intermediary Rules 2021 compliance
- India-only, English-only
- **Anonymous browsing for unauthenticated users with progressive soft auth wall on protected actions.** (DD-003)

**Out of scope for Phase 1 (will be addressed in Phase 2):**

- Direct messaging / chat between users
- Live events / live streaming
- Multi-language UI (Hindi, Tamil, etc.) — architecture ready, content not
- International payments / multi-currency
- Brand sponsorship marketplace
- Desktop-first creator studio with AI content assistant, templates, scheduling, custom domains
- Ambassador program, tip jars, subscriptions, gifts
- Referral program (considered for V2)
- Blog CMS, in-app help centre content (external docs for Phase 1)
- Native desktop apps
- Web push notifications (mobile FCM only for Phase 1)

### 1.4 Intended audience

| Reader | Sections to focus on |
|---|---|
| Founder / Product | §1, §2, §3, §4 (all), §9 |
| Engineer | §2.5, §3, §4, §5, §6, §7 |
| Designer | §2.3, §2.5 (C-17–C-20), §4 (UX notes), §6.1, Appendix F |
| Legal counsel | §8 |
| Ops / Support | §4.11, §4.12, §4.13, §4.14 |
| Finance / CA | §4.14, §8.4, §8.5 |

### 1.5 Definitions, acronyms, abbreviations

| Term | Meaning |
|---|---|
| **Creator** | A user who publishes content. Every user is a potential creator — no separate sign-up. |
| **Follower** | A user who consumes content (reads, saves, books). Same user model — no role split. |
| **Vertical** | A top-level domain that defines the wizard schema and discovery surface. MVP ships `travel` and `stories`. Planned verticals: `food`, `fitness`, `photography`, `wellness`, `music`, `education`. One new vertical per quarter post-MVP. (DD-001) |
| **Sub-category** | A topical narrowing within a vertical. Travel ships with 12 sub-categories in MVP. Each future vertical has its own set defined when it ships. (DD-006) |
| **Leaf type** | An optional format-specific narrowing within a sub-category. Used in the publishing wizard and search filters, not in primary navigation. Each sub-category has 5–7 leaf types. (DD-006) |
| **Facet** | A cross-cutting attribute (group_size, budget, difficulty, duration, season) applied to any content regardless of sub-category. Used in search filters, NOT in the taxonomy hierarchy. (DD-006) |
| **Post** | Long-form text + media content. Vertical-agnostic. No KYC required to publish. Monetised indirectly via follower growth. Body text on detail pages uses Fraunces serif per DD-026. (DD-022, DD-027) |
| **Self-paced Itinerary** | A map-first, spot-based curated travel guide. Organised as days of spots with creator notes. One-time purchase for lifetime access. Not chapters of text. (DD-022, DD-023) |
| **Scheduled Experience** | A creator-led multi-day experience with fixed future departure dates and slots. Always paid. Always requires KYC. (DD-022, DD-021) |
| **Event** | A single-occurrence, time-bound, fixed-venue experience. Under 24 hours. Community/meetup feel. Low-cost or free. No KYC required for free events; KYC required for paid. (DD-022, DD-025) |
| **Spot** | An individual pinned location within an itinerary day. Has a Google Places ID, creator note, and stop type. Overnight spots are rendered in coral on the map. (DD-023, DD-024) |
| **Experience** | Umbrella term for Self-paced Itinerary + Scheduled Experience + Event. |
| **`vertical_data`** | A JSONB column on `content` that holds vertical-specific fields (validated by a Zod schema per vertical at the API edge). See §5.1. |
| **Mini-site** | A creator's public profile page, SEO-indexed, functioning as their personal website. Shows their vertical(s). |
| **Escrow** | Funds held by Razorpay Route until trip completion + dispute window. |
| **Platform fee** | `<AppName>`'s cut. Dynamic, configured per creator/category in admin. |
| **GST** | Goods and Services Tax — 18% on services in India. |
| **TDS** | Tax Deducted at Source — **1%** under Section 194-O for e-commerce operators (not 10%). |
| **DPDPA** | Digital Personal Data Protection Act 2023 (India). DPDP Rules 2025 in force from Nov 2025. |
| **ATOAI** | Adventure Tour Operators Association of India — safety guidelines 2022. |
| **KYC** | Know Your Customer — PAN + Aadhaar OTP + bank penny drop. |
| **Waitlist card** | A dashed-border card shown in the home feed for verticals the user picked during onboarding but which have no content yet. (DD-012, DD-007) |
| **Soft auth wall** | A bottom sheet that slides up over the current screen when a guest user attempts a protected action (book, save, follow, comment, publish). (DD-016) |

### 1.6 References

1. Draft requirement docs (superseded): `Docs/01_requirements/archive/original-drafts/{mobile,web,admin_panel}_draft_v1.md`
2. BA review: `Docs/01_requirements/phase-1/ba-review/ba-review-v1.md`
3. Creator-platform pivot framing: `Docs/01_requirements/phase-1/srs/creator-platform-pivot.md`
4. Design decisions changelog (archived): `Docs/01_requirements/phase-1/srs/archive/srs-design-decisions-changelog-final.md`
5. Digital Personal Data Protection Act 2023 + DPDP Rules 2025
6. IT (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021
7. Consumer Protection (E-commerce) Rules 2020
8. RBI Guidelines on Regulation of Payment Aggregators, 2020 (+ 2022 escrow amendments)
9. Section 194-O, Income Tax Act, 1961 (1% TDS for e-commerce operators)
10. GST Act — services of e-commerce operators (Section 9(5))
11. ATOAI Adventure Tour Operators Safety Guidelines, 2022
12. Razorpay Route + Linked Accounts documentation
13. Supabase Auth / RLS documentation

---

## 2. Overall description

### 2.1 Product perspective

`<AppName>` is a **greenfield** product. It is not replacing an existing system. It will integrate with:

- **Firebase Auth** (phone OTP) → issues Firebase JWT → backend verifies and mints session
- **Supabase Postgres** (primary store) with Row-Level Security and **PostGIS** extension (DD-009)
- **Firebase Storage** (media: images, audio, video, KYC docs)
- **Razorpay Route** (escrow + linked accounts + payouts)
- **Razorpay Payment Gateway** (UPI, cards, netbanking, wallets)
- **MSG91** (transactional SMS)
- **SendGrid** (transactional email)
- **Google Maps SDK** (mobile + web)
- **Google Places API** (spot search + metadata for itinerary publishing — new) (DD-028)
- **Firebase Cloud Messaging** (mobile push)
- **Sentry** (error monitoring)
- **Meilisearch** or **Typesense** (search — MVP uses Postgres `tsvector`, V1 migrates to Meilisearch)
- **Upstash Redis** (rate limiting, OTP, cache) — optional for MVP, required for V1

### 2.2 Product functions (high-level)

1. **Identity & onboarding** — sign up with phone OTP, pick vertical interests, pick location, optionally follow suggested creators, land on personalised feed within 60 seconds.
2. **Publish** — create posts, self-paced itineraries, scheduled experiences, events; vertical-adaptive structured-content builder; upload media; save drafts. (MVP ships travel and stories verticals.)
3. **Discover** — section-based home feed organised by vertical interest + location, Discover tab (browse + search + filter), category and city browse. (DD-007)
4. **Consume** — read a post or experience, view a creator's mini-site, save to bookmarks, share via WhatsApp or native sheet.
5. **Book** — for bookable content, check availability, pay (escrow), receive confirmation.
6. **Review** — after completion, leave a rating + review; creators can respond.
7. **Social** — follow/unfollow, like, comment, reply, save. (DD-017)
8. **Notifications** — push + email for follows, bookings, payments, comments, system alerts.
9. **Trust & safety** — report content/users; moderators queue; KYC gating for paid content; T&Cs.
10. **Admin & ops** — moderate, run payouts, resolve disputes, pull tax reports, view analytics, editorial curation. (DD-014)
11. **Tax compliance** — collect GST, deduct 1% TDS, generate Form 16A, GSTR-1, GSTR-3B inputs.

### 2.3 User classes and characteristics

See `Docs/phase-1/srs/personas.md` for full personas.

| Class | Description | Primary needs | Tech fluency |
|---|---|---|---|
| **Follower (primary)** | Urban Indian, 22–40, salaried or freelance, plans 2–4 trips/year, follows travel creators on Instagram | Trusted itineraries, easy booking, mobile-first | Medium–high |
| **Creator (primary)** | Indian travel/stories content producer, 23–38, currently reliant on Instagram / YouTube | Profile, publishing tools, analytics, payouts | Medium |
| **Creator-led group operator** | Small tour operator or solo guide running adventure/photo/spiritual tours | Slot management, bookings, waivers, payouts, GST | Low–medium |
| **Admin / moderator / support / finance / ops** | Internal staff | Moderation queue, KYC review, payout runs, editorial curation, tax exports | High |
| **Guest (unauthenticated)** | Web or app visitor arriving from Google search or WhatsApp share | Browse content, see reviews, be converted to sign up | Varies |

### 2.4 Operating environment

| Surface | Platform | OS / Browser minimums |
|---|---|---|
| Mobile app | Flutter 3.22+ | Android 9.0 (API 28)+, iOS 14+ |
| Web app | Next.js 14+ App Router | Chrome/Edge/Safari/Firefox last 2 versions; responsive down to 360px |
| Admin (MVP) | Supabase Studio + Retool | Chrome/Edge last 2 versions |
| Admin (V2) | Next.js (separate app) | Same as web |
| Backend | Supabase (hosted Postgres + Edge Functions) + a thin Hono service on Fly.io or Railway | — |
| Storage | Firebase Storage | — |

### 2.5 Design and implementation constraints

| # | Constraint | Rationale |
|---|---|---|
| C-01 | **Flutter** for mobile, not React Native. | Founder preference; single codebase iOS + Android. |
| C-02 | **Next.js 14+ App Router** for web, with SSR on public creator/mini-site pages for SEO. | SEO is a primary wedge. |
| C-03 | **Supabase Postgres** as primary store, with Row-Level Security (RLS). | Single tenant DB, built-in auth integration. |
| C-04 | **Firebase Phone Auth** for OTP, not Supabase Auth. | Phone OTP in India — cheapest and most reliable path. |
| C-05 | **Razorpay** as sole PG/escrow provider for Phase 1. | UPI-first, Route for escrow, proven in India. |
| C-06 | **India-only.** All UI copy, currency, locale, legal docs target India. | Focused launch. |
| C-07 | **English-only UI** at launch, but all user-facing strings go through `intl` / ARB files from day one. | i18n architecture ready. |
| C-08 | **Amounts stored in paisa (integer)**, never in rupees (float). | Floating point is forbidden for money. |
| C-09 | **Monorepo** with `apps/mobile` (Flutter), `apps/web` (Next.js), `apps/api` (Hono TypeScript), `apps/admin` (deferred), `packages/shared`. | Single source of truth for types and schemas. |
| C-10 | **Admin panel is NOT custom-built for MVP.** Retool + Supabase Studio. Custom admin ships in V2. | Cannot fit in 3 months. |
| C-11 | **Platform fee is dynamic** — stored per creator and per category, defaulting from a global setting. | Founder has not committed to a single number. |
| C-12 | **No direct messaging** in Phase 1. | Cut for scope + moderation burden. |
| C-13 | **All public pages SSR-rendered with canonical URLs** and JSON-LD structured data. | SEO. |
| C-14 | **Category-adaptive content creation** — the wizard changes fields based on sub-category. | Specified in §4.4. |
| C-15 | **Accessibility: WCAG 2.1 AA** for web; platform accessibility APIs for mobile. | Legal + inclusion. |
| C-16 | **Analytics: PostHog** (self-hosted or cloud) with a strict PII allow-list. | DPDPA compliant by design. |
| C-17 | **Monochrome warm-neutral design system + coral as sole accent.** Palette: 7 warm neutrals (`#FAF7F4` surface → `#2C2823` ink) + 1 coral accent (`#E15A41`). Coral is reserved for **exactly five contexts**: (1) primary CTA buttons, (2) active save/bookmark icon, (3) location pin icon, (4) active bottom tab, (5) overnight stop pin on itinerary maps. Critical notification signals (unread dots, booking alerts) also use coral. All other visual differentiation via typography, iconography, opacity, and spacing. Per-vertical color accents are removed — each vertical is identified by a canonical Phosphor icon. Semantic colors (success `#1D9E75` / warning `#BA7517` / danger `#C2362F` / info `#185FA5`) exist only on functional states, never decoratively. See Appendix F for the full palette. (DD-013) |
| C-18 | **Typography locked: Fraunces + Inter.** Fraunces (display opsz/SOFT variant) for: display text, h1, h2, section headers, Discover page title, AND post detail body text (14px/1.65 line-height) and pull quotes (italic). Inter for: all h3 and below, all UI metadata, all non-post body text, and all content types other than post. This exception for post body text is intentional — long-form reading warrants a serif. Web uses `next/font` for loading; Flutter uses `google_fonts` package. See Appendix F. (DD-005, DD-026) |
| C-19 | **Iconography locked: Phosphor Icons.** Phosphor outline weight for inactive states; Phosphor fill weight for active states. No per-city emojis or decorative icons. Each vertical has a canonical Phosphor icon: Travel = `mountains`, Stories = `book-open`, Food = `fork-knife`, Fitness = `barbell`, Photography = `camera`, Wellness = `sun`, Music = `music-notes`, Education = `graduation-cap`. The coral `map-pin` icon is the sole city/location icon — used uniformly across all city cards and the location chip. (DD-005, DD-010) |
| C-20 | **Animation libraries locked.** Mobile (Flutter): `flutter_animate` for micro-animations; Lottie for milestone celebrations only. Web (Next.js): Framer Motion for all animations; `lottie-react` for milestone celebrations. Standard parameters: card press = scale 1.0 → 0.97, 120ms; section entrance = fade + 8px slide-up, 80ms stagger; sheet slide-up = 240ms cubic-bezier(0.32, 0.72, 0, 1); loading shimmer = 1.6s linear on warm gradient; milestone celebration = ~1s Lottie, auto-dismiss after 2s. (DD-008) |
| C-21 | **PostGIS enabled in Supabase by Week 1.** Seeded from GeoNames/OpenStreetMap (~4000 Indian cities). No `content_by_region` materialized views — use `ST_DWithin` queries directly at MVP scale. Migrate to Meilisearch geo search when content exceeds ~10k items (V1 timeline). (DD-009) |
| C-22 | **Google Places API required for itinerary publishing.** Autocomplete, Place Details, Place Photos APIs. All calls go through a server-side Hono proxy (`/api/places/*`) — API key never exposed to client. Rate limit: 100 requests per creator per hour. Cache place details in our DB once fetched. Estimated MVP cost: ~$200–300/month. (DD-028) |

### 2.6 User documentation

- In-app help screens (static, linked) — MVP
- A `/help` page on the web app with FAQs — MVP
- Creator onboarding guide (PDF + web) — V1
- Terms, Privacy, Community Guidelines, Refund Policy, Cancellation Policy, Cookie Policy — **MVP, legal-counsel-authored**

### 2.7 Assumptions and dependencies

| # | Assumption / dependency | Risk if false |
|---|---|---|
| A-01 | Razorpay Route is available to us and approves our use case. | Hard block — validate by **Week 1**. |
| A-02 | Firebase Auth phone OTP continues to work in India (TRAI, DLT compliance). | Fallback: MSG91 OTP. |
| A-03 | Supabase free/pro tier handles our MVP load (< 500 DAU at launch). | Migrate to paid tier. |
| A-04 | Legal counsel can deliver T&Cs, Privacy Policy, Community Guidelines by **Week 6**. | Cannot publish paid bookings without these. |
| A-05 | At least 15 creators can be recruited for a seed cohort before public launch. | Product has nothing to show. |
| A-06 | One additional full-stack engineer joins by **Week 4**. | Scope must be cut further. |
| A-07 | CGL + Professional Liability insurance can be sourced for adventure creators by V2. | Must defer adventure categories. |
| A-08 | **Google Places API is available, priced per current tier, with no usage restrictions blocking our itinerary spot editor.** Risk if false: replace with OpenStreetMap Nominatim (lower quality, free) or Mapbox Geocoding (comparable cost). (DD-028) |

---

## 3. Release strategy — what ships when

> The "consider all requirements in design but only build MVP now" rule is implemented here. Every requirement in §4 has a milestone tag. The database schema, API surface, folder structure, and module boundaries in §5 and §6 are designed to hold the **union** of all milestones.

### 3.1 Milestones at a glance

| Milestone | Ship | Duration | Headline |
|---|---|---|---|
| **M0 — Foundations** | Weeks 1–2 | 2 weeks | Repo, CI, auth, schema, legal docs drafted, Razorpay sandbox approved, seed creators contacted, PostGIS + Google Places API configured |
| **M1 — Private alpha** | Weeks 3–6 | 4 weeks | End-to-end **free posts + free itineraries + events**, home feed, creator profile, no payments, 15 seed creators |
| **M2 — Public MVP launch** | Weeks 7–12 | 6 weeks | **Paid scheduled experiences + paid itineraries**, Razorpay Route, KYC, reviews, reports, basic admin via Retool |
| **V1 — Growth features** | Weeks 13–22 | 10 weeks | Third vertical, search (Meilisearch), explore map, gamification, wishlist, creator analytics dashboard, tax summary, editorial curation |
| **V2 — Platform features** | Weeks 23–34 | 12 weeks | Custom admin panel, full compliance exports, adventure safety toolkit, desktop creator studio |
| **Phase 2 (DEF)** | Post-V2 | — | DMs, multi-language, brand sponsorships, subscriptions, international, AI assistant, live streams |

### 3.2 What MVP (M0+M1+M2) is NOT

- No DMs
- No search bar that hits a real search engine — MVP uses Postgres `tsvector` only
- No map view for Explore (list only for MVP Explore)
- No gamification (points/streaks/badges)
- No custom admin panel — Supabase Studio + Retool queries
- No creator analytics dashboard — creators see counts only
- No Hindi / regional languages
- No brand sponsorships / subscriptions
- No blog / CMS
- No referral program
- No scheduled publishing
- No "version history" or drafts beyond one auto-saved draft per content type
- No desktop-only creator studio — same web UI for all viewports

*(Note: Events and groups are **in** MVP as of v1.2, promoted from V2 per DD-025.)*

### 3.3 What MVP MUST have (non-negotiable)

- Phone OTP sign-up → location → vertical interests → creators → feed (5-step onboarding, ≤ 60 seconds) (DD-004, DD-009)
- **Guest browsing** with soft auth wall on protected actions (DD-003, DD-016)
- Create & publish Post
- Create & publish Self-paced Itinerary (free and paid, spot-based) (DD-023)
- Create & publish Scheduled Experience (paid, multi-date) (DD-021)
- Create & publish Event (free or paid, single occurrence) (DD-025)
- Creator KYC (PAN + Aadhaar OTP + bank penny drop) for paid content
- **Section-based home feed** with vertical sections, Near you rail, location chip, nearest-neighbor waterfall (DD-007, DD-009)
- Creator mini-site (SSR on web, deep-linked on mobile)
- Follow / unfollow
- Like / comment / save (global save state per DD-017)
- WhatsApp share as first-class action (DD-019)
- Booking flow with Razorpay Route escrow, UPI-first (paid content)
- Payout to creator after completion + 48-hour dispute window
- Review after completed experience (blind, 14-day reveal)
- Report content / user
- Notifications (push + email)
- Terms, Privacy, Community Guidelines, Refund Policy, Cancellation Policy live
- DPDPA consent flows + data export + deletion + search history clearing (DD-015)
- GST collection on bookings
- 1% TDS under Section 194-O

### 3.4 Rule of scope

If a requirement in §4 does not have an `M0`, `M1`, or `M2` tag, **it is not in the MVP.** Do not build it. Do not optimise for it. The database model and API must *accommodate* it, but no UI, no server logic, no tests.

---

## 4. Functional requirements

> Format: each requirement has an ID, a milestone tag, a title, a description, acceptance criteria, and (where relevant) UI notes. Critical business rules are called out as `BR-*` under their parent requirement.

### 4.1 Identity, Access, Auth (IAM)

#### IAM-FR-001 · [M0] · Phone-number sign-up and sign-in

**Description.** A user signs up or signs in using their Indian mobile number (+91). A 6-digit OTP is sent via Firebase Phone Auth. On successful verification, Firebase issues an ID token; the backend exchanges it for a `<AppName>` session.

**Acceptance criteria:**
- Entering a valid +91 number sends an OTP within 5 seconds in ≥95% of attempts.
- OTP is 6 digits, valid for 10 minutes, max 5 verify attempts before lockout.
- Successful verify creates a `users` row if none exists (first-time), or signs in an existing user.
- Resend OTP allowed after 30 seconds, max 3 resends per 10 minutes.
- Rate limit: 5 OTP requests per phone number per hour (enforced server-side).

**BR-IAM-001.** The backend **never** trusts a Firebase ID token alone — it verifies the token on every auth'd request.

**BR-IAM-002.** A user record is created only after successful OTP verification, never on OTP send.

---

#### IAM-FR-002 · [M0] · Session management

**Description.** Sessions persist across app launches. Web uses HttpOnly secure cookies; mobile uses a refresh token in flutter_secure_storage / iOS Keychain / Android Keystore.

**Acceptance criteria:**
- Mobile session valid for 90 days rolling; idle > 30 days → sign out.
- Web session valid for 30 days, refreshed on each request.
- Sign-out revokes the refresh token server-side and clears local storage.
- Multi-device allowed; new device sign-in writes an activity audit record.

---

#### IAM-FR-003 · [M2] · Account deletion

**Description.** DPDPA 2023 §12 right to erasure. Soft-delete for 30 days, then hard delete of PII. Bookings and reviews are anonymised, not deleted (legal retention). Creator with live bookings cannot delete until resolved.

---

#### IAM-FR-004 · [V1] · Email-as-secondary-identifier

Deferred. Email for notifications and recovery; not a login method in Phase 1.

---

#### IAM-FR-005 · [M0] · Social login (Google, Apple)

**Description.** Google and Apple sign-in are supported as secondary auth paths, primarily surfaced in the soft auth wall (DD-016). These allow users to complete auth without a phone number when they prefer social login. Database supports multiple auth providers per user. (Promoted from [DEF] to [M0] per DD-016.)

**Acceptance criteria:**
- "Continue with Google" available on Android and web.
- "Continue with Apple" available on iOS.
- On successful social login, the user's original intent (e.g., the save or follow that triggered the soft auth wall) is automatically performed.
- If a social login email matches an existing phone-auth account, the two are linked.

---

#### IAM-FR-006 · [M2] · KYC onboarding for creators who monetise

**Description.** Before a creator can publish paid content or receive payouts: PAN verification, Aadhaar OTP, bank account penny drop.

**Acceptance criteria:**
- PAN via Razorpay/Cashfree KYC API — name must fuzzy-match Aadhaar name (2 char tolerance).
- Aadhaar OTP via Digilocker or UIDAI API.
- Bank penny drop (₹1) — beneficiary name must match PAN name.
- Creator blocked from publishing paid content until `kyc_status = verified`.
- Free posts and free itineraries publishable without KYC. (DD-027)
- KYC docs encrypted at rest, access audit-logged.

---

#### IAM-FR-010 · [M0] · Guest browsing

**Description.** Unauthenticated users may browse freely without being forced to sign up. Guest browsing is the default path after the welcome screen's "Browse as guest" CTA. (DD-003)

**Acceptance criteria:**
- Unauthenticated users can access: home feed, discover/search, experience detail pages, creator mini-site profiles, vertical hubs.
- Unauthenticated users can save items to a **device-local temporary list** (cleared on app uninstall or after 30 days). The soft auth wall (IAM-FR-011) offers to persist these when the user signs up.
- All content visible to guests is identical to content visible to logged-in users for SEO indexing purposes. No wall before content display.
- Web crawlers (Googlebot, Bingbot) are excluded from soft auth walls via user-agent allow-list.

---

#### IAM-FR-011 · [M0] · Soft auth wall

**Description.** When a guest user attempts a protected action, a bottom sheet slides up over the current screen — preserving scroll position — presenting sign-in / sign-up options in context. (DD-016)

**Triggers:** `book`, `save_permanent`, `follow`, `comment`, `like`, `publish`.

**Sheet anatomy:**
- Drag handle, warm-sunken lock icon block.
- Fraunces title "Sign in to continue".
- **Context-aware subhead** interpolated from caller props:
  - `save` → "We'll keep {content_title} saved for you"
  - `book` → "We'll hold your spot for {content_title}"
  - `follow` → "We'll keep you updated on {creator_name}"
  - `publish` → "We'll save your draft of {content_title}"
  - `comment` → "We'll let {creator_name} know what you think"
- Primary CTA: coral "Continue with phone" (OTP).
- Secondary CTA: outlined "Continue with Google" (and "Continue with Apple" on iOS).
- Tertiary text: "Not now" — dismisses sheet, preserves scroll.
- Legal fine-print line linking Terms and Privacy Policy.

**Acceptance criteria:**
- On successful sign-in, the original triggering intent is automatically performed — never lost.
- "Not now" does not permanently block — the same action re-triggers the sheet on next tap.
- Context props are sanitized before interpolation (XSS-safe).

---

### 4.2 Onboarding (ONB)

#### ONB-FR-001 · [M0] · Onboarding flow structure — welcome screen

**Description.** The welcome screen offers three entry paths: "Sign up" (primary coral CTA), "Sign in" (secondary outlined CTA), "Browse as guest" (tertiary text link). The welcome screen is shown only on first launch. (DD-003, DD-004)

**Acceptance criteria:**
- Tapping "Sign up" or "Sign in" enters the phone OTP flow (IAM-FR-001).
- Tapping "Browse as guest" goes directly to the home feed without any account creation.
- Welcome screen is shown only on first launch; subsequent launches go directly to the feed if a session exists.

---

#### ONB-FR-002 · [M0] · Onboarding step 2 — location capture (mandatory) (DD-009)

**Description.** After OTP verification, the user must provide their current location before proceeding. Location can be provided via one-tap GPS detection or manual city search. No skip option. (DD-009)

**Acceptance criteria:**
- "Use my location" button triggers system GPS permission dialog. On permission grant, detects city and auto-fills the picker with the nearest city from the `cities` table.
- Manual picker has a search field querying the full cities table (~4000 cities) with fuzzy match.
- If GPS permission is denied, fallback is manual picker — no re-prompt in the same session.
- User cannot proceed to step 3 without a `current_city_id` set.
- The progress bar shows 5 segments (phone, location, categories, creators, done). (DD-009)

---

#### ONB-FR-003 · [M0] · Onboarding step 3 — vertical interests (minimum 3) (DD-004)

**Description.** User picks ≥3 verticals from the full list of 8. Each vertical card shows the vertical icon (Phosphor, C-19), vertical name, and creator count. Verticals with content count ≤ 10 show a "soon" marker; verticals with count = 0 show "coming soon". (DD-002, DD-004)

**Acceptance criteria:**
- User must select ≥3 verticals to enable the Continue button.
- Continue button is always visible; tapping it when < 3 selected shows inline "Pick at least 3 to continue" feedback.
- Selection writes to `user_active_verticals` table.
- Verticals with ≤ 10 published creators are additionally written to `user_waitlisted_verticals`. (DD-002)

---

#### ONB-FR-004 · [M0] · Onboarding step 4 — follow suggested creators (skippable) (DD-004)

**Description.** A curated list of suggested creators personalised to the user's selected verticals. Skip affordance ("I'll do this later") is prominent. (DD-004)

**Acceptance criteria:**
- Suggested creators are filtered and ranked by selected verticals.
- Tapping Follow creates a `follows` row immediately (no page transition).
- Skipping sets no follows; user proceeds to next step.

---

#### ONB-FR-005 · [M0] · Onboarding step 5 — milestone celebration + first feed (DD-004)

**Description.** After the creator follow step, a celebration screen (Lottie animation, ~1 second) auto-dismisses after 2 seconds. Manual fallback button "Take me there" for slow devices. Then the first home feed view shows. (DD-004)

**Acceptance criteria:**
- Celebration animation plays once on first onboarding completion only — never on subsequent launches.
- First home feed view shows an onboarding-tasks card: "Account created ✓, Categories picked ✓, Following {N}/5 creators."

---

#### ONB-FR-007 · [M0] · Vertical picker — honest live counts with "soon" markers (DD-002)

**Description.** The vertical picker in onboarding shows all 8 verticals at all times with real-time creator counts. (DD-002)

**Acceptance criteria:**
- Creator count is the live count of `published` creators in that vertical.
- Verticals with count > 10: show count only (e.g. "142 creators").
- Verticals with 1–10 creators: show count + "soon" marker (e.g. "8 creators · soon").
- Verticals with 0 creators: show "coming soon" without a count.
- Count data is fetched at onboarding start and cached for the session; not real-time per keystroke.

---

#### ONB-FR-008 · [M0] · Waitlist signal on low-content vertical selection (DD-002)

**Description.** When a user selects a vertical with content count ≤ 10 during onboarding, their selection is additionally recorded in `user_waitlisted_verticals`. (DD-002)

**Schema:**
```sql
CREATE TABLE user_waitlisted_verticals (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  vertical text NOT NULL,
  created_at timestamptz DEFAULT now(),
  notified_at timestamptz NULL,
  PRIMARY KEY (user_id, vertical)
);
```

---

#### ONB-FR-009 · [V1] · Waitlist notification on vertical launch (DD-002)

**Description.** When a vertical reaches ≥5 published creators with ≥1 piece of content each, the system fires a one-time push + email notification to all users in `user_waitlisted_verticals` for that vertical. (DD-002)

---

#### ONB-FR-010 · [M0] · All cities equally valid in location picker (DD-009)

**Description.** The city picker queries the full `cities` table — no tier filtering. Any of the ~4000 cities in the dataset can be selected as the user's current location. (DD-009)

---

#### ONB-FR-011 · [M0] · Progress bar has 5 segments (DD-009)

**Description.** The onboarding progress bar has 5 segments representing: phone + OTP, location, categories, creators, done. Visible throughout the flow. (DD-009)

---

### 4.3 Profile & Creator mini-site (PROF)

#### PROF-FR-001 · [M1] · View own profile

**Description.** Avatar, name, bio, counts (followers, following, posts, experiences), tabs (Posts / Experiences / Reviews received / Saved).

---

#### PROF-FR-002 · [M1] · Edit profile

Edit display name, bio, avatar, cover, home city, languages, categories, social links.

**BR-PROF-002.** Profile photo and cover must pass image moderation (TS-FR-005).

---

#### PROF-FR-003 · [M1] · Public creator mini-site (web, SSR)

**Description.** Every creator has a public URL: `<AppName>.in/@username`. Server-rendered with complete HTML on first byte. Sections: hero, featured experiences, all posts, all experiences, reviews, stats, contact/report. OpenGraph tags + JSON-LD (`Person`, `TouristTrip`, `Product`). Canonical URL in `sitemap.xml`. Loads < 2.5 s LCP on 4G. Works unauthenticated.

**BR-PROF-003.** Usernames: 3–20 chars, lowercase alphanumeric + underscore, reserved list for system paths.

---

#### PROF-FR-004 · [M1] · Public creator mini-site (mobile deep link)

iOS Universal Link + Android App Link → native view.

---

#### PROF-FR-005 · [V1] · Creator analytics — basic

Views, follows, saves, bookings, earnings, conversion rate.

---

#### PROF-FR-006 · [V2] · Custom domain

CNAME to mini-site. **Deferred.**

---

### 4.4 Content creation (CRT)

> This is the most complex area. Read §4.4 in full before implementing any creation flow.
> Content types: `post | event | scheduled_experience | self_paced_itinerary` (DD-022)

#### CRT-FR-001 · [M1] · Create a Post (DD-022, DD-027)

**Description.** Long-form text content. Text + hero image + inline media. No booking, no price, no KYC required. Monetisation is indirect via follower growth. Stories creators — those who publish only posts — never need KYC. (DD-027)

**Acceptance criteria:**
- Max 1000 chars, live counter.
- Max 5 images, max 5 MB each (client-side compressed to ≤ 1 MB).
- Optional location tag (single point), optional vertical + sub-category tag.
- Auto-save draft every 10 seconds to local storage.
- Single-tap publish.
- On publish: `status='published'`, `type='post'`, `visibility='public'`; enqueued for image moderation.
- No price field, no booking CTA on post detail pages. (DD-027)
- Post detail body text uses Fraunces 14px/1.65. Pull quotes use Fraunces italic. (DD-026)

---

#### CRT-FR-002 · [M1] · Create a Self-paced Itinerary (DD-022, DD-023)

**Description.** Map-first, spot-based curated travel guide. Organised as days of spots with creator notes — not chapters of text. Freemium: Day 1's spots are auto-marked as free preview. (DD-023)

**Wizard shape:**

| Step | Name | Fields |
|---|---|---|
| 1 | Basics | Title (5–100 chars), cover image, short description (max 280 chars), sub-category (from 12 travel sub-categories), tags (max 5) |
| 2 | Trip overview | Duration (days), total distance (auto-computed from spots), starting city, destination cities, budget range |
| 3 | **Day builder** | For each day: title, description. Then **spot picker** powered by Google Places autocomplete (see CRT-FR-003) |
| 4 | Media | Up to 10 images |
| 5 | Pricing & access | Free / Paid. If Paid: price in ₹, GST, what's included, refund policy pick-list |
| 6 | Review & publish | Preview, T&Cs checkbox (unticked by default), publish |

**Acceptance criteria:**
- Auto-save draft every 30 seconds, server-side.
- One draft per user per content type in MVP.
- Paid itineraries require KYC verified before publish.
- On publish: emit `content.published` event → search indexer + feed fan-out.
- Day 1's spots are automatically set `is_free_preview = true`. (DD-023)

---

#### CRT-FR-003 · [M1] · Itinerary spot-based day builder (DD-023)

**Description.** Inside the day builder step, the creator adds spots to each day using Google Places autocomplete. This replaces the old segment/time-block builder. (DD-023)

**For each spot:**
- Creator searches a place name → Google Places autocomplete returns suggestions with `place_id`.
- On selection, the system auto-fills: name, `place_id`, lat/long point, category, thumbnail from Google Places Photos API.
- Creator adds: `creator_note` (e.g. "Come at 10am before tour buses"), `duration_minutes`, `stop_type` (regular / overnight / meal / viewpoint / activity).
- Creator marks exactly one spot per day as `overnight` (unless a day trip with no overnight stay).

**Acceptance criteria:**
- Add/remove/reorder spots within a day (drag handle on mobile, keyboard on web).
- Minimum 1 spot per day.
- Spots render on a per-day map as pins. Overnight spots render as larger coral pins; other spots use ink pins. (DD-024)
- Place details are cached in our DB after first fetch — not re-fetched on every view.
- All Places API calls routed through server-side proxy at `/api/places/*`. (DD-028)

---

#### CRT-FR-004 · [M1 for Road Trips, Street Food, Adventure; V1 for all 12] · Category-adaptive fields

The publishing wizard adapts to the selected sub-category. Travel sub-categories with extra fields in MVP:

| Sub-category | Extra fields |
|---|---|
| **Road Trips & Biking** | Vehicle type, route map, fuel cost estimate, toll cost, road condition notes, parking notes |
| **Food Trails** | Dish list, diet tags (veg/non-veg/jain/vegan), hygiene rating, allergen warnings |
| **Adventure & Sports** | **Mandatory**: things to avoid, required gear, fitness level, guide mandatory?, emergency contacts, altitude, monsoon safety, insurance mandatory flag |
| Others | Generic fallback field set until V1 |

**BR-CRT-004-A.** For **Adventure & Sports**, `things_to_avoid` is **mandatory**. Cannot publish without it.

---

#### CRT-FR-005 · [M2] · Create a Scheduled Experience (DD-022, DD-021)

**Description.** Creator-led multi-day experience with multiple future departure dates, fixed capacity per date, and a private meeting point shared 24 hours before start. Always paid. Always requires KYC. (DD-021)

**Fields (beyond itinerary basics):**
- One or more departure date ranges via `scheduled_dates` table.
- `capacity` per date (required at publish).
- Price per person (in paisa).
- Cancellation policy pick-list: flexible / moderate / strict.
- Meeting point: city, location description (public), exact address (private — shared in booking confirmation 24hr before start).
- Inclusions / exclusions (checklist).
- GST rate (auto-computed, editable by finance admin).

**Acceptance criteria:**
- Must have ≥1 row in `scheduled_dates` to publish.
- Capacity check is transactional (prevents overselling). (DD-021)
- Meeting point `exact_location` is never returned by the public content API — only via the booking confirmation endpoint. (DD-021)

---

#### CRT-FR-006 · (deprecated) · Events — removed from V2 deferral

Events are now **M0** scope per DD-025. See **CRT-FR-013**.

---

#### CRT-FR-007 · [M1] · Auto-save drafts

See CRT-FR-002.

---

#### CRT-FR-008 · [M1] · Publish / unpublish / archive

States: `draft` → `under_review` → `published` → `unpublished` | `archived`. Moderator can force-move to `rejected` or `takedown`.

---

#### CRT-FR-009 · [V1] · Scheduled publishing

Deferred.

---

#### CRT-FR-010 · [V1] · Version history

Deferred.

---

#### CRT-FR-011 · [V2] · AI content assistant

Deferred.

---

#### CRT-FR-012 · [M1] · Media upload pipeline

Client compresses (max 1 MB per image) → signed upload URL to Firebase Storage → server generates thumbnails (200/600/1200 px). EXIF GPS stripped on upload. HEIC → JPEG server-side. Max 10 MB per file.

---

#### CRT-FR-013 · [M0] · Create an Event (DD-025, DD-022)

**Description.** A single-occurrence, time-bound, fixed-venue experience. Under 24 hours. Community/meetup feel. Free or low-cost. Promoted from V2 to M0. (DD-025)

**Distinction from Scheduled Experience:** Event has a single date/time, public venue address (users must know if they can get there before RSVPing), community RSVP feel vs commercial booking feel.

**Fields:**
- Title, description (max 500 chars), cover image.
- `start_at` + `end_at` timestamptz (must be same day for M0; multi-day events = V1).
- Venue name (required) + venue address (public — shown before RSVP).
- City (from `cities` table).
- Capacity (required).
- Is free / price in paisa.
- Optional: dress code, age restriction, what to bring.

**Acceptance criteria:**
- `event_occurrences` row created on publish.
- Venue address is public — shown on the event detail page before RSVP / booking.
- RSVP action (free events) creates a booking row with `price = 0`.
- Paid events follow the same booking flow as paid itineraries.
- `spots_booked` updated transactionally. (DD-025)

---

### 4.5 Discovery & Search (DISC)

#### DISC-FR-001 · [M1] · Home feed — section-based structure (DD-007)

**Description.** The home feed is organised into **named, independent sections**, each with a Fraunces section header and a consistent content shape. Sections are fetched and rendered independently. A section with no data is **hidden** — not replaced with a placeholder or error. There are no "For You" or "Following" tabs. (DD-007)

**Top-down structure:**
1. **Top bar** — location chip (coral `map-pin` + city name) + search icon + notifications icon. Sticky.
2. **Vertical filter chips** — All · Travel · Stories · plus unshipped verticals with "soon" pill. Each chip shows a Phosphor outline icon next to the text label. (DD-011)
3. **Pick up where you left off** — compact horizontal list card, shown only if user has in-progress self-paced content.
4. **Near you section** — mixed content types anchored by location (DD-022).
5. **Per-vertical sections** — one section per vertical the user selected, ordered by engagement strength.
6. **Waitlist cards** — for user-selected verticals with no content yet. Dashed-border card (DD-012).
7. **Discover something new** — serendipity section from verticals the user did NOT pick.

**Acceptance criteria:**
- Each section header shows the section title in Fraunces + a Phosphor icon.
- All sections are independent — a single section failing does not break others.
- Per-vertical sections use horizontal rails.
- Feed supports pull-to-refresh.
- Empty state shown only when ALL sections return empty.

---

#### DISC-FR-002 · [M1] · Home feed — section data fetching rules (DD-007)

**Description.** Rules for when each section is shown and what it contains. (DD-007)

**Acceptance criteria:**
- **Near you:** queries `content` with `ST_DWithin` against `user.current_location_point` using the nearest-neighbor waterfall (DISC-FR-027). Shows trips + stories in MVP; events and meetups added in V1.
- **Per-vertical sections:** `section_content(user_id, vertical, limit)` ordered by interest strength × recency × engagement.
- **Waitlist card:** shown when the user has a `user_waitlisted_verticals` row for that vertical and the vertical has fewer than 5 published creators.
- **Discover something new:** `discover_creators(user_id, exclude_verticals=user_picks, limit)` — returns creators from verticals outside user picks.
- **Pick up where you left off:** queries `user_content_progress` for the most recent self-paced content with progress > 0 and < 100%.
- All sections independently cached with appropriate TTLs (Near you: 30 min; per-vertical: 15 min; Discover: 1 hour).

---

#### DISC-FR-003 · [M1] · Category browse (DD-006)

**Description.** Tap a vertical chip → sub-category browse screen. Within a sub-category → leaf-type filter row. Content sorted by recency within the selected taxonomy node. (DD-006)

**Acceptance criteria:**
- Browse path: vertical → sub-category → (optional) leaf type.
- Each level shows a count of matching content items.
- Facet filters (group_size, budget, difficulty, duration, season) available at any level.

---

#### DISC-FR-004 · [V1] · Explore — list view

Browse all content with filters: sub-category, budget, duration, difficulty, region, season.

---

#### DISC-FR-005 · [V1] · Explore — map view

Same as list, but on a map. Pin clustering, tap pin → bottom sheet preview.

---

#### DISC-FR-006 · [M0] · Search (MVP: Postgres tsvector; V1: Meilisearch)

**Description.** Single search bar. Queries title, description, creator name, tags, city, sub-category. MVP backed by Postgres `tsvector`. V1 migrates to Meilisearch. Search history and analytics per DD-015. (DD-015)

**Acceptance criteria:**
- Typeahead suggestions after 2 chars, < 300 ms response.
- Filters applied on top of results (see DISC-FR-034).
- Authenticated user queries logged to `search_queries`. Guest queries stored client-side only. (DD-015)
- Search field placeholder rotates through top platform searches. (DISC-FR-037)

---

#### DISC-FR-007 · [M2] · SEO for public pages

All public pages SSR'd by Next.js. Complete HTML, OpenGraph + JSON-LD, in `sitemap.xml`, honour `robots.txt`. Open Graph metadata required for every public content URL (og:title, og:description, og:image, og:url, og:type) to support WhatsApp preview cards. (DD-019)

---

#### DISC-FR-008 · [V1] · Category / city landing pages

`<AppName>.in/travel/spiti`, `<AppName>.in/travel/himachal`, etc.

---

#### DISC-FR-020 · [M0] · Home feed — independent section architecture (DD-007)

**Description.** Each home feed section is a React/Flutter widget that fetches its own data endpoint and renders independently. If a section's API call fails or returns empty, the section widget removes itself from the feed DOM silently. (DD-007)

---

#### DISC-FR-021 · [M0] · Home feed — fixed section order (DD-007, DD-011)

**Description.** Section order is fixed: (1) Pick up where you left off [conditional], (2) Near you, (3) User's picked verticals in engagement-strength order, (4) Waitlist cards for picked-but-empty verticals, (5) Discover something new. **No time-of-day greeting block.** The top bar with location chip and vertical filter chips leads directly into content. (DD-007, DD-011)

---

#### DISC-FR-022 · [M0] · Near you section — mixed content types (DD-007)

**Description.** The Near you section surfaces content from multiple types (trips and stories in MVP; events in V1) anchored by the user's current location. Uses the nearest-neighbor waterfall (DISC-FR-027). Content from multiple origins is deduped and sorted by location proximity + recency. (DD-007)

---

#### DISC-FR-023 · [M0] · Per-vertical sections — content shape and rail layout (DD-007)

**Description.** Each per-vertical section uses the vertical's canonical Phosphor icon in the section header, and rail-based horizontal scroll. Travel sections use photo-forward rail cards. Stories sections use horizontal list cards with small thumbnails (text is the hero). (DD-007)

---

#### DISC-FR-024 · [M0] · Waitlist card for empty-vertical sections (DD-007, DD-012)

**Description.** For verticals the user selected during onboarding that have no content yet, the section renders as a **single dashed-border waitlist card** instead of a content rail. Card shows: vertical icon, "You're on the {vertical} waitlist", current creator count ("X creators have joined so far"), and "We'll notify you when this goes live." Card is tappable and opens a vertical-specific "coming soon" page. (DD-007, DD-012)

---

#### DISC-FR-025 · [M0] · Discover something new — serendipity section (DD-007)

**Description.** The last section on every home feed is a serendipity section surfacing creators and content from **verticals the user did NOT pick** during onboarding. Uses a vertical creator chip rail component. Designed to prevent filter bubbles. Hidden if there are no other-vertical creators yet. (DD-007)

---

#### DISC-FR-026 · [M0] · Home feed top bar — location chip (DD-009)

**Description.** The home feed top bar shows a location chip on the left: coral `map-pin` icon + "You're in {city name}". Tapping opens a location picker bottom sheet where the user can search for and set any city from the full `cities` table. (DD-009)

---

#### DISC-FR-027 · [M0] · Nearest-neighbor waterfall for location-scoped rails (DD-009)

**Description.** For any location-scoped content query (Near you, trips from city), the server runs a cascading waterfall: (DD-009)

1. **Exact city match:** `content.starting_city_id = user.current_city_id` — returns results with label "Weekend trips from {city}"
2. **If < 5 results, expand to 200 km radius:** `ST_DWithin(content.starting_city_point, user.current_location_point, 200000)` — label "Trips around you"
3. **If < 5 results, expand to 500 km radius** — label "Trips near you"
4. **If still empty, India-wide popular** — label "Popular trips across India"

When any fallback level is used, a honesty banner is shown above the rail (see DISC-FR-028).

---

#### DISC-FR-028 · [M0] · Location fallback honesty banner (DD-009)

**Description.** When the nearest-neighbor waterfall uses a radius expansion (levels 2–4), a warm-tinted banner appears above the rail naming the specific nearby cities being pulled from. Example: *"Nothing in Shirdi yet — showing trips starting from Nashik, Aurangabad, and Pune within a few hours of you."* (DD-009)

**BR-DISC-028.** This banner must NOT be hidden for "cleaner UI" reasons. It is a trust requirement — users who don't understand the fallback assume the app is broken.

---

#### DISC-FR-029 · [M0] · Cities table — full Indian dataset (DD-009)

**Description.** The `cities` table is seeded with the comprehensive Indian cities dataset (OpenStreetMap or GeoNames, minimum 4000 cities). All cities are equal — no tier-1/tier-3 distinction. New cities added via migration only, not user-editable. (DD-009)

---

#### DISC-FR-030 · [M0] · GPS location refresh cadence (DD-009)

**Description.** Current location is refreshed from GPS on each app foreground if (a) GPS permission is granted AND (b) last refresh was > 1 hour ago. Manual picker selection overrides GPS until next app foreground. If `current_city_id` is null on feed load (interrupted onboarding edge case), a modal requires city selection before the feed is shown. (DD-009)

---

#### DISC-FR-031 · [M0] · Vertical filter chips — icons (DD-011)

**Description.** The horizontal vertical filter chip row on the home feed displays a Phosphor outline icon (11px) next to the text label for each vertical chip. Icons match the canonical vertical icons from C-19. The "All" chip has no icon. "soon" vertical chips show at 60% opacity. (DD-011)

---

#### DISC-FR-032 · [M0] · Discover tab — default browse mode (DD-014)

**Description.** The Discover tab defaults to browse mode. Top-down structure: (1) page title "Discover" in Fraunces display + Inter subhead, (2) prominent 50px search field with rotating placeholder + filter icon, (3) 2×4 category grid of all 8 verticals as monochrome tiles with Phosphor outline icons, vertical name, and creator count (waitlisted verticals at 60% opacity with "soon" pill), (4) editorial collections rail, (5) city chip rail with coral `map-pin` + city name + trip count. (DD-014)

---

#### DISC-FR-033 · [M0] · Discover tab — search active overlay (DD-014)

**Description.** Tapping the search field opens a full-screen search overlay. Shows: recent searches as chips (up to 5), then live-updating suggestions grouped by result type (trips, cities, creators, posts) as the user types. Matching characters in results are bolded. Minimum 2 chars before suggestions fire. (DD-014)

---

#### DISC-FR-034 · [M0] · Discover tab — filter sheet (DD-014)

**Description.** Filter sheet triggered by filter icon in search field or "Filters" button on search results screen. Bottom sheet with drag handle. Facet groups: Duration (Day trip / Weekend / 3–5 days / 6+ days), Budget per person (4 ranges: under ₹2k / ₹2k–5k / ₹5k–15k / ₹15k+), Group size (Solo / Couple / Small / Group), Difficulty (Easy / Moderate / Challenging). Multi-select per group. Apply CTA (coral) shows live result count as user toggles facets. (DD-014)

---

#### DISC-FR-035 · [M0] · Editorial collections (DD-014 + DD-014 amendment)

**Description.** The Discover tab shows a horizontal rail of editorial collections. In MVP these are **algorithmically generated** from templates (e.g. "New in Travel", "Popular in {city}", "Under ₹{budget}", "By creators you don't follow") — no human curation. Templates execute as queries and are cached per user per day. In V1, the admin panel gains manual curation tools (ADM-FR-009). Manual collections (when active) appear above algorithmic ones. (DD-014, DD-014 amendment)

---

#### DISC-FR-036 · [M0] · Search query logging (DD-015)

**Description.** All search queries by authenticated users are logged to `search_queries` with query text, normalized query, result count, and click outcome (which result the user tapped, if any). Guest user searches are stored client-side only and are never logged server-side. (DD-015)

**Privacy:** 90-day rolling retention. Daily cron deletes rows older than 90 days. Users can clear via Settings → Privacy (see PRIV-FR-010). (DD-015)

---

#### DISC-FR-037 · [M0] · Discover search field — rotating placeholder (DD-015)

**Description.** The search field placeholder rotates through real top-searches from the `top_searches_7d` materialized view every 3 seconds while the field is unfocused. Format: "Try {query}" or "Search {query}". Falls back to seeded defaults from `search_placeholder_defaults` when aggregate data has < 10 searches per query in the last 7 days (prevents early-stage weirdness with "test" queries becoming placeholders). (DD-015)

---

#### DISC-FR-038 · [V1] · Trending searches section on Discover (DD-015)

**Description.** A "Trending searches" section on the Discover browse screen shows the top 5–8 platform searches as tap-to-search chips. Hidden when the confidence threshold is not met (< 5 queries with ≥ 10 occurrences each). Uses `top_searches_7d` materialized view. (DD-015)

---

### 4.6 Social graph (SOC)

#### SOC-FR-001 · [M1] · Follow / unfollow a creator

Follow toggles a `follows` row. Fires notification to creator (batched).

**BR-SOC-001.** Follow count is eventually consistent — cached column with trigger + periodic reconcile.

---

#### SOC-FR-002 · [M1] · Like a content item

Tap heart → `likes` row. Optimistic UI. Undo on double-tap.

---

#### SOC-FR-003 · [M1] · Comment on a content item

Threaded one level deep. Max 500 chars. Rate limit: 10 per user per minute. Comments pass text moderation (TS-FR-004).

---

#### SOC-FR-004 · [M1] · Save / bookmark a content item (DD-017)

**Description.** Tap the bookmark icon on any content card or detail page to save. Save state is a **global user-content relationship** (`user_saves` table), not per-screen UI state. The filled coral bookmark icon must appear on that item on every surface it appears — feed, search results, Saved tab, creator mini-site — once it is saved. (DD-017)

**Acceptance criteria:**
- Icon renders filled coral when saved, ink outline when unsaved.
- Save actions are **optimistically** updated on client — filled state appears immediately. Server call is fire-and-forget.
- On server failure, revert quietly to outline state (no error toast).
- Never block the UI on a save action.
- Guest saves live in device local storage until sign-up via soft auth wall (IAM-FR-011). The soft auth wall offers to persist them.
- Single collection in MVP; multiple collections = V1. (DD-017)

---

#### SOC-FR-005 · [M1] · Share a content item (DD-019)

**Description.** Two share paths exist on every detail page: (DD-019)

1. **Dedicated WhatsApp button** — opens WhatsApp with pre-filled text: *"Check out {title} on `<AppName>`: {canonical_url}"* using the `https://wa.me/?text={url-encoded-text}` deep link scheme.
2. **Generic share button** — opens the native share sheet (Flutter: `share_plus`, web: Web Share API with copy-link fallback).

Both use the canonical SSR URL. Open Graph metadata (og:title, og:description, og:image, og:url, og:type) is emitted on all public content pages so WhatsApp preview cards render correctly. (DD-019)

---

#### SOC-FR-006 · [V1] · Repost / reshare

Deferred.

---

#### SOC-FR-007 · [DEF] · Direct messages

Deferred to Phase 2.

---

### 4.7 Bookings & Payments (BOOK)

#### BOOK-FR-001 · [M2] · Booking flow — paid itinerary

Follower taps "Get full itinerary" → sign-in required → booking summary (price breakdown incl. GST) → payment (Razorpay Checkout, UPI default) → confirmation. Payment held in Razorpay Route escrow.

---

#### BOOK-FR-002 · [M2] · Booking flow — paid scheduled experience

Same as BOOK-FR-001 but with date selection. User picks a departure date from `scheduled_dates` → `spots_booked` checked against `capacity` (DD-021) → optimistic 10-minute seat hold → payment → confirmed or released.

**Acceptance criteria:**
- Hard capacity check using `scheduled_dates.spots_booked`. (DD-021)
- If payment times out, hold released and `spots_booked` decremented.

---

#### BOOK-FR-003 · [M2] · Free-itinerary "booking" (virtual booking)

Free itinerary "Save as my trip plan" creates a booking row with `price = 0`. Used for analytics.

---

#### BOOK-FR-004 · [M2] · Price breakdown and tax

Every paid booking shows base price, GST (18%), convenience fee (if any), total. Backend: creator payable = base − platform_fee − tds(1%). All amounts in paisa.

---

#### BOOK-FR-005 · [M2] · Escrow + payout via Razorpay Route

Customer payment → platform Razorpay account. Route auto-transfers creator share after completion + 48h dispute window. Payout T+2 business days.

---

#### BOOK-FR-006 · [M2] · Refunds and cancellations

Policies: flexible (full refund up to 7 days), moderate (50% up to 3 days), strict (no refund). Follower-initiated or creator-initiated cancellation per policy.

---

#### BOOK-FR-007 · [M2] · Booking state machine

States: `pending_payment → paid → confirmed → in_progress → completed → reviewed` and side paths `cancelled_by_user`, `cancelled_by_creator`, `refunded`, `disputed`. See Appendix C.

---

#### BOOK-FR-008 · [V1] · Booking management dashboard (creator)

Creator sees upcoming, in-progress, and completed bookings. Can mark status transitions.

---

#### BOOK-FR-009 · [V1] · Waitlist (booking waitlist for sold-out slots)

Deferred.

---

#### BOOK-FR-010 · [M2] · T&C acceptance per booking

Unticked-by-default checkbox at checkout. Records `tnc_version_id`, timestamp, ip, user_agent.

---

### 4.8 Reviews and Ratings (REV)

#### REV-FR-001 · [M2] · Leave a review (blind, 14-day reveal)

After a booking is `completed`, follower can leave a review within 30 days. Held blind for 14 days or until both parties review. After reveal, creator can respond once.

**BR-REV-001.** Reviews can be reported and moderated, but cannot be deleted by the creator.

---

#### REV-FR-002 · [M2] · Display reviews on experience + creator profile

Average rating + individual reviews paginated, newest first.

---

#### REV-FR-003 · [V1] · Review moderation queue

Described under §4.11.

---

### 4.9 Notifications (NTF)

#### NTF-FR-001 · [M1] · Push notifications (FCM, iOS + Android)

Required for: new follower, new comment/reply, new booking, booking confirmation, payment received, review posted, system alerts, vertical waitlist notification (V1 per ONB-FR-009).

---

#### NTF-FR-002 · [M2] · Email notifications

Transactional only. SendGrid. Required for: booking confirmation, payment receipt, refund issued, KYC status change, account deletion, T&C change, DPDPA consent change.

---

#### NTF-FR-003 · [M2] · SMS notifications

MSG91. Limited to: OTP, booking confirmation, trip reminder 24h before, payout sent.

---

#### NTF-FR-004 · [M2] · Notification preferences

Per-channel (push/email/SMS) × per-category (social/bookings/payments/marketing). Transactional and legally required notifications cannot be opted out of.

---

#### NTF-FR-005 · [V1] · In-app notification centre

Bell icon with unread count + list.

---

#### NTF-FR-006 · [DEF] · Web push

Deferred.

---

### 4.10 Gamification (GAM)

All of §4.10 is **V1 or later.**

- **GAM-FR-001 [V1]** Points for actions (publish, review, book, complete a trip, get followers).
- **GAM-FR-002 [V1]** Streaks (consecutive days of activity).
- **GAM-FR-003 [V1]** Badges (bronze/silver/gold for milestones).
- **GAM-FR-004 [V1]** Levels (1–20 based on points).
- **GAM-FR-005 [V2]** Leaderboards (city, category, national).
- **GAM-FR-006 [V2]** Rewards marketplace (redeem points).

Gamification tables exist in schema from M0 for event logging. UI deferred.

---

### 4.11 Trust and Safety (TS)

#### TS-FR-001 · [M2] · Report content

Categories: spam, nudity, violence, hate, scam, copyright, misinformation, other.

---

#### TS-FR-002 · [M2] · Report user

Same UX, targets a user.

---

#### TS-FR-003 · [M2] · Moderator queue (Retool in MVP, custom in V2)

SLA: first response within 36h for P1; 72h for others. IT Act 2021: 24h takedown of grossly offensive content.

---

#### TS-FR-004 · [M2] · Text moderation

Google Perspective API (MVP). High-confidence matches held "needs review."

---

#### TS-FR-005 · [M2] · Image moderation

Google Cloud Vision SafeSearch. Explicit/violence auto-rejected; borderline queued.

---

#### TS-FR-006 · [M2] · Creator suspension

Suspension hides all content; in-flight bookings get refund option.

---

#### TS-FR-007 · [V1] · Content quality score

Heuristics-based ranking signal.

---

#### TS-FR-008 · [M2] · Grievance Officer (IT Act 2021)

Name + contact published on every page footer. Acknowledge within 24h, resolve within 15 days.

---

#### TS-FR-009 · [M2] · Adventure safety checklist

Required gear list, insurance status, guide credentials, emergency contacts, waiver URL. Creator certifies compliance before publish.

---

### 4.12 Admin & Operations (ADM)

#### ADM-FR-001 · [M2 via Retool] · User search and view

Look up by phone / email / username; view KYC, bookings, content.

---

#### ADM-FR-002 · [M2 via Retool] · KYC review

Approve / reject KYC with reason code.

---

#### ADM-FR-003 · [M2 via Retool] · Content takedown

Take down content with reason + internal note. Audit-logged.

---

#### ADM-FR-004 · [M2 via Retool] · Payout run

Trigger pending creator payouts after completion + 48h dispute window.

---

#### ADM-FR-005 · [M2 via Retool] · Refund run

Manual refund outside the follower-driven flow.

---

#### ADM-FR-006 · [V2] · Full custom admin panel

Custom Next.js admin with all modules. **Deferred.**

---

#### ADM-FR-007 · [V2] · RBAC with 5 roles

Super Admin, Content Moderator, Support, Finance, Operations.

---

#### ADM-FR-008 · [M2] · Audit log

Every ops action writes a row to `audit_log` with: actor, action, target, timestamp, ip, reason, before/after JSON snapshot.

---

#### ADM-FR-009 · [V1] · Editorial Curation CRUD (DD-014 amendment)

**Description.** The admin panel gains an Editorial Curation section for managing `editorial_collections`. (DD-014 amendment)

**Features:**
- Create / edit / archive collections with: title, subtitle, cover image, hand-picked content list (search + select), priority, scheduled_start, scheduled_end.
- Priority ordering — pinned manual collections appear above algorithmic ones.
- Per-collection analytics: views, tap-through rate, bookings driven.
- Content picker with search (queries `content` table with status=published).

---

#### ADM-FR-010 · [V1] · Search analytics dashboard (DD-015)

**Description.** Dashboard showing: daily search volume, top queries (last 7 days), zero-result queries (content gap signal), click-through rate per query. CRUD for `search_placeholder_defaults` so the team can control fallback seed list before organic data accumulates. (DD-015)

---

### 4.13 Analytics & Reporting (ANL)

#### ANL-FR-001 · [M1] · Event tracking

All UI events through `track(eventName, props)`. Events land in PostHog + `events` Postgres table.

Key events: `app_open`, `signup_started`, `signup_completed`, `onboarding_completed`, `content_viewed`, `content_liked`, `content_saved`, `content_shared`, `booking_initiated`, `booking_paid`, `booking_cancelled`, `search_performed`, `creator_followed`, `profile_viewed`, `review_submitted`.

**BR-ANL-001.** No PII in event properties. User identified by `user_id` (UUID) only.

---

#### ANL-FR-002 · [V1] · Creator analytics dashboard

Views, unique viewers, saves, bookings, earnings, conversion rate, top content.

---

#### ANL-FR-003 · [V1] · Platform KPI dashboard

DAU, WAU, MAU, retention cohorts, GMV, take rate, creator counts, funnel conversion.

---

### 4.14 Tax & Compliance (TAX)

#### TAX-FR-001 · [M2] · GST calculation and collection

18% GST on services at checkout. `invoices` row records base, GST, platform fee, creator share.

---

#### TAX-FR-002 · [M2] · TDS under Section 194-O

1% TDS on gross amount payable to creator (base price). Rate jumps to 5% (Sec 206AA) if no PAN.

---

#### TAX-FR-003 · [V2] · GSTR-1 and GSTR-3B export

---

#### TAX-FR-004 · [V2] · Annual tax summary for creators

---

#### TAX-FR-005 · [M2] · Invoice generation

PDF invoice for every paid booking emailed on payment success.

---

#### TAX-FR-006 · [M2] · PAN validation on creator KYC

Required under Sec 194-O.

---

## 5. Data model (overview)

### 5.1 Core entities

```
users (1) ──< user_interests >── vertical_sub_categories
  │         ──< user_active_verticals
  │         ──< user_waitlisted_verticals           (DD-002)
  │         ──< user_saves                          (DD-017)
  ├──< user_profiles (1:1)
  ├──< user_kyc (1:1, creator only)
  ├──< follows (self-join)
  ├──< content (1:M) ────────────────────┐
  ├──< bookings (1:M)                    │
  ├──< reviews (1:M)                     │
  ├──< notifications                     │
  ├──< audit_log                         │
  ├──< user_sessions                     │
  ├──< user_content_progress             │  (DD-007)
  └──< search_queries                    │  (DD-015)

cities                                       (DD-009)
  └── used by users.current_city_id
         content.starting_city_id
         event_occurrences.city_id
         meeting_points.city_id

vertical_sub_categories                      (DD-006)
  └── id 'travel.trekking', vertical, slug,
      name, display_order, leaf_types[],
      active

content
  ├── type: post | event | scheduled_experience | self_paced_itinerary  (DD-022)
  ├── vertical: travel | stories | food | …   (DD-001)
  ├── vertical_data: JSONB
  ├── sub_category_id → vertical_sub_categories  (DD-006)
  ├── leaf_type, tags[], facets JSONB         (DD-006)
  ├── starting_city_id → cities               (DD-009)
  ├── starting_city_point geography(POINT)    (DD-009)
  ├── destination_city_ids text[]             (DD-009)
  ├── status, visibility, published_at
  ├──< content_media
  ├──< content_locations
  ├──< content_tags
  ├──< itinerary_days                         (DD-023)
  │      └──< itinerary_spots
  ├──< scheduled_dates                        (DD-021)
  ├──< meeting_points (1:1 for sched. exp.)   (DD-021)
  ├──< event_occurrences (1:1 for events)     (DD-025)
  ├──< likes
  ├──< comments
  ├──< reports
  └──< content_moderation

bookings
  ├── content_id, user_id, creator_id
  ├── scheduled_date_id (nullable — for scheduled_experience)
  ├── state (enum)
  ├──< booking_financials (1:1)
  ├──< payments
  ├──< refunds
  └──< disputes

editorial_collections                        (DD-014)
search_queries                               (DD-015)
search_placeholder_defaults                  (DD-015)
-- top_searches_7d (materialized view)       (DD-015)
razorpay_linked_accounts
razorpay_webhook_events
tnc_versions
dpdpa_consents
dpdpa_data_requests
grievances
feature_flags
platform_settings
```

**New tables in v1.2 (from design decisions):**

```sql
-- ── Cities (DD-009) ──────────────────────────────────────────────────────────
CREATE TABLE cities (
  id text PRIMARY KEY,                    -- 'in.mh.pune' (stable slug)
  name text NOT NULL,                      -- 'Pune'
  state text NOT NULL,                     -- 'Maharashtra'
  country text NOT NULL DEFAULT 'IN',
  point geography(POINT, 4326) NOT NULL,  -- PostGIS
  population int,
  active boolean DEFAULT true,
  UNIQUE (name, state, country)
);
CREATE INDEX cities_point_idx ON cities USING GIST (point);

-- ── User location additions (DD-009) ─────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN current_city_id text REFERENCES cities(id),
  ADD COLUMN current_location_point geography(POINT, 4326),
  ADD COLUMN location_last_updated timestamptz,
  ADD COLUMN location_source text CHECK (location_source IN ('gps', 'manual'));
CREATE INDEX users_location_idx ON users USING GIST (current_location_point);

-- ── Content location additions (DD-009) ──────────────────────────────────────
ALTER TABLE content
  ADD COLUMN starting_city_id text REFERENCES cities(id),
  ADD COLUMN starting_city_point geography(POINT, 4326),
  ADD COLUMN destination_city_ids text[] DEFAULT '{}';
CREATE INDEX content_starting_point_idx ON content USING GIST (starting_city_point);

-- ── Content taxonomy additions (DD-006) ──────────────────────────────────────
CREATE TABLE vertical_sub_categories (
  id text PRIMARY KEY,             -- 'travel.trekking'
  vertical text NOT NULL,
  slug text NOT NULL,              -- 'trekking'
  name text NOT NULL,              -- 'Trekking & Hiking'
  display_order int NOT NULL,
  leaf_types text[] NOT NULL,
  active boolean DEFAULT true,
  UNIQUE (vertical, slug)
);

ALTER TABLE content
  ADD COLUMN sub_category_id text REFERENCES vertical_sub_categories(id),
  ADD COLUMN leaf_type text NULL,
  ADD COLUMN tags text[] DEFAULT '{}',
  ADD COLUMN facets jsonb DEFAULT '{}'::jsonb;
  -- facets shape: { group_size, budget, difficulty, duration, season }

-- ── User waitlist (DD-002) ────────────────────────────────────────────────────
CREATE TABLE user_waitlisted_verticals (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  vertical text NOT NULL,
  created_at timestamptz DEFAULT now(),
  notified_at timestamptz NULL,
  PRIMARY KEY (user_id, vertical)
);

-- ── User saves (DD-017) ───────────────────────────────────────────────────────
CREATE TABLE user_saves (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);
CREATE INDEX user_saves_content_idx ON user_saves(content_id);

-- ── User content progress (DD-007) ───────────────────────────────────────────
CREATE TABLE user_content_progress (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  progress_pct int DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  last_spot_id uuid,               -- for itineraries: last visited spot
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);

-- ── Scheduled experience schema (DD-021) ─────────────────────────────────────
CREATE TABLE scheduled_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  capacity int NOT NULL,
  spots_booked int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CHECK (end_date >= start_date),
  CHECK (spots_booked <= capacity)
);
CREATE INDEX scheduled_dates_content_idx ON scheduled_dates(content_id, start_date);

CREATE TABLE meeting_points (
  content_id uuid PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
  city_id text NOT NULL REFERENCES cities(id),
  location_description text NOT NULL,     -- 'Manali Volvo Stand' (public)
  area_point geography(POINT, 4326),      -- neighborhood-level (public)
  exact_location text,                     -- private: shared 24hr before start
  exact_shared_hours_before int DEFAULT 24
);

-- ── Itinerary spot schema (DD-023) ────────────────────────────────────────────
CREATE TABLE itinerary_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  day_number int NOT NULL,
  title text,
  description text,
  total_distance_km numeric(6,1),
  estimated_hours numeric(4,1),
  UNIQUE (content_id, day_number)
);

CREATE TYPE spot_stop_type AS ENUM ('regular', 'overnight', 'meal', 'viewpoint', 'activity');

CREATE TABLE itinerary_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_day_id uuid NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  spot_order int NOT NULL,
  google_place_id text,
  name text NOT NULL,
  category text,
  point geography(POINT, 4326) NOT NULL,
  thumbnail_url text,
  creator_note text,
  duration_minutes int,
  stop_type spot_stop_type DEFAULT 'regular',
  is_free_preview boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (itinerary_day_id, spot_order)
);
CREATE INDEX itinerary_spots_day_idx ON itinerary_spots(itinerary_day_id, spot_order);
CREATE INDEX itinerary_spots_point_idx ON itinerary_spots USING GIST(point);

-- ── Event occurrences (DD-025) ────────────────────────────────────────────────
CREATE TABLE event_occurrences (
  content_id uuid PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  timezone text DEFAULT 'Asia/Kolkata',
  venue_name text NOT NULL,
  venue_address text NOT NULL,             -- PUBLIC (unlike meeting_points)
  venue_point geography(POINT, 4326) NOT NULL,
  city_id text NOT NULL REFERENCES cities(id),
  capacity int NOT NULL,
  spots_booked int DEFAULT 0,
  rsvp_count int DEFAULT 0,
  is_free boolean DEFAULT false,
  CHECK (end_at > start_at),
  CHECK (spots_booked <= capacity)
);

-- ── Editorial collections (DD-014 + amendment) ───────────────────────────────
CREATE TABLE editorial_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  cover_image_url text,
  content_ids uuid[] NOT NULL,
  is_active boolean DEFAULT true,
  priority int DEFAULT 0,
  source text NOT NULL CHECK (source IN ('algorithmic', 'manual')),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  refreshed_at timestamptz DEFAULT now()
);
CREATE INDEX editorial_collections_active_idx ON editorial_collections(is_active, priority DESC, scheduled_start);

-- ── Search analytics (DD-015) ─────────────────────────────────────────────────
CREATE TABLE search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  query text NOT NULL,
  normalized_query text NOT NULL,
  result_count int,
  clicked_result_id uuid,
  clicked_result_type text,
  clicked_at timestamptz,
  session_id uuid,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX search_queries_user_idx ON search_queries(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX search_queries_normalized_idx ON search_queries(normalized_query, created_at DESC);

CREATE TABLE search_placeholder_defaults (
  id serial PRIMARY KEY,
  placeholder_text text NOT NULL,
  priority int DEFAULT 0,
  is_active boolean DEFAULT true
);

CREATE MATERIALIZED VIEW top_searches_7d AS
SELECT normalized_query,
       COUNT(*) AS search_count,
       COUNT(DISTINCT user_id) AS unique_users
FROM search_queries
WHERE created_at > now() - interval '7 days'
  AND char_length(normalized_query) >= 3
  AND normalized_query !~ '@|\+91|\d{6,}'
GROUP BY normalized_query
HAVING COUNT(*) >= 3
ORDER BY search_count DESC
LIMIT 50;
CREATE UNIQUE INDEX top_searches_7d_query_idx ON top_searches_7d(normalized_query);
```

### 5.2 Key enums (Postgres enum types)

```sql
-- Updated per DD-001, DD-022 (vv1.1 values superseded)
content_type        : post | event | scheduled_experience | self_paced_itinerary
                      -- 'experience_format' enum removed — format expressed in content_type (DD-022)

vertical            : travel | stories | food | fitness | education
                      | photography | music | wellness
                      -- stories added as second MVP vertical (DD-001)
                      -- MVP: only 'travel' and 'stories' allowed by RLS check

content_status      : draft | under_review | published | unpublished | archived | rejected | taken_down
visibility          : public | unlisted | private
pricing_model       : free | paid

-- Travel sub-categories updated (DD-006) — 12 values replacing 7
travel_subcategory  : road_trips_biking | trekking_hiking | adventure_sports |
                      heritage_culture | food_trails | wildlife_nature |
                      photo_walks | wellness_retreats | family_kids |
                      luxury_curated | offbeat_hidden | nightlife_events
                      -- per-vertical sub-categories also seeded in vertical_sub_categories table

spot_stop_type      : regular | overnight | meal | viewpoint | activity  -- NEW (DD-023)

kyc_status          : not_started | pending | verified | rejected | expired
booking_state       : pending_payment | paid | confirmed | in_progress | completed | reviewed |
                      cancelled_by_user | cancelled_by_creator | refunded | disputed
payment_status      : initiated | success | failed | refunded
report_status       : open | in_review | actioned | dismissed
```

**Notes on enum changes from v1.1:**
- `content_type` completely rewritten: `post | experience` → `post | event | scheduled_experience | self_paced_itinerary` (DD-022)
- `experience_format` enum **removed** — format is now expressed directly in `content_type` (DD-022)
- `vertical` gains `stories` as an MVP vertical alongside `travel` (DD-001)
- `travel_subcategory` expands from 7 to 12 values (DD-006)
- `spot_stop_type` is a new enum (DD-023)

**Why JSONB for `vertical_data`?** Each vertical adds 5–15 fields; JSONB + a strict Zod schema at the API layer avoids a migration per field. Frequently-queried fields can be promoted to generated columns. See ADR-009.

### 5.3 Row-level security (RLS)

- `users`: self-read only; admin via service role
- `content`: public-read for `status='published' AND visibility='public'`; author read/write for own
- `bookings`: self-read for owner or creator; admin via service role
- `dpdpa_consents`: self-only, append-only
- `audit_log`: admin-read only, service-role write
- `user_saves`: self-read/write only
- `search_queries`: self-read/write; service-role for aggregate views

### 5.4 Amount representation

All monetary columns are `BIGINT` and named `*_paisa`. Never `NUMERIC`, never `FLOAT`. Conversion is `paisa / 100.0` at the UI edge only.

---

## 6. External interfaces

### 6.1 User interfaces

| Surface | Framework | Design system | Notes |
|---|---|---|---|
| Mobile | Flutter 3.22+ | `<AppName>` design system (see Appendix F) | SafeArea on every screen, `cached_network_image` with shimmer |
| Web | Next.js 14 App Router + Tailwind + shadcn/ui | Same tokens via Tailwind config | SSR for all public pages |
| Admin (MVP) | Supabase Studio + Retool | — | Pre-built Retool app |
| Admin (V2) | Next.js (separate app) | Same system | Custom |

### 6.2 Hardware interfaces

- Camera — profile photo, content images
- GPS (mobile) — location tagging (permission-gated, used for onboarding + feed personalization per DD-009)
- Gallery / file picker
- Biometric unlock (V1)

### 6.3 Software interfaces

| Service | Purpose | Decision |
|---|---|---|
| **Firebase Auth** | Phone OTP | Confirmed |
| **Supabase Postgres + PostGIS** | Primary DB + geo queries | Confirmed (PostGIS enabled Week 1 per C-21) |
| **Supabase Edge Functions** | Feed, search fan-out | Yes for MVP |
| **Hono on Fly.io or Railway** | Complex backend (webhooks, KYC proxy, payouts, cron, Places proxy) | Yes for MVP |
| **Firebase Storage** | Media | Confirmed |
| **Firebase Cloud Messaging** | Push | Confirmed |
| **Razorpay Payment Gateway** | PG | Confirmed |
| **Razorpay Route** | Escrow + linked accounts | Confirmed |
| **Razorpay KYC** (or Cashfree) | PAN/Aadhaar/penny drop | Week 1 validation |
| **MSG91** | SMS | Confirmed |
| **SendGrid** | Email | Confirmed |
| **Google Maps SDK** | Maps (mobile + web) | Confirmed |
| **Google Places API** | Autocomplete + Place Details + Place Photos for itinerary spot editor | **New — required per C-22 (DD-028)** |
| **Google Perspective API** | Text moderation | Confirmed (free tier) |
| **Google Cloud Vision SafeSearch** | Image moderation | Confirmed |
| **Sentry** | Error monitoring | Confirmed |
| **PostHog** | Product analytics | Confirmed (self-hosted or cloud) |
| **Meilisearch** (cloud) | Full-text search | V1. MVP uses Postgres `tsvector`. **Not Elasticsearch**. |
| **Upstash Redis** | Rate limit + OTP + cache | V1 |

### 6.4 Communication interfaces

- HTTPS/TLS 1.2+ for all client↔server traffic
- FCM for push
- SMS via MSG91 HTTPS API
- Email via SendGrid HTTPS API
- Webhooks from Razorpay verified with HMAC signature
- Rate limiting at the gateway layer (Cloudflare → origin)
- Google Places API calls proxied server-side via `/api/places/*` — client never has direct API key access (DD-028)

---

## 7. Non-functional requirements

### 7.1 Performance

| ID | Requirement |
|---|---|
| NFR-PERF-001 | Cold start of mobile app ≤ 2.5 s on Redmi Note 12 (mid-range Android reference device) |
| NFR-PERF-002 | Feed first-page load ≤ 1.5 s on 4G |
| NFR-PERF-003 | p95 API response time ≤ 400 ms for read endpoints at 500 RPS |
| NFR-PERF-004 | p95 API response time ≤ 800 ms for write endpoints |
| NFR-PERF-005 | Web LCP ≤ 2.5 s for public creator pages on 4G |
| NFR-PERF-006 | Image upload from mobile at 1 MB ≤ 5 s on 4G median |
| NFR-PERF-007 | Booking payment round trip ≤ 3 s from tap Pay to confirmation screen |

### 7.2 Scalability

| ID | Requirement |
|---|---|
| NFR-SCALE-001 | MVP must sustain 1,000 concurrent users without horizontal scaling |
| NFR-SCALE-002 | V1 must sustain 10,000 concurrent users with Supabase Pro + Upstash |
| NFR-SCALE-003 | V2 must sustain 50,000 concurrent users |
| NFR-SCALE-004 | Feed section fetches must not block on creators with > 100k followers (fan-in on read) |

### 7.3 Availability

| ID | Requirement |
|---|---|
| NFR-AVAIL-001 | Target uptime 99.5% (MVP), 99.9% (V1 onward) |
| NFR-AVAIL-002 | Payment webhook handler is idempotent and durably queued |
| NFR-AVAIL-003 | RTO ≤ 4 hours, RPO ≤ 1 hour (Supabase PITR) |

### 7.4 Security

| ID | Requirement |
|---|---|
| NFR-SEC-001 | All secrets in a secrets manager (Doppler / Vault / Supabase Vault), never in `.env` committed to git |
| NFR-SEC-002 | Passwordless auth via Firebase Phone OTP; no local password storage |
| NFR-SEC-003 | TLS 1.2+ mandatory; HSTS on web with preload |
| NFR-SEC-004 | CSP headers on web; no unsafe-inline |
| NFR-SEC-005 | All PII encrypted at rest (Supabase default) |
| NFR-SEC-006 | KYC documents encrypted with envelope encryption (KMS key) |
| NFR-SEC-007 | Razorpay webhook signature verification mandatory |
| NFR-SEC-008 | Rate limiting on all auth endpoints |
| NFR-SEC-009 | Session tokens in `HttpOnly; Secure; SameSite=Lax` cookies (web) |
| NFR-SEC-010 | Mobile refresh tokens in Keychain / Keystore |
| NFR-SEC-011 | OWASP Top 10 in code review checklist |
| NFR-SEC-012 | Penetration test before V1 public launch |
| NFR-SEC-013 | Audit log is append-only, exportable, retained 7 years |
| NFR-SEC-014 | Google Places API key never exposed to client; all calls proxied server-side (C-22) |

### 7.5 Privacy

| ID | Requirement |
|---|---|
| NFR-PRIV-001 | Data minimisation: collect only what is needed for the stated purpose |
| NFR-PRIV-002 | Purpose-bound consent for each category of personal data (DPDPA §7) |
| NFR-PRIV-003 | User can export their data as JSON (DPDPA §11) |
| NFR-PRIV-004 | User can delete their account (DPDPA §12) — see IAM-FR-003 |
| NFR-PRIV-005 | Breach notification to DPB within 72 h (DPDPA §8(6)) |
| NFR-PRIV-006 | Children under 18 — parental consent required (DPDPA §9). MVP disallows < 18 via self-declaration. |
| NFR-PRIV-007 | No behavioural tracking of children |
| NFR-PRIV-008 | Consent manager module from M0 (purposes: analytics, marketing, notifications, location, KYC) |
| PRIV-FR-010 | [M0] Users can clear their entire search history via Settings → Privacy. Action hard-deletes all `search_queries` rows for that user. Confirmation dialog required. (DD-015) |
| PRIV-FR-011 | [M0] Search query retention is 90 days rolling. A daily cron job hard-deletes `search_queries` rows where `created_at < now() - interval '90 days'`. (DD-015) |
| PRIV-FR-012 | [M0] Guest (unauthenticated) user searches are **never** logged server-side. Their recent searches live in device local storage only. (DD-015) |
| PRIV-FR-013 | [M0] The Privacy Policy must disclose that authenticated users' search queries are logged and used to improve recommendations and populate trending-search surfaces. Standard performance-of-service basis; no explicit opt-in required. (DD-015) |

### 7.6 Accessibility

| ID | Requirement |
|---|---|
| NFR-A11Y-001 | Web meets WCAG 2.1 AA |
| NFR-A11Y-002 | Mobile screen readers (VoiceOver, TalkBack) supported |
| NFR-A11Y-003 | Minimum tap target 44×44 dp |
| NFR-A11Y-004 | Text scales with system setting up to 200% without clipping |
| NFR-A11Y-005 | Colour contrast ≥ 4.5:1 for body text |

### 7.7 Maintainability

| ID | Requirement |
|---|---|
| NFR-MAINT-001 | Monorepo with clear app boundaries (C-09) |
| NFR-MAINT-002 | ≥ 70% unit-test coverage on critical modules (booking, payments, KYC, tax) |
| NFR-MAINT-003 | CI runs lint + typecheck + tests on every PR; green required to merge |
| NFR-MAINT-004 | One-command local dev boot (`make dev` or `pnpm dev`) |
| NFR-MAINT-005 | ADRs under `Docs/adr/` for every major decision |

### 7.8 Usability

| ID | Requirement |
|---|---|
| NFR-UX-001 | First-time user: sign-up → location → interest selection → see feed in ≤ 60 s (DD-004, DD-009) |
| NFR-UX-002 | Booking flow ≤ 4 taps from "Book" to payment screen |
| NFR-UX-003 | Error messages are actionable (not "something went wrong") |
| NFR-UX-004 | Empty states include illustration + title + description + CTA |

---

## 8. Legal and compliance requirements

### 8.1 DPDPA 2023 + DPDP Rules 2025

| ID | Requirement |
|---|---|
| LGL-DPDPA-001 | Publish a compliant Privacy Notice at signup and at the footer of every page |
| LGL-DPDPA-002 | Collect explicit, purpose-bound consent at first use of each processing purpose |
| LGL-DPDPA-003 | Provide a way for users to withdraw consent at any time |
| LGL-DPDPA-004 | Provide data export (right to access) — JSON download |
| LGL-DPDPA-005 | Provide account deletion (right to erasure) — see IAM-FR-003 |
| LGL-DPDPA-006 | Appoint a Data Protection Officer (DPO) or Grievance Officer |
| LGL-DPDPA-007 | Breach notification to Data Protection Board within 72 h |
| LGL-DPDPA-008 | Children under 18 — parental consent, no tracking, no targeted ads |
| LGL-DPDPA-009 | Retain personal data only as long as necessary; publish retention schedule |
| LGL-DPDPA-010 | Cross-border transfer — allowed to any non-blacklisted country; document destinations |

### 8.2 IT Act Intermediary Rules 2021

| ID | Requirement |
|---|---|
| LGL-IT-001 | Publish ToS, Privacy Policy, Community Guidelines on signup and footer |
| LGL-IT-002 | Appoint a Grievance Officer; publish name, contact, process on every page |
| LGL-IT-003 | Acknowledge grievances within 24 h; resolve within 15 days |
| LGL-IT-004 | Monthly compliance report when user base crosses SSMI threshold (50 lakh) |
| LGL-IT-005 | Takedown of prohibited content within 24 h of actual knowledge |
| LGL-IT-006 | Retain user records for 180 days after account removal |

### 8.3 Consumer Protection (E-commerce) Rules 2020

| ID | Requirement |
|---|---|
| LGL-CP-001 | Display clear pricing (base, taxes, total) before payment |
| LGL-CP-002 | Display clear cancellation and refund policy per listing |
| LGL-CP-003 | Display creator/seller details |
| LGL-CP-004 | No fake reviews — all reviews tied to a verified booking |
| LGL-CP-005 | Handle consumer complaints within 48h acknowledgement, 1 month resolution |

### 8.4 RBI Payment Aggregator rules

| ID | Requirement |
|---|---|
| LGL-RBI-001 | We do not hold customer funds directly — Razorpay holds escrow under their PA licence. |
| LGL-RBI-002 | We do not settle funds to creators directly — Razorpay Route performs settlements. |
| LGL-RBI-003 | Disclose Razorpay's role and settlement timeline to both parties. |

### 8.5 Tax compliance

| ID | Requirement |
|---|---|
| LGL-TAX-001 | GST registration for the platform |
| LGL-TAX-002 | Collect 18% GST on services |
| LGL-TAX-003 | Deduct 1% TDS under Section 194-O on gross payable to creator |
| LGL-TAX-004 | Higher TDS (5%) under Sec 206AA if creator has no PAN |
| LGL-TAX-005 | File quarterly TDS (Form 26Q) and issue Form 16A to creators |
| LGL-TAX-006 | Retain tax records for 8 years |

### 8.6 Adventure tourism safety (ATOAI 2022)

| ID | Requirement |
|---|---|
| LGL-ADV-001 | Adventure sub-category creators must disclose risks, required gear, guide qualifications |
| LGL-ADV-002 | `things_to_avoid` field mandatory for Adventure & Sports sub-category (BR-CRT-004-A) |
| LGL-ADV-003 | CGL insurance mandatory for Adventure creators by V2 |
| LGL-ADV-004 | Waiver of liability from followers at booking time for Adventure trips (V1) |
| LGL-ADV-005 | Minor (< 18) participation requires guardian consent upload (V1) |
| LGL-ADV-006 | Emergency contact capture from every follower booking an Adventure experience |
| LGL-ADV-007 | Waivers do not protect against gross negligence — platform cannot over-rely on them |

### 8.7 Insurance

| ID | Requirement |
|---|---|
| LGL-INS-001 | Platform carries CGL by M2 |
| LGL-INS-002 | Platform carries Professional Liability / E&O by V1 |
| LGL-INS-003 | Creators in Adventure carry their own CGL (enforced by V2) |

### 8.8 Required legal documents (owned by counsel, not AI)

| Document | Owner | Due |
|---|---|---|
| Terms of Service | Counsel | Before M2 |
| Privacy Policy (DPDPA-compliant, includes search logging disclosure per PRIV-FR-013) | Counsel | Before M2 |
| Community Guidelines | Counsel + Product | Before M1 |
| Refund Policy | Counsel | Before M2 |
| Cancellation Policy | Counsel | Before M2 |
| Cookie Policy | Counsel | Before M2 |
| Grievance Redressal Policy | Counsel | Before M2 |
| Adventure Activity Waiver (template) | Counsel | V1 |
| Creator Agreement | Counsel | Before M2 |
| Data Processing Addendum for sub-processors | Counsel | Before M2 |

---

## 9. Open items and deferred decisions

| # | Item | Who decides | When |
|---|---|---|---|
| O-01 | Final app name | Founder | Week 1 |
| O-02 | Final platform fee rate (default) | Founder + CA | Week 4 |
| O-03 | Razorpay Route approval for use case | Razorpay | Week 1 |
| O-04 | Full-stack engineer hired | Founder | Week 4 |
| O-05 | Legal counsel engaged with deliverables signed | Founder + Counsel | Week 2 |
| O-06 | Insurance broker engaged | Founder | Week 4 |
| O-07 | PostHog: cloud or self-host | Engineering | Week 3 |
| O-08 | KYC provider: Razorpay KYC vs Cashfree vs Signzy | Engineering | Week 2 |
| O-09 | SMS OTP fallback (MSG91) in addition to Firebase | Engineering | Week 3 |
| O-10 | *(Closed)* Category list — confirmed 12 travel sub-categories per DD-006 | — | Done |
| O-11 | First 15 seed creators identified | Founder | Week 4 |
| O-12 | Custom domain for creators — deferred to V2 confirmed | Founder | V1 planning |
| O-13 | Third vertical (post-MVP) — Food vs Fitness vs Photography | Founder | V1 planning |
| O-14 | Google Places API billing account setup and quota confirmed | Engineering | Week 1 |

---

## 10. Appendices

### Appendix A — Glossary

See §1.5.

### Appendix B — Content taxonomy (3 levels + orthogonal facets) (DD-006)

*This appendix replaces the 10→7 category collapse table from SRS v1.0/v1.1. The new model has three hierarchical levels plus orthogonal facets.*

#### Level 1 · Verticals (8)

| Vertical | MVP Status | KYC required? | Phosphor icon | Description |
|---|---|---|---|---|
| `travel` | **M0** | For paid content only | `mountains` | Trips, itineraries, experiences across India |
| `stories` | **M0** | Never (posts only in MVP) | `book-open` | Long-form essays, travel writing, creator journals |
| `food` | V1 | For paid events/classes | `fork-knife` | Food trails, cooking classes, recipes, market walks |
| `fitness` | V1 | For paid sessions | `barbell` | Workout plans, live coaching, outdoor fitness |
| `photography` | V2 | For paid workshops | `camera` | Photo walks, editing guides, gear reviews |
| `wellness` | V2 | For paid retreats | `sun` | Yoga, meditation, ayurveda, breathwork |
| `music` | V2 | For paid sessions | `music-notes` | Gig guides, lesson plans, local music scenes |
| `education` | V2 | For paid courses | `graduation-cap` | Skill guides, learning trails, expert walkthroughs |

**Notes:**
- Stories vertical: no sub-categories. A post under Stories is tagged with up to 3 free-form tags by the creator. No KYC required for any Stories content because Stories only supports `post` type (no paid experiences). (DD-001)
- Travel and Stories are the only verticals with active content in MVP.

#### Level 2 · Sub-categories per vertical

**Travel sub-categories (12 — locked for MVP) (DD-006):**

| Sub-category slug | Display name | Leaf types (examples) |
|---|---|---|
| `road_trips_biking` | Road Trips & Biking | city_ride, highway_ride, offroad_ride, mountain_ride, coastal_ride, weekend_drive |
| `trekking_hiking` | Trekking & Hiking | day_hike, summit_trek, forest_trail, snow_trek, camping_trek |
| `adventure_sports` | Adventure & Sports | zipline, kayaking, rock_climbing, river_rafting, paragliding, multi_sport |
| `heritage_culture` | Heritage & Culture | fort_walk, museum_tour, old_city_walk, temple_trail, architecture_tour, storytelling_walk, village_visit |
| `food_trails` | Food Trails | street_food_trail, market_walk, dessert_crawl, night_food_walk, regional_meal |
| `wildlife_nature` | Wildlife & Nature | safari, birding_trail, nature_walk, wetland_tour, jungle_drive |
| `photo_walks` | Photo Walks | sunrise_walk, street_photography, landscape_shoot, night_photography, wildlife_shoot |
| `wellness_retreats` | Wellness Retreats | yoga_retreat, meditation_walk, ayurveda_stay, breathwork_retreat, sound_healing |
| `family_kids` | Family & Kids | kids_nature_walk, family_picnic, learning_trail, zoo_day, farm_visit |
| `luxury_curated` | Luxury & Curated | private_city_tour, chef_table, yacht_day, curated_stay, concierge_day |
| `offbeat_hidden` | Offbeat & Hidden | hidden_village, remote_trail, local_homestay, tribal_experience, secret_spots |
| `nightlife_events` | Nightlife & Events | pub_crawl, live_music_night, club_night, late_food_night, sunset_party, festival_event |

**Other verticals:**
Sub-categories for Food, Fitness, Photography, Wellness, Music, Education are defined when each vertical ships. Structure (vertical_sub_categories table) is ready from M0.

#### Level 3 · Leaf types (optional)

Leaf types are an optional third level used for search filters and publishing wizard UX. 5–7 per sub-category. Not shown in primary navigation. Not required for publish in MVP — V1 refinement.

#### Orthogonal facets

These are **not** part of the taxonomy tree. They cut across all content types and sub-categories. Used in search filters and Discover filter sheet (DISC-FR-034):

| Facet | Values |
|---|---|
| `group_size` | solo / couple / small_group (4–6) / large_group (7+) |
| `budget` | budget (< ₹2k) / mid (₹2k–5k) / premium (₹5k–15k) / luxury (₹15k+) |
| `difficulty` | easy / moderate / challenging |
| `duration` | half_day / full_day / weekend / 3_5_days / week_plus |
| `season` | spring / summer / monsoon / autumn / winter / year_round |

Facets are filter dimensions, not topics. A piece of content can have any combination of facet values stored in the `content.facets` JSONB column.

#### What was removed from the v1.1 taxonomy (DD-006)

- **Workshops** — this is a content format (Scheduled Experience), not a topic. Discoverable via content type filter, not a sub-category.
- **Solo & Budget** — these are facets (`group_size=solo`, `budget=budget`), not topics.
- **Standalone Culture** — merged into Heritage & Culture to avoid overlap.
- **Weekend Getaways** — merged into Road Trips & Biking; "weekend" is a facet (duration).

#### Implementation notes

Sub-categories are seeded via migration from `vertical_sub_categories` table. Adding a new sub-category is a database migration, not a user-facing admin action — this prevents taxonomy fragmentation. Adding a new vertical follows the same pattern.

---

### Appendix C — Booking state machine (narrative)

```
    (follower taps Book / Get my spot)
           │
           ▼
   pending_payment
     │          │
     │ success  │ fail / timeout
     ▼          ▼
    paid    payment_failed ──► retry → pending_payment
     │
     │ creator / system acknowledgement
     ▼
   confirmed ───► cancelled_by_user ──► refunded (per policy)
     │      └──► cancelled_by_creator ──► refunded (full)
     │
     │ trip/event start
     ▼
   in_progress
     │
     │ trip/event end
     ▼
   completed
     │
     │ dispute window (48h)
     │  └─► disputed ──► refunded or resolved
     │
     │ payout trigger (T+2)
     ▼
   (creator paid, follower may review within 30 days)
     │
     ▼
   reviewed
```

---

### Appendix D — Decision log (seeds the ADR folder)

| ADR | Decision | Status |
|---|---|---|
| ADR-001 | Flutter for mobile, Next.js for web, Supabase Postgres + Firebase Auth | Approved |
| ADR-002 | Monorepo with pnpm workspaces + Flutter side-by-side | Approved |
| ADR-003 | Meilisearch for search in V1; Postgres tsvector in MVP | Approved |
| ADR-004 | Admin via Retool + Supabase Studio for MVP; custom admin in V2 | Approved |
| ADR-005 | ~~Consolidate 10 categories to 7~~ → Superseded: 3-level taxonomy, 12 travel sub-categories (DD-006) | Superseded |
| ADR-006 | Amounts stored in paisa | Approved |
| ADR-007 | Blind review reveal at 14 days | Approved |
| ADR-008 | Dynamic platform fee | Approved |
| ADR-009 | **Vertical strategy — multi-vertical schema, travel + stories as launch verticals** (updated from travel-only per DD-001) | Approved |
| ADR-010 | Section-based home feed replacing For You / Following tabs (DD-007) | Approved |
| ADR-011 | Monochrome design system — coral as sole accent, Phosphor icons (DD-013) | Approved |
| ADR-012 | Four content types: post, event, scheduled_experience, self_paced_itinerary (DD-022) | Approved |
| ADR-013 | Roamy-style spot-based itinerary, Google Places API required (DD-023, DD-028) | Approved |
| ADR-014 | Single current_city location model, PostGIS nearest-neighbor waterfall (DD-009) | Approved |

---

### Appendix E — Differences from earlier versions

| Area | v1.1 said | v1.2 says | DD |
|---|---|---|---|
| Verticals in MVP | Travel only | Travel + Stories | DD-001 |
| Onboarding flow | 3 steps (OTP, interests, role nudge) | 5 steps (phone, location, categories, creators, done) | DD-004, DD-009 |
| Home feed structure | For You tab + Following tab | Section-based feed (Near you, per-vertical, discover new) | DD-007 |
| Content types | `post | experience` with `format = self_paced | scheduled` | `post | event | scheduled_experience | self_paced_itinerary` | DD-022 |
| Self-paced content | Day-by-day text + segment builder | Map-first spot-based itinerary (Roamy-style) | DD-023 |
| Events | V2 (deferred) | **M0** (promoted) | DD-025 |
| Category taxonomy | 7 flat categories | 3-level: 8 verticals → 12 travel sub-categories → leaf types + facets | DD-006 |
| Design palette | Multi-accent (8 vertical colors) | Monochrome warm neutrals + 1 coral | DD-013 |
| Save state | Per-screen UI flag | Global `user_saves` table, optimistic updates | DD-017 |
| Share | Generic share only | WhatsApp first-class button + generic | DD-019 |
| Guest access | Not specified | Full browse, device-local saves, soft auth wall | DD-003, DD-016 |
| Social login | DEF (deferred) | **M0** (for soft auth wall secondary path) | DD-016 |
| Location | Not in schema | Mandatory in onboarding, PostGIS nearest-neighbor waterfall | DD-009 |
| Search history | Not specified | Logged, 90-day retention, DPDPA-compliant clear | DD-015 |
| Google Places | Not in scope | Required for itinerary spot editor (C-22) | DD-028 |
| Post body typography | Not specified | Fraunces 14px/1.65 (reading-first) | DD-026 |
| Tech stack | React Native (parent CLAUDE.md) | Flutter (project CLAUDE.md overrides) | ADR-001 |
| TDS rate | Draft said 10% | **1%** under Section 194-O | Corrected in v1.0 |
| Admin panel | Custom from day 1 (draft) | Retool + Studio for MVP, custom in V2 | ADR-004 |

---

### Appendix F — Design system canonical specification (DD-005, DD-013, DD-026)

#### F.1 Color palette

**Warm neutrals (7 values — all surfaces and type):**

| Token | Hex | Usage |
|---|---|---|
| `warm-50` / Surface | `#FAF7F4` | Primary page background |
| `warm-100` / Sunken | `#F2EEE8` | Chips, inactive tiles, secondary surfaces |
| `warm-200` / Border | `#E5E0D7` | All borders and dividers |
| `warm-300` / Line | `#C9C3B6` | Heavier dividers, drag handles |
| `warm-500` / Soft Ink | `#9C9689` | Metadata, counts, placeholders |
| `warm-700` / Muted | `#6B6660` | Secondary text, subheads |
| `warm-1000` / Ink | `#2C2823` | Primary text, filled pills, icons |

**Accent (1 value):**

| Token | Hex | Usage |
|---|---|---|
| `coral` | `#E15A41` | EXACTLY five contexts (see §2.5 C-17) |

**Semantic (functional states only):**

| Token | Hex | Usage |
|---|---|---|
| `success` | `#1D9E75` | Success toasts, verified badges |
| `warning` | `#BA7517` | Warning toasts, caution flags |
| `danger` | `#C2362F` | Error toasts, destructive actions |
| `info` | `#185FA5` | Informational toasts, help states |

**The five coral contexts (complete list):**
1. Primary CTA buttons (the singular main action per screen)
2. Active save/bookmark icon (filled state)
3. Location pin icon (all city cards + top bar chip)
4. Active bottom tab indicator
5. Overnight stop pin on itinerary maps

Critical notification signals (unread dots, booking alerts) also use coral.

**Removed:** All 8 per-vertical accent colors. Gradient card backgrounds. Colored content-type pills.

#### F.2 Typography

**Type scale (mobile):**

| Style | Font | Size | Weight | Line height | Letter spacing |
|---|---|---|---|---|---|
| Display | Fraunces (SOFT opsz) | 34px | 700 | 1.18 | −0.5px |
| H1 | Fraunces | 28px | 700 | 1.21 | −0.4px |
| H2 | Fraunces | 24px | 600 | 1.25 | −0.3px |
| H3 | Inter | 20px | 600 | 1.3 | −0.2px |
| H4 | Inter | 17px | 600 | 1.35 | −0.1px |
| Body Large | Inter | 16px | 400 | 1.5 | 0 |
| Body | Inter | 15px | 400 | 1.53 | 0 |
| Body Small | Inter | 13px | 400 | 1.54 | 0 |
| Post body | **Fraunces** | **14px** | 400 | **1.65** | 0 |
| Post pull quote | **Fraunces Italic** | 16px | 400 | 1.6 | 0 |
| Caption | Inter | 12px | 400 | 1.4 | 0 |
| Label | Inter | 11px | 600 | 1.27 | +0.2px |

**Loading:**
- Flutter: `google_fonts` package (`GoogleFonts.fraunces()`, `GoogleFonts.inter()`).
- Web: `next/font/google` (`Fraunces`, `Inter`).
- Fraunces variation axes: `opsz=9` (SOFT) for display and headings. Regular opsz for post body text.

**The Fraunces exception (DD-026):** Post detail body text uses Fraunces 14px/1.65 as the only case of Fraunces below H2. Every other body text in the app uses Inter. This is not a mistake — it is intentional for long-form reading ergonomics.

#### F.3 Iconography

Phosphor Icons, locked per C-19. Flutter: `phosphor_flutter` package. Web: `@phosphor-icons/react`.

**Weight rules:**
- Outline: inactive nav tabs, inactive states, UI icons at rest.
- Fill: active nav tab, active toggle, active filter, selected chip.

**Canonical vertical icons:**

| Vertical | Icon name | Phosphor ID |
|---|---|---|
| Travel | Mountains | `mountains` |
| Stories | Open book | `book-open` |
| Food | Fork and knife | `fork-knife` |
| Fitness | Barbell | `barbell` |
| Photography | Camera | `camera` |
| Wellness | Sun | `sun` |
| Music | Music notes | `music-notes` |
| Education | Graduation cap | `graduation-cap` |

**City / location icon:** `map-pin` (coral, everywhere). No per-city custom icons or emojis.

#### F.4 Shadows

Two-layer warm-tinted shadow system (`rgba(60, 30, 15, alpha)` — never black, never blue-gray):

**Card shadow (Level 1):**
```
Layer 1: rgba(60, 30, 15, 0.06) blur 1px offset 0 1px
Layer 2: rgba(60, 30, 15, 0.10) blur 8px offset 0 4px
```

**Hover shadow (Level 2):**
```
Layer 1: rgba(60, 30, 15, 0.08) blur 16px offset 0 8px
```

**Modal/sheet shadow (Level 3):**
```
Layer 1: rgba(60, 30, 15, 0.04) blur 0px spread 1px offset 0 0
Layer 2: rgba(60, 30, 15, 0.10) blur 24px offset 0 12px
```

#### F.5 Standard animation parameters (DD-008)

| Interaction | Parameters |
|---|---|
| Card press | scale 1.0 → 0.97 → 1.0, 120ms total, easeInOut |
| Section entrance (first load) | fade + 8px slide-up, 80ms per section, staggered |
| Bottom sheet slide-up | 240ms, cubic-bezier(0.32, 0.72, 0, 1) — iOS-native curve |
| Loading shimmer | 1.6s linear loop on warm gradient (#EBEADF → #D8D5C9 → #EBEADF) |
| Milestone celebration | Lottie file, ~1s, auto-dismiss parent after 2s |
| Chip select/deselect | 120ms, scale 1.0 → 1.03 → 1.0 with fill color transition |

---

### Appendix G — Decision traceability matrix

*All 28 design decisions and the SRS sections they affected.*

| DD | Title | SRS sections affected |
|---|---|---|
| DD-001 | Stories as first-class vertical (M0) | §1.2, §1.3, §1.5 (Vertical def), §5.2 (vertical enum), App B, App D |
| DD-002 | Show all verticals with honest "soon" counts; waitlist signal | §4.2 (ONB-FR-007, ONB-FR-008, ONB-FR-009), §5.1 (user_waitlisted_verticals) |
| DD-003 | Three-CTA welcome + guest browsing | §1.3 (scope), §4.1 (IAM-FR-010, IAM-FR-011), §4.2 (ONB-FR-001) |
| DD-004 | 5-step onboarding flow (welcome/phone, location, categories, creators, done) | §4.2 (ONB-FR-001 through ONB-FR-005), §3.3, §7.8 |
| DD-005 | Design system foundations (typography, icons, animations) | §2.5 (C-18, C-19, C-20), App F |
| DD-006 | 3-level taxonomy: vertical → sub-category → leaf type + facets | §1.5, §4.5 (DISC-FR-003), §5.1, §5.2, App B (full rewrite), App D |
| DD-007 | Section-based home feed (not For You/Following tabs) | §2.2, §3.3, §4.5 (DISC-FR-001, DISC-FR-002, DISC-FR-020 through DISC-FR-025), App D |
| DD-008 | Animation library choices (flutter_animate, Framer Motion, Lottie) | §2.5 (C-20), App F.5 |
| DD-009 | Location mandatory, single current_city, nearest-neighbor waterfall | §1.3, §2.1, §2.5 (C-21), §2.7 (A-07 updated), §3.3, §4.2 (ONB-FR-002, ONB-FR-010, ONB-FR-011), §4.5 (DISC-FR-026 through DISC-FR-030), §5.1 (cities table, user/content additions), App D |
| DD-010 | City icons: Phosphor map-pin only, no emoji | §2.5 (C-19), App F.3 |
| DD-011 | Home feed: greeting removed, vertical chip icons added | §4.5 (DISC-FR-021 updated, DISC-FR-031) |
| DD-012 | Waitlist card for picked-but-empty verticals | §4.5 (DISC-FR-024) — covered by DD-007 |
| DD-013 | Monochrome design system, coral as sole accent | §2.5 (C-17), App F.1, App D |
| DD-014 | Discover tab: browse-first + search overlay + filter sheet + editorial collections | §4.5 (DISC-FR-032 through DISC-FR-035), §5.1 (editorial_collections), §4.12 (ADM-FR-009) |
| DD-014 amendment | Collections are algorithmic in MVP, manual in V1 | §4.5 (DISC-FR-035 updated), §5.1 (editorial_collections.source) |
| DD-015 | Search history, rotating placeholder, DPDPA compliance | §4.5 (DISC-FR-036 through DISC-FR-038), §4.12 (ADM-FR-010), §5.1 (search_queries, materialized view), §7.5 (PRIV-FR-010 through PRIV-FR-013) |
| DD-016 | Soft auth wall — bottom sheet with context-aware subhead | §4.1 (IAM-FR-011, IAM-FR-005 promoted to M0) |
| DD-017 | Save state as global user-content relationship | §4.6 (SOC-FR-004 rewritten), §5.1 (user_saves) |
| DD-018 | (Superseded by DD-022) | — |
| DD-019 | WhatsApp share as first-class action | §4.6 (SOC-FR-005 updated), §4.5 (DISC-FR-007 updated) |
| DD-020 | (Superseded by DD-023) | — |
| DD-021 | Scheduled experience schema (dates, capacity, meeting points) | §4.4 (CRT-FR-005 rewritten, BOOK-FR-002 updated), §5.1 (scheduled_dates, meeting_points) |
| DD-022 | Four content types: post, event, scheduled_experience, self_paced_itinerary | §1.5, §3.3, §4.4 (CRT-FR-001, CRT-FR-002, CRT-FR-003, CRT-FR-005, CRT-FR-006 deprecated, CRT-FR-013 added), §5.2 (enums) |
| DD-023 | Self-paced = Roamy-style spot-based itinerary (not chaptered text) | §1.5, §4.4 (CRT-FR-002, CRT-FR-003 rewritten), §5.1 (itinerary_days, itinerary_spots), §6.3 |
| DD-024 | Overnight stop: coral pin on itinerary map | §4.4 (CRT-FR-003 acceptance criteria), §2.5 (C-17 5th coral use) |
| DD-025 | Events vs scheduled experiences — distinct types; events promoted to M0 | §3.2, §3.3, §4.4 (CRT-FR-013 added), §5.1 (event_occurrences), App D |
| DD-026 | Post body uses Fraunces — exception to general Inter rule | §2.5 (C-18 updated), §4.4 (CRT-FR-001 updated), App F.2 |
| DD-027 | Posts: engagement signals, no price, no KYC | §4.4 (CRT-FR-001 updated) |
| DD-028 | Google Places API dependency for itinerary publishing | §2.1, §2.5 (C-22), §2.7 (A-08), §6.3, §6.4, §7.4 (NFR-SEC-014) |

**ID numbering notes for DISC-FR:** DD-007 assigns DISC-FR-020 through DISC-FR-025. DD-009 was originally numbered DISC-FR-025 through DISC-FR-029 in the changelog — in this SRS they are renumbered DISC-FR-026 through DISC-FR-030 to avoid collision with DD-007's DISC-FR-025. DD-011 was originally DISC-FR-030 in the changelog — renumbered to DISC-FR-031. DD-014 (030–033) renumbered to DISC-FR-032–035. DD-015 (034–036) renumbered to DISC-FR-036–038.

---

**End of SRS v1.2**

> **Companion documents (live):**
>
> - [`personas.md`](./personas.md) — user personas
> - [`success-metrics.md`](./success-metrics.md) — north star + inputs + counter-metrics
> - [`compliance.md`](./compliance.md) — DPDPA + IT Act + Adventure safety playbook
> - [`content-seeding.md`](./content-seeding.md) — how we recruit the first 15 creators
> - [`creator-platform-pivot.md`](./creator-platform-pivot.md) — framing for the v1.0 → v1.1 pivot
> - [`archive/srs-design-decisions-changelog-final.md`](./archive/srs-design-decisions-changelog-final.md) — DD-001 through DD-028 changelog (archived)
> - [`../../../02_design/phase-1/adr/ADR-001-tech-stack.md`](../../../02_design/phase-1/adr/ADR-001-tech-stack.md) — locked tech stack
> - `02_design/phase-1/adr/ADR-002` through `ADR-014` — one per decision in Appendix D
> - `CLAUDE.md` at project root — project-local overrides for Claude
