# Plan Epic

Plan the implementation for epic: $ARGUMENTS

## Instructions

1. Read the SRS at `docs/00_SRS/v1.2/srs-v1.2.md` — find all requirements listed in the epic's scope from `docs/epics/TRACKING.md`
2. Read relevant wireframes from `docs/01_wireframes/v1/wireframes_html/`
3. Read the instruction files:
   - `.claude/instructions/api.md` (if epic has API work)
   - `.claude/instructions/ui-ux.md` (if epic has Flutter work)
   - `.claude/instructions/infosec.md` (always)
4. Read existing code to understand current patterns and what can be reused
5. Create the epic folder if it doesn't exist: `docs/epics/<epic-id>/`
6. Write these files in the epic folder:
   - `plan.md` — implementation approach, architecture decisions, dependencies
   - `tasks.md` — detailed task breakdown with:
     - Task ID, title, files to create/modify
     - SRS requirement IDs mapped to each task
     - Edge cases and error states
     - Acceptance criteria
   - `tracking.md` — initialized with all tasks as `[ ] Not Started`
7. Update `docs/epics/TRACKING.md` with the new epic status
8. Present the plan summary to the user for approval before building
