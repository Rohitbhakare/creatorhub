# Claude Code Prompt · SRS v1.2 Consolidation

**Task:** Generate SRS v1.2 by applying the wireframe consolidation changelog and all running design decisions since DD-028 to the base SRS v1.1.

**Target output file:** `srs-v1.2.md`

---

## Context

You are consolidating a Software Requirements Specification for a multi-vertical creator platform (`<AppName>`, domain `xyz.com`). Travel is the launch wedge; India-only MVP; English only; INR only. Stack: Flutter mobile + Next.js web + Supabase Postgres + Firebase Auth + Razorpay. Target MVP: 2026-07-07.

An earlier consolidation pass produced SRS v1.1 plus a closed changelog tracking DD-001 through DD-028. Since then, a wireframing session produced 21 screens across mobile, web desktop, and web mobile surfaces, generating 12 new design decisions (DD-029 through DD-040), 50+ new functional requirements, multiple new schema tables, and compliance notes. All of these are captured in a wireframe consolidation document.

Your job is to merge everything into a clean SRS v1.2 without losing anything.

---

## Input files

You will find the following files in the working directory:

1. **`srs-v1.md`** — the base SRS v1.1 (1601 lines, creator-platform pivot version). This is your starting point.
2. **`srs-design-decisions-changelog-final.md`** — the closed changelog covering DD-001 through DD-028. Already applied to v1.1 conceptually, but treat it as canonical reference for the locked decisions.
3. **`wireframe-consolidation-changelog-final.md`** — THIS is the primary input for the consolidation. It contains:
   - DD-029 through DD-040 (12 new design decisions)
   - 50+ new functional requirements organized by module
   - 8 new schema tables with DDL
   - Design system amendments
   - Compliance notes
   - Open questions
4. **This prompt file** (`claude-code-prompt-srs-v1.2-consolidation.md`) — the instructions you're reading now.

---

## Execution instructions

### Step 1 · Read all input files completely

Before writing anything, read:
1. `srs-v1.md` — understand the current structure and content
2. `srs-design-decisions-changelog-final.md` — understand what's already been applied
3. `wireframe-consolidation-changelog-final.md` — understand what needs to be added

Do NOT start editing until you have a mental model of all three.

### Step 2 · Apply the branding fix pass

Before any other edits, run a global find/replace across the working SRS:
- `Roamy` → `<AppName>`
- `roamy.com` → `xyz.com`
- `roamy` → `<appname>` (lowercase contexts like URL paths, variables)

This includes references inside code blocks, examples, footnotes, and prose. Be thorough — the brand name is currently a placeholder.

### Step 3 · Apply design decisions DD-029 through DD-040

For each design decision in Section 2 of the wireframe consolidation document:

1. Locate the relevant section of the SRS v1.1 that the decision affects
2. Apply the decision's change as documented in the changelog
3. Add a reference note indicating the source: `[DD-029 · Studio as 3rd bottom tab · LOCKED]`
4. If the decision introduces new content that doesn't fit an existing section, add a new subsection

**Specific handling for each DD:**

**DD-029 · Studio as 3rd bottom tab** — Update any references to the bottom navigation structure. Ensure the 5-tab structure (Home · Discover · Studio · Saved · You) is documented in the UX specification section. Add a note that Studio is always visible for all authenticated users.

**DD-030 · Multi-list saved wishlists** — Replace any references to `user_saves` table with the new `saved_lists` + `saved_list_items` schema. Apply the schema changes from Section 3.4 of the consolidation document. Update SOC-FR-004 to reflect the multi-list model.

**DD-031 · Connected social accounts** — Lock this at scope tier M1 unless the user has indicated otherwise. Add the `user_social_accounts` schema. Add the OAuth integration as a new module under Identity & Access Management.

**DD-032 · Custom spot cover upload deferred to V1** — Update CRT-FR-016 to clarify that MVP uses Google Places `photo_reference` as the sole source of spot imagery.

**DD-033 · Wizard Step 5 full-page preview** — Update CRT-FR-020 to specify full-page preview rendering using actual detail-page components, not card thumbnails.

**DD-034 · Notification channels fixed (push, WhatsApp, email)** — Add this as a locked decision in the notifications specification. Explicitly note that SMS is NOT a notification channel.

**DD-035 · Username change cooldown** — Add the 30-day cooldown rule to the profile specification. Add the `username_changed_at` column to the `users` table schema.

**DD-036 · Profile surface is minimal by design** — Document the exclusion list (no DOB, gender, pronouns, website, theme, multi-language bio) as a design principle in the profile section.

**DD-037 · Self-paced purchases separated from bookings** — Update the Bookings module to describe the two-section architecture (Upcoming trips + Library).

**DD-038 · OAuth permissions transparency** — Add this as a UX requirement for any OAuth integration, not just the current ones.

**DD-039 · Home page is curated** — Add the `featured` boolean flag to the `users` and `content` table schemas. Document the manual curation approach.

**DD-040 · Responsive design changes layout only** — Add this as a cross-cutting principle in the web specification.

### Step 4 · Add new functional requirements

For each module in Section 3 of the consolidation document, add the new FR-* requirements to the existing module sections:

- **Booking module** · Add BK-FR-007 through BK-FR-015 to the Bookings section
- **Studio module** · Add STUD-FR-001 through STUD-FR-004 as a new subsection under Creator Experience
- **Creator/Publishing module** · Add CRT-FR-014 through CRT-FR-025 to the Content Creation section
- **Social/saves module** · Amend SOC-FR-004, add SOC-FR-008 through SOC-FR-011 to the Social Interactions section
- **Profile module** · Add PROF-FR-006 through PROF-FR-016 to the User Profile section
- **Identity/access module** · Add IAM-FR-005 (promoted), IAM-FR-009, IAM-FR-010 to the Identity section
- **Notifications module** · Add NOT-FR-001 through NOT-FR-005 to the Notifications section
- **Web/SEO module** · Add WEB-FR-001 through WEB-FR-013 as a new or expanded Web Platform section
- **Security workstream** · Add SEC-FR-001 through SEC-FR-009 to a new "Deferred security workstream" subsection, clearly marked as DEFERRED

Each requirement should have:
- The ID
- The scope tier (M0, M1, or V1+)
- The requirement text
- The source screen reference

### Step 5 · Apply schema changes

Consolidate all new `CREATE TABLE` and `ALTER TABLE` statements from Section 3 of the consolidation document into the SRS data model section (likely §5 or §6). The new tables are:

1. `saved_lists` (replaces `user_saves`)
2. `saved_list_items`
3. `user_social_accounts`
4. `studio_alerts`
5. `meeting_points`
6. `tnc_versions`
7. `cancellation_policy_versions`
8. `user_notification_preferences`

Also add column additions:
- `users.dnd_enabled boolean NOT NULL DEFAULT false`
- `users.username_changed_at timestamptz`
- `users.featured boolean NOT NULL DEFAULT false`
- `content.featured boolean NOT NULL DEFAULT false`

For each new table, include the appropriate Row Level Security (RLS) policies as documented in the consolidation document.

### Step 6 · Update the design system appendix

Apply the design system amendments from Section 4 of the consolidation document:

1. **Color correction** · Change any references to `#FFF5F1` (warm hero background) to `#F2EEE8` (standard sunken surface token). The `#FFF5F1` value should not appear anywhere in the final SRS except as a note that it was rejected as too orange.
2. **Coral usage rules** · Expand DD-013 / DD-024 rules to include the 8 legitimate semantic contexts listed in Section 4.1.2 of the consolidation document.
3. **Component additions** · Add the new UI patterns listed in Section 4.3 (contextual alert hero, save-to-list bottom sheet, sticky header on mobile web, horizontal scrollable stats strip, two-part meeting point privacy model, wizard framework, booking status pill system, permissions transparency card, profile completion nudge card).
4. **Bottom tab bar structure** · Document the 5-tab structure from DD-029.

### Step 7 · Add compliance section

Create or expand a compliance section covering:

- **DPDPA** (India data protection) requirements from Section 6.1 of the consolidation document
- **IT Act 2021 Intermediary Rules** requirements from Section 6.2
- **Tax compliance** (GST + TDS) requirements from Section 6.3
- **Google Places API** compliance requirements from Section 6.4

Each requirement should reference the surface where it's implemented and its current status.

### Step 8 · Create "Post-MVP scope" section

Add a clearly-marked section listing everything that was identified but deferred to V1 or later:

- Custom spot cover upload (DD-032)
- Quiet hours scheduler (NOT-FR-004)
- Connected social accounts (DD-031, if M1)
- Block list functionality (SEC-FR-008)
- Anomaly detection (SEC-FR-009)
- Profile photo import from social (PROF-FR-008)
- Subscriber count delta tracking (PROF-FR-012)
- All other items marked V1 or M1 in Section 3

### Step 9 · Create "Decisions needed before lock" section

Add a clearly-marked section listing open questions that still need resolution:

1. DD-031 scope tier (M0 vs M1) — recommending M1
2. SEC-FR-001 through SEC-FR-007 prioritization — deferred to web build phase but must revisit
3. Brand name decision — blocking public launch materials
4. Domain registration — blocking public launch materials
5. Creator mini-site launch timing (MVP vs post web build)

### Step 10 · Verification checks

Before finalizing the output, verify:

- [ ] All DDs (DD-001 through DD-040) are present in sequence with no gaps
- [ ] Every new FR-* requirement has a module prefix and scope tier
- [ ] Every new schema table has an accompanying RLS policy
- [ ] No broken cross-references between old and new sections
- [ ] All placeholder brand names are `<AppName>` / `xyz.com` (NO "Roamy" anywhere)
- [ ] All wireframe references point to Screen numbers that match the consolidation document
- [ ] The design system appendix has the color correction applied (`#F2EEE8`, not `#FFF5F1`)
- [ ] The bottom tab structure shows 5 tabs (Home · Discover · Studio · Saved · You)
- [ ] The Bookings section has the two-section architecture (Upcoming + Library)
- [ ] The Saved tab section reflects multi-list wishlists
- [ ] The compliance section covers DPDPA, IT Act, tax, and Google Places
- [ ] All deferred items are listed in the Post-MVP scope section
- [ ] All open questions are listed in the Decisions needed before lock section

### Step 11 · Format and output

Output the final document as `srs-v1.2.md` in the working directory. Use clean markdown with:

- H1 for the document title
- H2 for major sections
- H3 for subsections
- H4 for sub-subsections
- Numbered lists for procedural content
- Tables for requirements registries
- Code blocks with language tags for SQL DDL
- Bold for emphasis of key terms
- Links for cross-references between sections (e.g., `[see §5.2]`)

Start the document with:
- Document version: `v1.2`
- Date: today's date
- Previous version: `v1.1`
- Changelog summary pointing to Section X for details

End the document with:
- Revision history showing v1.0 → v1.1 → v1.2 with summary of changes at each version

---

## Style and tone guidelines

Match the existing SRS v1.1 tone:
- Formal but readable (not bureaucratic legalese)
- Precise about requirements without over-specifying implementation
- Uses concrete examples where helpful
- Clearly distinguishes between M0 (MVP), M1 (first fast-follow), V1+ (future)
- Includes rationale for significant decisions, not just the decisions themselves

Avoid:
- Repeating identical requirements in multiple sections
- Vague language ("should probably," "might want to," "consider")
- Implementation details that lock the engineering team into a specific approach unnecessarily
- Marketing language in a technical specification
- Inconsistent terminology across sections

Prefer:
- Direct statements: "The system MUST..." / "The system SHOULD..." / "The system MAY..."
- Concrete acceptance criteria
- Schema definitions in SQL
- Cross-references with explicit section numbers

---

## Output requirements

Your output must be:

1. **A single file** at `srs-v1.2.md` (do NOT split across multiple files)
2. **Self-contained** (all content from v1.1 plus all additions from the changelog, not a diff)
3. **Valid markdown** that renders cleanly in any markdown viewer
4. **Complete** (no "[TODO]" or "[placeholder]" markers except in the Decisions needed before lock section)
5. **Traceable** (every requirement has an ID, every decision has a DD reference, every schema change has a note about when it was introduced)

---

## After generating the output

1. Print a summary of what you did:
   - Total word count of v1.2 vs v1.1
   - Number of new FR-* requirements added
   - Number of new schema tables added
   - Number of DDs applied (should be 12: DD-029 through DD-040)
   - Any sections that required structural changes
   - Any ambiguities you had to resolve with a judgment call

2. Flag any issues you encountered:
   - Contradictions between v1.1 and the changelog
   - Missing information that should have been in the changelog
   - Places where the branding fix required contextual interpretation
   - Any DD that couldn't be cleanly applied

3. Provide a recommended next-step list:
   - Should the user run any verification queries against the final document?
   - Are there any open questions that should be resolved before engineering handoff?
   - Does the document need a human review pass for any specific section?

---

## Critical constraints

- **Do NOT invent requirements.** Only apply what's in the changelog. If something seems missing, flag it rather than inventing it.
- **Do NOT change locked decisions from DD-001 through DD-028.** These are final.
- **Do NOT drop any requirement from v1.1** unless the changelog explicitly says to remove it.
- **Do NOT add security requirements beyond SEC-FR-001 through SEC-FR-009.** The security workstream is scoped to what's in the changelog.
- **Do NOT speculate about M0 vs M1 scope tiering** beyond what's documented. If the scope is unclear, flag it in the open questions section.
- **Do NOT change the terminology** (e.g., don't rename "self-paced itinerary" to "digital guide" or "content" to "post"). Preserve the existing taxonomy.

---

## Quality bar

The output SRS v1.2 should be good enough that:

1. An engineering team could read it and estimate sprint work without needing to cross-reference the wireframe changelog
2. A designer could read the design system appendix and produce Figma components that match
3. A new team member could read it end-to-end and understand the product
4. A legal reviewer could check the compliance section without hunting through other sections
5. A PM could track scope by filtering on M0 / M1 / V1+ tiers

If you find yourself generating content that fails any of these criteria, pause and fix it before moving on.

---

## End of prompt

Begin by reading all input files. Then proceed through the steps in order. Flag any issues as you go. Output the final document when all steps are complete and verification checks pass.

Good luck. Take your time. Quality over speed.
