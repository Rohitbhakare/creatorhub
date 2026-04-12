# E1.1 — Content Framework

## Overview
Build the shared content creation infrastructure that all 4 content types (post, itinerary, scheduled experience, event) will use. This epic provides the content CRUD API, draft/publish state machine, media upload pipeline, Google Places proxy, content type picker UI, and the publishing wizard shell. No content-type-specific logic here — just the framework.

## SRS Requirements
- CRT-FR-008 (Publish / unpublish / archive state machine)
- CRT-FR-012 (Media upload pipeline: client compress, signed URL, server thumbnails, EXIF strip)
- CRT-FR-014 (Content type picker — 4 cards with KYC indicator)
- CRT-FR-015 (Publishing wizard framework — shared step-based shell)
- CRT-FR-017 (Pricing step — freemium toggle, GST line, take-home preview)
- CRT-FR-018 (Basics step — live character counters)
- CRT-FR-020 (Review step — full-page preview + validation checklist)
- CRT-FR-021 (Creator T&Cs consent per publish)
- CRT-FR-007 (Auto-save drafts every 30 seconds)

## Dependencies
- E0.1 (monorepo scaffold)
- E0.2 (content table, content_media table, enums)
- E0.3 (auth middleware — authenticate, requireCreator)
- E0.4 (design system — Button, Card, Input, BottomSheet, Skeleton)
- E0.5 (onboarding complete — user has verticals set)

## Architecture Decisions
- Content table is unified (single table with `type` enum + `vertical_data` JSONB per HLD §6.3)
- State machine: `draft` -> `under_review` -> `published` -> `unpublished` | `archived`. Moderator paths: `rejected`, `taken_down`
- Auto-save: 30s debounce on client, PUT to /content/:id. Server uses `updated_at` for conflict detection (optimistic concurrency)
- Media upload: client requests signed URL -> uploads to Firebase Storage -> confirms with server. Server generates thumbnails (200/600/1200px)
- Google Places API proxy: server-side only (key never exposed to client), rate limited at 100 req/creator/hour
- Content type picker: first screen of Studio tab for non-creators or when tapping "+" FAB
- Publishing wizard: shared stepper component with configurable steps per content type
- All amounts in paisa (integer). GST displayed separately, not bundled into listed price
- Cursor-based pagination for content lists (no offset pagination)

## Deliverables

### API (apps/api)
1. Content CRUD endpoints (create draft, get, update, list, delete)
2. Content publish/unpublish/archive endpoints with state machine validation
3. My drafts endpoint (list creator's drafts by type)
4. Media upload signed URL generation endpoint (enhanced from E0.5 stub)
5. Media confirm endpoint (after client upload completes)
6. Google Places autocomplete proxy endpoint
7. Google Places detail proxy endpoint
8. T&Cs consent recording
9. Content Zod schemas in packages/shared

### Mobile (apps/mobile)
10. Content type picker screen (4 cards: Post, Event, Experience, Itinerary)
11. Publishing wizard shell (stepper, progress bar, back/next, draft auto-save)
12. Basics step component (title, description with live char counters)
13. Media picker component (image selection, compression, upload with progress)
14. Pricing step component (free/paid toggle, price input, GST line, take-home preview)
15. Review & publish step component (validation checklist, T&Cs checkbox, publish CTA)
16. Location picker component (Google Places autocomplete, map pin)
17. Draft auto-save service (30s debounce, conflict detection)
18. Content state provider (Riverpod, tracks wizard state)

### Shared (packages/shared)
19. Content type definitions and Zod schemas
20. Content status enum and transition rules
21. Pricing calculation utilities (platform fee, GST, TDS, take-home)
