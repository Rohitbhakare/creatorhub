# CLAUDE.md — Admin (Next.js)

> Context for AI sessions working on the admin panel. Read `.claude/instructions/ui-ux.md` before writing any UI code.

## What This App Is

The internal operations console for CreatorHub. Ships at `admin.creatorhub.in` in prod. Only provisioned admin users (seeded via migration 018 + created via `POST /api/v1/admin/admins`) can log in.

## Stack

- **Framework:** Next.js 15 App Router (TypeScript, strict)
- **Styling:** Tailwind CSS v4 + Pure White/Coral tokens from `globals.css`
- **Auth:** Firebase email+password verified server-side by Hono; session is a signed JWT in an httpOnly cookie (`ch_admin_session`)
- **Data flow:** Browser → Next.js proxy (`/api/proxy/*`) → Hono API. First-party cookies only. Server components call Hono directly via `serverFetch()`.

## Auth model

- Middleware (`src/middleware.ts`) — edge runtime, cookie-presence check only. Redirects to `/login` if the cookie is missing.
- `AppShell` (`src/components/AppShell.tsx`) — server component wrapping every authenticated page. Loads the admin profile via `/auth/me` and redirects to `/change-password` if `must_change_password=true`.
- **Do not** trust JWT claims client-side. The API re-checks role + `is_active` on every request.

## Running locally

```bash
pnpm --filter admin dev   # port 3002
```

The admin app expects the Hono API at `$API_INTERNAL_URL` (defaults to `http://localhost:3001`).

## File layout

```
src/
├── middleware.ts                 # edge cookie gate
├── app/
│   ├── layout.tsx                # root layout (Inter + globals)
│   ├── globals.css               # design tokens
│   ├── page.tsx                  # dashboard (placeholder)
│   ├── login/page.tsx
│   ├── change-password/page.tsx
│   └── api/proxy/[...path]/      # catch-all proxy to Hono
├── components/
│   ├── AppShell.tsx              # server — auth + shell
│   ├── Sidebar.tsx               # server — role-scoped nav
│   ├── TopBar.tsx                # client — logout
│   ├── LoginForm.tsx             # client
│   └── ChangePasswordForm.tsx    # client
└── lib/
    ├── env.ts                    # API_INTERNAL_URL, cookie name
    ├── types.ts                  # AdminProfile, envelopes
    ├── server-api.ts             # SSR fetch (forwards cookie)
    ├── api.ts                    # browser fetch (via proxy)
    ├── session.ts                # getCurrentAdmin()
    └── rbac.ts                   # NAV groups + visibleNav()
```

## Conventions

- Every mutation confirms in a modal before firing. Destructive actions (suspend, takedown, force release) require an explicit reason string.
- Render role badges via `roleColor(role)` + `roleLabel(role)` — never hard-code.
- Never import Firebase Admin here. Admin auth flows through the Hono API.
- Never set cookies from Next.js. The proxy relays Set-Cookie from Hono verbatim.
