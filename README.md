# CreatorHub

Travel social platform + experience marketplace for India.

## Prerequisites

- **Node.js** 22+ (`node --version`)
- **pnpm** 10+ (`npm install -g pnpm`)
- **Flutter** 3.41+ (`flutter --version`)
- **Docker** (optional, for production builds)

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-org/creatorhub.git
cd creatorhub

# 2. Install Node dependencies
pnpm install

# 3. Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Edit both .env files with your credentials

# 4. Start API + web
pnpm dev
```

| App | URL |
|-----|-----|
| API | http://localhost:3000 |
| API Health | http://localhost:3000/healthz |
| Web | http://localhost:3001 |

## Flutter (Mobile)

```bash
cd apps/mobile
flutter pub get
flutter run          # requires connected device or simulator
flutter analyze      # lint check
flutter test         # run tests
```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API + web in parallel |
| `pnpm build` | Build API + web |
| `pnpm lint` | Lint all TypeScript |
| `pnpm typecheck` | Type-check all TypeScript |
| `pnpm test` | Run all tests |

## Project Structure

```
creatorhub/
├── apps/
│   ├── api/        # Hono API (TypeScript) — localhost:3000
│   ├── mobile/     # Flutter app (iOS + Android)
│   └── web/        # Next.js SSR (TypeScript) — localhost:3001
├── packages/
│   └── shared/     # Shared types, Zod schemas, constants
└── docs/           # All documentation
```

## Documentation

- [docs/README.md](docs/README.md) — full docs guide
- [docs/engineering/HLD.md](docs/engineering/HLD.md) — system architecture
- [docs/engineering/openapi.yaml](docs/engineering/openapi.yaml) — API contracts
- [docs/epics/TRACKING.md](docs/epics/TRACKING.md) — sprint progress
- [CLAUDE.md](CLAUDE.md) — AI session context
