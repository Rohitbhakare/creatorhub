# Build Epic

Execute the build for epic: $ARGUMENTS

## Instructions

This is the master orchestration command. Follow these steps exactly:

### Step 1: Load Context
- Read `docs/epics/<epic-id>/plan.md` and `docs/epics/<epic-id>/tasks.md`
- Read `docs/epics/<epic-id>/tracking.md` to see what's already done
- Read `.claude/instructions/api.md`, `.claude/instructions/ui-ux.md`, `.claude/instructions/testing.md`, `.claude/instructions/infosec.md`
- Read the master agent prompt: `.claude/agents/master-epic.md`

### Step 2: Create Feature Branch
```
git checkout -b epic/<epic-id>
```

### Step 3: Build Shared Types
- Define TypeScript interfaces in `packages/shared/src/types/`
- These are the contract between API and mobile
- Update tracking: mark shared types task as complete

### Step 4: Build API + Mobile in Parallel
Launch 2 parallel agents using the agent prompts:
- **Backend agent** (`.claude/agents/backend.md`): API endpoints per OpenAPI spec
- **Mobile agent** (`.claude/agents/mobile.md`): Flutter screens per wireframes

### Step 5: Integration
- Connect Flutter screens to API endpoints
- Run tests: `pnpm test` (API) + `flutter test` (mobile)

### Step 6: 4-Step Review Gate
Run reviews sequentially — each one must pass:
1. `/review-edge-cases` on the epic branch
2. `/review-security` on the epic branch
3. `/review-architecture` on the epic branch
4. `/review-pr` (built-in skill)

### Step 7: Fix & Commit
- Fix all issues found in reviews
- Commit with conventional message: `feat(<scope>): <description>`

### Step 8: Update Tracking
- Mark all tasks as `[x] Done` in `docs/epics/<epic-id>/tracking.md`
- Update `docs/epics/TRACKING.md` with epic status
- Save progress to memory

### Step 9: Merge
- Squash merge to main
- Delete feature branch
