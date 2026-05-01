# SRS v1.5 — R-deltas (revision deltas)

> Companion to `srs-v1.5-delta.md`. Each `-R` clause supersedes a numbered
> clause in v1.5 (or a clause inherited from v1.2 / v1.3 / v1.4). Reason
> for the supersession is recorded inline.
>
> **Date:** 2026-05-01 (initial)
> **Status:** ACTIVE — clauses here OVERRIDE the original numbered clauses.

---

## §4.16.2 Home Feed — single-column delta

### WEB-FEED-FR-023-R · [M1] · Web home shell (single-column)

**Supersedes:** WEB-FEED-FR-023.

Single-column on all breakpoints, max-width 1240px, side gutters per
`PAGE_GUTTER` (32px desktop / 24px tablet / 16px mobile). No left
sidebar nav. No right rail. The quest visibility that FR-023 placed in
a right-rail dock moves to (a) the streak chip in `<WebHeader>` and
(b) an inline `<QuestStripInline>` band between the chapter hero and
the mood selector.

**Reason:** v3 wireframe (`pack-w3-home-web.jsx`) was designed as
single-column magazine. The original three-column FR-023 predates the
v3 redesign. ADR-0002 records the decision.

### WEB-FEED-FR-030-R · [M1] · Quest visibility (no right-rail dock)

**Supersedes:** WEB-FEED-FR-030.

The right-rail dock specified in FR-030 is removed. Equivalent surfaces
on the home page:
- Streak count: `<WebHeader>` chip (always visible when authed)
- XP + daily quests: `<QuestStripInline>` (single horizontal band, fully
  in-flow rather than docked)
- Trending tags: rendered below the magazine bands as a content-tag
  chip rail (existing `<RightRail>` content-tag block is moved to its
  own component for re-use on `/discover` and `/u/<username>`)

The mobile-web FR-030 fallback ("collapses to floating bottom-right
pill on <768 px") is no longer needed — single-column has no rail to
collapse.

**Reason:** Follows from FR-023-R.

---

## How to add a new R-delta

1. Identify the numbered clause that's getting superseded.
2. Add an `## §<section>` header here if one doesn't exist.
3. Use the format `<CLAUSE-ID>-R · [milestone] · <short title>`.
4. Include the **Supersedes:** line and a short **Reason:** line.
5. Keep R-deltas to clauses that have a clear architectural rationale —
   prose tweaks belong in the next minor SRS revision, not here.
