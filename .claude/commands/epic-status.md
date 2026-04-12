# Epic Status

Show the current progress of all epics, or a specific epic if provided.

Arguments: $ARGUMENTS (optional epic ID, e.g., "E0.3")

## Instructions

1. Read `docs/epics/TRACKING.md` for the master tracking view
2. If a specific epic ID was provided:
   - Read `docs/epics/<epic-id>/tracking.md` for detailed task progress
   - Show: completed tasks, in-progress tasks, blocked tasks, remaining tasks
   - Show: % complete, files changed, tests passing
3. If no epic ID provided:
   - Show summary table of all epics: ID, name, status, % complete, milestone
   - Highlight the current/next epic to work on
   - Show any blocked items
4. Present the status in a clean table format
