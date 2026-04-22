# ─── Build stage ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Workspace skeleton — copy only what's needed to install + build admin.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/admin ./apps/admin

RUN pnpm install --frozen-lockfile

# Build Next.js in standalone mode (next.config.ts sets output='standalone').
# Standalone output produces apps/admin/.next/standalone with a minimal
# server.js and only the node_modules it actually imports.
RUN pnpm --filter admin build

# ─── Production stage ─────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone server.js lives at apps/admin/.next/standalone/apps/admin/server.js
# when built from the monorepo root, with node_modules beside it at
# apps/admin/.next/standalone/node_modules. Copy the whole standalone tree
# then layer static + public on top.
COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /app/apps/admin/public ./apps/admin/public

EXPOSE 3000

CMD ["node", "apps/admin/server.js"]
