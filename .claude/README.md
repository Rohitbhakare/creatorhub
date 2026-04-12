# .claude/ — AI Development Configuration

This folder configures Claude Code (AI assistant) for the CreatorHub project. It contains instruction files, agent prompts, and slash commands that ensure consistent, high-quality output across all development sessions.

## Folder Structure

```
.claude/
├── README.md              # You are here
├── settings.json          # Project-level permissions (auto-allowed tools)
│
├── instructions/          # Rules that MUST be followed before writing code
│   ├── api.md             # REST conventions, error handling, security, file structure
│   ├── ui-ux.md           # Colors, typography, components, animations, accessibility
│   ├── testing.md         # Test pyramid, coverage targets, fixtures, CI pipeline
│   ├── infosec.md         # Auth, encryption, PII, rate limiting, RLS, DPDPA
│   └── documentation.md   # What to document, ADR format, commit messages
│
├── agents/                # Prompts for specialized AI agents
│   ├── master-epic.md     # Orchestrator — loads epic, spawns agents, runs review gate
│   ├── backend.md         # Hono API agent — routes, handlers, services, SQL
│   ├── mobile.md          # Flutter agent — screens, providers, widgets
│   └── web.md             # Next.js agent — SSR pages, SEO, mini-site
│
└── commands/              # Slash commands for common workflows
    ├── plan-epic.md       # /plan-epic <id> — creates epic folder from SRS
    ├── build-epic.md      # /build-epic <id> — full build: types → agents → review
    ├── review-security.md # /review-security — OWASP checklist on current diff
    ├── review-architecture.md  # /review-architecture — HLD adherence check
    ├── review-edge-cases.md    # /review-edge-cases — missing error states check
    ├── epic-status.md     # /epic-status [id] — show progress
    └── update-tracking.md # /update-tracking — update task/epic status
```

## How It Works

### Instructions (read before coding)

Each instruction file enforces non-negotiable rules for its domain. Claude Code reads the relevant file before writing any code in that area.

| File | When to Read | Key Rules |
|------|-------------|-----------|
| `api.md` | Before any API code | REST conventions, RFC 9457 errors, Zod validation, paisa for money |
| `ui-ux.md` | Before any UI code | Coral in 8 contexts only, Fraunces/Inter fonts, skeleton loading, 44dp tap target |
| `testing.md` | Before any test | 70% coverage on critical modules, real DB for integration, colocated tests |
| `infosec.md` | Before auth/payments/PII | JWT server-side only, parameterized SQL, PII never logged, RLS on all tables |
| `documentation.md` | Before docs/commits | ADR template, conventional commits, CLAUDE.md rules |

### Agents (specialized AI workers)

Agents are prompt templates that create focused AI workers for parallel development:

| Agent | What It Does | When Spawned |
|-------|-------------|--------------|
| `master-epic.md` | Orchestrates an entire epic: reads tasks, spawns backend+mobile agents, runs 4-step review | `/build-epic` command |
| `backend.md` | Writes Hono API code: routes, handlers, services, SQL queries, tests | Spawned by master agent |
| `mobile.md` | Writes Flutter code: screens, providers, widgets, matched to wireframes | Spawned by master agent |
| `web.md` | Writes Next.js SSR pages: mini-site, detail pages, SEO metadata | Spawned by master agent (E2.10 only) |

### Commands (slash commands)

Commands are invoked with `/<command-name>` in Claude Code:

| Command | Purpose |
|---------|---------|
| `/plan-epic E0.3` | Creates epic folder with plan.md, tasks.md, tracking.md from SRS |
| `/build-epic E0.3` | Full build loop: shared types → parallel agents → integrate → 4-step review → commit |
| `/review-security` | Runs OWASP-based security checklist on current git diff |
| `/review-architecture` | Checks HLD adherence, pattern consistency, coupling |
| `/review-edge-cases` | Finds missing error states, boundary conditions, empty states |
| `/epic-status` | Shows master tracking or per-epic task progress |
| `/update-tracking E0.1 T3 done` | Updates a task's status in tracking.md |

## Development Flow

```
1. /plan-epic <id>        → Creates epic folder from SRS requirements
2. /build-epic <id>       → Builds the epic:
   a. Read tasks + OpenAPI spec
   b. Write shared TypeScript types
   c. Spawn backend agent + mobile agent (parallel)
   d. Integrate and test
   e. 4-step review gate:
      - /review-edge-cases
      - /review-security
      - /review-architecture
      - Code quality review
   f. Fix issues → commit → merge
3. /update-tracking       → Update progress
4. Repeat for next epic
```

## For New Contributors

1. **Read `CLAUDE.md` in the project root** — it has the tech stack, coding standards, and business rules
2. **Read the relevant instruction file** before touching any code area
3. **Check `docs/epics/TRACKING.md`** to see what's in progress and what's blocked
4. **Use the slash commands** — they enforce the project's quality standards automatically
