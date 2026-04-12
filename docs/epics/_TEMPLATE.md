# Epic Folder Template

When creating a new epic, create a folder: `docs/epics/<epic-id>/`

Each epic folder contains exactly 3 files:

## 1. plan.md
```markdown
# <Epic ID> — <Epic Name>

## Overview
One paragraph: what this epic builds and why.

## SRS Requirements
- List all SRS requirement IDs this epic implements

## Dependencies
- List epic IDs that must be complete before this one

## Architecture Decisions
- Any ADR-worthy decisions made for this epic

## Deliverables
1. Numbered list of what gets shipped
```

## 2. tasks.md
```markdown
# <Epic ID> — Tasks

## T1: <Task Name>
**Files:** list of files to create or modify
**SRS:** requirement IDs
**Acceptance:** what "done" looks like
**Edge cases:**
- List every error state, boundary condition, and failure mode
```

## 3. tracking.md
```markdown
# <Epic ID> — Tracking

**Status:** NOT STARTED | IN PROGRESS | IN REVIEW | DONE
**Progress:** X/Y tasks (Z%)
**Branch:** epic/<epic-id>
**Last Updated:** YYYY-MM-DD

## Tasks
| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1 | ... | [ ] Not Started | |

Status markers:
- [ ] = Not Started
- [~] = In Progress
- [x] = Done
- [!] = Blocked (add reason)
- [-] = Deferred (add reason)

## Review Gate
| Review | Status | Findings |
|--------|--------|----------|
| Edge Cases | [ ] Not Run | |
| Security | [ ] Not Run | |
| Architecture | [ ] Not Run | |
| Code Quality | [ ] Not Run | |

## Changelog
| Date | Change |
|------|--------|
```
