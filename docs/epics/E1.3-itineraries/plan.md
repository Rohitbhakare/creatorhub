# E1.3 — Itineraries (Self-Paced)

## Overview
Implement the Self-Paced Itinerary content type: spot-based day builder, Google Places autocomplete for spots, map-first detail page, free/paid toggle, and the creation wizard. Itineraries are map-first, spot-based curated travel guides organised as days of spots with creator notes. Day 1 spots are auto-marked as free preview for paid itineraries. This is the core travel content type.

## SRS Requirements
- CRT-FR-002 (Create a Self-paced Itinerary — map-first, spot-based, 6-step wizard)
- CRT-FR-003 (Itinerary spot-based day builder — Google Places autocomplete per spot)
- CRT-FR-004 (Category-adaptive fields — Road Trips, Street Food, Adventure extras)
- CRT-FR-016 (Spot editor — Google Places autocomplete, photo_reference only in MVP)
- CRT-FR-017 (Pricing step — freemium toggle, GST, take-home preview)
- CRT-FR-019 (Trip overview step — day count, day skeleton creation)
- CRT-FR-020 (Review step — full-page preview + validation checklist)
- DD-023 (Spot-based day builder replaces segment/time-block builder)
- DD-024 (Map rendering: overnight spots = larger coral pins, others = ink pins)
- DD-028 (Google Places API — server-side proxy, rate limit 100 req/creator/hour)
- DD-032 (Spot thumbnail: Google Places photo_reference only in MVP)

## Dependencies
- E1.1 (Content Framework — CRUD, wizard shell, media upload, Places proxy, state machine)
- E0.2 (itinerary_days, itinerary_spots tables, spot_stop_type enum)
- E0.4 (Design system — map styles, pin components)

## Architecture Decisions
- Itinerary wizard has 6 steps: Basics -> Trip Overview -> Day Builder (spot picker) -> Media -> Pricing -> Review & Publish
- Day builder: creator declares day count in Trip Overview, then fills spots per day in Day Builder step
- Spots are added via Google Places autocomplete (server-side proxy), each spot gets: name, place_id, coordinates, creator_note, stop_type, duration
- Spot thumbnails come from Google Places `photo_reference` in MVP (no custom upload per spot until V1)
- Place details cached in DB after first fetch (avoid re-fetching on every view)
- Day 1 spots auto-marked `is_free_preview = true` for paid itineraries
- Paid itineraries require KYC verified before publish
- One draft per user per content type in MVP (CRT-FR-023 — interpret as one active draft)
- Auto-save every 30 seconds (using E1.1 framework)
- Map rendering: Google Maps SDK with custom pins (overnight = coral large pin, regular = ink pin)
- Total distance auto-computed from sequential spot coordinates within each day

## Deliverables

### API (apps/api)
1. Itinerary-specific creation handler (validates itinerary rules)
2. Itinerary days CRUD (create day skeletons, update day title/description)
3. Itinerary spots CRUD (add/update/remove/reorder spots within a day)
4. Itinerary detail endpoint (public, includes days + spots + map data, respects free preview for paid)
5. Itinerary publish handler (validates all days have at least 1 spot, KYC check for paid)
6. Auto-compute distance between spots (PostGIS `ST_Distance`)
7. Itinerary validation schema (Zod, in packages/shared)

### Mobile (apps/mobile)
8. Itinerary creation wizard (6 steps using E1.1 shell)
9. Trip overview step screen (day count input 1-30, starting city, destination cities)
10. Day builder screen (per-day spot list with add/remove/reorder)
11. Spot picker bottom sheet (Google Places autocomplete, 300ms debounce, "Powered by Google")
12. Spot editor bottom sheet (creator note, duration, stop type, preview thumbnail)
13. Itinerary detail screen (map-first: full map with pins, day tabs, spot list below map)
14. Map component with custom pins (overnight=coral, regular=ink, activity=blue)
15. Day distance/duration summary bar
16. Pricing step with free preview indicator ("Day 1 spots will be visible to everyone")
17. Itinerary feed card widget (map preview thumbnail, day count badge, spot count)

### Web (apps/web — minimal)
18. Itinerary detail SSR page (/content/[id]) with map static image + OpenGraph meta
