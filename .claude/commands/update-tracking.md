# Update Tracking

Update the progress tracking for an epic or task.

Usage: /update-tracking <epic-id> [task-id] [status]

Arguments: $ARGUMENTS

## Instructions

Parse the arguments:
- If only epic-id: show all tasks in the epic and ask which to update
- If epic-id + task-id + status: update that specific task

Valid statuses: `not-started`, `in-progress`, `done`, `blocked`, `deferred`

### Steps

1. Read `docs/epics/<epic-id>/tracking.md`
2. Update the task status:
   - `[ ]` = not-started
   - `[~]` = in-progress
   - `[x]` = done
   - `[!]` = blocked (add reason)
   - `[-]` = deferred (add reason)
3. Update the epic-level stats (tasks done / total, % complete)
4. Update the timestamp
5. Write the updated tracking file
6. Update `docs/epics/TRACKING.md` master tracking with the new epic percentage
