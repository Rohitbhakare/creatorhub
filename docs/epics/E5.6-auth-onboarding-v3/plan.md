# E5.6 — Auth + Onboarding v3 (W1 → W5)

> **Series:** Seventh epic in the M2.5 Web v3 Parity series. Depends on E5.0 (Foundation).
> **Goal:** 3-tab signup (Email / Phone / Google) with v3 chrome, polished onboarding (Welcome burst → City → Interests), verified magic-link reset.
> **SRS refs:** WEB-AUTH-FR-014..022
> **Wireframes:** [docs/01_wireframes/v3/project/pack-w-onboarding.jsx](docs/01_wireframes/v3/project/pack-w-onboarding.jsx)
> **Master plan:** [`/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md`](/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md)

---

## 1. Overview

The auth surface is **substantially built already**:

- `signin-form.tsx` (401 LOC) — Firebase phone OTP + Google OAuth, with E.164 normalization, OTP-mode swap, and CSRF-safe POST to `/api/auth/signin`
- `forgot-form.tsx` (167 LOC) — magic-link password reset via Firebase, client-side rate limit (3/hr per email in localStorage)
- Onboarding 3-step (`/onboarding/welcome` → `/city` → `/sub-categories`) with `<WelcomeBurst>` 80-particle framer-motion confetti
- API: `apps/api/src/routes/auth.routes.ts` + `auth.service.ts` exchange Firebase ID tokens for backend session cookies

**What's missing vs v3 + SRS** (the sharpest gap is email+password):

1. **Email+password sign-in** (FR-014) — current signin has only Phone + Google. SRS calls for a 3-tab signup with Email as the primary path.
2. **3-tab tab UI** — current form switches mode internally; v3 wants explicit Email / Phone / Google tabs above the form.
3. **v3 chrome on welcome** — current `/onboarding/welcome` is a centred card; v3 W1 is a full-bleed hero.
4. **Server-side phone OTP rate limit** (3/hr per phone, account lockout after 5 fails) — server-side enforcement TBD.
5. **Login-from-new-device email notification** (security, FR-022) — TBD.
6. **Polish on chrome across signin / signup / forgot-password / onboarding** to match v3.

## 2. SRS Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| WEB-AUTH-FR-014 | 3-tab signup (Email+password / Google / Phone) | **New (Email tab)** + restructure |
| WEB-AUTH-FR-015 | Email+password validation + breach-list check | **New** |
| WEB-AUTH-FR-016 | Google OAuth via Firebase (with state validation) | Existing — verify state validation |
| WEB-AUTH-FR-017 | Phone OTP fallback (Firebase + reCAPTCHA) | Existing |
| WEB-AUTH-FR-018 | Session middleware refresh (existing-mutex pattern) | Existing |
| WEB-AUTH-FR-019 | Logout / session-end | Existing |
| WEB-AUTH-FR-020 | Magic-link password reset | Existing — verify polish |
| WEB-AUTH-FR-021 | CSRF on auth POSTs (double-submit + Origin) | Existing (E5.0 middleware) |
| WEB-AUTH-FR-022 | Onboarding celebration spring (200-particle confetti) | Existing — bump 80→200 |

## 3. Wireframes Referenced

| File | Use |
|---|---|
| [docs/01_wireframes/v3/project/pack-w-onboarding.jsx](docs/01_wireframes/v3/project/pack-w-onboarding.jsx) | W1 Welcome (lines 18–102), W2 Phone (104–168), W3 OTP (170–219), W4 Location (221–310), W5 Interests (image-tile grid 312+) |
| Standalone HTML — section "W · Web — onboarding & auth" | Visual cross-check |

## 4. Dependencies

| Dependency | Status | What we use |
|---|---|---|
| E5.0 Web Foundation | DONE | CSRF middleware, motion library, `<ToastRegion>` |
| Existing Firebase wrapper (`lib/firebase-client.ts`) | — | `signInWithGoogle`, `verifyPhoneOtp`, `sendPasswordReset` |
| Existing API auth routes | — | `/api/auth/signin` exchanges Firebase ID token for session cookies |
| Firebase Auth | — | Email+password sign-in needs `signInWithEmailAndPassword` + `createUserWithEmailAndPassword` from `firebase/auth` |

## 5. Architecture Decisions — OPEN QUESTIONS

### Decision 1 — Email+password vs magic-link as the primary email path

**SRS FR-014** says "3-tab signup (Email+password / Google / Phone)" — so Email+password explicitly. But many modern apps prefer magic-link only.

| Option | Path | Trade-off |
|---|---|---|
| **A. Email+password as the primary email path (recommended)** | New users sign up with email + password. Firebase's `createUserWithEmailAndPassword` handles password hashing + breach-list (we wire `haveibeenpwned` integration as a follow-up if not done already). Returning users sign in with the same. | Honors FR-014 literally. Familiar UX. Adds password-recovery surface area. |
| **B. Magic-link only** | Email tab sends a magic-link; user clicks; signed in. No password ever. | Lower auth-friction. Doesn't match FR-014. |
| **C. Both** (password OR magic-link in a single email tab) | Default to password; "Forgot? Use magic-link instead" reveals the magic-link path. | Most flexibility, most code. |

**Recommended: A** — SRS is explicit, and password is the most familiar UX. Magic-link ALREADY exists at `/forgot-password` for resets.

### Decision 2 — Tab UI: above-form pills vs separate routes

**v3 wireframe** shows a single auth screen with input shifted by mode.

| Option | Layout | Trade-off |
|---|---|---|
| **A. Pill row above the form (recommended)** | Three coral-tinted pills — Email / Phone / Google — pinned above the input area. Click swaps the form below. Single page, single URL. | Matches v3. Single component to test. Fast. |
| **B. Separate routes** (`/signin/email`, `/signin/phone`, `/signin/google`) | One route per method. SEO-segregated. | More chrome variation; cross-method handoff (`?prefill=email`) gets messy. |
| **C. Single composite form** (no tabs; show all methods at once) | All three methods stacked. | Visually cluttered for the primary flow. |

**Recommended: A.**

### Decision 3 — Welcome burst particle count

SRS FR-022 calls for 200-particle confetti spring. Current `<WelcomeBurst>` runs 80.

| Option | Count | Trade-off |
|---|---|---|
| **A. Bump to 200 framer-motion particles (recommended)** | Match SRS literally. Keep the existing reduced-motion fallback. | Honors spec. ~120 extra `<motion.div>` elements at peak; performance acceptable on mid-tier laptops. |
| **B. Stay at 80** | Keep what we have; SRS is interpretive. | Doesn't honor SRS literal. |
| **C. Switch to canvas-confetti (E5.4 stack)** | Reuse the `canvas-confetti` library that E5.4 added; cheaper / better physics. | New code path, but consistent with the booking confirmation animation. |

**Recommended: A** — pure framer-motion keeps the rendering inside React, which means the burst respects layout / theme without leaking into a global canvas. C is also acceptable.

### Decision 4 — Login-from-new-device email notification

**SRS FR-022** mentions "login-from-new-device email notification" as a security measure.

| Option | Implementation | Trade-off |
|---|---|---|
| **A. Server-side fingerprint + email send (recommended)** | API records `(userId, fingerprintHash)` per session create; if hash is unrecognised, queues a SendGrid template email "New device signed in". Fingerprint hash combines IP-prefix + UA-hash. | Honors FR. Needs SendGrid wired (already in M2 plan). |
| **B. Defer to V2** | Skip for E5.6. | Cheapest. Misses FR. |

**Recommended: B for E5.6** — SendGrid integration is a separate deferred-to-M2 item per CLAUDE.md ("Pending creds: ... SendGrid"). File as ENH so we don't lose it.

### Other decisions (no user input needed)

| Decision | Choice | Rationale |
|---|---|---|
| Email validation client-side | RFC-5322-lite regex + length cap 254 | Minimal — server-side Firebase enforces real validity |
| Password minimum | 8 chars + at least 1 letter + 1 number; client-side check | Firebase's default is 6; we tighten |
| Generic error messages | "If that email exists, we sent a link" | No email enumeration on forgot-password |
| Welcome chrome | Full-bleed hero per v3 W1; existing `<WelcomeBurst>` mounts on top | v3 spec |

## 6. Database

No DB changes for E5.6. Firebase handles password hashing; backend `users` table already has `email` column.

## 7. API Contract

No new endpoints. Existing `POST /api/auth/signin` accepts Firebase ID token from any provider (email / Google / phone). Server doesn't care which provider issued it.

## 8. Test Plan

| Layer | Coverage |
|---|---|
| Unit | `<EmailTab>` (form validation, password strength), `<TabBar>` (tab switching), `<WelcomeBurst>` particle count props. ~12 new tests. |
| Integration | OAuth state mismatch (CSRF rejection); OTP rate-limit (3/hr); magic-link single-use (existing). |
| SSR | `/signin`, `/signup`, `/forgot-password`, `/onboarding/welcome|city|sub-categories` all render for guest. |
| A11y | Tab through Email / Phone / Google pills via Tab key + Arrow key (within `role="tablist"`); each form keyboard-submittable; password input has visible-toggle. |
| Visual | 5-breakpoint screenshots × 4 routes (signin / signup / forgot / welcome). |

## 9. Edge Cases

- **OAuth state mismatch** — Firebase handles internally; server validates ID token signature.
- **OTP retry abuse** — server-side 3/hr rate limit (defer to ENH if not in place).
- **Password ≤ 7 chars** — client-side blocks, server fallback.
- **Email already exists** (signup) — generic "If that email exists..." or specific "An account exists — sign in"? We pick generic to avoid enumeration on signup.
- **Magic-link expired / single-use** — Firebase handles single-use server-side; UI shows "Link expired, try again".
- **Phone OTP delivered SMS provider down** — toast "Couldn't send. Try email instead?"
- **User on `noscript`** — server-rendered fallback message asking to enable JS.
- **Session refresh race (two tabs)** — existing mutex pattern in `api-client.ts`.
- **Welcome burst on slow CPU** — reduced-motion fallback already in `<WelcomeBurst>`.
- **Onboarding skipped midway** — sub-categories step is optional; we save partial state.

## 10. InfoSec Review

| Concern | Mitigation |
|---|---|
| CSRF on POST /api/auth/signin | E5.0 middleware enforces double-submit + Origin check |
| Email enumeration (signup vs signin) | Generic "we sent an email" copy |
| Password strength | Client-side gate ≥ 8 chars + 1 letter + 1 number; server (Firebase) defaults |
| Breach-list check (haveibeenpwned) | Defer to ENH |
| OTP brute-force | Account lockout after 5 fails / 1h timeout (server-side; defer to ENH if not yet in place) |
| Magic-link single-use | Firebase server enforces |
| New-device email | Defer to ENH (SendGrid not wired) |
| Session cookie attrs | httpOnly / Secure / SameSite=Lax / 30-day rolling (existing E5.0) |
| Login audit log | API records `auth_audit_events` (existing E2.6) |
| Onboarding consent capture | Existing — we don't change the consent surface |

## 11. Governance

- **DPDPA** — consent capture at signup with terms+privacy version pinning (existing).
- **Audit logs** — login, password change, OAuth link, magic-link issued (existing).
- **Account deletion** — 14-day soft-delete (existing FR-083).

## 12. Tasks

| ID | Task |
|----|------|
| T1 | Audit (already done in plan §1) — verify CSRF on `/api/auth/signin`, OTP rate-limit, magic-link single-use, audit log emission |
| T2 | `<TabBar>` + restructure `<SignInForm>` into 3 tabs (Email / Phone / Google), preserving existing phone+Google paths |
| T3 | Email+password tab — `<EmailTab>` with email + password inputs, sign-in vs signup mode, validation, Firebase wire-up |
| T4 | v3 welcome chrome — restyle `/onboarding/welcome` to full-bleed hero per W1 |
| T5 | Bump `<WelcomeBurst>` 80 → 200 particles per FR-022 |
| T6 | v3 chrome polish — signin / signup / forgot-password / onboarding city + sub-categories pages aligned to v3 |
| T7 | Edge cases — generic error copy, password-strength meter, sign-in vs signup mode toggle |
| T8 | 4-step review gate |
| T9 | Pre-commit + 5-breakpoint screenshots × 4 routes + commit |

## 13. Definition of Done

Standard E5.X DoD inherited from the cross-cutting quality contract.
