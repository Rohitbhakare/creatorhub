# E5.6 — Tasks

> 9 tasks. Decisions locked: email+password primary, pill tab bar, 200-particle confetti, new-device email deferred to ENH.

| ID | Task | Files touched (new in **bold**) |
|----|------|--------------------------------|
| T1 | Audit existing auth surface — confirm CSRF on `/api/auth/signin`, OTP rate-limit, magic-link single-use, audit-log emission. | — (read-only) |
| T2 | `<AuthTabs>` + restructure `<SignInForm>` into 3 tabs (Email / Phone / Google), preserving existing phone+Google paths. Tab state via `role="tablist"` + arrow-key nav. | **`apps/web/src/components/auth/auth-tabs.tsx`**, **`auth-tabs.test.tsx`**; [apps/web/src/app/signin/signin-form.tsx](apps/web/src/app/signin/signin-form.tsx) (refactor) |
| T3 | Email+password tab — `<EmailTab>` with email + password inputs, sign-in vs signup mode toggle, password strength meter, Firebase `signInWithEmailAndPassword` / `createUserWithEmailAndPassword` wire-up. | **`apps/web/src/components/auth/email-tab.tsx`**, **`email-tab.test.tsx`**; [apps/web/src/lib/firebase-client.ts](apps/web/src/lib/firebase-client.ts) (extend) |
| T4 | v3 welcome chrome — restyle `/onboarding/welcome` to full-bleed hero per W1 (top-aligned ink display title + coral italic accent + welcome burst + skip-to-feed link). | [apps/web/src/app/onboarding/welcome/page.tsx](apps/web/src/app/onboarding/welcome/page.tsx) |
| T5 | Bump `<WelcomeBurst>` 80 → 200 particles per FR-022. Reduced-motion fallback unchanged. | [apps/web/src/app/onboarding/welcome/welcome-burst.tsx](apps/web/src/app/onboarding/welcome/welcome-burst.tsx) |
| T6 | v3 chrome polish — signin / signup / forgot-password pages aligned to v3 (mono kicker + display H1 + tab bar + footer "or continue with…" rule). | [apps/web/src/app/signin/page.tsx](apps/web/src/app/signin/page.tsx), [apps/web/src/app/signup/page.tsx](apps/web/src/app/signup/page.tsx), [apps/web/src/app/forgot-password/page.tsx](apps/web/src/app/forgot-password/page.tsx) |
| T7 | Edge cases — generic error copy on forgot-password ("If that email exists, we sent a link"), password-strength meter, sign-in vs signup mode toggle on Email tab. | included in T3 + T6 |
| T8 | 4-step review gate (edge cases → security → architecture → code quality) | [docs/epics/E5.6-auth-onboarding-v3/tracking.md](docs/epics/E5.6-auth-onboarding-v3/tracking.md) |
| T9 | Pre-commit gate: typecheck + lint + tests + 5-breakpoint screenshots × 4 routes; commit + push to `dev` | — |
