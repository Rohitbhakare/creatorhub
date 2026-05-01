# E5.5 — Publishing Wizard v3 (W-P1 / W-P2 / W-P3)

> **Series:** Sixth epic in the M2.5 Web v3 Parity series. Depends on E5.0 (Foundation).
> **Goal:** TipTap markdown editor + 2:1 cover crop + drag-reorder spots + 8s autosave indicator + iframe live preview, restructured to match v3's 3-step Outline / Chapter / Pricing flow.
> **SRS refs:** WEB-PUB-FR-067..073
> **Wireframes:** [docs/01_wireframes/v3/project/pack-w-publish.jsx](docs/01_wireframes/v3/project/pack-w-publish.jsx)
> **Master plan:** [`/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md`](/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md)

---

## 1. Overview

`/publish/[type]` already runs an 817-line wizard with a 5-step flow (Cover / Details / Body / Spots / Review), 8s autosave, framer-motion `AnimatePresence` between steps, Firebase Storage integration for covers, and `<MarkdownBody>` preview. **Most of the wizard scaffolding is in place — E5.5 is the editor + media-handling polish on top.**

What's missing vs v3 + SRS:

1. **TipTap editor** (FR-070) — body is a plain `<textarea>` today. v3 mandates a real WYSIWYG with toolbar (bold / italic / heading / quote / link), markdown roundtrip, `~150KB` budget when lazy-loaded.
2. **2:1 cover crop** (FR-069) — current uploader has no crop. v3 wants a crop UI (drag to position, fixed 2:1 aspect).
3. **Drag-reorder spots via framer-motion `Reorder`** (FR-071) — spots step today probably renders a static list; needs `Reorder.Group` with handles.
4. **8s autosave indicator** (FR-072) — autosave exists but the visual state machine (idle / saving / saved / error / retry) needs to match v3's prominent indicator at the top of the wizard.
5. **iframe live preview** (FR-073) — current preview is inline `<MarkdownBody>`. v3 spec (Master plan §E5.5) wants an actual `<iframe>` of the eventual `/u/<username>/<slug>` mini-site URL.
6. **v3 chrome restructure** — wireframe shows 3 steps (Outline / Chapter / Pricing) vs current 5. Restructure or keep?

## 2. SRS Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| WEB-PUB-FR-067 | Per-type step structure | Existing — 4 types covered |
| WEB-PUB-FR-068 | Server-side draft persistence + autosave | Existing — `draftId` + 8s timer |
| WEB-PUB-FR-069 | 2:1 cover crop | **New** |
| WEB-PUB-FR-070 | TipTap markdown editor (~150KB lazy) | **New** |
| WEB-PUB-FR-071 | Drag-reorder spots via framer-motion `Reorder` | **New** |
| WEB-PUB-FR-072 | 8s autosave indicator (5-state) | Partial — autosave runs; visual indicator gap |
| WEB-PUB-FR-073 | iframe live preview | **New** |

## 3. Wireframes Referenced

| File | Use |
|---|---|
| [docs/01_wireframes/v3/project/pack-w-publish.jsx](docs/01_wireframes/v3/project/pack-w-publish.jsx) | W-P1 (Outline, lines 4–164), W-P2 (Chapter editor + map, 166–315), W-P3 (Pricing & visibility, 316–462), shared chrome (464–544) |
| [docs/01_wireframes/v3/project/uploads/pack-w8-publishing-wizard.html](docs/01_wireframes/v3/project/uploads/pack-w8-publishing-wizard.html) | Earlier standalone reference |

## 4. Dependencies

| Dependency | Status | What we use |
|---|---|---|
| E5.0 Web Foundation | DONE | `<Btn>`, motion library, `<ToastRegion>` |
| E5.3 Reader | DONE | `<MarkdownBody>` for the preview pane (read-only) |
| Existing publish wizard | — | 817-LOC scaffolding + autosave; restyle, do not rebuild |
| Firebase Storage | — | `lib/firebase-storage.ts` already wraps `uploadToStorage()` |
| TipTap | new | Add `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-link`; ~120 KB lazy. |

## 5. Architecture Decisions — OPEN QUESTIONS

### Decision 1 — Step structure: keep 5 steps or collapse to v3's 3?

**v3 wireframe:** 3 steps — Outline (cover + title + summary + city + duration) / Chapter (TipTap body + spot manager + map) / Pricing (price + visibility + publish).

**Current code:** 5 steps — Cover / Details / Body / Spots / Review.

| Option | Layout | Trade-off |
|---|---|---|
| **A. Collapse to 3 steps matching v3 (recommended)** | Cover + Details merge into "Outline"; Body + Spots merge into "Chapter"; Review → "Pricing". Per-type variation: post/event skip Spots-within-Chapter, free content hides price block. | Matches v3 cleanly. Simpler progress rail. Slightly more vertical scroll within each step. |
| **B. Keep 5 steps; restyle each to v3 chrome** | Existing structure stays; we restyle with v3 colors + horizontal stepper. | Cheapest. Loses v3's editorial flow ("Outline → Chapter → Pricing" reads like a publishing process). |
| **C. Hybrid** | 5 steps for itinerary + experience (need spots step), 3 steps for post + event. | Matches v3 for content with spots; cleaner for short-form. More chrome variation. |

**Recommended: A** — v3's mental model is the right one for authors; the merge is small refactoring, not a rewrite.

### Decision 2 — TipTap extensions: minimal-toolbar vs full-featured

**v3 wireframe** shows a minimal toolbar (bold / italic / H2 / quote / link / list). SRS FR-070 doesn't specify the extension set.

| Option | Extensions | Trade-off |
|---|---|---|
| **A. Minimal: starter-kit + link (recommended)** | `@tiptap/starter-kit` (paragraph, headings H1-H3, bold, italic, lists, blockquote, code) + `@tiptap/extension-link`. Bundle ~120 KB lazy. | Covers 90% of authoring intent. Aligns with the read-side `<MarkdownBody>` token set (which doesn't render images / tables anyway). |
| **B. Full: + image + table + collaboration cursor + youtube embed** | Adds 60–80 KB for surface area we'll throw away if `<MarkdownBody>` can't render it. | Authors get more, but readers see less. Mismatched authoring UX. |
| **C. Markdown-source-only + live-render preview pane** | No TipTap; keep the `<textarea>` and live-render alongside via `<MarkdownBody>`. | Cheapest. Misses the WYSIWYG SRS calls for. |

**Recommended: A.**

### Decision 3 — Cover crop UI: in-place crop vs modal cropper

**v3 wireframe** doesn't show explicit crop chrome. SRS FR-069 mandates 2:1 ratio.

| Option | Approach | Trade-off |
|---|---|---|
| **A. In-place 2:1 frame, drag-to-pan after upload (recommended)** | After file pick, render the image inside a fixed 2:1 mask; user drags to pan, scrolls to zoom. Output canvas exports 1600×800 JPEG. ~80 LOC + 1 dep (`react-easy-crop` ~10KB or hand-roll). | Inline, immediate feedback. No modal context-switch. Matches the cover slot the user sees on the page. |
| **B. Modal cropper after pick** | Click → file pick → modal opens → crop → close → preview shows. | Familiar UX, but adds a modal layer the wizard otherwise avoids. |
| **C. Server-side smart-crop** | Accept the full image; crop server-side via Sharp's smart crop. | Easiest authoring (no UI), worst control (the algorithm picks). |

**Recommended: A** with hand-rolled crop (no library).

### Decision 4 — Live preview: real iframe vs in-place preview pane

**SRS FR-073** mandates iframe live preview.

| Option | Layout | Trade-off |
|---|---|---|
| **A. Real iframe to `/preview/<draftId>` (recommended)** | New route `/preview/[draftId]` renders the unpublished content using the actual reader components. Wizard's preview pane is an `<iframe>` pointing at this URL. Refreshes on autosave. | True WYSIWYG against production CSS / fonts. Demands a new route + draft-token ACL (only the author can preview their own draft). |
| **B. Inline preview via `<MarkdownBody>` rendered in the wizard** | What we have today. | Cheaper. Doesn't match SRS literally. The preview won't show the page chrome (header / footer / spot cards). |
| **C. iframe to `/content/<contentId>` once published** | After publish, link to the public route. | No preview before publish — fails the spec. |

**Recommended: A** — iframe preview is the integration test for the publish flow itself; if it works, the live page works.

### Other decisions (no user input needed)

| Decision | Choice | Rationale |
|---|---|---|
| Autosave indicator | 5-state pill (Idle / Saving… / Saved {n}s ago / Error · retry / Offline) | Matches v3 W-P1 line 80–96 indicator chrome |
| Drag handle | Pinned to left edge of each spot row, 6-dot icon | Standard pattern; framer-motion `Reorder` requires explicit drag listeners |
| Image MIME validation | jpeg / png / webp only — no svg / html / gif (per ui-ux.md) | Existing rule |
| Max image size | 8 MB raw, then compressed to 1600px wide | Matches FR rule for media uploads |

## 6. Database

No DB changes. Drafts table (`content` with `status='draft'`) already in place from earlier migrations.

## 7. API Contract

No new endpoints. Existing draft `POST /api/v1/content` + `PATCH /api/v1/content/:id` cover the autosave path.

New web route handler: `/preview/[draftId]/page.tsx` — auth-gated, owner-only, renders content via the existing `/content/[id]/page.tsx` composition with a `?preview=1` flag that suppresses the public chrome.

## 8. Test Plan

| Layer | Coverage |
|---|---|
| Unit | TipTap markdown roundtrip helper (markdown → AST → markdown idempotent), 2:1 crop output dimensions, drag-reorder onChange order, autosave indicator state transitions. ~12 new tests. |
| Integration | Autosave conflict resolution (two-tab simulation — out of scope for first land, file as ENH); KYC-gate enforcement on paid publish (existing API logic). |
| SSR | `/publish/[type]` renders for each of post / itinerary / experience / event. |
| A11y | TipTap toolbar buttons accessible-named; drag-reorder has keyboard-nav fallback (existing arrow-key pattern); cover crop has hidden file input + visible CTA. |
| Visual | 5-breakpoint screenshots × 4 types × 3 steps (Outline / Chapter / Pricing). |

## 9. Edge Cases

- **Browser-close with unsaved dirty draft** → `beforeunload` warning (existing wizard wires this).
- **Two tabs editing same draft** → server picks the most recent `updated_at`. Documented as ENH for proper conflict resolution.
- **Autosave fails 5× in a row** → indicator goes to "Error · retry" state, retries with exponential backoff (1s → 30s cap).
- **Very long body (>10 000 words)** → TipTap's virtualization handles it; preview iframe lazy-renders.
- **Cover image with >8MB size** → reject with toast "Cover too large — max 8 MB".
- **Cover MIME spoof (JPEG ext, PNG body)** → server-side mime-sniff (existing) catches.
- **Spot list with 0 spots** → Chapter step shows empty-state CTA "Add your first stop".
- **Spot list with > 30 spots** → no hard cap; `Reorder` performance acceptable up to ~100 spots.
- **Publish without KYC** (paid content) → server-side gate returns 403 with reason; wizard surfaces inline error.
- **Browser without `FileReader` / `Crypto`** → cover-pick falls back to direct upload without crop.

## 10. InfoSec Review

| Concern | Mitigation |
|---|---|
| Markdown XSS via TipTap → readers | TipTap's HTML output goes through markdown serializer → `<MarkdownBody>` (no raw-HTML path); existing safety holds |
| Image MIME spoof | Server-side mime-sniff (existing) |
| S3 presign URL TTL | 15 min (existing E2.10b) |
| Preview iframe sandbox | `sandbox="allow-same-origin allow-scripts"` (no top-navigation, no forms) |
| Draft-preview ACL | `/preview/[draftId]` owner-check via session — return 404 if not the author |
| Paid-content publish | `requireKYC` middleware (existing) — server enforces |
| Image EXIF stripping | Server-side on upload (existing) |
| Copyright self-cert | Checkbox before paid publish (existing — verify wired) |

## 11. Governance

- **Audit logs:** publish + unpublish already emit audit_events (E2.6).
- **DPDPA:** image EXIF stripped on upload (existing E2.10b) — verify still wired.
- **Doc sync:** WEB-DESIGN-SYSTEM.md gets the autosave indicator class if it generalises beyond the wizard.
- **ADR:** if Decision 1 picks A and we restructure to 3 steps, an ADR documents the v3 alignment + why we deviated from the prior 5-step scaffolding.

## 12. Tasks (preliminary — refined after decisions land)

| ID | Task |
|----|------|
| T1 | Audit existing publish wizard surface (already done in plan §1) — verify autosave path, KYC gate on paid publish, draft restoration, cover MIME validation |
| T2 | Restructure wizard to 3 steps (Outline / Chapter / Pricing) — merge Cover+Details and Body+Spots; preserve per-type variations |
| T3 | TipTap editor — install `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-link`; lazy-load via `dynamic()`; markdown roundtrip helper |
| T4 | 2:1 cover crop — hand-rolled in-place pan/zoom, output 1600×800 JPEG via canvas |
| T5 | Drag-reorder spots — framer-motion `Reorder.Group` + drag handle + keyboard nav fallback |
| T6 | 5-state autosave indicator — Idle / Saving / Saved / Error · retry / Offline pill at top of wizard |
| T7 | iframe live preview — new `/preview/[draftId]` route, owner-gated, renders via reader components; wizard mounts iframe on a "Preview" sidecar that auto-refreshes on autosave |
| T8 | Edge cases — beforeunload warning, MIME validation, 8MB rejection, KYC gate surfacing |
| T9 | 4-step review gate (edge cases → security → architecture → code quality) |
| T10 | Pre-commit + 5-breakpoint screenshots × 4 types × 3 steps + commit |

## 13. Definition of Done

Standard E5.X DoD inherited from the cross-cutting quality contract. Plus: TipTap markdown roundtrip is idempotent (write → save → reload → re-edit produces the same markdown).
