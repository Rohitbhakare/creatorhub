# E4.1 — Admin panel deploy runbook

> Everything in this file requires `fly` CLI + founder's Fly.io + domain
> registrar access. Claude authors the configs; the founder runs these
> commands.

## Prereqs

- `fly auth login` — authenticated as the CreatorHub org owner
- The API is already deployed at `creatorhub-api.fly.dev` (T22 scope is
  the admin app; the API was deployed earlier)
- DNS registrar access for `creatorhub.in`

## Files already authored

- [apps/admin/Dockerfile](../../../apps/admin/Dockerfile) — multi-stage,
  uses Next.js standalone output
- [apps/admin/fly.toml](../../../apps/admin/fly.toml) — app
  `creatorhub-admin`, `bom` region, `shared-cpu-1x / 512mb`
- [apps/admin/.dockerignore](../../../apps/admin/.dockerignore)
- [apps/admin/src/app/healthz/route.ts](../../../apps/admin/src/app/healthz/route.ts)
  — lightweight 200 endpoint (excluded from auth middleware so Fly's
  check doesn't 307 to /login)

## Deploy steps (founder)

Run everything from the **repo root** so the Docker build context picks
up `pnpm-workspace.yaml` + `packages/shared`.

### 1. Create the app (once)

```sh
fly launch \
  --config apps/admin/fly.toml \
  --dockerfile apps/admin/Dockerfile \
  --no-deploy \
  --copy-config \
  --name creatorhub-admin \
  --region bom
```

Answer `no` to "Would you like to set up a Postgres/Redis" — the admin
app talks only to the API.

### 2. Set secrets

```sh
# Session JWT secret (generate with: openssl rand -base64 64)
fly secrets set ADMIN_SESSION_SECRET='<64-byte random>' \
  --app creatorhub-admin

# Pointer to the Hono API (use the public URL for simplicity; switch
# to 6PN private address later if we want to take the admin off public
# API exposure)
fly secrets set API_INTERNAL_URL='https://creatorhub-api.fly.dev' \
  --app creatorhub-admin

# Firebase admin credential — same JSON blob as the API uses. Paste
# the full JSON as a single-line string.
fly secrets set FIREBASE_ADMIN_CREDENTIAL='<paste service-account JSON>' \
  --app creatorhub-admin
```

Verify: `fly secrets list --app creatorhub-admin` — three secrets
present, none logged in plaintext.

### 3. Deploy

```sh
fly deploy --config apps/admin/fly.toml --dockerfile apps/admin/Dockerfile
```

First build takes ~3-5 min (pnpm install + Next build). Subsequent
deploys are faster due to Docker layer cache.

### 4. Verify the fly.dev URL works

```sh
curl -fsS https://creatorhub-admin.fly.dev/healthz
# → ok

curl -I https://creatorhub-admin.fly.dev/
# → 307 to /login (unauthenticated — expected)
```

Visit `https://creatorhub-admin.fly.dev/login` in a browser and sign in
as `rohitbhakare@gmail.com` (seeded in migration 018).

### 5. Attach custom domain

```sh
fly certs add admin.creatorhub.in --app creatorhub-admin
```

Copy the CNAME target Fly returns (usually
`creatorhub-admin.fly.dev`). At your DNS registrar:

```
admin.creatorhub.in.  CNAME  creatorhub-admin.fly.dev.
```

Wait for DNS propagation (usually <10 min). Then:

```sh
fly certs show admin.creatorhub.in --app creatorhub-admin
```

Should show `Issued` once LE issues the cert (2-10 min after CNAME
propagates).

### 6. Smoke test prod

- Visit `https://admin.creatorhub.in` → 307 to `/login` → sign in
- Dashboard loads with stat tiles populated from prod data
- Navigate through: Users / KYC / Moderation / Payouts / Refunds /
  Editorial / Analytics / Audit / Admins — no 500s, no 403s for
  super_admin
- Provision a test admin from `/admins` with role=support; sign out,
  sign in as them, confirm role-scoped nav (no `/admins` link, no
  `/payouts` link)

### 7. Record in tracking

Mark T22 `[x] Done` in
[tracking.md](tracking.md) with the
deploy date, the Fly.io `creatorhub-admin` app URL, and the certs
issued timestamp.

## Rollback

```sh
fly releases --app creatorhub-admin        # find the previous version
fly releases rollback <n> --app creatorhub-admin
```

Or redeploy a prior commit:

```sh
git checkout <prior-sha>
fly deploy --config apps/admin/fly.toml --dockerfile apps/admin/Dockerfile
git checkout dev
```

## Operational notes

- **Session cookie scope:** `ch_admin_session` is `HttpOnly`,
  `SameSite=Strict`, `Secure`. The cookie is set from the Hono API
  (`creatorhub-api.fly.dev`) and surfaces as first-party through the
  Next.js `/api/proxy` route on `admin.creatorhub.in`. No cross-site
  cookie is needed.
- **Log retention:** `fly logs --app creatorhub-admin` streams stdout
  only; Sentry captures exceptions. No persistent log store yet —
  revisit after launch.
- **Scaling:** Admin traffic is tiny (single-digit concurrent users).
  The `min_machines_running=1` config is intentional so we can wake
  without cold-start latency during an incident.
- **Secret rotation:** `fly secrets set ADMIN_SESSION_SECRET=...` ← any
  rotation invalidates all live sessions (everyone re-logs in). Do this
  if a secret leaks or quarterly at minimum.
