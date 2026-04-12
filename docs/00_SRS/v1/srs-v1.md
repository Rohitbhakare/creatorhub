# Software Requirements Specification (SRS) — `<AppName>`
**Version:** 1.1 (creator-platform pivot applied)
**Date:** 2026-04-07
**Status:** Approved by founder · creator-platform framing · travel as launch vertical
**Author:** Business Analyst (Claude) + Product Owner (Rohit)
**Supersedes:** `Docs/01_requirements/archive/original-drafts/{mobile,web,admin_panel}_draft_v1.md`
**Related:** [`creator-platform-pivot.md`](./creator-platform-pivot.md), [`ba-review-v1.md`](../ba-review/ba-review-v1.md)

> **Reading contract.** This is the single source of truth for Phase 1. If a requirement is not in this SRS, it does not exist for Phase 1. Conflicts with the original draft PRDs are resolved **in favour of this document**. SRS v1.1 reframes the product as a **creator platform with travel as the launch vertical** (decision DEC-002, 2026-04-07) — see `creator-platform-pivot.md` for the full rationale.

---

## 0. Document Control

| Field | Value |
|---|---|
| Product | `<AppName>` — text-first creator-and-booking platform · India-launched · **travel is the launch vertical** |
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
| 1.1 | 2026-04-07 | Claude BA | **Creator-platform pivot applied** (DEC-002). Travel reframed as launch vertical. Schema gains `vertical` enum + `vertical_data` JSONB on `content`. ~85% of v1.0 carried over verbatim — see `creator-platform-pivot.md` §7 for the edit list, and Appendix E for the row entry. |

### 0.2 Terminology — requirement IDs

All requirements are identified with a stable ID that **does not change** across versions. Format:

`<AREA>-<TYPE>-<NNN>` — e.g. `IAM-FR-001`, `BOOK-NFR-004`, `TAX-LGL-002`.

- **AREA** — see §4 section codes (IAM, ONB, PROF, CRT, DISC, SOC, BOOK, REV, NTF, GAM, TS, ADM, ANL, TAX)
- **TYPE** — `FR` (functional), `NFR` (non-functional), `LGL` (legal/compliance), `INT` (interface), `DAT` (data), `BR` (business rule)

Every FR also has a **Milestone** tag (`M0`, `M1`, `M2`, `M3`, `DEF`) — see §3.

---

## 1. Introduction

### 1.1 Purpose

`<AppName>` exists because **content creators have no durable home on the internet — their work vanishes with the algorithm, lives buried in DMs, and earns through someone else's ad-tech instead of through their own audience.** The creator economy runs on rented land. We are building owned land: a **bookable mini-website for every creator**, durable, SEO-indexed, monetisable, and structured around their actual craft.

We launch with the **travel vertical** because (a) the founder's insight is sharpest there, (b) Indian travel creators have no good home today, and (c) the booking model maps cleanly to itineraries and guided trips. Once travel proves the wedge (target: 50 paying creators), the same platform expands vertical-by-vertical — food, fitness, education, photography, music, wellness, sports — at a cadence of one new vertical per quarter.

This SRS specifies a mobile (Flutter), web (Next.js), and admin platform that does three things at once:

1. Lets creators publish **text-first, structured, persistent** content with media — essentially their own mini-website. The wizard adapts to each vertical (MVP ships only the travel vertical, but the schema is multi-vertical from day one).
2. Lets followers **discover, read, save, and book** that content with minimum clicks and zero itinerary-hunting.
3. Runs the payments, tax compliance, reviews, and trust/safety rails that are legally required to operate a marketplace in India.

### 1.2 Product vision (one paragraph)

> *"I was in Bali, drowning in Reels, noting itineraries on paper, cross-checking them on Google Maps, hunting for activity bookings on four different sites. I want a place where a creator I trust has already laid out the route, day by day, with the bookings attached — and if I like it, I tap Book. That is what we are building — first for travel, then for every other craft a creator builds an audience around."*

**Vertical strategy.** Travel is the **launch wedge**, not the whole product. The vision is the creator-website-and-booking platform; travel is the proof point. The schema, the wizard architecture, and the discovery surfaces are all designed to hold N verticals from day one — but we ship only travel for the 12-week MVP. **No other vertical ships before V1.** See `creator-platform-pivot.md` and ADR-009 for the locked rule.

### 1.3 Product scope — in and out

**Verticals (vertical strategy — see ADR-009):**

- **MVP (M0+M1+M2):** travel vertical only. The user-visible UX has no vertical picker because there is only one vertical to pick.
- **V1+:** second vertical pilot (founder-chosen, likely food or fitness). UI exposes the vertical picker.
- **V2+:** third vertical + vertical-management UI in admin.
- **Schema:** multi-vertical from day one (`vertical` enum + `vertical_data` JSONB on `content`). See §5.1.
- **Hard rule:** no second vertical ships before V1. No exceptions, regardless of opportunity. (DEC-002)

**In scope for Phase 1:**

- Mobile app (Flutter, iOS + Android)
- Web app (Next.js, responsive, SEO-first)
- Admin/operations tooling (hosted on Supabase Studio + Retool for MVP; custom admin panel for V2)
- Content types: **Post**, **Self-paced Experience**, **Scheduled Experience** (and their free/paid variants — see §1.5 for terminology)
- Creator mini-site (public profile, SEO-indexed)
- Bookings & escrow payments via Razorpay
- Reviews & ratings
- Follow graph, likes, comments, saves
- Creator KYC (PAN + Aadhaar OTP + bank penny drop)
- Tax compliance (GST, Section 194-O 1% TDS, Form 16A)
- DPDPA 2023 + DPDP Rules 2025 compliance
- IT Act Intermediary Rules 2021 compliance
- India-only, English-only

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
| Designer | §2.3, §4 (UX notes), §6.1 |
| Legal counsel | §8 |
| Ops / Support | §4.11, §4.12, §4.13, §4.14 |
| Finance / CA | §4.14, §8.4, §8.5 |

### 1.5 Definitions, acronyms, abbreviations

| Term | Meaning |
|---|---|
| **Creator** | A user who publishes content. Every user is a potential creator — no separate sign-up. |
| **Follower** | A user who consumes content (reads, saves, books). Same user model — no role split. |
| **Vertical** | A top-level domain that defines the wizard schema and discovery surface. MVP ships **`travel`** only. Future verticals: `food`, `fitness`, `education`, `photography`, `music`, `wellness`, `sports`. Locked at the platform level; one new vertical per quarter post-MVP. |
| **Sub-category** | A vertical-specific slice (e.g. within travel: road trips, adventure, cultural; within food: street food, cooking class, recipe). User picks vertical first, then sub-category. |
| **Post** | Short-form (text + up to 5 images) free content. Vertical-agnostic. No KYC required to publish. |
| **Self-paced Experience** | (formerly "Self-guided Itinerary") A structured experience a follower works through on their own — for travel: a day-by-day itinerary; for food: a recipe collection; for fitness: a workout plan. Can be free or paid. Paid requires KYC. |
| **Scheduled Experience** | (formerly "Guided Trip") A creator-led experience with fixed dates and slots — for travel: a guided trip; for food: a cooking class; for fitness: a live coaching session. Always paid. Always requires KYC. |
| **Experience** | Umbrella term for Self-paced + Scheduled. |
| **`vertical_data`** | A JSONB column on `content` that holds vertical-specific fields (validated by a Zod schema per vertical at the API edge). See §5.1. |
| **Mini-site** | A creator's public profile page, SEO-indexed, functioning as their personal website. Shows their vertical(s). |
| **Escrow** | Funds held by Razorpay Route until trip completion + dispute window. |
| **Platform fee** | `<AppName>`'s cut. Dynamic, configured per creator/category in admin. |
| **GST** | Goods and Services Tax — 18% on services in India. |
| **TDS** | Tax Deducted at Source — **1%** under Section 194-O for e-commerce operators (not 10%). |
| **DPDPA** | Digital Personal Data Protection Act 2023 (India). DPDP Rules 2025 in force from Nov 2025. |
| **ATOAI** | Adventure Tour Operators Association of India — safety guidelines 2022. |
| **KYC** | Know Your Customer — PAN + Aadhaar OTP + bank penny drop. |
| **PAS** / **PA** | Payment Aggregator Service / Payment Aggregator (RBI licensed — we rely on Razorpay's licence, we are not a PA). |

### 1.6 References

1. Draft requirement docs (superseded): `Docs/01_requirements/archive/original-drafts/{mobile,web,admin_panel}_draft_v1.md`
2. BA review: `Docs/01_requirements/phase-1/ba-review/ba-review-v1.md`
2a. Creator-platform pivot framing: `Docs/01_requirements/phase-1/srs/creator-platform-pivot.md`
3. Digital Personal Data Protection Act 2023 + DPDP Rules 2025
4. IT (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021
5. Consumer Protection (E-commerce) Rules 2020
6. RBI Guidelines on Regulation of Payment Aggregators and Payment Gateways, 2020 (+ 2022 escrow amendments)
7. Section 194-O, Income Tax Act, 1961 (1% TDS for e-commerce operators)
8. GST Act — services of e-commerce operators (Section 9(5))
9. ATOAI Adventure Tour Operators Safety Guidelines, 2022
10. Razorpay Route + Linked Accounts documentation
11. Supabase Auth / RLS documentation

---

## 2. Overall description

### 2.1 Product perspective

`<AppName>` is a **greenfield** product. It is not replacing an existing system. It will integrate with:

- **Firebase Auth** (phone OTP) → issues Firebase JWT → backend verifies and mints session
- **Supabase Postgres** (primary store) with Row-Level Security
- **Firebase Storage** (media: images, audio, video, KYC docs)
- **Razorpay Route** (escrow + linked accounts + payouts)
- **Razorpay Payment Gateway** (UPI, cards, netbanking, wallets)
- **MSG91** (transactional SMS)
- **SendGrid** (transactional email)
- **Google Maps SDK** (mobile + web)
- **Firebase Cloud Messaging** (mobile push)
- **Sentry** (error monitoring, both client and server)
- **Meilisearch** or **Typesense** (search — see §6.3 decision; **not** Elasticsearch for MVP due to ops cost)
- **Upstash Redis** (rate limiting, OTP, cache) — optional for MVP, required for V1

### 2.2 Product functions (high-level)

1. **Identity & onboarding** — sign up with phone OTP, pick interests, become either a follower or a creator (or both).
2. **Publish** — create posts, self-paced experiences, scheduled experiences; vertical-adaptive structured-content builder; upload media; save drafts. (MVP ships only the travel vertical, but the wizard architecture is vertical-aware.)
3. **Discover** — home feed (Following / For You), Explore (list + map), search, category browse. Vertical filter is in the schema from day one but hidden in MVP (only one vertical exists).
4. **Consume** — read a post or experience, view a creator's mini-site (with vertical badge), save to wishlist, share.
5. **Book** — for bookable content, check availability, pay (escrow), receive confirmation, prepare for the experience. Booking flow is vertical-agnostic.
6. **Review** — after completion, leave a rating + review; creators can respond.
7. **Social** — follow/unfollow, like, comment, reply, save.
8. **Notifications** — push + email for follows, bookings, payments, comments, system alerts.
9. **Trust & safety** — report content/users; moderators queue; KYC gating for paid content; T&Cs.
10. **Admin & ops** — moderate, run payouts, resolve disputes, pull tax reports, view analytics.
11. **Tax compliance** — collect GST, deduct 1% TDS, generate Form 16A, GSTR-1, GSTR-3B inputs.

### 2.3 User classes and characteristics

See `Docs/phase-1/srs/personas.md` for full personas.

| Class | Description | Primary needs | Tech fluency |
|---|---|---|---|
| **Follower (primary)** | Urban Indian, 22–40, salaried or freelance, plans 2–4 trips/year, follows travel creators on Instagram, searches "best Bali itinerary" on Google | Trusted itineraries, easy booking, mobile-first | Medium–high |
| **Creator (primary)** | Indian travel content producer, 23–38, currently reliant on Instagram / YouTube, wants durable content + a mini-site + monetization | Profile, publishing tools, analytics, payouts, a brand-able URL | Medium |
| **Creator-led group operator** | Small tour operator or solo guide running adventure/photo/spiritual tours | Slot management, bookings, waivers, payouts, GST | Low–medium (needs hand-holding) |
| **Admin / moderator / support / finance / ops** | Internal staff | Moderation queue, KYC review, payout runs, dispute resolution, tax exports | High |
| **Guest (unauthenticated)** | Web visitor arriving from Google search | Read content, see reviews, be convinced to sign up | Varies |

### 2.4 Operating environment

| Surface | Platform | OS / Browser minimums |
|---|---|---|
| Mobile app | Flutter 3.22+ | Android 9.0 (API 28)+, iOS 14+ |
| Web app | Next.js 14+ App Router | Chrome/Edge/Safari/Firefox last 2 versions; responsive down to 360px |
| Admin (MVP) | Supabase Studio + Retool | Chrome/Edge last 2 versions |
| Admin (V2) | Next.js (separate app) | Same as web |
| Backend | Supabase (hosted Postgres + Edge Functions) + a thin Express/Hono service on Fly.io or Railway | — |
| Storage | Firebase Storage | — |

### 2.5 Design and implementation constraints

| # | Constraint | Rationale |
|---|---|---|
| C-01 | **Flutter** for mobile, not React Native. | Founder preference; single codebase iOS + Android; overrides inherited CLAUDE.md. |
| C-02 | **Next.js 14+ App Router** for web, with SSR on public creator/mini-site pages for SEO. | SEO is a primary wedge. |
| C-03 | **Supabase Postgres** as primary store, with Row-Level Security (RLS). | Single tenant DB, built-in auth integration, reduces backend code for solo dev. |
| C-04 | **Firebase Phone Auth** for OTP, not Supabase Auth. | Phone OTP in India — Firebase is the cheapest and most reliable path today. Supabase JWT is used only for RLS claims, not for identity. |
| C-05 | **Razorpay** as sole PG/escrow provider for Phase 1. | UPI-first, Route for escrow, proven in India. |
| C-06 | **India-only.** All UI copy, currency, locale, legal docs target India. | Focused launch. |
| C-07 | **English-only UI** at launch, but all user-facing strings go through `intl` / ARB files from day one. | i18n architecture ready without i18n content. |
| C-08 | **Amounts stored in paisa (integer)**, never in rupees (float). | Floating point is forbidden for money. |
| C-09 | **Monorepo** with `apps/mobile` (Flutter), `apps/web` (Next.js), `apps/api` (Hono/Express TypeScript), `apps/admin` (deferred), `packages/shared` (TypeScript types + Zod schemas generated from Postgres, shared by web and api). | Flutter side uses Dart types generated from the same schema via `supabase gen types` + `freezed`. |
| C-10 | **Admin panel is NOT custom-built for MVP.** Ops uses Supabase Studio + Retool. Custom admin ships in V2. | 3-month launch does not permit custom admin. |
| C-11 | **Platform fee is dynamic** — stored per creator and per category, defaulting from a global setting. | Founder has not committed to a single number. |
| C-12 | **No direct messaging** in Phase 1. | Cut for scope + moderation burden. |
| C-13 | **All public pages SSR-rendered with canonical URLs** and JSON-LD structured data. | SEO. |
| C-14 | **Category-adaptive content creation** — the wizard changes fields based on category (adventure vs road trip vs street food vs wildlife). | Specified in detail in §4.4. |
| C-15 | **Accessibility: WCAG 2.1 AA** for web; platform accessibility APIs for mobile. | Legal + inclusion. |
| C-16 | **Analytics: PostHog self-hosted or cloud**, with a strict PII allow-list. | DPDPA compliant by design. |

### 2.6 User documentation

- In-app help screens (static, linked) — MVP
- A `/help` page on the web app with FAQs — MVP
- Creator onboarding guide (PDF + web) — V1
- Terms, Privacy, Community Guidelines, Refund Policy, Cancellation Policy, Cookie Policy — **MVP, legal-counsel-authored**

### 2.7 Assumptions and dependencies

| # | Assumption / dependency | Risk if false |
|---|---|---|
| A-01 | Razorpay Route is available to us and approves our use case. | Hard block — must validate by **Week 1**. |
| A-02 | Firebase Auth phone OTP continues to work in India (TRAI, DLT compliance on SMS). | Fallback: MSG91 OTP. |
| A-03 | Supabase free/pro tier handles our MVP load (< 500 DAU at launch). | Migrate to paid tier; contingency is self-hosted Postgres. |
| A-04 | Legal counsel can deliver T&Cs, Privacy Policy, Community Guidelines by **Week 6**. | Cannot publish paid bookings without these. |
| A-05 | At least 15 creators can be recruited for a seed cohort before public launch. | Product has nothing to show. See `content-seeding.md`. |
| A-06 | One additional full-stack engineer joins by **Week 4**. | Scope must be cut further. |
| A-07 | CGL + Professional Liability insurance can be sourced for the platform and required of adventure creators. | Must defer adventure categories. |

---

## 3. Release strategy — what ships when

> **The "consider all the requirements in design but only build MVP now" rule is implemented here.** Every requirement in §4 has a milestone tag. The database schema, API surface, folder structure, and module boundaries in §5 and §6 are designed to hold the **union** of all milestones — meaning the MVP is a slice of the full shape, not a throwaway prototype.

### 3.1 Milestones at a glance

| Milestone | Ship | Duration | Headline |
|---|---|---|---|
| **M0 — Foundations** | Weeks 1–2 | 2 weeks | Repo, CI, auth, schema, legal docs drafted, Razorpay sandbox approved, seed creators contacted |
| **M1 — Private alpha** | Weeks 3–6 | 4 weeks | End-to-end **free posts + free itineraries**, home feed, creator profile, no payments, 15 seed creators in |
| **M2 — Public MVP launch** | Weeks 7–12 | 6 weeks | **Paid guided trips + paid itineraries**, Razorpay Route, KYC, reviews, reports, basic admin via Retool |
| **V1 — Growth features** | Weeks 13–22 | 10 weeks | Search (Meilisearch), explore map, gamification (points/streaks), wishlist, referrals, creator analytics dashboard, in-app tax summary, bulk content tools |
| **V2 — Platform features** | Weeks 23–34 | 12 weeks | Custom admin panel, full compliance exports (GSTR-1, GSTR-3B, 16A), adventure safety toolkit, events & groups, desktop creator studio |
| **Phase 2 (DEF)** | Post-V2 | — | DMs, multi-language, brand sponsorships, subscriptions, international, AI assistant, live streams |

### 3.2 What MVP (M0+M1+M2) is NOT

- No DMs
- No search bar that hits a real search engine — MVP uses Postgres `tsvector` only
- No map view (list only for Explore in MVP)
- No gamification (points/streaks/badges)
- No wishlist (saves collapse to "bookmarks" — a simple flag on a content row)
- No custom admin panel — Supabase Studio + Retool queries
- No creator analytics dashboard — creators see counts only
- No Hindi / regional languages
- No brand sponsorships / subscriptions
- No events & groups as separate entities (see §4.4 — deferred)
- No blog / CMS
- No referral program
- No scheduled publishing
- No "version history" or drafts beyond one auto-saved draft per content type
- No desktop-only creator studio — same web UI for all viewports

### 3.3 What MVP MUST have (non-negotiable)

- Phone OTP sign-up → profile
- Create & publish Post
- Create & publish Self-guided Itinerary (free and paid)
- Create & publish Guided Trip (paid only)
- Creator KYC (PAN + Aadhaar OTP + bank penny drop)
- Home feed (Following tab + For You tab — For You is chronological-with-interest-weights, no ML)
- Creator mini-site (SSR on web, deep-linked on mobile)
- Follow / unfollow
- Like / comment / save
- Booking flow with Razorpay Route escrow, UPI-first
- Payout to creator after completion + 48-hour dispute window
- Review after completed trip (blind, 14-day reveal)
- Report content / user
- Notifications (push + email) for the critical events only
- Terms, Privacy, Community Guidelines, Refund Policy, Cancellation Policy live
- DPDPA consent flows + data export + data deletion
- GST collection on bookings
- 1% TDS under Section 194-O

### 3.4 Rule of scope

If a requirement in §4 does not have an `M0`, `M1`, or `M2` tag, **it is not in the MVP.** Do not build it. Do not optimise for it. The database model and API must *accommodate* it, but no UI, no server logic, no tests.

---

## 4. Functional requirements

> Format: each requirement has an ID, a milestone tag, a title, a description, acceptance criteria, and (where relevant) UI notes. Critical business rules are called out as `BR-*` under their parent requirement.

### 4.1 Identity, Access, Auth (IAM)

#### IAM-FR-001 · [M0] · Phone-number sign-up and sign-in

**Description.** A user signs up or signs in using their Indian mobile number (+91). A 6-digit OTP is sent via Firebase Phone Auth. On successful verification, Firebase issues an ID token; the backend exchanges it for a `<AppName>` session cookie (web) or a session record (mobile).

**Acceptance criteria:**
- Entering a valid +91 number sends an OTP within 5 seconds in ≥95% of attempts.
- OTP is 6 digits, valid for 10 minutes, max 5 verify attempts before lockout.
- Successful verify creates a `users` row if none exists (first-time), or signs in an existing user.
- If `phone_number` already exists and is soft-deleted, the user can be restored on explicit consent.
- Resend OTP allowed after 30 seconds, max 3 resends per 10 minutes.
- Rate limit: 5 OTP requests per phone number per hour (enforced server-side).

**BR-IAM-001.** The backend **never** trusts a Firebase ID token alone — it verifies the token on every auth'd request (or on session creation and caches a session token with short TTL).

**BR-IAM-002.** A user record is created only after successful OTP verification, never on OTP send.

**UI notes:** "+91" prefix is fixed, non-editable in MVP.

---

#### IAM-FR-002 · [M0] · Session management

**Description.** Sessions persist across app launches. Web uses HttpOnly secure cookies; mobile uses a refresh token stored in secure storage (flutter_secure_storage / iOS Keychain / Android Keystore).

**Acceptance criteria:**
- Mobile session is valid for 90 days of rolling activity; idle > 30 days signs the user out.
- Web session is valid for 30 days, refreshed on each request.
- Sign-out revokes the refresh token server-side and clears local storage.
- Signing in on a new device does not sign out existing sessions (multi-device allowed) but an activity audit record is written.

---

#### IAM-FR-003 · [M2] · Account deletion

**Description.** A user can request deletion of their account. DPDPA 2023 §12 "Right to erasure". See LGL-DPDPA-005.

**Acceptance criteria:**
- Deletion is soft for 30 days (grace period), then hard.
- Hard delete removes PII from `users`, `user_profiles`, and any table flagged PII=true in the data catalogue.
- Bookings, reviews, and content authored by the user are **anonymised, not deleted**, to preserve the marketplace audit trail (legal retention).
- Creator with live bookings cannot delete until all bookings complete or are refunded.
- User receives email + SMS confirmation of deletion.

---

#### IAM-FR-004 · [V1] · Email-as-secondary-identifier

**Description.** Users can add an email to their profile for notifications and recovery. Email is not a login method in Phase 1.

---

#### IAM-FR-005 · [DEF] · Social login (Google, Apple)

**Description.** Deferred to V2. Database and schema already support multiple auth providers per user.

---

#### IAM-FR-006 · [M2] · KYC onboarding for creators who monetise

**Description.** Before a creator can **publish paid content or receive payouts**, they must complete KYC: PAN verification, Aadhaar OTP verification, bank account penny drop.

**Acceptance criteria:**
- PAN verification via Razorpay/Cashfree KYC API — returns verified name, which must match the Aadhaar name (fuzzy match, 2 char tolerance).
- Aadhaar OTP verified via Digilocker or UIDAI API (through Razorpay KYC as a proxy).
- Bank penny drop (₹1) credits the stated account and reads the beneficiary name; it must match PAN name.
- Creator is blocked from publishing paid content until KYC status = `verified`.
- Creator can publish **free** posts and free itineraries without KYC.
- KYC re-verification required if PAN/bank/Aadhaar is changed.
- All KYC docs encrypted at rest, access audit-logged.

**BR-IAM-KYC-001.** KYC failures must include a reason code so support can help. Raw failure messages from the API must not leak to the user.

---

### 4.2 Onboarding (ONB)

#### ONB-FR-001 · [M1] · Splash and welcome carousel

**Description.** First-launch shows a 3-slide carousel explaining the product (creator-first, text-based, booking). Skippable. Shown once.

**Acceptance:** swipe or skip, last slide has "Get started" → IAM-FR-001.

---

#### ONB-FR-002 · [M1] · Interest selection

**Description.** After sign-up, the user picks **at least 3** categories from a locked list (see Appendix B — revised category taxonomy, 7 categories not 10).

**Acceptance:**
- User must pick ≥3 to proceed.
- Selection writes to `user_interests` table (many-to-many).
- Feed uses these for For You ranking.
- User can change interests later in Settings.

---

#### ONB-FR-003 · [M1] · Role nudge (follower or creator)

**Description.** After interest selection, a single screen: "Are you here to discover trips, or to share yours?" — picking "Share" launches the creator profile setup (display name, bio, profile image, languages spoken, home city). Picking "Discover" skips to the feed; user can become a creator later from Settings.

**Acceptance:**
- Role is not binary — both users are the same `users` row. This is a UX funnel, not a schema split.
- `is_creator` flag on `users` flips to true on first content publish, not on this screen.

---

#### ONB-FR-004 · [M2] · Creator profile completion

**Description.** Before publishing *paid* content, creator must complete: full name, bio (min 100 chars), profile photo, cover photo, home city, languages, categories they cover, social links (optional).

---

### 4.3 Profile & Creator mini-site (PROF)

#### PROF-FR-001 · [M1] · View own profile

**Description.** The user sees their profile: avatar, name, bio, counts (followers, following, posts, experiences), tabs (Posts / Experiences / Reviews received / Saved).

---

#### PROF-FR-002 · [M1] · Edit profile

**Description.** Edit display name, bio, avatar, cover, home city, languages, categories, social links (Instagram, YouTube, personal website).

**BR-PROF-002.** Profile photo and cover must pass image moderation (see TS-FR-005).

---

#### PROF-FR-003 · [M1] · Public creator mini-site (web, SSR)

**Description.** Every creator has a public URL: `<AppName>.in/@username` (or slug if name collision). This is the creator's mini-website.

**Acceptance:**
- Server-rendered with full HTML on first byte.
- Sections: hero (cover + avatar + bio + follow button), featured experiences, all posts, all experiences, reviews, stats, contact/report.
- OpenGraph tags with cover image, title, description.
- JSON-LD structured data: `Person`, `Organization`, and for each experience a `TouristTrip` or `Product` schema.
- Canonical URL: `https://<AppName>.in/@username`.
- `sitemap.xml` includes all public creator pages and experience pages.
- Loads < 2.5 s LCP on 4G for the median user.
- Works unauthenticated; follow/book CTAs prompt sign-in.

**BR-PROF-003.** Usernames are 3–20 chars, lowercase alphanumeric + underscore, reserved list for system paths (`admin`, `api`, `help`, etc.).

---

#### PROF-FR-004 · [M1] · Public creator mini-site (mobile deep link)

**Description.** The same URL opens in the mobile app via deep link (iOS Universal Link + Android App Link), rendering a native view.

---

#### PROF-FR-005 · [V1] · Creator analytics — basic

**Description.** Creator sees views, follows, saves, bookings, earnings, conversion rate. MVP shows the counts only on each card; V1 adds a dashboard.

---

#### PROF-FR-006 · [V2] · Custom domain

**Description.** Creators on V2 can point a custom domain (e.g., `creatorname.com`) to their mini-site via CNAME. **Deferred.**

---

### 4.4 Content creation (CRT)

> This is the most complex area. Read §4.4 in full before implementing any create flow.

#### CRT-FR-001 · [M1] · Create a free Post

**Description.** Short-form content: 1–1000 chars text + 0–5 images. No category-specific fields. No booking. No KYC required.

**Acceptance:**
- Max 1000 chars, live counter.
- Max 5 images, max 5 MB each (client-side compressed to ≤ 1MB before upload).
- Optional location tag (single point), optional category tag (1 category).
- Auto-save draft every 10 seconds to local storage.
- One single-tap publish.
- On publish: record created with `status='published'`, `type='post'`, `visibility='public'`; enqueued for image moderation.

---

#### CRT-FR-002 · [M1] · Create a Self-guided Itinerary (free or paid)

**Description.** Multi-step wizard. The wizard adapts to the selected category.

**Wizard shape (common to all itineraries):**

| Step | Name | Fields |
|---|---|---|
| 1 | Basics | Title (5–100 chars), cover image, short description (max 280 chars), category (single), sub-category, tags (max 5) |
| 2 | Meta | Duration (days), difficulty, best season, budget range, suitability (solo/couple/family/group, flags) |
| 3 | **Itinerary** | Day-by-day builder — see CRT-FR-003 |
| 4 | Location | Start point, end point, waypoints (on map), region, state, country (locked: India) |
| 5 | Media | Up to 10 images, optional audio narration (V1), optional video (V2) |
| 6 | Long description | Rich text, max 2000 chars |
| 7 | Category-specific fields | **Adaptive — see CRT-FR-004** |
| 8 | Pricing & access | Free / Paid. If Paid: price in ₹, GST handling, what's included, what's not, refund policy pick-list |
| 9 | Review & publish | Preview, T&Cs checkbox (unticked by default), publish |

**Acceptance:**
- Auto-save draft every 30 seconds; draft is server-side (not just local), so it survives device change.
- One draft per user per content type in MVP. (Multiple drafts — V1.)
- Paid itineraries require KYC verified before publish (see IAM-FR-006).
- All images pass image moderation queue.
- On publish: emit `content.published` event → search indexer + feed fan-out.

---

#### CRT-FR-003 · [M1] · Itinerary day-by-day builder

**Description.** Inside Step 3, creator adds N days, and within each day adds segments (time blocks). Each segment has: title, description, start time, duration, location (pin on map), cost estimate, image (optional), "how to reach" (optional), "where to book" (optional link or platform-native tap-to-book for V1).

**Acceptance:**
- Add/remove/reorder days (drag handle on mobile; keyboard + drag on web).
- Add/remove/reorder segments within a day.
- Minimum 1 day, 1 segment.
- Segments show on a per-day summary map.
- Server computes total cost estimate (sum of segment costs).

---

#### CRT-FR-004 · [M1 for 3 categories; V1 for all 7] · Category-adaptive fields

> Category taxonomy is reduced from 10 to 7 — see Appendix B. The 10 original categories had meaningful overlap.

| Category | Extra fields |
|---|---|
| **Road Trips & Weekend Getaways** | Vehicle type, route map, fuel cost estimate, toll cost, road condition notes, parking notes |
| **Street Food & Culinary** | Dish list, diet tags (veg/non-veg/jain/vegan), hygiene rating (creator self-assessed), allergen warnings |
| **Adventure & Trekking** | **Mandatory**: things to avoid, required gear, fitness level, guide mandatory?, emergency contacts, altitude, monsoon safety, insurance mandatory flag |
| **Cultural & Festival** | Festival dates (calendar), dress code, etiquette, photography allowed? |
| **Wildlife & Nature** | Sanctuary name, safari timings, permit required?, sighting probability, season windows |
| **Offbeat & Hidden Gems** | Accessibility (solo safe?), network availability, ATM availability, local contact |
| **Solo & Budget** | Gender safety notes, hostel / stay suggestions with price bands, public transport notes |

**BR-CRT-004-A.** For **Adventure & Trekking**, `things_to_avoid` is **mandatory**. Cannot publish without it.

**BR-CRT-004-B.** For V1, every category unlocks its own set. For MVP, only **Road Trips**, **Street Food**, and **Adventure** are supported — the others use a generic fallback field set.

---

#### CRT-FR-005 · [M2] · Create a Guided Trip

**Description.** Creator-led trip with fixed dates, slots, and pricing. Always paid. Always requires KYC.

**Extra fields beyond Itinerary:**
- Departure date(s) + return date
- Max group size, min confirmed to run
- Price per head
- Meeting point
- Inclusions / exclusions (checklist)
- Cancellation policy (pick-list: flexible / moderate / strict)
- **Waiver URL** (V1 — required for adventure categories)
- GST rate (auto-computed, editable by finance admin)

**Acceptance:**
- Calendar picker for dates (multiple departures allowed).
- Each departure is a `trip_slot` row with its own capacity and bookings.
- Published trips appear in the creator's experiences and in search.
- Trip can be unpublished but not deleted once a booking exists — it is hidden instead.

---

#### CRT-FR-006 · [V2] · Events and Groups as separate entities

**Description.** Events and Groups are modelled in the DB from M0 but **no UI** until V2. Posts/Itineraries/Trips cover MVP needs.

---

#### CRT-FR-007 · [M1] · Auto-save drafts

See CRT-FR-002.

---

#### CRT-FR-008 · [M1] · Publish / unpublish / archive

**Description.** States: `draft` → `under_review` (auto) → `published` → `unpublished` | `archived`. Moderator can force-move to `rejected` or `takedown`.

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

**Description.** Client compresses (max 1 MB per image) → uploads to Firebase Storage with signed URL → returns `media_id`. Server generates thumbnails (200 / 600 / 1200 px) via a Cloud Function on upload trigger. Video in V2.

**Acceptance:**
- EXIF GPS stripped on upload (privacy).
- HEIC converted to JPEG server-side.
- Signed upload URLs expire in 15 minutes.
- Max 10 MB per file uploaded, rejected otherwise.

---

### 4.5 Discovery & Search (DISC)

#### DISC-FR-001 · [M1] · Home feed — Following tab

**Description.** Chronological feed of content from creators the user follows. Pull to refresh. Infinite scroll.

**Acceptance:**
- Empty state: "Follow creators to see their content here" + CTA to explore.
- Backed by `feed_items` table populated via fan-out-on-write for creators with < 10k followers, and fan-in-on-read for larger creators (both ready at schema level, only fan-in-on-read is implemented in MVP).

---

#### DISC-FR-002 · [M1] · Home feed — For You tab

**Description.** Content ranked by: interest match (40%), recency (30%), engagement signals (20%), creator quality (10%). No ML in MVP — a **hand-tuned Postgres query** with weights.

**Acceptance:**
- Returns 20 items per page.
- Excludes content the user has already seen in the last 7 days (tracked in `feed_seen`).
- For new users with no history, defaults to trending by category match.

---

#### DISC-FR-003 · [M1] · Category browse

**Description.** Tap a category → list of content in that category, sorted by recency.

---

#### DISC-FR-004 · [V1] · Explore — list view

**Description.** Browse all content with filters: category, budget, duration, difficulty, region, season.

---

#### DISC-FR-005 · [V1] · Explore — map view

**Description.** Same as list, but on a map. Pin clustering, tap pin → bottom sheet preview.

---

#### DISC-FR-006 · [V1] · Search

**Description.** Single search bar. Queries: title, description, creator name, tags, location. Backed by Meilisearch (decided in §6.3).

**Acceptance:**
- Typeahead suggestions after 3 chars, < 200 ms response.
- Filters applied on top of search results.
- Recent searches stored locally.

---

#### DISC-FR-007 · [M2] · SEO for public pages

**Description.** All public pages (creator mini-site, experience detail, post detail) are SSR'd by Next.js, ship complete HTML, emit OpenGraph + JSON-LD, are in `sitemap.xml`, and honour `robots.txt`.

---

#### DISC-FR-008 · [V1] · Category / city landing pages

**Description.** `<AppName>.in/trek/himachal`, `<AppName>.in/road-trips/spiti`, etc. — SEO landing pages with curated content.

---

### 4.6 Social graph (SOC)

#### SOC-FR-001 · [M1] · Follow / unfollow a creator

**Description.** From any creator card or profile, tap Follow. Toggles `follows` row. Fires notification to creator (batched).

**BR-SOC-001.** Follow count is eventually consistent — read from a cached column updated by trigger, with a periodic reconcile job. No reads from the raw count.

---

#### SOC-FR-002 · [M1] · Like a content item

**Description.** Tap heart → `likes` row created. Optimistic UI. Undo on double-tap.

---

#### SOC-FR-003 · [M1] · Comment on a content item

**Description.** Threaded one level deep (replies to top-level comments only).

**Acceptance:**
- Comments max 500 chars.
- Rate limit: 10 comments per user per minute.
- Comments pass text moderation (see TS-FR-004).
- Creator receives push + email notification (batched).

---

#### SOC-FR-004 · [M1] · Save / bookmark a content item

**Description.** Single "saved" collection in MVP. Multiple collections = V1.

---

#### SOC-FR-005 · [M1] · Share a content item

**Description.** Native share sheet (Flutter: `share_plus`, web: Web Share API fallback to copy-link). Shared URL is the SSR mini-site URL.

---

#### SOC-FR-006 · [V1] · Repost / reshare

Deferred.

---

#### SOC-FR-007 · [DEF] · Direct messages

Deferred to Phase 2.

---

### 4.7 Bookings & Payments (BOOK)

#### BOOK-FR-001 · [M2] · Booking flow — paid itinerary

**Description.** Follower taps "Book" on a paid itinerary → sign-in required → booking summary (what they're buying, creator, price breakdown incl. GST) → payment (Razorpay Checkout, UPI default) → confirmation.

**Acceptance:**
- Booking intent row created on tap, state = `pending_payment`.
- Razorpay order created server-side, signed by server secret.
- Successful payment webhook → state `paid` → confirmation email + SMS + push.
- Failed payment → state `payment_failed`, user can retry from booking screen.
- Payment held in **escrow** via Razorpay Route (see BOOK-FR-005).

---

#### BOOK-FR-002 · [M2] · Booking flow — paid guided trip

**Description.** Same as BOOK-FR-001 but with slot selection. User picks a departure date → slot availability checked → seats reserved for 10 minutes during payment → paid or released.

**Acceptance:**
- Optimistic seat reservation with a 10-minute TTL hold.
- If payment completes, hold converts to confirmed booking.
- If payment times out, hold released.
- Hard capacity check — cannot oversell.

---

#### BOOK-FR-003 · [M2] · Free-itinerary "booking" (virtual booking)

**Description.** A free itinerary has an optional "Book" (i.e., "Save as my trip plan") that creates a booking row with price 0. Used for analytics + notifications (creator sees who took their itinerary).

---

#### BOOK-FR-004 · [M2] · Price breakdown and tax

**Description.** Every paid booking shows:

```
Base price              ₹ X
GST (18%)               ₹ Y
Convenience fee (if any)₹ Z
Total                   ₹ (X + Y + Z)
```

And in the backend:

```
Creator payable         = base_price - platform_fee - tds(1%)
Platform fee            = base_price * platform_fee_rate
TDS (Sec 194-O)         = base_price * 1%
GST collected           = base_price * 18%  (remitted to govt)
```

**BR-BOOK-004.** **Platform fee is computed on base price, not on GST.** TDS is computed on base price (gross payment to seller per Sec 194-O), not on creator-payable.

**BR-BOOK-005.** All amounts stored in **paisa**. Displayed as ₹ with two decimals only when non-integer.

---

#### BOOK-FR-005 · [M2] · Escrow + payout via Razorpay Route

**Description.** Customer payment lands in platform Razorpay account. Route config auto-transfers the creator's share to their linked account **on trigger after trip completion + 48-hour dispute window**. Platform fee stays in platform account.

**Acceptance:**
- Each creator has a `razorpay_linked_account_id` after KYC.
- Transfer is triggered by a scheduled job that scans completed bookings.
- If a dispute is raised within 48 h of completion, transfer is blocked; support investigates.
- Payout T+2 business days from trigger (Razorpay settlement window).

---

#### BOOK-FR-006 · [M2] · Refunds and cancellations

**Description.** Cancellation policies: `flexible` (full refund up to 7 days before), `moderate` (50% up to 3 days), `strict` (no refund after booking). Policy picked by creator at publish time.

**Acceptance:**
- Follower initiates cancellation → system computes refund per policy → creator notified → refund initiated via Razorpay.
- Refund timeline visible to user.
- Full refund on creator-initiated cancellation regardless of policy.

---

#### BOOK-FR-007 · [M2] · Booking state machine

States: `pending_payment → paid → confirmed → in_progress → completed → reviewed` and side paths `cancelled_by_user`, `cancelled_by_creator`, `refunded`, `disputed`.

See Appendix C for the state diagram.

---

#### BOOK-FR-008 · [V1] · Booking management dashboard (creator)

**Description.** Creator sees all upcoming, in-progress, and completed bookings. Can mark a booking as `in_progress` (trip started) and `completed`.

---

#### BOOK-FR-009 · [V1] · Waitlist

Deferred.

---

#### BOOK-FR-010 · [M2] · T&C acceptance per booking

**Description.** Unticked-by-default checkbox at checkout. Records `tnc_version_id`, `timestamp`, `ip`, `user_agent`.

---

### 4.8 Reviews and Ratings (REV)

#### REV-FR-001 · [M2] · Leave a review (blind, 14-day reveal)

**Description.** After a booking is `completed`, the follower can leave a review within 30 days. Reviews are held blind for 14 days or until both parties (follower and creator) have reviewed, whichever is first — then revealed.

**Acceptance:**
- Rating (1–5 stars) + text (20–1000 chars) + up to 3 optional images.
- One review per completed booking.
- After submission, user sees "Held for blind review."
- Creator cannot see the review until reveal.
- After reveal, creator can respond once, publicly.

**BR-REV-001.** Reviews can be reported and moderated, but cannot be deleted by the creator.

---

#### REV-FR-002 · [M2] · Display reviews on experience + creator profile

**Description.** Average rating shown prominently. Individual reviews paginated, newest first, with "helpful" count.

---

#### REV-FR-003 · [V1] · Review moderation queue

Described under §4.11.

---

### 4.9 Notifications (NTF)

#### NTF-FR-001 · [M1] · Push notifications (mobile)

**Description.** FCM on iOS + Android. Users consent at first eligible event. Required for: new follower, new comment/reply, new booking (for creators), booking confirmation (for followers), payment received, review posted, system alerts.

---

#### NTF-FR-002 · [M2] · Email notifications

**Description.** Transactional only in MVP. Uses SendGrid. Required for: booking confirmation, payment receipt, refund issued, KYC status change, account deletion, T&C change, DPDPA consent change.

---

#### NTF-FR-003 · [M2] · SMS notifications

**Description.** MSG91. Limited to: OTP, booking confirmation, trip reminder 24h before, payout sent.

---

#### NTF-FR-004 · [M2] · Notification preferences

**Description.** Per-channel (push, email, SMS) × per-category (social, bookings, payments, marketing) preferences page.

**BR-NTF-004.** Transactional and legally required notifications (OTP, booking confirmations, refund receipts, DPDPA consent) cannot be opted out of.

---

#### NTF-FR-005 · [V1] · In-app notification centre

Bell icon with unread count + list.

---

#### NTF-FR-006 · [DEF] · Web push

Deferred.

---

### 4.10 Gamification (GAM)

All of §4.10 is **V1 or later**.

- **GAM-FR-001 [V1]** Points for actions (publish, review, book, complete a trip, get followers).
- **GAM-FR-002 [V1]** Streaks (consecutive days of activity).
- **GAM-FR-003 [V1]** Badges (bronze/silver/gold for milestones).
- **GAM-FR-004 [V1]** Levels (1–20 based on points).
- **GAM-FR-005 [V2]** Leaderboards (city, category, national).
- **GAM-FR-006 [V2]** Rewards marketplace (redeem points).

**Design note:** Gamification tables exist in schema from M0 so we can start logging events immediately. UI is deferred.

---

### 4.11 Trust and Safety (TS)

#### TS-FR-001 · [M2] · Report content

**Description.** Every content item has a "Report" action. Categories: spam, nudity, violence, hate, scam, copyright, misinformation, other. User provides optional note.

---

#### TS-FR-002 · [M2] · Report user

Same UX, targets a user.

---

#### TS-FR-003 · [M2] · Moderator queue (via Retool in MVP, custom in V2)

**Description.** All reports land in a queue. Moderator can `take_down`, `warn_user`, `suspend_user`, `dismiss`. Actions are audit-logged.

**Acceptance:**
- SLA: **first response within 36 hours** for P1 (nudity, hate, violence); 72 hours for others. (Per IT Act Intermediary Rules 2021, take-down of grossly offensive content must happen within 24 hours of awareness; critical — see LGL.)

---

#### TS-FR-004 · [M2] · Text moderation

**Description.** All text (posts, comments, reviews, bios) passes a profanity / hate-speech filter. High-confidence matches held in a "needs review" state before publish.

**Implementation:** **Google Perspective API** in MVP (free tier). Replaced with an in-house classifier later.

---

#### TS-FR-005 · [M2] · Image moderation

**Description.** Uploaded images pass through Google Cloud Vision SafeSearch before publish. Explicit / violence images rejected automatically; borderline items queued for human review.

---

#### TS-FR-006 · [M2] · Creator suspension

**Description.** Admin can suspend a creator. Suspension hides all their content; in-flight bookings get a notice and full refund option.

---

#### TS-FR-007 · [V1] · Content quality score

Heuristics-based ranking signal.

---

#### TS-FR-008 · [M2] · Grievance Officer (IT Act)

**Description.** Per IT Act Rules 2021, platforms must publish the name and contact of a Grievance Officer on every page (footer). Acknowledge grievances within 24h, resolve within 15 days.

---

#### TS-FR-009 · [M2] · Adventure safety checklist

**Description.** Adventure category publish flow forces: required gear list, insurance status, guide credentials, emergency contacts, waiver URL. Creator certifies compliance before publish.

**BR-TS-009.** If the platform requires CGL insurance for creators in adventure category (Phase 1 decision: **yes, by V2**), enforce at KYC time with document upload + expiry tracking.

---

### 4.12 Admin & Operations (ADM)

#### ADM-FR-001 · [M2 via Retool] · User search and view

Ops can look up a user by phone / email / username; view KYC, bookings, content.

---

#### ADM-FR-002 · [M2 via Retool] · KYC review

Ops can approve / reject KYC with reason code.

---

#### ADM-FR-003 · [M2 via Retool] · Content takedown

Ops can take down content, with reason + internal note. Action audit-logged.

---

#### ADM-FR-004 · [M2 via Retool] · Payout run

Ops runs a job to trigger pending creator payouts (after completion + 48 h dispute window). Job writes a batch row and per-creator transfer rows. Razorpay Route does the actual transfer.

---

#### ADM-FR-005 · [M2 via Retool] · Refund run

Ops can initiate a manual refund outside of the follower-driven flow (e.g., dispute resolution).

---

#### ADM-FR-006 · [V2] · Full custom admin panel

Custom Next.js admin with all modules from `admin_panel_v1.md`. **Deferred to V2.**

---

#### ADM-FR-007 · [V2] · RBAC with 5 roles

Super Admin, Content Moderator, Support, Finance, Operations — matching the draft PRD.

---

#### ADM-FR-008 · [M2] · Audit log

Every ops action writes a row to `audit_log` with: actor, action, target, timestamp, ip, reason, before/after JSON snapshot where applicable.

---

### 4.13 Analytics & Reporting (ANL)

#### ANL-FR-001 · [M1] · Event tracking

**Description.** All UI events go through a single `track(eventName, props)` function on mobile and web. Events land in PostHog (or Mixpanel) and also in a `events` table in Postgres for SQL analysis.

**Key events (minimum set):**
- `app_open`, `app_close`
- `signup_started`, `signup_completed`
- `onboarding_completed`
- `content_viewed` (type, id, source)
- `content_liked`, `content_saved`, `content_shared`
- `booking_initiated`, `booking_paid`, `booking_cancelled`
- `search_performed`
- `creator_followed`, `creator_unfollowed`
- `profile_viewed`
- `review_submitted`

**BR-ANL-001.** Event properties must not contain PII (no phone, no email, no full name). User is identified by `user_id` (UUID) only.

---

#### ANL-FR-002 · [V1] · Creator analytics dashboard

Views, unique viewers, saves, bookings, earnings, conversion rate, top content.

---

#### ANL-FR-003 · [V1] · Platform KPI dashboard

DAU, WAU, MAU, retention cohorts, GMV, take rate, creator counts, funnel conversion. Metabase or PostHog dashboards.

---

### 4.14 Tax & Compliance (TAX)

#### TAX-FR-001 · [M2] · GST calculation and collection

**Description.** At checkout, GST (18% on services) is added to base price. On the backend, an `invoices` row records base, GST, platform fee, creator share.

**BR-TAX-001.** GSTIN of the platform is pre-configured. Creator GSTIN (optional in MVP) is stored and appears on the invoice if provided.

---

#### TAX-FR-002 · [M2] · TDS under Section 194-O

**Description.** Platform deducts **1%** TDS on the gross amount payable to the creator (i.e., base price before platform fee), per Section 194-O. Remits quarterly.

**BR-TAX-002.** The draft `admin_panel_v1.md` states 10% — **that is wrong** for marketplaces under 194-O. Correct rate is 1%.

**Acceptance:**
- Per-booking TDS deduction stored in `booking_financials`.
- Quarterly TDS aggregate by creator, by PAN, ready to export.
- Form 16A generation — V2.

---

#### TAX-FR-003 · [V2] · GSTR-1 and GSTR-3B export

**Description.** Export monthly data in the format needed by the platform's CA to file GSTR-1 and GSTR-3B. MVP = a raw CSV; V2 = a formatted export.

---

#### TAX-FR-004 · [V2] · Annual tax summary for creators

Tax statement for each creator showing earnings, TDS deducted, GST collected (if they have GSTIN), and Form 16A download.

---

#### TAX-FR-005 · [M2] · Invoice generation

**Description.** PDF invoice for every paid booking, emailed on payment success. Includes platform GSTIN, booking ID, base, GST, total, buyer details (name, city), seller details (creator name, city, GSTIN if applicable).

---

#### TAX-FR-006 · [M2] · PAN validation on creator KYC

Required under Sec 194-O. Without PAN, TDS rate jumps to 5% (Sec 206AA) — must enforce.

---

## 5. Data model (overview)

> Full ERD and migration scripts live in the HLD/LLD, which is a separate document. This SRS describes the high-level entities and their relationships so the schema can be designed to hold the full product.

### 5.1 Core entities

```
users (1) ──< user_interests >── categories
  │
  ├──< user_profiles (1:1)
  ├──< user_kyc (1:1, creator only)
  ├──< follows (self-join)
  ├──< content (1:M) ────┐
  ├──< bookings (1:M)    │
  ├──< reviews (1:M)     │
  ├──< notifications     │
  ├──< audit_log         │
  └──< user_sessions     │
                         │
content                  │
  ├── type: post | experience                 (universal — replaces post|itinerary|guided_trip)
  ├── format: self_paced | scheduled          (only if type=experience)
  ├── vertical: travel | food | fitness | …   (MVP: only `travel` is allowed by RLS check)
  ├── vertical_data: JSONB                    (vertical-specific fields, validated by Zod at API edge)
  ├── status, visibility, published_at
  ├──< content_media
  ├──< content_locations
  ├──< content_tags
  ├──< experience_days (if type=experience; for travel: itinerary days, for food: recipe steps, for fitness: workout days)
  │      └──< experience_segments
  ├──< experience_schedules (if format=scheduled — slots/sessions, vertical-agnostic)
  ├──< likes
  ├──< comments
  ├──< saves
  ├──< reports
  └──< content_moderation

bookings
  ├── content_id, user_id, creator_id
  ├── trip_slot_id (nullable)
  ├── state (enum)
  ├──< booking_financials (1:1)
  │      ├── base_amount_paisa
  │      ├── gst_amount_paisa
  │      ├── platform_fee_paisa
  │      ├── tds_paisa
  │      └── creator_payable_paisa
  ├──< payments
  ├──< refunds
  └──< disputes

razorpay_linked_accounts  (creator payout routing)
razorpay_webhook_events   (raw webhook store, idempotent)
tnc_versions              (for audit of what the user agreed to)
dpdpa_consents            (per-purpose consent records)
dpdpa_data_requests       (export / delete requests)
grievances                (IT Act grievance records)
feature_flags             (remote config)
platform_settings         (global + per-category platform fee etc.)
```

### 5.2 Key enums (Postgres enum types)

```
content_type        : post | experience                                  -- v1.1 simplified from post|itinerary|guided_trip
experience_format   : self_paced | scheduled                             -- only set when content_type='experience'
vertical            : travel | food | fitness | education | photography
                      | music | wellness | sports                        -- MVP: only `travel` allowed by an RLS check
content_status      : draft | under_review | published | unpublished | archived | rejected | taken_down
visibility          : public | unlisted | private
pricing_model       : free | paid
travel_subcategory  : road_trips | street_food | adventure | cultural | wildlife | offbeat | solo_budget
                                                                          -- per-vertical sub-categories live as
                                                                          -- `<vertical>_subcategory` enums; new verticals add new enums
kyc_status          : not_started | pending | verified | rejected | expired
booking_state       : pending_payment | paid | confirmed | in_progress | completed | reviewed |
                      cancelled_by_user | cancelled_by_creator | refunded | disputed
payment_status      : initiated | success | failed | refunded
report_status       : open | in_review | actioned | dismissed
```

**Why JSONB for `vertical_data` instead of one extension table per vertical?** Each vertical adds 5–15 fields, and we don't want a migration every time we add one. JSONB + a strict Zod schema at the API layer is the right shape. Frequently-queried fields (e.g. `duration_days` for travel) can be promoted to columns or generated columns later. See ADR-009 for the decision rationale.

### 5.3 Row-level security (RLS)

Every table with user data has RLS enabled:

- `users`: self-read only; admin-read via service role
- `content`: public-read for `status='published' AND visibility='public'`; author-read/write for own
- `bookings`: self-read for owner (follower) or creator (seller); admin via service role
- `dpdpa_consents`: self-only, append-only
- `audit_log`: admin-read only, service-role write

### 5.4 Amount representation

- All monetary columns are `BIGINT` and named `*_paisa`.
- Never `NUMERIC`, never `FLOAT`. Conversion is `paisa / 100.0` at the UI edge only.

---

## 6. External interfaces

### 6.1 User interfaces

| Surface | Framework | Design system | Notes |
|---|---|---|---|
| Mobile | Flutter 3.22+ | Custom `<AppName>` design system (tokens in `packages/ui_tokens`) | SafeArea on every screen, `CachedNetworkImage` with shimmer placeholder |
| Web | Next.js 14 App Router + Tailwind + shadcn/ui | Same tokens mirrored to Tailwind config | SSR for all public pages |
| Admin (MVP) | Supabase Studio + Retool | — | Pre-built Retool app |
| Admin (V2) | Next.js (separate app) | Same system | Tabler or Mantine admin kit |

### 6.2 Hardware interfaces

- Camera (both platforms) — for profile photo, content images
- GPS (mobile) — for location tagging (permission-gated)
- Gallery / file picker — mandatory
- Biometric unlock (V1) — for app unlock

### 6.3 Software interfaces

| Service | Purpose | Decision |
|---|---|---|
| **Firebase Auth** | Phone OTP | Confirmed |
| **Supabase Postgres** | Primary DB | Confirmed |
| **Supabase Edge Functions** | Light backend logic (feed, search fan-out) | Yes for MVP |
| **Hono on Fly.io or Railway** | Complex backend (webhooks, KYC proxy, payouts, cron) | Yes for MVP |
| **Firebase Storage** | Media | Confirmed |
| **Firebase Cloud Messaging** | Push | Confirmed |
| **Razorpay Payment Gateway** | PG | Confirmed |
| **Razorpay Route** | Escrow + linked accounts | Confirmed |
| **Razorpay KYC** (or Cashfree) | PAN/Aadhaar/penny drop | Week 1 validation |
| **MSG91** | SMS | Confirmed |
| **SendGrid** | Email | Confirmed |
| **Google Maps SDK** | Maps (mobile + web) | Confirmed |
| **Google Perspective API** | Text moderation | Confirmed (free tier) |
| **Google Cloud Vision SafeSearch** | Image moderation | Confirmed |
| **Sentry** | Error monitoring | Confirmed |
| **PostHog** | Product analytics | Confirmed (self-hosted or cloud) |
| **Meilisearch** (cloud) | Full-text search | Confirmed for V1. **Not Elasticsearch** — too expensive to operate at MVP scale. MVP uses Postgres `tsvector`. |
| **Upstash Redis** | Rate limit + OTP + cache | V1 |

### 6.4 Communication interfaces

- HTTPS/TLS 1.2+ for all client↔server traffic
- FCM for push
- SMS via MSG91 HTTPS API
- Email via SendGrid HTTPS API
- Webhooks from Razorpay verified with HMAC signature
- Rate limiting at the gateway layer (Cloudflare → origin)

---

## 7. Non-functional requirements

### 7.1 Performance

| ID | Requirement |
|---|---|
| NFR-PERF-001 | Cold start of mobile app ≤ 2.5 s on a Redmi Note 12 (mid-range Android reference device) |
| NFR-PERF-002 | Feed first-page load ≤ 1.5 s on 4G |
| NFR-PERF-003 | p95 API response time ≤ 400 ms for read endpoints at 500 RPS |
| NFR-PERF-004 | p95 API response time ≤ 800 ms for write endpoints |
| NFR-PERF-005 | Web LCP ≤ 2.5 s for public creator pages on 4G |
| NFR-PERF-006 | Image upload from mobile at 1 MB ≤ 5 s on 4G median |
| NFR-PERF-007 | Booking payment round trip ≤ 3 s from tap Pay to confirmation screen (excluding user input in PG) |

### 7.2 Scalability

| ID | Requirement |
|---|---|
| NFR-SCALE-001 | MVP must sustain 1,000 concurrent users without horizontal scaling |
| NFR-SCALE-002 | V1 must sustain 10,000 concurrent users with Supabase Pro tier + Upstash |
| NFR-SCALE-003 | V2 must sustain 50,000 concurrent users |
| NFR-SCALE-004 | Feed fan-out design must not block on creators with > 100k followers (fan-in on read; see DISC-FR-001) |

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
| NFR-SEC-009 | Session tokens stored in `HttpOnly; Secure; SameSite=Lax` cookies (web) |
| NFR-SEC-010 | Mobile refresh tokens in Keychain / Keystore |
| NFR-SEC-011 | OWASP Top 10 addressed in code review checklist |
| NFR-SEC-012 | Penetration test before V1 public launch |
| NFR-SEC-013 | Audit log is append-only, exportable, retained 7 years |

### 7.5 Privacy (see §8 for full legal list)

| ID | Requirement |
|---|---|
| NFR-PRIV-001 | Data minimisation: collect only what is needed for the stated purpose |
| NFR-PRIV-002 | Purpose-bound consent for each category of personal data (DPDPA §7) |
| NFR-PRIV-003 | User can export their data as JSON (DPDPA §11) |
| NFR-PRIV-004 | User can delete their account (DPDPA §12) — see IAM-FR-003 |
| NFR-PRIV-005 | Breach notification to DPB within 72 h (DPDPA §8(6)) |
| NFR-PRIV-006 | Children under 18 — parental consent required (DPDPA §9). MVP disallows < 18 via self-declaration at signup. |
| NFR-PRIV-007 | No behavioural tracking of children |
| NFR-PRIV-008 | Consent manager module from M0 (purposes: analytics, marketing, notifications, location, KYC) |

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
| NFR-MAINT-001 | Monorepo with clear app boundaries (see C-09) |
| NFR-MAINT-002 | ≥ 70% unit-test coverage on critical modules (booking, payments, KYC, tax) |
| NFR-MAINT-003 | CI runs lint + typecheck + tests on every PR; green required to merge |
| NFR-MAINT-004 | One-command local dev boot (`make dev` or `pnpm dev`) |
| NFR-MAINT-005 | ADRs under `Docs/adr/` for every major decision |

### 7.8 Usability

| ID | Requirement |
|---|---|
| NFR-UX-001 | First-time user can complete sign-up → interest selection → see feed in ≤ 60 s |
| NFR-UX-002 | Booking flow ≤ 4 taps from "Book" to payment screen |
| NFR-UX-003 | Error messages are actionable (not "something went wrong") |
| NFR-UX-004 | Empty states include an illustration + title + description + CTA |

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
| LGL-DPDPA-006 | Appoint a Data Protection Officer (DPO) or Grievance Officer for data matters (may be same person as IT Act Grievance Officer) |
| LGL-DPDPA-007 | Breach notification to Data Protection Board within 72 h |
| LGL-DPDPA-008 | Children under 18 — parental consent, no tracking, no targeted ads |
| LGL-DPDPA-009 | Retain personal data only as long as necessary; publish retention schedule |
| LGL-DPDPA-010 | Cross-border transfer — transfer allowed to any country not on the blacklist; document the destinations |

### 8.2 IT Act Intermediary Rules 2021

| ID | Requirement |
|---|---|
| LGL-IT-001 | Publish Terms of Service, Privacy Policy, Community Guidelines on signup and footer |
| LGL-IT-002 | Appoint a Grievance Officer; publish name, contact, process on every page |
| LGL-IT-003 | Acknowledge grievances within 24 h; resolve within 15 days |
| LGL-IT-004 | Publish Grievance Officer's monthly compliance report (when user base crosses SSMI threshold — 50 lakh — not applicable at launch) |
| LGL-IT-005 | Takedown of prohibited content within 24 h of actual knowledge or court order |
| LGL-IT-006 | Retain user records for 180 days after account removal (for investigation) |

### 8.3 Consumer Protection (E-commerce) Rules 2020

| ID | Requirement |
|---|---|
| LGL-CP-001 | Display clear pricing (base, taxes, total) before payment |
| LGL-CP-002 | Display clear cancellation and refund policy per listing |
| LGL-CP-003 | Display creator/seller details (name, contact, GSTIN if applicable) |
| LGL-CP-004 | No fake reviews — all reviews tied to a verified booking |
| LGL-CP-005 | Handle consumer complaints within 48 h acknowledgement, 1 month resolution |

### 8.4 RBI Payment Aggregator rules

| ID | Requirement |
|---|---|
| LGL-RBI-001 | We do not hold customer funds directly — Razorpay holds escrow under their PA licence. |
| LGL-RBI-002 | We do not settle funds to creators directly — Razorpay Route performs settlements. |
| LGL-RBI-003 | Disclose the role of Razorpay and settlement timeline to both buyer and seller. |

### 8.5 Tax compliance

| ID | Requirement |
|---|---|
| LGL-TAX-001 | GST registration for the platform (already assumed, verify with CA) |
| LGL-TAX-002 | Collect 18% GST on services |
| LGL-TAX-003 | Deduct 1% TDS under Section 194-O on gross payable to creator |
| LGL-TAX-004 | Higher TDS (5%) under Sec 206AA if creator has no PAN |
| LGL-TAX-005 | File quarterly TDS (Form 26Q) and issue Form 16A to creators |
| LGL-TAX-006 | Retain tax records for 8 years |

### 8.6 Adventure tourism safety (ATOAI 2022 guidelines)

| ID | Requirement |
|---|---|
| LGL-ADV-001 | Adventure category creators must disclose risks, required gear, guide qualifications |
| LGL-ADV-002 | `things_to_avoid` field mandatory for Adventure category (BR-CRT-004-A) |
| LGL-ADV-003 | CGL insurance mandatory for Adventure creators by V2 |
| LGL-ADV-004 | Waiver of liability from followers at booking time for Adventure trips (V1) |
| LGL-ADV-005 | Minor (< 18) participation requires guardian consent upload (V1) |
| LGL-ADV-006 | Emergency contact capture from every follower booking an Adventure trip |
| LGL-ADV-007 | **Waivers do not protect against gross negligence** — platform cannot over-rely on them |

### 8.7 Insurance

| ID | Requirement |
|---|---|
| LGL-INS-001 | Platform carries Commercial General Liability (CGL) by M2 |
| LGL-INS-002 | Platform carries Professional Liability / E&O by V1 |
| LGL-INS-003 | Creators in Adventure carry their own CGL (enforced by V2) |

### 8.8 Required legal documents (owned by counsel, not AI)

| Document | Owner | Due |
|---|---|---|
| Terms of Service | Counsel | Before M2 |
| Privacy Policy (DPDPA-compliant) | Counsel | Before M2 |
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
| O-09 | Whether to have SMS OTP fallback (MSG91) in addition to Firebase | Engineering | Week 3 |
| O-10 | Final category list — confirm reduction from 10 to 7 (Appendix B) | Founder | Week 1 |
| O-11 | First 15 seed creators identified | Founder | Week 4 |
| O-12 | Custom domain for creators — deferred to V2 confirmed? | Founder | V1 planning |

---

## 10. Appendices

### Appendix A — Glossary

See §1.5.

### Appendix B — Revised category taxonomy (10 → 7)

The original 10 categories from `mobile_draft_v1.md` had meaningful overlap. Proposal:

| New category | Collapses | Rationale |
|---|---|---|
| **Road Trips & Weekend Getaways** | Road Trips & Travel + Weekend Getaways & Events + Motorcycle & Bike Touring | All are "short-haul by road"; motorcycle is a sub-tag |
| **Street Food & Culinary** | Street Food & Culinary | Keep |
| **Adventure & Trekking** | Adventure Trekking & Hiking | Keep — tighten name |
| **Cultural & Festival** | Cultural & Festival Experiences | Keep |
| **Wildlife & Nature** | Wildlife & Nature | Keep |
| **Offbeat & Hidden Gems** | Offbeat & Hidden Gems | Keep |
| **Solo & Budget** | Solo Adventures + Budget & Sustainable Travel | Merge — both express the same "low-cost, self-guided" intent |

User picks ≥3 during onboarding. Content is tagged with **one** primary category and up to 3 tags (which can map to the other categories).

### Appendix C — Booking state machine (narrative)

```
    (follower taps Book)
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
     │ trip start
     ▼
   in_progress
     │
     │ trip end
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

### Appendix D — Decision log (seeds the ADR folder)

| ADR | Decision | Status |
|---|---|---|
| ADR-001 | Flutter for mobile, Next.js for web, Supabase Postgres + Firebase Auth | Proposed — write-up pending |
| ADR-002 | Monorepo with pnpm workspaces + Flutter side-by-side | Proposed |
| ADR-003 | Meilisearch for search in V1; Postgres tsvector in MVP | Proposed |
| ADR-004 | Admin via Retool + Supabase Studio for MVP; custom admin in V2 | Proposed |
| ADR-005 | Consolidate 10 categories to 7 | Proposed |
| ADR-006 | Amounts stored in paisa | Proposed |
| ADR-007 | Blind review reveal at 14 days | Proposed (retain from draft PRD) |
| ADR-008 | Dynamic platform fee | Proposed |
| ADR-009 | **Vertical strategy — multi-vertical schema, single-vertical MVP** | Proposed (this SRS v1.1) |

### Appendix E — Differences from `mobile_draft_v1.md` / `web_draft_v1.md` / `admin_panel_v1.md`

| Area | Draft said | SRS says | Reason |
|---|---|---|---|
| Tech stack | React Native (implied) + Elasticsearch | Flutter + Next.js + Supabase, Postgres tsvector → Meilisearch | Founder decision; ops cost |
| TDS rate | 10% | **1%** (Sec 194-O) | Draft was factually wrong |
| Categories | 10 | 7 | Overlap; smoother onboarding |
| Admin panel | Full custom from day 1 | Retool + Supabase Studio in MVP, custom in V2 | Cannot fit in 3 months |
| DMs | Phase 1 | Phase 2 | Scope cut |
| Gamification | Phase 1 | V1 onward | Scope cut |
| Events & Groups | Phase 1 | V2 | Scope cut |
| Desktop creator studio | Phase 1 | Phase 2 | Scope cut |
| Hindi / regional | Partial | English only, i18n architecture ready | Scope cut |
| DPDPA / IT Act compliance | Not mentioned | Full section 8 | Legal requirement |
| Adventure safety & insurance | Partial | Full LGL-ADV + LGL-INS | Legal + safety requirement |
| Blind review reveal | 14 days | 14 days | Retained |
| Platform fee | 17% fixed | Dynamic default | Founder decision |
| **Product framing** (v1.1) | Travel-only platform | **Creator platform · travel as launch vertical** | Founder decision DEC-002, 2026-04-07. Schema becomes multi-vertical (`vertical` enum + `vertical_data` JSONB). MVP user experience is unchanged because only travel ships. See `creator-platform-pivot.md` for the full reasoning. |
| **Content type model** (v1.1) | `post | itinerary | guided_trip` | `post | experience` with `format = self_paced | scheduled` | Same idea, more general — works for any vertical |

---

**End of SRS v1.1**

> **Companion documents (live):**
>
> - [`personas.md`](./personas.md) — user personas
> - [`success-metrics.md`](./success-metrics.md) — north star + inputs + counter-metrics
> - [`compliance.md`](./compliance.md) — DPDPA + IT Act + Adventure safety playbook
> - [`content-seeding.md`](./content-seeding.md) — how we recruit the first 15 creators
> - [`creator-platform-pivot.md`](./creator-platform-pivot.md) — framing for the v1.0 → v1.1 pivot
> - [`../../../02_design/phase-1/adr/ADR-001-tech-stack.md`](../../../02_design/phase-1/adr/ADR-001-tech-stack.md) — locked tech stack
> - `02_design/phase-1/adr/ADR-002` through `ADR-009` — one per row in Appendix D (in progress)
> - `CLAUDE.md` at project root — project-local overrides for Claude
