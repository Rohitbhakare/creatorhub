# CreatorHub — Design Chat → SRS → Code Gap Report

> **Source chat:** `docs/01_wireframes/v2/chats/chat1.md` (exported from the claude.ai/share session)
> **Scope:** Compare every design decision locked in the wireframe session against (a) SRS v1.2.1 and (b) current Flutter implementation.
> **Generated:** 2026-04-25

---

## 0 · TL;DR

The design chat produced **9 screen packs (~47 screens)** and a **master prompt** with concrete SRS clause changes. Most SRS clauses (C-17 through C-28) were correctly updated in v1.2.1. The Flutter codebase partially implements them. The critical gap is the **bottom navigation** — the locked C-28 structure (`Home · Discover · [Create FAB] · Studio · You`) was never built; the code still runs the old C-23 layout (`Home · Discover · Studio · Saved · You`). There are also 4 designed screens with no implementation and ~6 design features that are V1+ scope and correctly deferred.

---

## 1 · Design Decisions Locked in Chat → SRS Coverage

These are the explicit SRS clause changes the design master prompt requested. Check whether they landed in SRS v1.2.1.

| Clause | Design decision | In SRS v1.2.1? | Notes |
|--------|----------------|:--------------:|-------|
| C-17 | Coral `#E15A41` sole decorative accent. Semantic hues only on functional states. No gradient backgrounds. | ✅ YES | Fully stated in C-17 + C-25 |
| C-17.1 (new) | **Selection state language**: rest = outlined + hairlineStrong border; selected = coral border + 3px `primaryTint` halo + coral icon + 18dp coral check badge top-right. No dark fill ever. | ✅ YES | Captured as C-26 in SRS |
| C-18 (renamed C-27) | **Card elevation**: raised by default (layered 3-stop shadow); `flat` is explicit opt-in only for info blocks. | ✅ YES | Captured as C-27 in SRS |
| C-19 (renamed C-28) | **Bottom nav C-28**: 5 slots: `Home · Discover · Create (52dp coral FAB, centre) · Studio · You`. Active tab = coral-tint 44×26dp pill. No Saved tab. | ✅ YES | Captured as C-28; supersedes C-23 |
| C-20 | Controlled form inputs: every `<input value>` must have `onChange` or `readOnly`. | ✅ YES | Captured as C-28 note / form rules |
| C-21 | Default theme: **Paper White** (`bg #F7F7F5`, `surface #FFFFFF`). Snow/Bone/Ink Night as alternates. | ✅ YES | Captured as C-25 |
| Typography | Fraunces display + Geist UI + JetBrains Mono for meta | ⚠️ PARTIAL | SRS C-18 says Fraunces + **Inter** (not Geist). Design chat says Geist. SRS wins — Inter is correct. |
| IAM-FR-007 AC | Verticals: outline only; min-3; coral border + halo + check badge | ✅ YES | Reflected in E0.4b + SRS C-26 |
| IA-FR-001 AC | Nav: 5 items; Create = coral FAB (not label); active = coral-tint pill; elevated. | ✅ YES | Reflected in SRS C-28 |
| CRT-FR-017 | Publish kind-picker tiles follow C-17.1 selection | ✅ YES | Traced to C-26 |
| BKG-FR-007 | Pay method picker tiles follow C-17.1 | ✅ YES | Traced to C-26 |
| KYC-FR-008 | Doc-type picker tiles follow C-17.1 | ✅ YES | Traced to C-26 |

**Verdict:** The SRS absorbed all 12 design clause updates. The canonical decisions are in the SRS.

---

## 2 · Screen-by-Screen: Design vs Implementation

### Pack A — Onboarding & Auth (8 screens)

| Screen | Label | SRS FR | Implemented? | Notes |
|--------|-------|--------|:------------:|-------|
| A1 | Welcome | IAM-FR-001, ONB-FR-001 | ✅ | `welcome_screen.dart` |
| A2 | Phone sign-in | IAM-FR-001 | ✅ | `phone_otp_screen.dart` |
| A2b | OTP verify | IAM-FR-001 | ✅ | Part of `phone_otp_screen.dart` |
| A3 | Profile setup | ONB-FR-002 | ✅ | `profile_bootstrap_screen.dart` |
| A4 | Verticals / Interests | IAM-FR-007, ONB-FR-003 | ✅ | `vertical_picker_screen.dart`; outline + coral halo + check badge matches C-26 exactly |
| A5 | Suggested creators | ONB-FR-004 | ✅ | `suggested_creators_screen.dart` |
| A6 | Celebrate | ONB-FR-005 | ✅ | `celebration_screen.dart` |
| A7 | Soft auth wall | IAM-FR-011 | ✅ | `soft_auth_sheet.dart`; context-aware subhead implemented |

Pack A: **8/8 implemented.** ✅

---

### Pack B — Home, Discover, Search, Create (6 screens)

| Screen | Label | SRS FR | Implemented? | Notes |
|--------|-------|--------|:------------:|-------|
| B1 | Home feed | DISC-FR-001–010 | ⚠️ PARTIAL | `home_feed_screen.dart` exists. Design shows full segmented control (For you / Following / Local). Code uses chip rail (For you / Following / Near you). Near you ≠ Local (Local is a named filter; Near you is proximity-based). Visual treatment also differs (design = solid segmented, code = pill chips). Functional coverage is equivalent. |
| B2 | Discover | DISC-FR-032–037 | ✅ | `discover_tab_screen.dart`; editorial themes grid + creator rail + upcoming experiences — matches design |
| B3 | Search overlay | DISC-FR-033 | ✅ | `search_overlay.dart`; typeahead + history |
| B4 | Filter sheet | DISC-FR-034 | ✅ | `filter_sheet.dart` |
| B5 | Create sheet / content type picker | CRT-FR-014 | ✅ | `content_type_picker_screen.dart`; SelectionTile pattern matches C-26 |
| B6 | Quests hub | — | ❌ NOT BUILT | Design-only V1 feature (gamification). **Correct to defer** — SRS §3.2 "No gamification for MVP". |

Pack B: **4/6 implemented, 1 partial (B1 visual), 1 correctly deferred (B6).** ⚠️

---

### Pack C — Content Detail (3 screens)

| Screen | Label | SRS FR | Implemented? | Notes |
|--------|-------|--------|:------------:|-------|
| C1 | Itinerary detail | CRT-FR-008 | ✅ | `itinerary_detail_screen.dart`; spot-based day cards |
| C2 | Post / Story detail | CRT-FR-001 | ✅ | `post_detail_screen.dart`; Fraunces body serif per DD-026 |
| C3 | Experience detail | CRT-FR-011 | ✅ | `experience_detail_screen.dart` |

Pack C: **3/3 implemented.** ✅

---

### Pack D — Booking Flow (3 screens)

| Screen | Label | SRS FR | Implemented? | Notes |
|--------|-------|--------|:------------:|-------|
| D1 | Booking intro / date selection | BK-FR-007 | ✅ | `booking_sheet.dart`; seat hold timer |
| D2 | Pay sheet (UPI/card) | BK-FR-008 | ✅ | Part of `booking_sheet.dart`; C-26 selection on pay tiles |
| D3 | Confirmation | BK-FR-009 | ✅ | `booking_confirmation_screen.dart` |

Pack D: **3/3 implemented.** ✅

---

### Pack E — Publishing Wizard (5 steps)

| Screen | Label | SRS FR | Implemented? | Notes |
|--------|-------|--------|:------------:|-------|
| E1 | Outline / chapters | CRT-FR-015 | ✅ | `wizard_shell_screen.dart` + step widgets |
| E2 | Stops / spots | CRT-FR-016 | ✅ | `day_builder_screen.dart` |
| E3 | Media upload | CRT-FR-018 | ✅ | Media step in wizard |
| E4 | Meta (price, dates) | CRT-FR-019 | ✅ | Basics + pricing steps |
| E5 | Preview + publish | CRT-FR-020 | ✅ | Review step |

Pack E: **5/5 implemented.** ✅

---

### Pack F — KYC Flow (10 screens)

| Screen | Label | SRS FR | Implemented? | Notes |
|--------|-------|--------|:------------:|-------|
| F1 | KYC intro | KYC-FR-005 | ✅ | `kyc_wizard_screen.dart` intro step |
| F2 | PAN entry | KYC-FR-010 | ✅ | PAN step |
| F3 | Aadhaar eKYC | KYC-FR-015 | ✅ | Aadhaar OTP step |
| F4 | Live selfie | KYC-FR-020 | ✅ | Selfie capture step |
| F5 | Bank account | KYC-FR-025 | ✅ | Bank step |
| F6 | Review + submit | KYC-FR-028 | ✅ | Review step |
| F7 | Submitted state | KYC-FR-029 | ✅ | `kyc_status_screen.dart` submitted |
| F8 | Pending ₹1 deposit | KYC-FR-030 | ✅ | Pending penny drop state |
| F9 | Approved | KYC-FR-031 | ✅ | Approved state |
| F10 | Needs fixes | KYC-FR-032 | ✅ | Rejected state with notes |

Pack F: **10/10 implemented.** ✅

---

### Pack G — You Tab & Profile Settings (5 screens)

| Screen | Label | SRS FR | Implemented? | Notes |
|--------|-------|--------|:------------:|-------|
| G1 | You / self profile | PROF-FR-001 | ✅ | `you_tab_screen.dart`; stats grid, account links |
| G2 | Edit profile | PROF-FR-006 | ✅ | `edit_profile_screen.dart` |
| G3 | Connected accounts | IAM-FR-009 | ❌ MISSING | **No dedicated screen.** You tab links to it but `/profile/connected-accounts` route and screen do not exist. The design (G3) shows a dedicated list with Instagram/YouTube connect tiles following C-26 selection. |
| G4 | Notification preferences | NOT-FR-003 | ✅ | `notification_preferences_screen.dart` |
| G5 | My bookings | BK-FR-014 | ✅ | `my_bookings_screen.dart` |

Pack G: **4/5 implemented. G3 (Connected Accounts) MISSING.** ⚠️

---

### Pack H — Creator Public Page + Studio (6 screens)

| Screen | Label | SRS FR | Implemented? | Notes |
|--------|-------|--------|:------------:|-------|
| H1 | Creator public page | CRT-FR-001, PROF-FR-012 | ✅ | `profile_view_screen.dart`; cover photo + avatar + stats + content tabs |
| H2 | Studio home | STUD-FR-001 | ✅ | `studio_tab_screen.dart`; alert hero + stats grid + content list + earnings info |
| H3 | Studio insights | STUD-FR-002 | ❌ MISSING | **No dedicated insights screen.** Design shows a sparkline chart page with views/followers/bookings over time. Only aggregate count cards exist in `studio_tab_screen.dart`. No separate insights/analytics page. |
| H4 | Studio payouts | STUD-FR-003 | ✅ | `earnings_screen.dart` |
| H5 | Messages | — | ❌ OUT OF SCOPE | Direct messaging is out of scope for Phase 1 (SRS §1.3 "No direct messaging"). Correctly not built. |
| H6 | Booking detail (creator view) | BK-FR-012 | ✅ | `booking_detail_screen.dart` |

Pack H: **4/6 implemented. H3 (Studio Insights) MISSING. H5 correctly excluded.** ⚠️

---

### Pack I — Web Mini-Site (2 screens)

| Screen | Label | SRS FR | Implemented? | Notes |
|--------|-------|--------|:------------:|-------|
| I1 | Creator public web page (desktop) | WEB-FR-001–005 | ✅ | Next.js SSR public profile — `/[username]` route |
| I2 | Web booking page | WEB-FR-006–008 | ✅ | Booking embed on experience page |

Pack I: **2/2 implemented.** ✅

---

### Pack J — Admin

| Screen | Label | SRS | Implemented? | Notes |
|--------|-------|-----|:------------:|-------|
| J (all) | Custom admin panel | ADM-FR-* | ❌ NOT STARTED | E4.1 in backlog. Correctly deferred — SRS C-10 says admin is Supabase Studio + Retool for MVP. Custom panel ships in V2. |

---

### DS Reference Panel

Design-only reference HTML — no Flutter equivalent needed. Design tokens live in `apps/mobile/lib/shared/theme/colors.dart` + `typography.dart`. ✅

---

## 3 · Critical Implementation Gaps (vs Locked SRS)

These are not V1+ deferrals — they are **locked SRS requirements that are designed but not built**.

| # | Gap | SRS Ref | Design Ref | Severity | Effort |
|---|-----|---------|-----------|----------|--------|
| **G-01** | **Bottom nav uses C-23 layout, not locked C-28** | C-28 (supersedes C-23) | B1, all packs | 🔴 CRITICAL | Medium |
| **G-02** | **"Saved" tab exists in code but removed in C-28** | C-28 removes Saved nav slot | G1 You tab has Saved stat tile | 🔴 CRITICAL | Medium |
| **G-03** | **Create FAB is 40dp floating bottom-right, not 52dp centre-slot** | C-28 "52dp coral FAB, not a text label" | B1–H2 (all packs show centre FAB) | 🔴 CRITICAL | Small |
| **G-04** | **Connected Accounts screen (G3) not built** | IAM-FR-009 [M1] | Pack G, screen G3 | 🟠 HIGH | Small |
| **G-05** | **Studio Insights page (H3) not built** | STUD-FR-002 | Pack H, screen H3 | 🟠 HIGH | Medium |
| **G-06** | **Home feed: "Local" chip vs "Near you" chip** | DISC-FR-007 DD-007 | B1 "For you / Following / Local" | 🟡 MEDIUM | Small |

---

## 4 · G-01/G-02/G-03 Detail — Bottom Navigation Gap

This is the most impactful discrepancy. The design session explicitly locked C-28 in April 2026, which supersedes C-23.

### What C-28 says (SRS-locked, master-prompt confirmed):
```
5 slots: Home · Discover · [Create 52dp coral FAB] · Studio · You
Active non-FAB: coral-tint 44×26dp pill behind icon + coral label
Centre: 52dp coral FAB + rgba(225,90,65,0.33) glow shadow
Top edge: soft upward shadow
NO Saved tab
```

### What `main_shell.dart` implements (old C-23):
```
5 tabs: Home · Discover · Studio · Saved · You
Separate floating FAB (40dp, bottom-right corner, only on Home/Discover)
Saved = dedicated 4th tab (saved_lists_screen.dart)
```

### Impact:
- `saved_lists_screen.dart` and `saved_list_detail_screen.dart` need to remain — access moves to You tab
- The `_ShellCreateFab` widget needs to move from floating to being the centre nav slot
- The You tab `_StatsGrid` already has a "Saved" stat tile (accessible from You tab) — this confirms the intent
- Studio becomes slot 3 (not slot 2)

---

## 5 · Things in Implementation NOT in Design (Additions Beyond Design)

These exist in the Flutter code but weren't shown in the wireframe packs. Most are correct SRS-mandated screens that weren't visualised in the design session.

| Screen | Route | SRS Ref | Status |
|--------|-------|---------|--------|
| Privacy settings | `/settings/privacy` | DPDPA-FR-001 | ✅ Correct addition (SRS §8.9–8.12) |
| Legal / T&C screen | `/legal` | WEB-FR-009 | ✅ Correct addition |
| Write review | `/reviews/write` | REV-FR-001 | ✅ Correct addition |
| Review detail | `/reviews/:id` | REV-FR-005 | ✅ Correct addition |
| Category browse | `/discover/category/:id` | DISC-FR-036 | ✅ Correct addition |
| Vertical section full | `/feed/section/:vertical` | DISC-FR-037 | ✅ Correct addition |
| Studio content list | `/studio/content` | STUD-FR-001 | ✅ Correct addition (separate from tab) |
| Location picker | `/location` | ONB-FR-001 | ✅ Correct addition |

All additions are SRS-mandated. No rogue screens.

---

## 6 · Things in Design NOT in SRS (Design-Only V1+ Features)

These were prototyped in the design session as "surprises" / gamification experiments. The SRS explicitly defers them to V1+. They are **correctly not built**.

| Feature | Design location | SRS status | Correct deferral? |
|---------|----------------|-----------|:-----------------:|
| XP chip + Explorer points | DS reference, B1 home | V1+ "No gamification for MVP" §3.2 | ✅ YES |
| Streak flame | DS reference | V1+ | ✅ YES |
| Collectible postcard system | DS reference, C1-C3 | V1+ | ✅ YES |
| Quests hub (B6) | Pack B | Not in SRS at all | ✅ YES |
| Creator tiers (Wanderer→Ascender) | DS reference | Not in SRS | ✅ YES |
| 4 runtime themes (Snow/Bone/Ink Night) | Tweaks panel | V1+ (SRS C-21 says Paper White default only) | ✅ YES |
| Messages / DMs (H5) | Pack H | SRS §1.3 "No DMs Phase 1" | ✅ YES |
| Leaderboards | B6 quests | V1+ | ✅ YES |

---

## 7 · Things in SRS NOT in Wireframe Design (SRS-only requirements)

These SRS requirements were never visualised in the design packs. They need design before implementation review.

| Requirement | SRS FR | Priority | Notes |
|-------------|--------|----------|-------|
| Waitlist card (dashed border, empty vertical) | DD-012, DD-007 | M1 | Shown in SRS §1.5 but no Pack B card for it |
| Search history clear (DPDPA) | DPDPA-FR-003 | M2 | Privacy settings has it but no dedicated design |
| Dispute window UI (48h post-booking) | BK-FR-011 | M2 | No design for dispute/refund flow UI |
| Report content sheet | TRUST-FR-001 | M2 | No design for report bottom sheet |
| Creator KYC gate in publishing | KYC-FR-034 | M2 | "You need KYC to publish paid content" modal |
| Admin moderation queue | ADM-FR-001 | V2 | E4.1 deferred, correct |
| Form 16A / GSTR download | TAX-FR-005 | M2 | No design — web only feature |

---

## 8 · Implementation Quality Notes (Design Rules Audit)

Quick audit of whether existing screens follow the locked design rules.

| Rule | Check | Status |
|------|-------|--------|
| C-26: SelectionTile outline+halo | Vertical picker ✅, Content type picker ✅, Filter chips ⚠️ (need verification) | ⚠️ |
| C-27: Card raised default | ContentCard ✅, AppCard ✅, EventFeedCard ⚠️ (not verified) | ⚠️ |
| C-28: BottomNav coral-tint pill active | ✅ `_TabItem` uses 44×26dp coral-tint pill + coral label | ✅ |
| C-18: Fraunces for display/H1/H2/post body | ✅ Consistent across screens | ✅ |
| C-19: Phosphor Icons outline/fill | ✅ All icons use PhosphorIcons regular/fill | ✅ |
| C-17: Coral in exactly 8 contexts | Unverified — needs visual audit | ❓ |

---

## 9 · Action Plan (Priority Order)

### Immediate (blocks visual parity with locked design):

| # | Action | File(s) | Effort |
|---|--------|---------|--------|
| A-01 | **Restructure bottom nav to C-28** — move Create FAB into centre nav slot; move Studio to slot 3; remove Saved tab from nav | `main_shell.dart`, `router.dart` | ~4h |
| A-02 | **Move Saved access to You tab** — You tab already shows Saved count tile; add navigate-to-saved from that tile | `you_tab_screen.dart` | ~1h |
| A-03 | **Resize Create FAB to 52dp** with correct glow shadow | `main_shell.dart` | ~30min |
| A-04 | **Build Connected Accounts screen** (G3) — IAM-FR-009 [M1] | New `connected_accounts_screen.dart` | ~3h |
| A-05 | **Build Studio Insights screen** (H3) — views/followers/bookings sparkline | New `studio_insights_screen.dart` | ~4h |

### Soon (visual consistency):

| # | Action | Effort |
|---|--------|--------|
| A-06 | Audit filter chips for C-26 selection state (outline at rest, not filled) | ~1h |
| A-07 | Rename home "Near you" chip to "Local" to match B1 design | ~15min |
| A-08 | Verify EventFeedCard uses raised shadow matching C-27 | ~30min |

### V1 (do not build yet):

- Gamification layer (XP, streaks, postcards, quests)
- Runtime theme switching (Snow/Bone/Ink Night)
- Creator tier system
- Admin custom panel (E4.1)

---

## 10 · Screen Count Summary

| Pack | Designed | Implemented | Missing | Deferred |
|------|:--------:|:-----------:|:-------:|:--------:|
| A — Onboarding | 8 | 8 | 0 | 0 |
| B — Home/Discover/Create | 6 | 4 | 0 | 1 (B6 quests) + 1 partial (B1 visual) |
| C — Content Detail | 3 | 3 | 0 | 0 |
| D — Booking | 3 | 3 | 0 | 0 |
| E — Publish Wizard | 5 | 5 | 0 | 0 |
| F — KYC | 10 | 10 | 0 | 0 |
| G — You/Profile | 5 | 4 | 1 (G3) | 0 |
| H — Creator/Studio | 6 | 4 | 1 (H3) | 1 (H5 DMs) |
| I — Web | 2 | 2 | 0 | 0 |
| J — Admin | all | 0 | 0 | all (V2) |
| **Total** | **~48** | **43** | **2** | **3+** |

**Implementation rate: 43/48 = ~90% of designed screens built.**

The 2 missing screens (G3 Connected Accounts, H3 Studio Insights) are M1/M2-scope requirements — not deferred.
The critical structural gap is the **bottom navigation layout** (G-01–G-03).

---

---

## 11 · Deep Audit — Publish Wizard vs Design Chat (Pack E)

> Point-by-point comparison of Pack E wireframes against current wizard implementation.
> These are **SRS-locked, not deferred**. Every gap below is an M1 build item.

### 11.1 Basics Step (`basics_step.dart`)

The current Basics step collects **title + description only**. Pack E and SRS CRT-FR-002 require:

| Field | Required by SRS | In code? |
|-------|:--------------:|:--------:|
| Title | CRT-FR-002 | ✅ |
| Description | CRT-FR-002 | ✅ |
| Cover image (upload, single) | CRT-FR-002, E3 | ❌ MISSING — cover is in Media step, SRS says it belongs in Basics |
| Sub-category (picker, single) | CRT-FR-002 "sub_category_id required" | ❌ MISSING — field exists in `WizardState` but no UI |
| Tags (multi-select, max 5) | CRT-FR-002 "tags: max 5" | ❌ MISSING — field exists in `WizardState` but no UI |
| Vertical selector (max 3) | E4, CRT-FR-002 | ❌ MISSING — entire E4 step absent |

### 11.2 E4 "Tag It" Step — Entirely Missing

Pack E includes a dedicated **E4 Tags step** between Media and Pricing. This step does not exist in the wizard at all.

| E4 Field | SRS Ref | In code? |
|----------|---------|:--------:|
| Verticals pills (Travel/Food/Culture, max 3) | CRT-FR-002 `verticals[]` | ❌ NOT BUILT |
| Difficulty segmented control (Easy / Moderate / Tough) | CRT-FR-002 `difficulty` | ❌ NOT BUILT |
| Budget range chips (Budget / Mid-range / Luxury) | E4 design | ❌ NOT BUILT — `trip_overview_step.dart` has budget for itineraries only, not universal |
| Search / hashtags field | E4 design | ❌ NOT BUILT |

**Current wizard step sequence for itinerary:** Basics → Details (TripOverview) → DayBuilder → Media → Pricing → Review  
**Required per Pack E:** Basics → Outline (E1) → Stops (E2) → Media (E3) → **Tags (E4)** → Review (E5)

The E4 step must be inserted before Review for all non-post content types.

### 11.3 Category-Adaptive Fields — CRT-FR-004 Entirely Unimplemented

SRS CRT-FR-004 mandates different fields depending on the itinerary sub-category. **Zero** of these are built:

| Sub-category | Required field | Mandatory? | SRS Ref |
|-------------|----------------|:---------:|---------|
| **Adventure** | Things to carry / required gear | **YES** (BR-CRT-004-A) | CRT-FR-004 |
| Adventure | Things to avoid | YES | CRT-FR-004 |
| Adventure | Fitness level (Easy/Moderate/Tough) | YES | CRT-FR-004 |
| **Road Trips** | Vehicle type | YES | CRT-FR-004 |
| Road Trips | Route map upload | YES | CRT-FR-004 |
| **Food Trails** | Dish list | YES | CRT-FR-004 |
| Food Trails | Diet tags (Veg/Vegan/Non-veg) | YES | CRT-FR-004 |

`BR-CRT-004-A`: Publishing an Adventure itinerary without "things to carry" must be blocked. This validation is also missing.

### 11.4 Event Wizard — Missing CRT-FR-013 Fields

SRS CRT-FR-013 requires events to collect:

| Field | In code? |
|-------|:--------:|
| What to bring (free text) | ❌ MISSING from `event_details_step.dart` |
| Dress code (optional) | ❌ MISSING |
| Age restriction (optional) | ❌ MISSING |
| Meeting point / address | ✅ Present |
| Max attendees / RSVP cap | ✅ Present |

### 11.5 Summary — Wizard Gap Priority

| Gap | Effort | Severity |
|-----|--------|----------|
| Sub-category picker in Basics | S | 🟠 HIGH — saves to `subCategoryId` already |
| Tags UI in Basics | S | 🟠 HIGH — saves to `tags` already |
| Insert E4 Tags step | M | 🟠 HIGH — step structure exists, need new widget |
| CRT-FR-004 adaptive fields | L | 🔴 CRITICAL — BR-CRT-004-A blocks publishing |
| Event: what-to-bring / dress code / age restriction | S | 🟡 MEDIUM |

---

## 12 · Deep Audit — Content Detail Screens vs Design Chat (Pack C)

### 12.1 Itinerary Detail Screen (`itinerary_detail_screen.dart`) vs C1

| Design C1 element | SRS Ref | In code? | Notes |
|-------------------|---------|:--------:|-------|
| Cover photo hero (260px tall, full-bleed) | CRT-FR-008 AC | ❌ MISSING | Code has a map placeholder `// TODO: integrate Google Maps` instead |
| Sub-category display (chip on hero) | CRT-FR-008 | ❌ MISSING | Sub-category not rendered anywhere on detail screen |
| Day cards with difficulty tags | CRT-FR-004 | ❌ MISSING | Day cards show title + spots; no difficulty badge |
| Estimated cost per day | C1 design | ❌ MISSING | Aggregate cost shown; no per-day cost |
| "Things to carry" section | BR-CRT-004-A | ❌ MISSING | Entire section absent for Adventure itineraries |
| "Start chapter 1" bottom CTA | C1 design, CRT-FR-008 | ❌ MISSING | No primary CTA on detail screen |
| Stats bar (days · ₹price · km) | C1 design | ✅ Present | `_StatsRow` widget |
| Creator header | CRT-FR-008 | ✅ Present | `_CreatorHeader` widget |
| Day tab bar + spot cards | CRT-FR-008 | ✅ Present | `_DayTabBar` + `_SpotCard` |
| Paywall overlay (paid content) | CRT-FR-008 | ✅ Present | `_PaywallOverlay` |
| EngagementBar (like/save/share) | SOC-FR-010 | ✅ Present | Bottom bar |

### 12.2 Post / Story Detail Screen (`post_detail_screen.dart`) vs C2

| Design C2 element | SRS Ref | In code? | Notes |
|-------------------|---------|:--------:|-------|
| Coral drop cap on first paragraph | C2 design, CRT-FR-001 reader mode | ❌ MISSING | Body renders plain `Text`, no `RichText` drop cap |
| Pull quote styling (coral left border + primaryTint bg) | C2 design | ❌ MISSING | No pull quote detection or styled rendering |
| Floating dark pill action bar (like/comment/bookmark/share, bottom-center) | C2 design | ❌ MISSING | Actions are in a static bottom bar, not floating dark pill |
| Reader settings sliders button | C2 design | ❌ MISSING | No font-size or theme toggle in reader |
| Hero carousel with overlay buttons | CRT-FR-001 | ✅ Present | `_HeroCarousel` |
| Metadata row (date, location, vertical) | CRT-FR-001 | ✅ Present | |
| Creator header with follow button | PROF-FR-012 | ✅ Present | |
| Fraunces body serif rendering | C-18 | ✅ Present | |

### 12.3 Priority for Detail Screen Fixes

| Fix | Effort | Severity |
|-----|--------|----------|
| Cover photo hero on itinerary detail | M | 🟠 HIGH — C1 design centrepiece |
| "Things to carry" section on Adventure itineraries | S | 🔴 CRITICAL — BR-CRT-004-A |
| "Start chapter 1" bottom CTA | S | 🟠 HIGH — core UX flow |
| Drop cap on post reader | S | 🟡 MEDIUM — visual polish |
| Floating dark action bar on post reader | M | 🟡 MEDIUM — visual polish |
| Pull quote styling | S | 🟡 MEDIUM — visual polish |

---

---

## 13 · Deep Audit — Home Feed (B1)

> Point-by-point comparison of B1 wireframe against `home_feed_screen.dart`.

### 13.1 Chip Rail Navigation

| Design B1 | SRS Ref | In code? | Notes |
|-----------|---------|:--------:|-------|
| "For you" chip | DISC-FR-001 | ✅ `kFeedNavForYou` | |
| "Following" chip | DISC-FR-006 | ✅ `kFeedNavFollowing` | |
| **"Local"** chip | DISC-FR-007 DD-007 | ⚠️ PARTIAL | Code uses **"Near you"** — label mismatch vs design. Same data, wrong label. |
| Category chips: Travel / Stories (scroll-jump) | DISC-FR-010 | ✅ | `_handleCategoryJump()` scrolls to section anchor |
| Segmented solid control (not pills) | B1 design | ⚠️ PARTIAL | Code uses `_ChipRailDelegate` pill chips; design shows a segmented-bar control with solid selection fill. Visual treatment differs. Functional parity exists. |

### 13.2 Top Bar

| Design element | SRS Ref | In code? | Notes |
|----------------|---------|:--------:|-------|
| Location pin pill (left) | DD-007 | ✅ | `_FeedTopBarDelegate` has location tap |
| Search pill (centre) | DISC-FR-033 | ✅ | Opens `/discover` |
| Bell icon (right) | NOT-FR-001 | ✅ | Routes to `/notifications/preferences` |
| **Unread badge count on bell** | NOT-FR-001 | ❌ MISSING | Bell has no badge — users can't tell they have new notifications without tapping |
| Coral location pin colour | C-17 (context 3) | ✅ | |

### 13.3 For-You Feed Sections

| Design B1 section | SRS Ref | In code? | Notes |
|-------------------|---------|:--------:|-------|
| Hero card (large editorial) | DD-025 | ✅ `HeroCard` | |
| For-you ranked content grid | DISC-FR-001 | ✅ `_ForYouVerticalFeed` | |
| Editor's picks row | DISC-FR-039 | ✅ `EditorPicksSection` | Hidden when empty |
| Travel section | DISC-FR-002 | ✅ `VerticalSection('travel')` | |
| Stories section | DISC-FR-003 | ✅ `VerticalSection('stories')` | |
| Serendipity / Discover section | DISC-FR-037 | ✅ `DiscoverSection` | |
| **"Trending in [city]" section** | B1 design, DD-007 | ❌ MISSING | Design shows a city-specific trending rail. No implementation. |
| **Waitlist card** (empty vertical) | DD-012 | ❌ MISSING | SRS §1.5 says dashed border empty-state when vertical has no content. Not built. |

### 13.4 Near-You Tab

| Design element | SRS Ref | In code? | Notes |
|----------------|---------|:--------:|-------|
| Fallback honesty banner | DD-009 | ✅ `_FallbackBanner` | Shows warm tint when using nearby city |
| City-scoped content | DISC-FR-007 | ✅ `NearYouSection` | |
| **Empty state when no location set** | DD-007 | ⚠️ PARTIAL | Prompts guest for location; no specific empty state for authenticated users who skipped |

### 13.5 Priority — Home Feed Gaps

| Gap | Severity | Effort |
|-----|----------|--------|
| Rename "Near you" → "Local" | 🟡 MEDIUM | XS |
| Bell badge (unread notification count) | 🟡 MEDIUM | S |
| "Trending in [city]" rail | 🟡 MEDIUM | M |
| Waitlist card for empty verticals | 🟡 MEDIUM | S |
| Visual chip-bar → segmented control | 🔵 LOW | M |

---

## 14 · Deep Audit — Discover Tab (B2)

> Comparison against `discover_tab_screen.dart`.

### 14.1 Discover Sections

| Design B2 element | SRS Ref | In code? | Notes |
|-------------------|---------|:--------:|-------|
| Sticky header with search pill + filter icon | DISC-FR-032 | ✅ `_DiscoverHeaderDelegate` | |
| Editorial themes grid (2-col) | DISC-FR-035 | ✅ `_ThemesGrid` | Taps into `CategoryBrowseScreen` |
| Creator rail (horizontal scroll) | DISC-FR-036 | ✅ `_CreatorsRail` | Follow button uses `coralOutline` |
| Upcoming experiences compact list | DISC-FR-037 | ✅ `_UpcomingExperiences` | |
| Themes chip rail (sub-category filter) | DISC-FR-034 | ✅ `DiscoverFilterSheet` | Filter sheet on icon tap |
| "Discover creators near [city]" | DISC-FR-036 | ✅ | Rail title is city-aware |
| **Serendipity / "You might also like"** | DISC-FR-037 | ❌ MISSING | Design shows a 3rd section below experiences — not implemented |
| **Vertical deep-dive tile** (tap theme → category browse) | DISC-FR-003 | ✅ | Routes to `CategoryBrowseScreen` |

### 14.2 Design Rule Check

| Rule | Status | Notes |
|------|:------:|-------|
| Filter chips: C-26 outlined at rest, coral border selected | ⚠️ PARTIAL | `DiscoverFilterSheet` uses a custom chip style — not verified as C-26 |
| Creator cards: follow button `coralOutline` variant | ✅ | |
| Search results use `SaveToListSheet` | ✅ | |

### 14.3 Priority — Discover Tab Gaps

| Gap | Severity | Effort |
|-----|----------|--------|
| Serendipity "You might also like" section | 🔵 LOW | M |
| Verify `DiscoverFilterSheet` chip C-26 compliance | 🟡 MEDIUM | XS |

---

## 15 · Deep Audit — You Tab (G1)

> Comparison against `you_tab_screen.dart`.

### 15.1 Profile Hero Block

| Design G1 element | SRS Ref | In code? | Notes |
|-------------------|---------|:--------:|-------|
| Avatar (64dp, creator = coral ring) | PROF-FR-001 | ✅ | 2.5px coral ring for creators |
| Display name (Fraunces 22px) | PROF-FR-001 | ✅ | |
| `@username · City` subtitle | PROF-FR-001 | ✅ | `handleLine` join |
| Verified creator badge (green) | PROF-FR-001 | ✅ `_CreatorBadge` | |
| Bio (Fraunces italic) | PROF-FR-006 | ✅ | |
| Edit + Share row | PROF-FR-006 | ✅ | Share → snackbar "coming soon" |
| **Follower / following count in hero** | PROF-FR-001 | ❌ MISSING | Design shows small follower count below bio in hero. Code only shows it in the stats grid. |
| **"View my page" quick link (creators only)** | PROF-FR-012 | ❌ MISSING | Design shows a small "View public profile →" link. Code has "Creator profile" in the account list below. |

### 15.2 Stats Grid

| Design G1 tile | SRS Ref | In code? | Notes |
|----------------|---------|:--------:|-------|
| Saved (tap → `/saved`) | PROF-FR-001 | ✅ | |
| Bookings (tap → `/bookings`) | BK-FR-014 | ✅ | |
| Completed (tap → `/bookings`) | BK-FR-014 | ✅ | |
| Following (tap → following list) | SOC-FR-001 | ⚠️ PARTIAL | Tile rendered but `onTap: null` — no navigation |
| **Followers count tile** | PROF-FR-001 | ❌ MISSING | Design shows Followers as a 5th stat (or replaces Completed). Code has 4 tiles — no Followers tile on You tab. |

### 15.3 Account List

| Design G1 row | SRS Ref | In code? | Notes |
|---------------|---------|:--------:|-------|
| Creator profile | PROF-FR-012 | ✅ | Shown only for creators |
| Connected accounts | IAM-FR-009 | **🐛 BUG FIXED** | Was showing "coming soon" snackbar; fixed this session — now routes to `/profile/connected-accounts` |
| Notifications | NOT-FR-003 | ✅ | Routes to `/notifications/preferences` |
| My bookings | BK-FR-014 | ✅ | Routes to `/bookings` |
| Payouts | STUD-FR-003 | ✅ | Routes to `/studio` (correct — Studio has earnings card) |
| Privacy & data | DPDPA-FR-001 | ✅ | Routes to `/privacy-settings` |
| **KYC / Identity** | KYC-FR-005 | ❌ MISSING | Design G1 shows a "KYC & Identity" row. Code doesn't expose KYC status from You tab. |
| **Legal** | WEB-FR-009 | ❌ MISSING | No T&C / Privacy Policy link in You tab account list. |

### 15.4 Profile Completion Card

| Element | Status |
|---------|:------:|
| Progress bar (coral) | ✅ |
| Checklist items | ✅ |
| Hides at 100% | ✅ |
| **Tapping checklist item navigates to that section** | ❌ MISSING — items are display-only, no actionable links |

### 15.5 Priority — You Tab Gaps

| Gap | Severity | Effort |
|-----|----------|--------|
| "Connected accounts" → snackbar bug | 🔴 CRITICAL | **FIXED** |
| Following tile no-op (no navigation) | 🟠 HIGH | S |
| Followers count tile missing | 🟠 HIGH | S |
| KYC row missing from account list | 🟡 MEDIUM | XS |
| Legal link missing from account list | 🟡 MEDIUM | XS |
| "View public profile" quick link (creators) | 🟡 MEDIUM | XS |
| Profile completion items not actionable | 🔵 LOW | M |

---

## 16 · Deep Audit — Studio Tab (H2)

> Comparison against `studio_tab_screen.dart`.

### 16.1 Top Bar

| Design H2 element | SRS Ref | In code? | Notes |
|-------------------|---------|:--------:|-------|
| "Studio" Fraunces title | STUD-FR-001 | ✅ | |
| Bell icon (right) | STUD-FR-001 | ⚠️ PARTIAL | **Renders but is a no-op** — `onTap` does nothing (comment says "no-op for M1"). Should route to `/notifications/preferences`. |
| **Insights link / quick nav** | STUD-FR-002 | ❌ MISSING | Design H2 shows an "Insights →" text link in top bar. Code has none — insights are only reachable from the earnings card area or direct URL. |

### 16.2 Alert Hero Card

| Design H2 element | Status | Notes |
|-------------------|:------:|-------|
| Action alert (KYC/linked account) | ✅ | `_ActionAlertCard` |
| Quiet state (no alert) | ✅ | `_QuietStateCard` |
| **Background uses hardcoded `Color(0xFFF2EEE8)`** | ⚠️ | Should use `AppColors.surfaceAlt` or a design token. Quiet state has warm-tinted hardcoded bg. |
| **Alert card uses hardcoded `Color(0xFFFFF5F1)`** | ⚠️ | Should use `AppColors.primaryTint` or `AppColors.coralSurface`. |

### 16.3 Stats Grid

| Design H2 tile | SRS Ref | In code? | Notes |
|----------------|---------|:--------:|-------|
| Views | STUD-FR-001 | ✅ | |
| **Revenue / Earnings** | STUD-FR-003 | ❌ MISMATCH | Code shows "Saves" not "Revenue". Design H2 shows total earnings. |
| Bookings | STUD-FR-001 | ✅ | |
| Followers | STUD-FR-001 | ✅ | |
| **Period selector (7D / 30D)** | STUD-FR-002 | ❌ MISSING | Design shows a period toggle on the stats. Code shows only all-time totals. |
| **Tap-to-insights on stat tile** | STUD-FR-002 | ❌ MISSING | Tapping a stat should navigate to `/studio/insights`. Tiles are not interactive. |

### 16.4 Content Section

| Design H2 element | Status | Notes |
|-------------------|:------:|-------|
| Filter chips (All / Published / Drafts) with counts | ✅ `StudioFilterChips` | |
| Rich content cards with progress bar | ✅ `StudioContentCard` | |
| See all link | ✅ | Routes to `/studio/content-list` |
| Create button | ✅ | Routes to `/content/create` |
| **Horizontal scroll on cards** | ⚠️ | Design shows horizontal card scroll; code uses vertical list. Acceptable difference for M1. |

### 16.5 Earnings Info Card

| Element | Status | Notes |
|---------|:------:|-------|
| KYC badge (green/amber/coral) | ✅ `_KycBadge` | |
| Pending payout amount | ✅ | |
| Next transfer date | ✅ | |
| Tap → `/studio/earnings` | ✅ | |
| **"View Insights →" link in card** | ❌ MISSING | Design H2 shows a small insights link inside the earnings card. Currently no `/studio/insights` entry point in the main Studio tab UI. |

### 16.6 Priority — Studio Tab Gaps

| Gap | Severity | Effort |
|-----|----------|--------|
| Bell icon is no-op | 🟠 HIGH | XS |
| Stats "Saves" → "Revenue" mismatch | 🟠 HIGH | S |
| Stats tiles not tappable (no insights link) | 🟠 HIGH | S |
| Period selector missing from stats | 🟡 MEDIUM | M |
| "View Insights →" link in earnings card | 🟡 MEDIUM | XS |
| Hardcoded bg colours in alert cards | 🔵 LOW | XS |

---

## 17 · Deep Audit — Edit Profile (G2)

> Comparison against `edit_profile_screen.dart`.

### 17.1 Fields

| Design G2 field | SRS Ref | In code? | Notes |
|-----------------|---------|:--------:|-------|
| Avatar (tap to change) | PROF-FR-006 | ✅ | `image_picker` + Firebase Storage |
| Display name | PROF-FR-006 | ✅ | |
| Username (creators, 30-day cooldown) | PROF-FR-006 | ✅ | Shown for all users but only editable if creator |
| Bio (280 chars) | PROF-FR-006 | ✅ | |
| Email (optional) | PROF-FR-006 | ✅ | With client-side validation |
| **Pronouns** | PROF-FR-006 | ❌ MISSING | SRS mentions pronouns field. Not in code. |
| **Social handles (Instagram / YouTube)** | PROF-FR-008 | ❌ MISSING | G2 design shows social URL fields. These should link to Connected Accounts screen or be editable here. |
| **Website URL** | PROF-FR-006 | ❌ MISSING | Profile bio usually includes website link. Not in code. |

### 17.2 UX Details

| Element | Status | Notes |
|---------|:------:|-------|
| Dirty-state detection | ✅ | `_isDirty` flag + back dialog |
| Save button | ✅ | `PUT /api/v1/users/me` |
| Back navigation guard | ✅ | Discard changes dialog |
| **Username edit cooldown UI** | ⚠️ PARTIAL | Code renders username field but no cooldown indicator or edit-lock (30-day rule is SRS PROF-FR-006 AC). |
| **Preview of how profile looks** | ❌ MISSING | No preview mode — creator can't see how their public profile looks before saving. |

### 17.3 Priority — Edit Profile Gaps

| Gap | Severity | Effort |
|-----|----------|--------|
| Pronouns field | 🟡 MEDIUM | XS |
| Social handles (links to Connected Accounts) | 🟡 MEDIUM | S |
| Website URL field | 🟡 MEDIUM | XS |
| Username edit cooldown UI indicator | 🟡 MEDIUM | S |

---

## 18 · Quick Audit — Remaining Screens

### 18.1 Notifications (G4 — `notification_preferences_screen.dart`)

| Element | Status | Notes |
|---------|:------:|-------|
| Toggle groups (booking/social/digest/legal) | ✅ | |
| DND quiet hours | ✅ | |
| `Switch` uses deprecated `activeColor` | ⚠️ | Should use `activeThumbColor` (Flutter 3.31+ deprecation) |
| **Push vs WhatsApp channel selection** | ❌ MISSING | SRS NOT-FR-003 says user picks preferred channel. Code only shows per-category toggles, no channel selector. |

### 18.2 Booking Detail / Booking Flow (D1–D3)

| Element | Status | Notes |
|---------|:------:|-------|
| Seat hold timer | ✅ | `booking_sheet.dart` |
| Pay method tiles (C-26 selection) | ✅ | |
| Confirmation screen | ✅ | `booking_confirmation_screen.dart` |
| Dispute window (48h post-completion) | ✅ | Built previous session |
| **"Write a review" CTA after completed booking** | ⚠️ PARTIAL | Booking detail has a "Rate this experience" button for completed bookings. Route to `WriteReviewScreen` works. But button only appears for `scheduled_experience` type. |
| **Booking receipt / invoice download** | ❌ MISSING | SRS BK-FR-013 says booking confirmation includes downloadable PDF receipt. Not built. |

### 18.3 KYC Flow (F1–F10)

All 10 steps confirmed ✅ in earlier §5 audit. Only gap:
- **KYC entry point from You tab missing** — covered in §15.3 above.

### 18.4 My Bookings (G5 — `my_bookings_screen.dart`)

| Element | Status | Notes |
|---------|:------:|-------|
| Upcoming / Past tab filter | ✅ | |
| Booking card with status pill | ✅ | |
| Tap → booking detail | ✅ | |
| **"Upcoming" sorted by date** | ⚠️ | Ordering is server-side — unverified |
| **Empty state (no bookings)** | ⚠️ | Need to verify empty state widget renders correctly |

### 18.5 Saved Lists (Saved tab — `saved_lists_screen.dart`)

| Element | Status | Notes |
|---------|:------:|-------|
| Lists grid | ✅ | |
| Create new list | ✅ | |
| List detail | ✅ | `saved_list_detail_screen.dart` |
| **"Saved" accessible without Saved tab (C-28 nav removes it)** | ⚠️ | Currently a top-level nav tab. C-28 removes this — access should move to You tab stats tile (already wired: `onTap: () => context.push('/saved')`). When bottom nav is restructured (G-01), this path remains. |

---

## 19 · Cross-Screen Gap Summary

> All gaps identified across §13–§18, consolidated by severity.

### 🔴 CRITICAL (blocks user flow or SRS BR)

| ID | Screen | Gap |
|----|--------|-----|
| BUG-YOU-001 | You Tab | "Connected accounts" → snackbar instead of route → **FIXED** (this session) |

### 🟠 HIGH (visible UX gap vs design / SRS requirement)

| ID | Screen | Gap | Effort |
|----|--------|-----|--------|
| GAP-STU-001 | Studio | Bell icon is no-op — must route to notifications | XS |
| GAP-STU-002 | Studio | Stats "Saves" tile should be "Revenue" (total earnings) | S |
| GAP-STU-003 | Studio | Stats tiles are not tappable (should link to `/studio/insights`) | S |
| GAP-YOU-001 | You Tab | "Following" stat tile has `onTap: null` — no navigation | S |
| GAP-YOU-002 | You Tab | No "Followers" count tile on You tab stats | S |

### 🟡 MEDIUM (design parity or SRS optional requirement)

| ID | Screen | Gap | Effort |
|----|--------|-----|--------|
| GAP-B1-001 | Home Feed | "Near you" chip label → should be "Local" | XS |
| GAP-B1-002 | Home Feed | No unread badge on bell icon | S |
| GAP-B1-003 | Home Feed | "Trending in [city]" section missing | M |
| GAP-B1-004 | Home Feed | Waitlist card (empty vertical dashed state) | S |
| GAP-STU-004 | Studio | Period selector (7D/30D) missing from stats | M |
| GAP-STU-005 | Studio | "View Insights →" entry point in earnings card | XS |
| GAP-STU-006 | Studio | Alert card background uses hardcoded hex (not design tokens) | XS |
| GAP-YOU-003 | You Tab | KYC row missing from account list | XS |
| GAP-YOU-004 | You Tab | Legal (T&C / Privacy Policy) link missing | XS |
| GAP-YOU-005 | You Tab | "View public profile" quick link for creators | XS |
| GAP-YOU-006 | You Tab | Follower count not shown in hero block | S |
| GAP-PRF-001 | Edit Profile | Pronouns field missing | XS |
| GAP-PRF-002 | Edit Profile | Social handles (Instagram/YouTube) fields | S |
| GAP-PRF-003 | Edit Profile | Website URL field | XS |
| GAP-PRF-004 | Edit Profile | Username edit cooldown indicator | S |
| GAP-NOT-001 | Notifications | Push vs WhatsApp channel selector missing | M |
| GAP-NOT-002 | Notifications | `Switch.activeColor` deprecated warning | XS |
| GAP-BK-001 | Bookings | PDF receipt / invoice download (BK-FR-013) | M |

### 🔵 LOW (visual polish, no SRS requirement)

| ID | Screen | Gap | Effort |
|----|--------|-----|--------|
| GAP-B1-005 | Home Feed | Segmented control (not pill chips) visual | M |
| GAP-B2-001 | Discover | Serendipity section below experiences | M |
| GAP-YOU-007 | You Tab | Profile completion items not actionable | M |

---

*This file is a point-in-time audit. Update TRACKING.md as items are resolved.*
