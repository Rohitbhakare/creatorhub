# Claude Code prompt · Consolidate SRS v1.1 + Changelog → SRS v1.2

Copy the section below (between the `---BEGIN PROMPT---` and `---END PROMPT---` markers) and paste it as the first message in a Claude Code session in your repo. Make sure both input files are present at the paths named.

---BEGIN PROMPT---

# Task: Consolidate the design decisions changelog into the SRS

I need you to produce `srs-v1.2.md` as a single consolidated source of truth by applying every decision in the design decisions changelog to the current SRS. This is a substantial, multi-section edit. Take your time and be methodical — the result is going to be the authoritative spec my engineering team builds against.

## Input files

1. **`Docs/01_requirements/phase-1/srs/srs-v1.md`** — the current SRS (v1.1, ~1600 lines). This is the base document you'll amend.
2. **`Docs/01_requirements/phase-1/srs/srs-design-decisions-changelog-final.md`** — the changelog with 28 numbered decisions (DD-001 through DD-028, plus a DD-014 amendment). This is the authoritative list of what needs to change.

## Output

Produce **`Docs/01_requirements/phase-1/srs/srs-v1.2.md`** as a new file. Do NOT overwrite `srs-v1.md` — keep it as the historical record of v1.1. At the end, also move the changelog to `Docs/01_requirements/phase-1/srs/archive/srs-design-decisions-changelog-final.md` so it's preserved but clearly archived.

## Ground rules

1. **The changelog is the authoritative source for WHAT changes.** The SRS v1.1 is the authoritative source for STRUCTURE and VOICE. Preserve the section numbering, heading hierarchy, requirement ID format, and writing style of v1.1 throughout. Don't invent new structure — slot the changes into existing sections.

2. **Requirement IDs never change or get reused.** If a requirement in v1.1 is being amended, update its content but keep its ID (e.g., `DISC-FR-001` stays `DISC-FR-001` even if its text is completely rewritten). If a new requirement is being added, give it the next available number in that area (e.g., new Discovery requirements become `DISC-FR-020` onwards).

3. **Every change traces back to a DD number.** Any requirement you add, amend, or rewrite must include a `(DD-NNN)` marker in its description so the reader can trace it back to the changelog. Use this format: `...some requirement text. (DD-009)` at the end of the description line.

4. **Preserve v1.1 verbatim wherever the changelog doesn't touch it.** Most of v1.1 is still correct. Don't rewrite sections just because they're nearby. Surgical edits only.

5. **Resolve conflicts in favor of the changelog.** Where v1.1 and the changelog disagree (e.g., v1.1 says "self-paced guide with chapters" but DD-023 says "Roamy-inspired spot-based itinerary"), the changelog wins. Update v1.1's language accordingly.

6. **Update the revision history.** Add a v1.2 row to §0.1 Revision history, dated 2026-04-08, listing the DD range applied and a one-paragraph summary of the major changes.

## Decision-by-decision guidance

This section tells you what each DD should actually do in the SRS. Read this before you start editing.

### DD-001 · Stories as 8th vertical
- Update §1.3 (Scope) to say MVP ships two verticals: `travel` and `stories`
- Update §1.5 terminology entry for "Vertical" to list all 8
- Update the `vertical` enum in §5.2 to include `stories` (and all 8 planned values)
- Add a note that Stories creators don't require KYC because they only publish posts

### DD-002 · Show all verticals during onboarding with waitlist for not-yet-shipped
- Add requirement **ONB-FR-005** · [M0] · Vertical picker shows all 8 verticals with "soon" badges for unshipped ones
- Add schema: `user_waitlisted_verticals` table (`user_id`, `vertical`, `waitlisted_at`)
- Add notification: fires when a waitlisted vertical crosses 5 published creators
- Add admin panel requirement: waitlist management dashboard

### DD-003 · Three-CTA welcome + guest browsing
- Add requirement **ONB-FR-000** · [M0] · Welcome screen with three CTAs (Sign up / Sign in / Browse as guest)
- Add requirement **IAM-FR-010** · [M0] · Guest browsing (new — full spec in the changelog)
- Update §1.3 scope to list guest browsing as in-scope

### DD-004 · 5-step onboarding flow
- Rewrite §4.2 Onboarding intro to describe the 5 steps: phone → location → categories → creators → done
- Add milestone celebration screen
- Progress bar has 5 segments, visible throughout

### DD-005 · Design system foundations (superseded by DD-013 for color; kept for typography/icons/animations)
- Captured in the new C-17, C-18, C-19, C-20 constraints (see below)

### DD-006 · Three-level taxonomy
- **Completely rewrite Appendix B.** The old 10→7 category collapse table is replaced by a new 3-level taxonomy:
  - Level 1: Vertical (8 values)
  - Level 2: Sub-category (per-vertical; travel ships with 12)
  - Level 3: Leaf type (optional, 5–7 per sub-category)
- Add a new facets section listing the orthogonal dimensions: `group_size`, `budget`, `difficulty`, `duration`, `season`
- Add schema: `vertical_sub_categories` table
- The 12 travel sub-categories are: Road Trips & Biking, Trekking & Hiking, Adventure & Sports, Heritage & Culture, Food Trails, Wildlife & Nature, Photo Walks, Wellness Retreats, Family & Kids, Luxury & Curated, Offbeat & Hidden, Nightlife & Events
- Explicitly note what was REMOVED from the old taxonomy: "Workshops" (it's a format not topic), "Solo & Budget" (those are facets not topics), standalone "Culture" (merged into Heritage)

### DD-007 · Home feed is section-based, not rail-based (big rewrite)
- This is the biggest §4.5 change. Rewrite **DISC-FR-001** and **DISC-FR-002** significantly.
- Remove the "For You / Following tabs" concept entirely — v1.1 had these, they're rejected in DD-007
- Replace with a single scrollable feed organized into sections in this fixed order:
  1. Pick up where you left off (conditional)
  2. Near you section (mixed content types, uses nearest-neighbor waterfall from DD-009)
  3. Per-vertical sections ordered by user's interest strength
  4. Waitlist cards for picked-but-empty verticals
  5. Discover something new (serendipity section, creators from verticals user did NOT pick)
- Add new requirements DISC-FR-020 through DISC-FR-025 for each section
- Each section is fetched independently and HIDDEN (not replaced with placeholder) when empty
- Note: the home feed screen has NO greeting block (DD-011 amendment)

### DD-008 · Animation libraries
- Captured in constraint C-20 (see below)

### DD-009 · Location mandatory with nearest-neighbor waterfall
- Add requirement **ONB-FR-006** · [M0] · Location capture step (mandatory)
- Add requirements **DISC-FR-025** through **DISC-FR-029** for the nearest-neighbor waterfall, location chip, fallback banners
- Add schema: `cities` table with PostGIS `geography(POINT, 4326)`, `users.current_city_id` + `current_location_point`, `content.starting_city_id` + `starting_city_point`
- Add constraint **C-21** · PostGIS enabled Week 1, seeded from GeoNames, no materialized views
- Note explicitly: SINGLE `current_city`, NOT dual home/viewing. The earlier dual-city draft was rejected.

### DD-010 · Phosphor map-pin for all cities, no emoji
- Captured in C-19 constraint (Iconography locked)

### DD-011 · Home feed · greeting removed, chip icons added
- Update DISC-FR-001 to explicitly note: NO greeting block on the home feed
- Add requirement **DISC-FR-030** · Vertical chips display Phosphor outline icons next to text label

### DD-012 · Waitlist card pattern
- Covered by DD-002 additions plus the home feed section rewrite (DD-007)
- Visual spec: dashed border, vertical icon, "X creators have joined so far · we'll notify you when this goes live", tappable

### DD-013 · Monochrome design system · coral as sole accent
- **This is the biggest constraint change.** Add constraint **C-17** to §2.5 with the full color palette (7 warm neutrals + 1 coral) and the five-place coral rule
- Remove any references in v1.1 to "8 vertical accent colors" or "per-vertical color schemes" — those are gone
- Add the five coral places explicitly: primary CTAs, active save/bookmark icon, location pin, active bottom tab, critical unread signals, overnight itinerary pin (DD-024 adds the 6th but it's functionally the 5th category — "things the user has done or anchors around")
- Semantic colors (success/warning/danger/info) survive but ONLY on functional states
- Add a new **Appendix F — Design system canonical spec** with the full palette, typography, icons, and animation parameters. This is a new appendix. Include color hex values, font loading instructions, and the Phosphor icon mapping per vertical.

### DD-014 · Discover screen + AMENDMENT for algorithmic collections
- Add requirements **DISC-FR-030** through **DISC-FR-033** for browse mode, search overlay, filter sheet, handpicked collections
- Important: MVP collections are **algorithmic** (template-based, cached per user per day). V1 adds manual curation via admin panel
- Add schema: `editorial_collections` table with `source text CHECK (source IN ('algorithmic', 'manual'))`, `scheduled_start`, `scheduled_end`, `created_by`
- Add admin panel requirement: **ADM-FR-009** · Editorial Curation CRUD

### DD-015 · Search history, analytics, dynamic placeholder
- Add requirements **DISC-FR-034** through **DISC-FR-036** for search logging, rotating placeholder, trending section (V1)
- Add privacy requirements **PRIV-FR-010** through **PRIV-FR-013** to §7.5
- Add schema: `search_queries` table, `search_placeholder_defaults` table, `top_searches_7d` materialized view
- Add admin panel requirement: **ADM-FR-010** · Search analytics dashboard
- **Important DPDPA compliance**: retention is 90 days rolling; users can clear search history via Settings → Privacy; guest searches are never logged server-side; privacy policy must disclose logging

### DD-016 · Soft auth wall
- Add requirement **IAM-FR-011** · [M0] · Soft auth wall (full spec in the changelog)
- Bottom sheet pattern with context-aware subhead
- Primary: phone OTP (coral). Secondary: Google/Apple. Tertiary: Not now.
- Promote **IAM-FR-005** (Social login) from [DEF] to [M0] — needed for the secondary auth path
- Triggers list: book, save_permanent, follow, comment, publish

### DD-017 · Save state as global user-content relationship
- Rewrite **SOC-FR-004** completely
- Add schema: `user_saves(user_id, content_id, created_at)` with PK and index
- Explicitly state: optimistic client updates, quiet rollback on server failure, never block UI
- Guest saves live in device local storage until sign-up

### DD-018 · (superseded by DD-022)
- Note in the changelog trace but no SRS change specific to DD-018

### DD-019 · WhatsApp share as first-class action
- Update **SOC-FR-005** · Share a content item to require BOTH a dedicated WhatsApp button AND a generic share button
- Deep-link format: `https://wa.me/?text={url-encoded-text}`
- Pre-filled text format: `Check out {title} on <AppName>: {canonical_url}`
- Open Graph metadata (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) must be emitted on all public content pages for the WhatsApp preview cards to work

### DD-020 · (superseded by DD-023)
- Note in the changelog trace but no SRS change specific to DD-020

### DD-021 · Scheduled experience schema
- Add schema: `scheduled_dates` table (with `capacity`, `spots_booked`, date range check)
- Add schema: `meeting_points` table (with `area_point` public, `exact_location` private)
- Update **BOOK-FR-002** to reference `scheduled_dates.spots_booked` for capacity checks
- Meeting point exact location is shared only in booking confirmation, 24hr before start

### DD-022 · Four content types (big change to enum and §4.4)
- Update `content_type` enum in §5.2: `post | event | scheduled_experience | self_paced_itinerary`
- Remove the old `experience_format` enum — format is now expressed in `content_type` directly
- In §4.4, rename and restructure:
  - **CRT-FR-001** · Create a Post (mostly unchanged, clarify as long-form reading, no KYC)
  - **CRT-FR-002** · Create a Self-paced Itinerary (rewritten per DD-023)
  - **CRT-FR-003** · Itinerary spot-based builder (rewritten per DD-023)
  - **CRT-FR-005** · Create a Scheduled Experience (rewritten per DD-021)
  - **CRT-FR-013** · Create an Event (new, replaces old CRT-FR-006 which deferred events)
- Old CRT-FR-006 (Events & Groups as V2) is deprecated — events are now M0

### DD-023 · Self-paced reframed as Roamy-inspired itinerary
- **Completely rewrite CRT-FR-002 and CRT-FR-003.** The old "day-by-day segment builder" is replaced by a "spot-based day builder"
- Add schema: `itinerary_days`, `itinerary_spots` (with `stop_type` enum including `overnight`), `spot_stop_type` enum
- Publishing wizard description: creator uses Google Places autocomplete to add spots, writes creator_note for each, marks overnight stop per day
- Freemium: Day 1's spots auto-marked `is_free_preview = true`

### DD-024 · Overnight stop coral pin
- Note in the rendering section of DISC-FR or CRT-FR-003: on itinerary maps, spots with `stop_type = 'overnight'` render as larger coral pins. Other spots use ink pins. Other days' spots are muted warm-gray dots. This is the 5th coral rule context (see C-17).

### DD-025 · Events vs scheduled experiences distinction
- Add **CRT-FR-013** · [M0] · Create an Event with full field spec
- Add schema: `event_occurrences` table (single row per event, `venue_point` public unlike scheduled experience privacy)
- Promote events from V2 to M0 in §3.3 MVP scope
- Update §3.2 to remove "No events & groups" line

### DD-026 · Post body uses Fraunces (reverses general rule)
- Update constraint **C-18 Typography** to note the exception: Fraunces for post detail body text (14px/1.65), Inter for everything else including other content types' body text
- Only applies to `content_type = 'post'` detail pages
- Pull quotes and inline callouts within post bodies also use Fraunces italic

### DD-027 · Posts have engagement signals, no price
- Update **CRT-FR-001** to clarify: no KYC, no price, no booking, monetization is indirect via follower conversion
- Stories-only creators never need KYC (reinforces DD-001)

### DD-028 · Google Places API dependency
- Add constraint **C-22** · Google Places API required for itinerary publishing
- Add to §6.3 software interfaces: Google Places API (Autocomplete, Place Details, Place Photos)
- Add to §2.7 assumptions: **A-08** · Google Places API availability and pricing
- Note the server-side proxy requirement (never expose API key to client)
- Estimated cost: ~$200–300/month at MVP launch

## Detailed instructions for the trickiest edits

### Appendix B — complete rewrite

This is the single biggest prose rewrite. The existing Appendix B is a 10→7 category collapse table. Delete it entirely and replace with a new Appendix B structured like this:

```markdown
### Appendix B — Content taxonomy (3 levels + orthogonal facets)

This taxonomy replaces the earlier 10→7 category collapse from SRS v1.0/v1.1. The new model has **three hierarchical levels plus orthogonal facets.** (DD-006)

#### Level 1 · Verticals (8)
[table with: vertical name, status (M0/V1/V2), KYC required, icon, short description]
- travel (M0, KYC for paid) — ...
- stories (M0, no KYC) — ...
- food (V1) — ...
- [etc for all 8]

#### Level 2 · Sub-categories per vertical

**Travel sub-categories (ship with MVP):**
[list all 12 with 1-line descriptions]

**Other verticals (structure defined, sub-categories per vertical ship with that vertical):**
- Stories: [plan for sub-cats]
- Food: [plan]
- [etc]

#### Level 3 · Leaf types (optional)
Leaf types are an optional third level used for search filters and publishing wizard steps. 5–7 per sub-category. Not required for MVP publish; V1 refinement.

#### Orthogonal facets
These are NOT part of the taxonomy tree. They cut across all content:
- `group_size`: solo / couple / small (4-6) / group (7+)
- `budget`: under ₹2k / ₹2k-5k / ₹5k-15k / ₹15k+
- `difficulty`: easy / moderate / challenging
- `duration`: day trip / weekend / 3-5 days / 6+ days
- `season`: any / summer / monsoon / autumn / winter

Facets are filter dimensions, not topics. A piece of content can have any combination of facet values.

#### What was removed from the v1.1 taxonomy
- **Workshops** — it's a format (scheduled experience) not a topic
- **Solo & Budget** — those are facets (`group_size=solo`, `budget=under-5k`), not topics
- **Standalone Culture** — merged into Heritage & Culture
```

### §5.1 Data model — many additions

You'll need to add multiple new tables and columns to the entity diagram and the enum list. Here's the full list of new schema elements to add:

**New tables:**
- `cities` (DD-009) — with PostGIS `geography(POINT, 4326)` column, seeded from GeoNames
- `user_waitlisted_verticals` (DD-002)
- `user_saves` (DD-017)
- `search_queries` (DD-015)
- `search_placeholder_defaults` (DD-015)
- `editorial_collections` (DD-014 + amendment)
- `itinerary_days` (DD-023)
- `itinerary_spots` (DD-023)
- `scheduled_dates` (DD-021)
- `meeting_points` (DD-021)
- `event_occurrences` (DD-025)
- `user_content_progress` (for "Pick up where you left off" — DD-007)

**New columns on existing tables:**
- `users.current_city_id`, `users.current_location_point`, `users.location_last_updated`, `users.location_source` (DD-009)
- `content.starting_city_id`, `content.starting_city_point`, `content.destination_city_ids` (DD-009)

**New enums:**
- `vertical` expanded to 8 values (DD-001)
- `content_type` rewritten: `post | event | scheduled_experience | self_paced_itinerary` (DD-022)
- `experience_format` enum REMOVED (no longer needed)
- `spot_stop_type` new enum (DD-023)
- `travel_subcategory` rewritten with 12 values (DD-006)

**New materialized view:**
- `top_searches_7d` (DD-015)

Put all of these in §5.1 or §5.2 as appropriate, grouped logically. Update the entity diagram ASCII art in §5.1 to include the new relationships.

### §2.5 Design constraints — add C-17 through C-22

Add six new constraints to the table in §2.5. Each one gets a constraint ID, a brief description, and a rationale. Use the full text from DD-013 (C-17 color palette + coral rule), DD-005/DD-026 (C-18 typography with post body exception), DD-010 (C-19 iconography), DD-008 (C-20 animation libraries), DD-009 (C-21 PostGIS Week 1), DD-028 (C-22 Google Places API).

### §4.5 Discovery — the biggest functional rewrite

This section needs the most attention because v1.1's Discovery section assumes For You / Following tabs, which are rejected. Here's the approach:

1. Keep DISC-FR-001 and DISC-FR-002 as requirement IDs but rewrite their content completely. DISC-FR-001 becomes "Home feed structure (section-based)" and describes the section order from DD-007. DISC-FR-002 becomes "Home feed section data fetching rules" with independent fetch + hide-when-empty rules.

2. Add new requirements DISC-FR-020 through DISC-FR-036 covering: near-you section, per-vertical sections, waitlist sections, discover-something-new, location chip, nearest-neighbor waterfall, search overlay, filter sheet, handpicked collections, search logging, rotating placeholder, trending searches.

3. Be careful with DISC-FR-003 (Category browse) — the category concept now follows the 3-level taxonomy from DD-006, so category browse lets users drill from vertical → sub-category → leaf type.

4. DISC-FR-006 (Search) gets updated to reference the new search history architecture from DD-015. Search is backed by Postgres tsvector in MVP (as before), Meilisearch in V1.

### Appendix F — new appendix for design system spec

Add a new **Appendix F — Design system canonical spec** after Appendix E. Include:
- The 7 warm neutrals + 1 coral palette with hex values and usage
- The five-place coral rule with exact contexts
- Typography loading instructions (Google Fonts URLs, next/font and flutter google_fonts packages)
- Fraunces opsz axis and SOFT variation usage
- Phosphor icon per vertical (canonical mapping)
- Standard animation parameters (card press, section entrance, sheet slide, loading shimmer)
- Shadow stack (warm-tinted, two-layer)

### Appendix G — new appendix for DD traceability

Add **Appendix G — Decision traceability matrix** listing all 28 DDs and the SRS sections they affect. Format as a table:

| DD | Title | Affects |
|---|---|---|
| DD-001 | Stories as first-class vertical | §1.3, §1.5, §5.2 |
| DD-002 | Show all verticals with waitlist | §4.2 ONB-FR-005, §5.1, admin panel |
| ... | ... | ... |

This is for reverse lookup. If someone reads a requirement with `(DD-009)` marker and wants to see the full reasoning, they can find DD-009 in the archived changelog.

## Verification at the end

After you finish all edits, run these checks and report the results to me:

1. **Grep for old terms that should be gone:**
   ```
   grep -n "For You tab\|Following tab\|Self-guided Itinerary\|Guided Trip\|experience_format" srs-v1.2.md
   ```
   Any hits are leftover old language that needs to be removed or updated.

2. **Count DD references:**
   ```
   grep -c "(DD-" srs-v1.2.md
   ```
   Should be at least 50 (most amendments leave a trace).

3. **Check requirement ID format is preserved:**
   ```
   grep -n "^#### [A-Z]\{2,4\}-FR-[0-9]\{3\}" srs-v1.2.md | head -20
   ```
   All requirements should match the `AREA-TYPE-NNN` format.

4. **Verify new requirement additions are in the right sections:**
   - IAM-FR-010, IAM-FR-011 under §4.1
   - ONB-FR-005, ONB-FR-006 under §4.2
   - CRT-FR-013 under §4.4
   - DISC-FR-020 through DISC-FR-036 under §4.5
   - PRIV-FR-010 through PRIV-FR-013 under §7.5
   - ADM-FR-009, ADM-FR-010 under §4.12

5. **Verify the revision history has the v1.2 entry** and that it references DD-001 through DD-028.

6. **Verify Appendix B was fully rewritten** (the old 10→7 category table should be gone).

7. **Verify Appendix F and Appendix G are new additions** (they don't exist in v1.1).

8. **Line count sanity check:** v1.1 was ~1600 lines. v1.2 should be 2000–2400 lines. Significantly shorter means you missed stuff; significantly longer means you bloated.

## Process suggestion

I'd recommend working in this order to avoid losing context:

1. Read v1.1 fully first. Get the structure and voice in your head.
2. Read the changelog fully. Understand the 28 decisions before editing anything.
3. Make the header and revision history update (§0).
4. Make the scope and terminology updates (§1.3, §1.5).
5. Add the new constraints to §2.5 (C-17 through C-22) and assumption A-08 to §2.7.
6. Update §3 MVP scope lists.
7. Work through §4 section by section in order:
   - §4.1 IAM: add IAM-FR-010, 011; promote IAM-FR-005
   - §4.2 Onboarding: rewrite structure, add ONB-FR-005, 006
   - §4.4 Content: rewrite CRT-FR-001, 002, 003, 005; add CRT-FR-013
   - §4.5 Discovery: rewrite DISC-FR-001, 002; add DISC-FR-020 through 036
   - §4.6 Social: rewrite SOC-FR-004, 005
   - §4.12 Admin: add ADM-FR-009, 010
8. Rewrite §5 data model with all new tables, columns, enums, view.
9. Update §6.3 software interfaces.
10. Add §7.5 privacy requirements.
11. Rewrite Appendix B completely.
12. Update Appendix D with new ADRs.
13. Update Appendix E differences table with v1.2 rows.
14. Create new Appendix F (design system) and Appendix G (traceability).
15. Update footer version stamp.
16. Run the verification checks and report.
17. Move the changelog to the archive path.

Don't try to do this in one pass of the whole file. Work section by section, commit or save progress between each section, and come back to ones that need refinement after you have the full picture.

If anything in the changelog is ambiguous or contradicts v1.1 in a way you can't resolve, STOP and ask me before making it up. I'd rather answer a clarifying question than fix hallucinated content.

---END PROMPT---

## Notes for Rohit

- Everything inside the `---BEGIN PROMPT---` / `---END PROMPT---` markers is the prompt itself. Copy that block as-is into Claude Code.
- The prompt assumes your SRS lives at `Docs/01_requirements/phase-1/srs/srs-v1.md` — update the paths if yours differ.
- The prompt references the changelog at the same directory. Make sure `srs-design-decisions-changelog-final.md` (the one I just produced) is at that path before you start Claude Code.
- Claude Code will take a while to work through this — 28 decisions is a lot. Let it work. If it stops partway through and asks to continue, say yes.
- When it's done, eyeball the verification output before accepting the result. If any check fails, ask Claude Code to fix that specific issue — don't re-run the whole job.
- Keep `srs-v1.md` as the historical v1.1 record. The new file is `srs-v1.2.md` and the changelog goes to an archive subfolder.

## If something goes wrong

If Claude Code produces a version you don't trust (wrong style, missing sections, hallucinated content), the changelog file is self-contained enough that you can also hand it to a human technical writer or use a different model to do the consolidation. The changelog IS the decision record — the SRS file is just the formatted output.
