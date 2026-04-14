# <EPIC-ID> — <Epic Name>
<!-- This template is filled in by the /plan-epic command (Opus model). -->
<!-- Every section must be completed before the plan is submitted for review. -->
<!-- Do NOT skip sections — mark N/A with a reason if genuinely not applicable. -->

---

## 1. Overview

> One paragraph: what this epic builds, why it matters at this stage, and how it connects to the product vision.

---

## 2. SRS Requirements

> List every requirement this epic implements with its description, not just its ID.

| ID | Requirement | Notes / Scope Decisions |
|----|-------------|------------------------|
| CRT-FR-XXX | Description from SRS | Any scope narrowing or deferral |

---

## 3. Wireframes Referenced

> Explicit wireframe → screen element mapping. Reviewer should open these files to cross-check the plan.

| Wireframe file | Relevant section / component | What to verify |
|----------------|------------------------------|----------------|
| `screen-XX-name.html` | e.g. "Date/time picker block" | Exact layout, label wording, state transitions |

---

## 4. Dependencies

| Dependency | Type | Status | What we need from it |
|------------|------|--------|----------------------|
| E1.1 Content Framework | Epic | DONE | Wizard shell, content CRUD service, state machine |

---

## 5. Architecture Decisions

> Decisions that affect implementation shape. Each must have a rationale — "because the SRS says so" is not enough. The reviewer checks these before implementation begins.

| Decision | Chosen approach | Rejected alternative | Rationale |
|----------|----------------|---------------------|-----------|
| | | | |

---

## 6. Database

### Tables touched
> List every table read from or written to. Flag any schema changes needed.

| Table | Operation | Schema change? | Notes |
|-------|-----------|---------------|-------|
| `content` | R/W | No | Reuse existing row with `type='event'` |
| `event_occurrences` | R/W | No | Created on publish |

### Key queries
> Write the actual SQL or pseudocode for non-trivial queries. Reviewer checks for missing indexes, N+1 risks, and RLS gaps.

```sql
-- Example: get event with occurrence
SELECT c.*, eo.*
FROM content c
JOIN event_occurrences eo ON eo.content_id = c.id
WHERE c.id = $1
  AND c.type = 'event'
  AND (c.status = 'published' OR c.user_id = $2);
```

### RLS policies needed
> One row per policy. Reviewer checks for missing policies or over-permissive reads.

| Table | Policy name | Rule |
|-------|-------------|------|
| `event_occurrences` | `event_occurrences_select` | Published events visible to all; draft only to owner |

---

## 7. API Endpoints

> Complete contract for every new endpoint. Reviewer cross-checks against OpenAPI spec.

### `POST /api/v1/events`
**Auth:** `authenticate` (required)
**Request body (Zod schema name):** `CreateEventDraftSchema`
```json
{
  "title": "string (5-100)",
  "description": "string (0-500)"
}
```
**Response 201:**
```json
{ "success": true, "data": { "id": "uuid", "status": "draft" } }
```
**Errors:**
- `422` — validation failure (list each field)
- `401` — unauthenticated

### `GET /api/v1/events/:id`
**Auth:** `optionalAuthenticate`
...

---

## 8. Shared Types / Zod Schemas

> Every new type and schema that goes into `packages/shared/`. Reviewer checks for type consistency with existing schemas.

```typescript
// packages/shared/src/types/event.ts
export interface EventDetail {
  id: string
  title: string
  // ...
}

// packages/shared/src/schemas/event.ts
export const CreateEventDraftSchema = z.object({ ... })
export const PublishEventSchema = z.object({ ... })
```

---

## 9. Flutter Screens & Widgets

> Every screen and widget to build. Reviewer cross-checks wireframes.

| File | Type | Description | State managed by |
|------|------|-------------|-----------------|
| `features/events/screens/event_wizard_screen.dart` | Screen | Multi-step creation wizard | `event_wizard_provider.dart` |
| `features/events/screens/event_detail_screen.dart` | Screen | Event detail page | `event_detail_provider.dart` |
| `features/events/widgets/event_feed_card.dart` | Widget | Feed card for event list | Stateless (props in) |

### UI decisions to verify against design system
> Flag every coral usage, font choice, or animation that needs cross-checking against ui-ux.md.

- [ ] Coral `#E15A41` used only in: ... (list the exact 8 allowed contexts, mark which apply here)
- [ ] Fraunces used only for: display, H1, H2, post body
- [ ] Skeleton shimmer (never spinner) on all loading states
- [ ] 44dp minimum tap targets on all interactive elements

---

## 10. Security Considerations

> Reviewer: every item must have a status before implementation is approved.

| Risk | Mitigation | Applies here? |
|------|-----------|--------------|
| Capacity oversell (race condition on RSVP) | Transactional update with `SELECT ... FOR UPDATE` or `UPDATE ... RETURNING` | Yes — `spots_booked` must be atomic |
| Unauthorized publish (not owner) | `requireOwner` check in handler | Yes |
| KYC bypass for paid events | `requireKYC` middleware on publish when `price_paisa > 0` | Yes |
| SQL injection | Parameterized queries only | Always |
| Mass RSVP spam | Rate limit: 10 RSVPs per user per hour | Yes |
| Venue address exposed pre-RSVP | Address is intentionally public per SRS (DD-025) — no mitigation needed | N/A |

---

## 11. Edge Cases & Error States

> This section is the primary input for the Edge Case review gate. Every edge case must map to a specific task.

### Creation wizard
- [ ] User has an existing event draft → "Continue draft?" prompt
- [ ] `start_at` after `end_at` → inline validation error
- [ ] `start_at` in the past → inline error "Event must be in the future"
- [ ] `start_at` and `end_at` on different days → inline error "Events must start and end on the same day (M0)"
- [ ] Capacity 0 → validation error "Minimum capacity is 1"
- [ ] Venue name empty → required field error
- [ ] Description > 500 chars → counter turns red, cannot save step

### RSVP
- [ ] Event at capacity → "Event is full" instead of RSVP button
- [ ] User already RSVP'd → button shows "You're going ✓", tap = cancel RSVP
- [ ] RSVP cancelled → `spots_booked` decremented, spot freed for others
- [ ] Race condition: two users RSVP last spot simultaneously → one succeeds, one gets "Event is full"
- [ ] Creator tries to RSVP own event → hide RSVP button, show "You're hosting this"

### Event detail
- [ ] Past event → show "Event has passed" banner, hide RSVP button
- [ ] Cancelled event → show "Event cancelled" state
- [ ] Non-existent event ID → 404 screen
- [ ] Draft event viewed by non-owner → 404 (not 403, to avoid leaking existence)

### API
- [ ] Publish without `event_occurrences` record → transaction ensures atomicity
- [ ] Venue address empty on publish → 422 validation error
- [ ] No cover image on publish → 422 (image required for events)

---

## 12. Test Cases

> Written before implementation. Reviewer checks coverage is adequate before approving.

### API tests (Vitest)
| Test | What it verifies |
|------|-----------------|
| `POST /events` — happy path | Returns 201, creates draft with type='event' |
| `POST /events/:id/publish` — missing venue | Returns 422 with venue field error |
| `POST /events/:id/rsvp` — at capacity | Returns 409 with spots_available: 0 |
| `POST /events/:id/rsvp` — already RSVP'd | Returns 409 with "already_rsvpd" code |
| `GET /events/:id` — draft, non-owner | Returns 404 |

### Flutter widget tests
| Widget | What it verifies |
|--------|-----------------|
| `EventFeedCard` | Renders title, date block, venue, RSVP count |
| `EventFeedCard` — past event | Shows "Ended" badge |
| `EventDetailScreen` — at capacity | RSVP button disabled / shows "Full" |

---

## 13. Open Questions / Risks

> Items that need a decision before or during implementation. Reviewer resolves these before approving the plan.

| # | Question | Impact | Suggested resolution |
|---|----------|--------|---------------------|
| 1 | Does the event feed card show a "Going" count (RSVP count) or "Spots left"? | UI design | SRS says `rsvp_count` is stored — show "X going" |
| 2 | Can a creator edit an event after publishing (e.g. venue change)? | State machine | SRS is silent — default to: title/description editable; start_at/venue NOT editable after first RSVP |
| 3 | What happens to RSVPs if creator cancels event? | Booking integrity | M0 scope — cancellation/refund is E2.4; for now, only free events in M1 |

---

## 14. Task Breakdown

> Complete tasks.md content. Each task is independent, assigned to either API agent or Mobile agent.

### T1: Zod Schemas & Shared Types
**Agent:** API
**Files:**
- `packages/shared/src/schemas/event.ts` (new)
- `packages/shared/src/types/event.ts` (new)
**SRS:** CRT-FR-013, CRT-FR-018
**Acceptance:** `CreateEventDraftSchema`, `UpdateEventSchema`, `PublishEventSchema`, `RSVPSchema`, `EventDetail` type.
**Edge cases:** [see §11 — all validation rules]

### T2: Event Service
...

### TN: ...

---

## 15. Pre-Implementation Checklist (for reviewer)

> Every box must be checked by the reviewer before implementation is approved.

**Completeness**
- [ ] All SRS requirements in §2 are covered by a task in §14
- [ ] All wireframe elements in §3 map to a widget/screen in §9
- [ ] All edge cases in §11 are addressed in at least one task's acceptance criteria
- [ ] All open questions in §13 are resolved or explicitly deferred

**Design**
- [ ] Architecture decisions in §5 are consistent with HLD
- [ ] API endpoints in §7 follow the conventions in `.claude/instructions/api.md`
- [ ] Coral usage in §9 is within the 8 allowed contexts
- [ ] All UI loading states use skeleton shimmer (not spinner)

**Security**
- [ ] All security risks in §10 have a mitigation
- [ ] Capacity check is transactional (if applicable)
- [ ] Auth middleware applied correctly to every endpoint

**Quality**
- [ ] Test cases in §12 cover all edge cases
- [ ] No task has vague acceptance criteria ("looks good" is not acceptable)
- [ ] Task dependencies are clearly stated

---

*Plan generated by: Opus (claude-opus-4-6) — see `/plan-epic` command*
*To be reviewed by: founder before implementation begins*
