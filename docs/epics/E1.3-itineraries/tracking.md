# E1.3 — Tracking

**Status:** DONE
**Progress:** 13/15 tasks (87%)
**Branch:** `dev`
**Last Updated:** 2026-04-12

---

## Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1 | Itinerary Zod Schemas & Types | `[x]` Done | createItineraryDraftSchema, reorderSpotsSchema added |
| T2 | Itinerary Service | `[x]` Done | 12 functions: CRUD + days + spots + publish + computeDayStats |
| T3 | Itinerary Days & Spots CRUD Handlers | `[x]` Done | 11 handlers, ownership chain verification |
| T4 | Itinerary Distance & Duration Calculator | `[x]` Done | PostGIS ST_Distance via RPC, integrated in service |
| T5 | Place Cache Service | `[x]` Done | Migration 013_place_cache.sql with RPCs |
| T6 | Itinerary Creation Wizard (Flutter) | `[x]` Done | 6-step wizard using E1.1 shell |
| T7 | Trip Overview Step (Flutter) | `[x]` Done | Day stepper, city search, destination multi-select |
| T8 | Day Builder Screen (Flutter) | `[x]` Done | Day tabs, spot list, ReorderableListView, FAB |
| T9 | Spot Picker Bottom Sheet (Flutter) | `[x]` Done | Places autocomplete, 300ms debounce, "Powered by Google" |
| T10 | Spot Editor Bottom Sheet (Flutter) | `[x]` Done | Creator note, duration picker, stop type selector |
| T11 | Itinerary Detail Screen (Flutter) | `[x]` Done | Map placeholder, day tabs, spot cards, paywall overlay |
| T12 | Itinerary Map Component (Flutter) | `[ ]` Deferred | Deferred until google_maps_flutter added (map placeholder in place) |
| T13 | Itinerary Feed Card Widget (Flutter) | `[x]` Done | ITINERARY badge, day count, stats row, price badge |
| T14 | Itinerary Detail SSR Page (Web) | `[ ]` Deferred | Deferred to E2.10 (minimal web) |
| T15 | Mount Itinerary Routes in App | `[x]` Done | Mounted at /api/v1/itineraries |

---

## Review Gate

| Review | Status | Findings |
|--------|--------|----------|
| Edge Cases | `[x]` Passed | Day renumbering, spot reorder, free preview gating, ownership chains |
| Security | `[x]` Passed | 3-level ownership verification, PostGIS via RPCs, KYC check for paid |
| Architecture | `[x]` Passed | PostGIS RPCs, handler→service→query pattern, Riverpod Notifier |
| Code Quality | `[x]` Passed | 0 flutter analyze issues, 0 TypeScript errors |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-12 | Epic created, 15 tasks defined |
| 2026-04-12 | 13/15 tasks completed (T12 map component + T14 SSR deferred). 6 API files + 9 Flutter files + 1 migration. Zero errors. |
