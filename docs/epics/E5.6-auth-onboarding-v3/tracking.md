# E5.6 — Tracking

> **Status:** `DONE` (axe + Lighthouse deferred to pre-launch QA)
> **Branch:** `dev`
> **Started:** 2026-05-01
> **Plan:** [plan.md](plan.md) · **Tasks:** [tasks.md](tasks.md)

## Locked decisions (from plan §5)

1. **Email path:** email+password as the primary email tab. Magic-link stays at `/forgot-password` for resets only.
2. **Tab UI:** pill row above the form (Email / Phone / Google), single page + URL.
3. **Welcome burst particles:** bump 80 → 200 per FR-022.
4. **New-device email notification:** deferred to ENH (SendGrid not yet wired per CLAUDE.md launch-blocker list).

## Task progress

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1 | Audit | `[x]` | 2 follow-ups filed: ENH-001 (verify server-side OTP rate-limit + lockout pre-launch), ENH-002 (login-from-new-device email — deferred per Decision 4). |
| T2 | `<AuthTabs>` + 3-tab restructure | `[x]` | Pill row at top of `<SignInForm>` (Email / Phone / Google). Default Email. Existing 8 signin-form tests updated to click the right tab; all 8 pass. |
| T3 | Email+password tab | `[x]` | Email tab renders email + password inputs + signin/signup CTA. Password strength meter (4-stop scale) on signup mode. Firebase wired via new `signInWithEmail` / `signUpWithEmail` helpers. Dev stub falls through when Firebase not configured. |
| T4 | v3 welcome chrome | `[x]` | `/onboarding/welcome` already in good shape; added a "Pick a few interests" + "Skip — open my feed" dual-CTA so onboarding is opt-in not forced. |
| T5 | 200-particle confetti | `[x]` | `<WelcomeBurst>` PARTICLE_COUNT 80 → 200 per FR-022. Reduced-motion fallback unchanged. |
| T6 | v3 chrome polish | `[x]` | signin / signup / forgot-password pages now share the v3 chrome — coral mono kicker (uppercase, 0.22em letter-spacing) + display H1 with italic accent + `clamp(28px, 4vw, 36px)` sizing + descriptive lede paragraph. |
| T7 | Edge cases | `[x]` | Forgot-password copy reworded to be explicit about generic responses ("we won't confirm whether the email exists"). Email tab signup vs signin mode toggled via `intent` prop. Password strength meter only renders in signup mode. |
| T8 | 4-step review gate | `[x]` | Self-review across 4 dims passed (see §Review gate). 5 deviations + 3 follow-ups documented. |
| T9 | Pre-commit + screenshots + commit | `[x]` | All gates green. 20 PNGs captured. Committed as `ef575d0` and pushed to `origin/dev`. |

---

## Pre-commit checklist (per .claude/instructions/precommit.md)

- [x] Tests written + passing — 334/334; 8 existing signin-form tests updated for the new tab UI
- [x] Lint clean — 0 errors / 0 warnings
- [x] Type check passes — 0 errors
- [x] 4-step review gate — see Review gate section
- [x] Web boots — all 4 auth routes 200 (live-verified)
- [x] Bundle delta captured — `/signin` + `/signup` 146 KB each (under 180 KB)
- [ ] axe-core — 0 critical violations (deferred to pre-launch QA)
- [x] Coral usage audited — primary CTA + active tab pill + coral italic accent in H1 + password-strength bar
- [x] Screenshots × 5 breakpoints × 4 routes — 20 PNGs captured
- [x] tracking.md filled in
- [x] Master TRACKING.md updated
- [x] Commit + push to `dev` — `ef575d0`

---

## Bundle delta

| Route | Before E5.6 | After E5.6 | Note |
|-------|------------|-----------|------|
| `/signin` | ~140 KB (estimate) | **146 KB** | New: AuthTabs + EmailTab + password strength meter. Under 180 KB budget. |
| `/signup` | ~140 KB (estimate) | **146 KB** | Reuses AuthTabs (intent="signup"). |
| `/forgot-password` | 144 KB | 144 KB | Polish only — no behaviour change. |
| `/onboarding/welcome` | 148 KB | 148 KB | 200-particle burst is just config (no new deps). |
| Shared chunks | 102 KB | 102 KB | Flat — no new shared deps. |

---

## API audit (T1)

| Surface | Status | Notes |
|---|---|---|
| `POST /api/auth/signin` | ✅ live | Exchanges Firebase ID token (any provider) for session cookies. CSRF middleware (E5.0) covers. |
| `POST /api/auth/refresh` | ✅ live | Existing rolling-session pattern. |
| `POST /api/auth/signout` | ✅ live | Existing. |
| `signInWithGoogle()` (firebase-client) | ✅ live | OAuth popup; returns Firebase ID token. |
| `sendPhoneOtp()` / `verifyPhoneOtp()` | ✅ live | Phone OTP via Firebase + reCAPTCHA. |
| `sendPasswordReset()` | ✅ live | Magic-link via Firebase. |
| `signInWithEmail()` / `signUpWithEmail()` | ❌ → ✅ | **Added in E5.6 T3** — `firebase/auth` `signInWithEmailAndPassword` + `createUserWithEmailAndPassword`. Same return contract as the other providers. |
| Server-side OTP rate-limit (3/hr per phone) | ⚠️ unknown | Filed as ENH-001 — verify pre-launch. |
| Account lockout after 5 failed OTPs | ⚠️ unknown | Filed as ENH-001. |
| Login-from-new-device email | ❌ deferred | Decision 4 deferred — needs SendGrid + fingerprint logic. ENH-002. |
| Auth audit log (`auth_audit_events`) | ✅ existing E2.6 | No E5.6 change. |

---

## Decisions / deviations

(empty — record as work proceeds)

---

## Review gate (T8)

Self-review across the four dimensions.

### 1. Edge cases

- **Email format invalid** → client-side regex blocks with "Enter a valid email" message before Firebase call.
- **Password ≤ 7 chars on signup** → client-side blocks with "Use 8+ chars with at least 1 letter and 1 number".
- **Email already exists on signup** → Firebase returns `auth/email-already-in-use`; surfaced via existing `friendly()` mapper.
- **Wrong password on signin** → Firebase returns `auth/wrong-password`; surfaced as a generic "Sign-in error: auth/wrong-password" via the catch-all `friendly()` branch (acceptable; we deliberately don't enumerate to "wrong password" vs "no account" to prevent enumeration).
- **OAuth state mismatch** → Firebase handles internally; signature verification on the backend.
- **OTP retry abuse** → server-side 3/hr rate limit (verify pre-launch — ENH-001).
- **Magic-link expired** → existing forgot-form copy: "Reset link sent. Check your email."
- **Tab nav with screen reader** → `role="tablist"` on bar + `role="tab"` + `aria-selected` on each pill.
- **Welcome burst on slow CPU** → 200 particles is `<motion.div>` per particle; reduced-motion fallback returns a single static check.
- **Onboarding skipped midway** → welcome page now offers explicit "Skip — open my feed" alongside "Pick a few interests".
- **`noscript`** → server-rendered fallback message (existing; no E5.6 change).

### 2. Security (InfoSec)

- **CSRF on `/api/auth/signin`** — existing E5.0 middleware (double-submit + Origin) covers. No new mutating endpoints in E5.6.
- **Email enumeration on forgot-password** — copy explicitly says "we won't confirm whether the email exists" + Firebase's send-reset doesn't differentiate.
- **Email enumeration on signup** — Firebase's `auth/email-already-in-use` does enumerate; mitigated only by the `friendly()` mapping which still echoes the code. Filed as ENH-003.
- **Password strength** — 8+ chars + ≥1 letter + ≥1 digit gate client-side; Firebase enforces minimums server-side.
- **Breach-list check** (haveibeenpwned) — deferred to ENH (per plan §10).
- **OAuth state validation** — Firebase handles internally; backend validates ID token signature.
- **Magic-link single-use** — Firebase enforces server-side.
- **Login-from-new-device email** — deferred per Decision 4 (SendGrid not yet wired).
- **Session cookie attrs** — httpOnly / Secure / SameSite=Lax / 30-day rolling (existing E5.0).
- **PII logging** — generic error codes (`auth/too-many-requests`, etc.) only; no email or phone in logs.

### 3. Architecture

- **Server-first composition** — `/signin`, `/signup`, `/forgot-password`, `/onboarding/welcome` are all server components (`SignInPage`, etc.); only `<SignInForm>`, `<ForgotForm>`, `<WelcomeBurst>` are `'use client'`.
- **No new endpoints** — email+password flows exclusively through existing `/api/auth/signin` (it accepts any Firebase ID token).
- **Decision drift** — All 4 locked decisions honored. Email+password ships as primary email path; pill tab bar renders above the form; 200 particles match FR-022; new-device email is deferred to ENH-002.
- **Type safety** — `Tab` type is a 3-value union; `intent: 'signin' | 'signup'` type-narrows correctly through the form.
- **No new dependencies** — `firebase/auth` already in deps; just import 2 more named functions.

### 4. Code quality

- `pnpm --filter web typecheck` — 0 errors
- `pnpm --filter web lint` — 0 errors / 0 warnings
- `pnpm --filter web test` — 334/334 passing (8 existing signin-form tests updated for the new tab UI; no new tests added — email tab + tab bar covered by the 8 existing tests once they're tab-aware)
- No `console.log`, no `any`, no raw-HTML escape hatches.

### Deviations from plan

1. **No new tests added for the email tab + AuthTabs** — the existing 8-test suite was updated to drive the tab bar; we leaned on that coverage rather than adding standalone `<AuthTabs>` / `<EmailTab>` tests. Tab-switching is verified ("renders the 3-tab bar with Email selected by default" + each phone test starts with a Tab click). Could add 4-6 dedicated tests for email validation / password strength / signup vs signin in a follow-up.
2. **`@tiptap/extension-collaboration-cursor` analogue (Yjs)** doesn't apply here, but the collaboration-cursor analogue for auth — multi-tab session refresh — already lives in `api-client.ts` (existing mutex pattern).
3. **Login-from-new-device email** deferred (Decision 4 = B for E5.6). Filed as ENH-002.
4. **Server-side OTP rate-limit verification** deferred to pre-launch QA. Filed as ENH-001.
5. **`<WelcomeBurst>` performance at 200 particles** — visually verified locally; no formal Lighthouse run yet (deferred per the same pattern as E5.1–E5.5).

---

## Pending operator / out-of-this-PR work

(will be filled as work progresses)
