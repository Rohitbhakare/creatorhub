# /plan-epic

**Usage:** `/plan-epic <epic-id> <epic-name>`
**Example:** `/plan-epic E1.4 "Events"`

**Model:** Always run with Opus (`claude-opus-4-6`). Plans are architectural decisions — use the most capable model.

---

## What this command does

Creates a complete, review-ready implementation plan for an epic **before any code is written**.
The plan is the single artifact the founder reviews and approves. No implementation starts until the plan is approved.

---

## Instructions (follow exactly, in order)

### Step 0 — Orient
- Read `docs/epics/TRACKING.md` to confirm the epic ID, name, and scope
- Confirm the epic's dependencies are all DONE (or explicitly note which aren't)

### Step 1 — Gather requirements
- Read `docs/00_SRS/v1.2/srs-v1.2.md` — extract **every** requirement (CRT-FR-XXX, DISC-FR-XXX, etc.) that belongs to this epic
- For each requirement, capture: description, acceptance criteria, design decisions referenced (DD-XXX)
- Do not stop at the first mention — search for all occurrences

### Step 2 — Study wireframes (v2 is canonical)
- Start at `docs/01_wireframes/v2/README.md` and `docs/01_wireframes/v2/chats/chat1.md` for design intent
- Open `docs/01_wireframes/v2/project/CreatorHub Redesign.html` to locate which pack (A–I) this epic belongs to
- Read the relevant `docs/01_wireframes/v2/project/pack-*.jsx` in full — extract: screen layout, component names, state labels, interaction flows, exact copy (button labels, empty state text, error messages)
- Follow imports through `design-system.jsx` → `components-primitives.jsx` → `components-chrome.jsx` for tokens and shared primitives
- Map each wireframe screen to a Flutter screen or widget (reuse `apps/mobile/lib/shared/components/` primitives — do not mirror React structure)
- Do NOT reference `docs/01_wireframes/archive/v1/` — it is historical only

### Step 3 — Read instruction files
- `.claude/instructions/api.md` — note route patterns, error format, auth middleware, SQL style
- `.claude/instructions/ui-ux.md` — note coral usage rules, typography rules, skeleton shimmer rule, tap target rules
- `.claude/instructions/infosec.md` — note auth requirements, rate limits, validation rules
- `.claude/instructions/testing.md` — note test patterns, what must be tested

### Step 4 — Study existing code
- Read the most similar existing epic's code as reference (e.g. for E1.4 Events, read E1.2 Posts and E1.3 Itineraries code)
- Identify: which services/utilities can be reused, which patterns must be followed, which files will be modified vs created new

### Step 5 — Draft the plan
Use `docs/epics/_EPIC_PLAN_TEMPLATE.md` as the structure. Fill in **every section**. Do not skip any section — write N/A with a reason if truly not applicable.

Key requirements for each section:
- **§6 Database:** write the actual SQL for non-trivial queries; flag any missing indexes
- **§7 API:** write the complete request/response shape for every endpoint
- **§10 Security:** address every risk in the template + add any epic-specific ones
- **§11 Edge cases:** write every error state and boundary condition before the task list
- **§12 Tests:** write the test cases table before the tasks (tests first)
- **§14 Tasks:** every task must have concrete file names, not vague descriptions
- **§15 Pre-implementation checklist:** leave this for the reviewer to fill in

### Step 6 — Write files
Create the epic folder if it doesn't exist: `docs/epics/<epic-id>-<epic-name-kebab>/`

Write three files:
1. `plan.md` — use the full `_EPIC_PLAN_TEMPLATE.md` structure (all 15 sections)
2. `tasks.md` — expand §14 into the detailed tasks.md format (each task a standalone section with files, SRS IDs, deps, acceptance, edge cases)
3. `tracking.md` — initialize with all tasks as `[ ] Not Started`

### Step 7 — Update master tracking
Add the new epic to `docs/epics/TRACKING.md` with status `PLAN REVIEW`.

### Step 8 — Present to founder
Output a summary of:
- What the plan covers (1 paragraph)
- The task list (T1 through TN with one-line descriptions)
- Any open questions that need founder input (§13)
- Any risks identified

**Do NOT start implementation. Wait for approval.**

---

## Quality bar

A plan is ready for review when:
- [ ] Every SRS requirement is mapped to a task
- [ ] Every wireframe element has a corresponding widget/screen
- [ ] Every edge case in §11 appears in at least one task's acceptance criteria
- [ ] The API section has complete request/response shapes
- [ ] The security section has a mitigation for every risk
- [ ] Test cases are written for every acceptance criterion
- [ ] No task has vague acceptance criteria
- [ ] Open questions are clearly stated with suggested resolutions

If any of these are missing, the plan is not ready. Fix it before presenting.
