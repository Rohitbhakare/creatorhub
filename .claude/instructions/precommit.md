# Pre-Commit Checklist

> This checklist MUST be completed before any epic is declared DONE and before any commit is made.
> No exceptions. Skipping any step is a process violation.

---

## Step-by-Step Pre-Commit Flow

```
Tests → Lint → Typecheck → 4-Step Review Gate → Boot Check → Screenshot Parity → Commit
```

---

## 1. Tests (MANDATORY — must pass before anything else)

### API Unit Tests
```bash
cd apps/api
pnpm test
```
- All tests must pass (`0 failed`)
- Critical modules must meet 70%+ coverage: pricing, content-state, auth, booking
- If any test fails, fix the code — do NOT skip or delete the test

### Flutter Tests
```bash
cd apps/mobile
flutter test
```
- All widget tests must pass
- If a test fails, fix the widget, not the test

### Shared Package Tests (if applicable)
```bash
cd packages/shared
pnpm test
```

---

## 2. Lint & Format

### TypeScript (API + Shared)
```bash
# From monorepo root
pnpm -r run lint        # ESLint on all packages
```

### Dart (Flutter)
```bash
cd apps/mobile
flutter analyze
```
- `0 issues found` required — no warnings, no infos, no errors

---

## 3. Type Check

### API + Shared
```bash
cd apps/api
pnpm typecheck          # tsc --noEmit

cd packages/shared
pnpm typecheck
```
- `0 errors` required

---

## 4. Review Gate (4 steps — run in order)

Each review MUST be done and findings MUST be resolved before moving to the next.

### 4a. Edge Case Review
Check for:
- Missing error states (what happens when DB call fails?)
- Boundary conditions (empty arrays, 0, null, max values)
- Empty states (zero content, no results)
- Race conditions (concurrent writes, duplicate requests)
- Offline behavior (Flutter: what shows when no network?)

Document findings and fixes in the epic tracking file under "Review Gate".

### 4b. Security Review (`.claude/instructions/infosec.md`)
Check for:
- Ownership verification (does every write verify the resource belongs to the current user?)
- SQL parameterization (zero string concatenation in queries)
- Auth middleware on every endpoint (`authenticate` or `optionalAuthenticate`)
- No secrets in code (API keys, tokens — use env vars only)
- Input validation with Zod before any processing
- Places API key proxied server-side (never in client)
- KYC check before publishing paid content

### 4c. Architecture Review
Check for:
- Pattern adherence: route → handler (thin) → service (logic) → SQL query
- No HTTP context leaking into services (services must be HTTP-agnostic)
- No raw strings in SQL (only parameterized queries)
- Riverpod Notifier pattern in Flutter (not StateNotifier, not ChangeNotifier)
- Shared types used from `packages/shared` (no locally duplicated types)
- OpenAPI spec up-to-date with implemented endpoints

### 4d. Code Quality
```bash
# Check diff for quality issues
git diff --stat HEAD  # see what changed
```
- No unused imports
- No `console.log` left in production code (use structured logging)
- No TODO comments without a tracking issue
- No hardcoded strings where constants should be used
- No duplicate code (DRY violations)

---

## 5. Boot Check

Before declaring any backend-touching epic complete:

### API Boot
```bash
cd apps/api
pnpm dev
```
- Server must start without errors on `http://localhost:3000`
- Hit `/healthz` → must return `{"status":"ok"}`
- Hit `/readyz` → database and firebase checks must pass

### Flutter Boot (after API changes)
```bash
cd apps/mobile
flutter run
```
- App must launch without runtime errors
- Navigate to the screen(s) built in this epic
- Verify the screen renders (no blank screens, no exceptions in console)

---

## 6. Screenshot Parity Check (MANDATORY for any UI-touching epic)

> Too many epics have shipped with code that compiles and "works" but looks nothing like
> the canonical design. This gate catches drift before it lands.

For every screen added or changed in the epic:

### 6a. Capture the build
- Run the app on iOS simulator OR connected device
- Navigate to the screen
- Take a screenshot (`Cmd+S` in simulator, or `flutter screenshot` for device)
- Save to `docs/epics/<epic-id>/screenshots/<screen-name>.png`

### 6b. Locate the canonical wireframe
- Find the matching pack in `docs/01_wireframes/v2/`
- Open the HTML file OR the exported image

### 6c. Diff against wireframe — check all of these
- **Background color** matches spec exactly (pure white `#FFFFFF` for v2, not tinted)
- **Coral usage** only in the 8 approved contexts (see `.claude/instructions/ui-ux.md`)
- **Typography** — Fraunces for display/H1/H2/post body only; Inter for everything else
- **Spacing & padding** match wireframe (use ruler/inspector)
- **Real content rendered** — no gray placeholders on a live screen, no Lorem Ipsum
- **All interactive elements** are actually wired (cards tap, "See all" navigates, buttons fire)
- **Loading state** is skeleton shimmer — never a spinner
- **Empty state** is illustration + title + description + optional CTA — never just gray text

### 6d. If there's drift, fix before commit
- Small cosmetic drift (2-4px, minor color): log in tracking.md "Review Gate" and fix
- Structural drift (wrong layout, wrong component): STOP, do not commit until corrected
- Missing wire-up (dead buttons, dead taps): STOP, wire it before declaring DONE

### 6e. Attach screenshots to tracking file
In `docs/epics/<epic-id>/tracking.md`, add a section:

```markdown
## Screenshot Parity

| Screen | Build | Wireframe | Match? |
|--------|-------|-----------|--------|
| Home Feed | ![](screenshots/home-feed.png) | [Pack 02](../../01_wireframes/v2/02_home/home.html) | `[x]` |
| Content Detail | ![](screenshots/content-detail.png) | [Pack 04](../../01_wireframes/v2/04_detail/detail.html) | `[ ]` drift: hero padding 12→16 |
```

**Every screen must be `[x]` before commit.**

---

## 7. Update Tracking File

Before committing, update the epic tracking file (`docs/epics/<epic-id>/tracking.md`):

- Mark all completed tasks as `[x]`
- Fill in the Review Gate section with findings and status
- Update the pre-commit checklist at the bottom with actual pass/fail results
- Update `docs/epics/TRACKING.md` with new progress count

---

## 8. Commit (only after all above pass)

```bash
# Stage specific files — never `git add .`
git add apps/api/src/services/post.service.ts
git add apps/api/src/services/post.service.test.ts
# etc.

# Conventional commit format
git commit -m "feat(e1.2): add post creation wizard and detail screen"
```

Conventional commit prefixes:
- `feat:` — new feature
- `fix:` — bug fix
- `test:` — adding or fixing tests
- `refactor:` — code change without behavior change
- `docs:` — documentation only

---

## Tracking Template for Each Task

Every task in a tracking file must have this structure:

```markdown
| T1 | Task Name | `[x]` Done | Notes about implementation |
```

And each epic tracking file must end with:

```markdown
## Pre-Commit Checklist

| Check | Status | Notes |
|-------|--------|-------|
| API unit tests pass | `[ ]` | `pnpm test` in apps/api |
| Flutter tests pass | `[ ]` | `flutter test` in apps/mobile |
| Dart analyze 0 issues | `[ ]` | `flutter analyze` |
| TypeScript 0 errors | `[ ]` | `tsc --noEmit` |
| Edge case review | `[ ]` | Findings: |
| Security review | `[ ]` | Findings: |
| Architecture review | `[ ]` | Findings: |
| Code quality review | `[ ]` | Findings: |
| API boots (`/healthz`) | `[ ]` | |
| Flutter launches | `[ ]` | |
| Screenshot parity (every UI screen) | `[ ]` | All rows `[x]` in Screenshot Parity table |
| Tracking file updated | `[ ]` | |
```

All items must be `[x]` before commit.

---

## What "DONE" Means for a Task

A task is DONE only when:
1. Implementation complete
2. Unit test written and passing
3. No lint/typecheck errors introduced
4. Manually verified it works (boot + navigate + interact)
5. Screenshot parity check passed — build matches the canonical wireframe

A task is NOT done if:
- Code compiles but has no tests
- Code compiles but was never run
- Code compiles but the 4-step review hasn't been done
- Screen compiles and navigates but visually drifts from the wireframe
- A button / card / "See all" exists but doesn't do anything when tapped
