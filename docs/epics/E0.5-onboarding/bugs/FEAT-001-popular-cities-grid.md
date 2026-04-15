# FEAT-001 — Popular cities grid on location screen

**Epic:** E0.5 Onboarding
**Screen:** Location capture (`/onboarding/location`)
**Type:** Enhancement (NOT in SRS)
**Status:** OPEN
**Reported:** 2026-04-15

---

## Description

Add a "Popular Cities" section on the location screen showing top 10 Indian cities in a 3-column grid with city-specific landmark icons. This gives users a quick one-tap selection instead of requiring search.

**This is a UX enhancement not specified in SRS ONB-FR-002.** The SRS only specifies GPS detection + manual search. The popular cities grid is an addition based on founder's design direction (screenshot reference attached).

## Design (from screenshot)

```
┌──────────────────────────────────┐
│  🔍 Search for your city         │
│                                  │
│  📍 Auto Detect My Location      │
│                                  │
│  POPULAR CITIES                  │
│  ┌────────┬────────┬────────┐    │
│  │Mumbai  │Delhi   │Bengaluru│   │
│  │  🏛    │  🏛    │  🏛     │   │
│  ├────────┼────────┼────────┤    │
│  │Hyderab.│Chandi. │Ahmedab.│    │
│  │  🏛    │  🏛    │  🏛     │   │
│  ├────────┼────────┼────────┤    │
│  │ Pune   │Chennai │Kolkata │    │
│  │  🏛    │  🏛    │  🏛     │   │
│  ├────────┼────────┴────────┘    │
│  │ Kochi  │                      │
│  │  🏛    │                      │
│  └────────┘                      │
│                                  │
│  OTHER CITIES                    │
│  Aalo                            │
│  Abohar                          │
│  Abu Road                        │
│  ...                             │
└──────────────────────────────────┘
```

## Layout

- 3-column grid below search box
- Each cell: city landmark icon (SVG/asset) + city name below
- Selected city: green dot indicator + coral highlight
- Popular cities list (hardcoded, ordered by population):
  Mumbai, Delhi-NCR, Bengaluru, Hyderabad, Chandigarh, Ahmedabad, Pune, Chennai, Kolkata, Kochi
- Below the grid: "OTHER CITIES" alphabetical scrollable list (from API)

## Implementation Notes

1. Popular cities can be hardcoded with their city IDs (query from DB on first load or hardcode top 10 UUIDs)
2. City landmark icons: use simple SVG assets or Phosphor building icons per city
3. Tapping a popular city = same as selecting from search results (calls `_selectCity`)
4. "OTHER CITIES" section: loads all cities alphabetically (paginated) — new API param `GET /api/v1/cities?popular=true` or load all with no query
5. Search box filters both popular + other cities

## Affected Files

- `apps/mobile/lib/features/onboarding/screens/location_screen.dart` — main changes
- `apps/mobile/assets/` — city landmark icons (new)
- Possibly `apps/api/src/handlers/cities.ts` — new endpoint for popular cities list

## SRS Gap

ONB-FR-002 specifies:
> "Manual picker has a search field querying the full cities table (~4000 cities) with fuzzy match."

It does NOT mention popular cities grid or landmark icons. This is a founder-directed enhancement for better UX.
