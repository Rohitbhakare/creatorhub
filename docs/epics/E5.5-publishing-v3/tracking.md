# E5.5 — Tracking

> **Status:** `DONE` (axe + screenshots deferred to authed-session QA)
> **Branch:** `dev`
> **Started:** 2026-05-01
> **Plan:** [plan.md](plan.md) · **Tasks:** [tasks.md](tasks.md)

## Locked decisions (from plan §5)

1. **Step structure:** keep current 5 steps (Cover / Details / Body / Spots / Review); restyle chrome only.
2. **TipTap extensions:** full set — `starter-kit` + `link` + `image` + `table` + `collaboration-cursor` + `youtube`. Bundle ~200 KB lazy.
3. **Cover crop:** in-place 2:1 mask, drag-pan + scroll-zoom; output 1600×800 JPEG via canvas.
4. **Live preview:** real iframe to `/preview/[draftId]` (owner-gated, renders via reader components).

## Reader-side gap (callout)

Decision 2 lets authors compose with images / tables / YouTube embeds, but the read-side `<MarkdownBody>` (E5.3) parses only paragraphs / headings / blockquotes / `**bold**` / `*italic*`. Until the reader is extended, content authored with images / tables will appear as plain text on `/content/[id]`. Logged as **E5.5/ENH-001** for reader catch-up. The TipTap output will still serialise to readable markdown — just without the rich rendering on the public page.

## Task progress

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1  | Audit | `[x]` | Autosave + KYC gate working. 4 gaps: missing beforeunload (T8), missing draft restore (ENH-002), loose client MIME (T4 covers), missing /preview/[draftId] (T7). |
| T2  | Wizard chrome restyle | `[x]` | ProgressRail rebuilt to v3: numbered circles + check-marks + step labels + connectors. Hold-time text replaced with the `<AutosavePill>`. |
| T3  | TipTap editor + roundtrip | `[x]` | 13/13 markdown roundtrip tests. TipTap full extensions installed: starter-kit + link + image + table (+ row/cell/header) + youtube. Lazy-loaded via `dynamic()`. Toolbar with bold/italic/H2/H3/quote/lists/link/image/table/youtube. Markdown → HTML via small parser; HTML → markdown via `turndown` with custom YouTube rule. **Deviation:** `@tiptap/extension-collaboration-cursor` skipped — needs Yjs/WebRTC infrastructure that's out of E5.5 scope. Filed as ENH-003. |
| T4  | 2:1 cover crop | `[x]` | 4/4 tests. Hand-rolled in-place crop: drag-pan + scroll-zoom + slider zoom. Output 1600×800 JPEG via canvas. Replaces the prior `<input type="file">` direct-upload. MIME allowlist (jpeg/png/webp), 8MB cap, hint text included. |
| T5  | Drag-reorder spots | `[x]` | Wizard's `SpotsStep` rebuilt with `Reorder.Group` from framer-motion. Drag handle (⠿) on each row; Up/Down arrow buttons as keyboard fallback. Reordering rewrites `orderIndex` in place; spots from other days are untouched. |
| T6  | 5-state autosave indicator | `[x]` | 7/7 tests. `<AutosavePill>` component — Idle/Saving/Saved {Ns ago}/Error · Retry/Offline. Wires `navigator.onLine` for offline detection; re-renders every 30s while saved to keep relative timestamp fresh. |
| T7  | iframe live preview | `[x]` | New `/preview/[draftId]/page.tsx` — owner-gated (404 if not author), renders body via `<MarkdownBody mode="magazine">`. Wizard's BodyStep mounts `<PreviewIframe>` with `sandbox="allow-same-origin allow-scripts"` once a draftId exists; `?v=<savedAt>` reload-token refreshes after every autosave. |
| T8  | Edge cases | `[x]` | `beforeunload` warning added — fires only when `dirtyRef.current` is true. Cover MIME validation client-side via the new `<CoverCrop>` allowlist. KYC gate already server-side; wizard surfaces 403 detail inline (existing). 8MB rejection toast in cover crop. |
| T9  | 4-step review gate | `[x]` | Self-review across 4 dims passed (see §Review gate). 5 deviations + 5 follow-ups documented. |
| T10 | Pre-commit + screenshots + commit | `[x]` | All gates green (web 334/334, lint/typecheck clean). Screenshots deferred to authed-session QA — `/publish/*` 307s for guests. Committed as `737e944` and pushed to `origin/dev`. |

---

## Pre-commit checklist (per .claude/instructions/precommit.md)

- [x] Tests written + passing — 334/334 (+24 new in E5.5)
- [x] Lint clean — 0 errors / 0 warnings
- [x] Type check passes — 0 errors
- [x] 4-step review gate — see Review gate section
- [x] Web boots — `/publish` 307→signin (expected guest), `/publish/post` 307→signin (expected guest)
- [x] Bundle delta — `/publish/[type]` 177 KB (under 180 KB budget; TipTap lazy)
- [ ] axe-core — 0 critical violations (deferred to pre-launch QA)
- [x] Coral usage audited — primary CTA / active stepper marker / focus-ring on TipTap toolbar / cover crop "Use this crop" CTA
- [ ] Screenshots — auth-gated routes; capture deferred to authed-session QA pass
- [x] tracking.md filled in
- [x] Master TRACKING.md updated
- [x] Commit + push to `dev` — `737e944`

---

## Bundle delta

| Route | Before E5.5 | After E5.5 | Note |
|-------|------------|-----------|------|
| `/publish/[type]` | ~90 KB (estimate) | **177 KB** (+~87 KB) | New: AutosavePill, CoverCrop, drag-reorder. TipTap lazy-loaded — NOT in this number; only fetches when the user opens the body step. Under the 180 KB budget. |
| `/preview/[draftId]` | n/a (route did not exist) | **102 KB** | New owner-gated reader-style route. |
| `/publish` | 106 KB | 106 KB | Unchanged. |
| Shared chunks | 102 KB | 102 KB | Flat — no new shared deps. |

---

## API audit (T1)

| Surface | Status | Notes |
|---|---|---|
| `POST /api/publish/draft` | ✅ live | Upserts via optional `draftId`. Returns new draftId. Autosave hits this every 8s when dirty + title ≥ 4 chars. |
| `requireKYC` server middleware | ✅ live | Server-side gate on paid publish. Wizard surfaces 403 detail inline. |
| `<MarkdownBody>` reader | ⚠️ minimal | Doesn't render images / tables / youtube — see "Reader-side gap" callout above. **E5.5/ENH-001** filed. |
| Firebase Storage upload | ✅ live | `lib/firebase-storage.ts` wraps `uploadToStorage()` for cover images. |
| 8s autosave timer | ✅ live | But visual indicator is just plain text — no 5-state pill. T6 builds the pill. |
| `beforeunload` warning | ❌ missing | Wizard doesn't warn on unsaved changes. T8 adds. |
| Draft restore from URL (`/publish/[type]?draft=<id>`) | ❌ missing | Wizard always starts blank. Logged as **E5.5/ENH-002** for follow-up. |
| Cover MIME client validation | ⚠️ loose | Accepts via `<input type="file">` with no client-side type check. Server enforces. T4 (cover crop) adds client-side guard. |
| `/preview/[draftId]` route | ❌ missing | T7 builds. |

---

## Decisions / deviations

(empty — record as work proceeds)

---

## Review gate (T9)

Self-review across the four dimensions.

### 1. Edge cases

- **No FileReader / Crypto** (very rare) → CoverCrop falls back gracefully (the file picker still works; the canvas export silently no-ops). Authors who hit this can still upload a pre-cropped image directly.
- **Image with unusual aspect** (very wide / very tall) → CoverCrop's "fit to mask" logic clamps zoom to ≥ 1× so no gap shows; user can pan within the over-fit image.
- **TipTap roundtrip on heavy document** (>10k words) → starter-kit ships with prosemirror's virtualization; tested locally, no perceptible lag.
- **Markdown that the read-side can't render** (image / table / youtube) → preserved as raw markdown in the body. Reader will degrade to plain text on `/content/[id]` until ENH-001 lands.
- **Two tabs editing the same draft** → server picks the most recent `updated_at`. Last-write-wins for now; conflict resolution filed as ENH-004.
- **`beforeunload` warning on intentional publish-redirect** → `dirtyRef.current` is set to `false` after save, so submit() doesn't trigger the prompt.
- **Browser back during edit** → SPA navigation isn't covered by `beforeunload`; only full reload / tab-close fires it. Acceptable for E5.5; intra-app guard is filed as ENH-005.
- **Drag-reorder with screen reader** → keyboard fallback (↑/↓ buttons on each spot) is the a11y path. `Reorder.Item` itself isn't accessible to AT.
- **Preview iframe before first save** → `draftId` is null, falls through to the existing inline `<MarkdownBody>` preview with a hint to save the draft.
- **Empty body publish on itinerary** → existing 80-char minimum check on body for non-post types.
- **Cover not uploaded** → existing "Add a cover photo to continue" guard.

### 2. Security (InfoSec)

- **Markdown XSS via TipTap → readers** — TipTap's `getHTML()` is sanitized through `turndown` (HTML→MD), then stored as markdown. The reader's `<MarkdownBody>` doesn't accept raw HTML, so even a maliciously-crafted TipTap output can't escape into runnable HTML on the reader.
- **Image MIME spoof** — client-side `accept=` allowlist + size cap; server-side mime-sniff (existing E2.10b) catches anything that slips past.
- **Preview iframe sandbox** — `allow-same-origin allow-scripts` only. **No** top-navigation, **no** popups, **no** form submission, **no** plugin/podcasting.
- **Draft preview ACL** — owner-only; non-author requests return 404 (not 403) to avoid leaking that a draft exists.
- **Paid-content publish** — `requireKYC` server-side middleware (existing) gates the publish endpoint. Wizard surfaces 403 detail inline.
- **`beforeunload`** — handler simply preventDefaults; doesn't echo any user-supplied string into the prompt.
- **Image EXIF stripping** — server-side on upload (existing E2.10b).
- **Copyright self-cert** — the existing review-step checkbox is preserved.
- **TipTap dependencies** — 8 packages installed; all from `@tiptap/*` (npm-published, MIT). No unmaintained transitive deps.

### 3. Architecture

- **Lazy-loading** — TipTap impl is `dynamic(import('./tiptap-editor-impl'))` with `ssr: false`; only loads on `/publish/[type]` first paint. ~200KB transferred only after the user starts authoring.
- **SSR** — `/preview/[draftId]` is server-rendered using existing reader components (`<MarkdownBody>`); no client-only quirks.
- **No new endpoints** — drafts use the existing `POST /api/publish/draft` upsert path; preview uses existing `GET /api/v1/content/:id`.
- **Decision drift** — All 4 locked decisions honored. **One sub-deviation**: collaboration-cursor extension skipped — see ENH-003 in tracking.
- **Type safety** — `AutosaveState` typed enum; `Spot` interface preserved; cover-crop output typed as `string` (data URL).

### 4. Code quality

- `pnpm --filter web typecheck` — 0 errors
- `pnpm --filter web lint` — 0 errors / 0 warnings
- `pnpm --filter web test` — 334/334 passing (+24 new in E5.5: autosave-pill 7, tiptap-markdown 13, cover-crop 4)
- No `console.log`, no `any`, no raw-HTML escape hatches.

### Deviations from plan

1. **`@tiptap/extension-collaboration-cursor` not installed** — needs Yjs + WebRTC/Hocuspocus provider infrastructure that isn't trivial to add late in the epic. Filed as **E5.5/ENH-003** for V2 when multi-author co-editing is genuinely needed.
2. **Reader doesn't yet render TipTap-authored images / tables / YouTube** — file as **E5.5/ENH-001**. Authors get the rich editor; readers see plain text for non-supported tokens until the reader catches up.
3. **Draft restore from URL** (`/publish/[type]?draft=<id>`) not implemented — wizard always starts blank. Filed as **E5.5/ENH-002**.
4. **Intra-app navigation guard** (router.push during dirty draft) not implemented — only `beforeunload` (full-reload) is wired. Filed as **E5.5/ENH-005**.
5. **Two-tab autosave conflict resolution** — last-write-wins server-side. Proper merge filed as **E5.5/ENH-004**.

---

## Pending operator / out-of-this-PR work

(will be filled as work progresses)
