# E1.2 — Posts

## Overview
Implement the Post content type end-to-end: creation wizard, detail page, and feed card. Posts are the simplest content type — text (max 1000 chars) + up to 5 images, no booking, no pricing, no KYC required. Posts serve as the low-friction entry point for creators. Body text on detail pages uses Fraunces 14px/1.65 serif font. This epic builds on the E1.1 Content Framework.

## SRS Requirements
- CRT-FR-001 (Create a Post — text + hero image + inline media, no KYC, no price)
- CRT-FR-008 (Publish / unpublish / archive — using E1.1 state machine)
- CRT-FR-012 (Media upload — max 5 images per post, using E1.1 pipeline)
- CRT-FR-015 (Publishing wizard — using E1.1 shell with post-specific steps)
- CRT-FR-018 (Basics step — title 5-100 chars, description 0-280 chars)
- DD-026 (Post detail body: Fraunces 14px/1.65, pull quotes use Fraunces italic)
- DD-027 (No price field, no booking CTA on post detail pages)

## Dependencies
- E1.1 (Content Framework — CRUD API, wizard shell, media upload, state machine)
- E0.4 (Design system — typography includes Fraunces font)

## Architecture Decisions
- Post wizard has 3 steps: Basics (title + description) -> Media (up to 5 images) -> Review & Publish
- No pricing step — posts are always free
- No KYC check — posts never require KYC
- `body` field stores the long-form text (max 1000 chars plain text for MVP; rich text deferred to V1)
- Post detail page: hero image full-bleed, body text in Fraunces serif, creator avatar + name header
- Post feed card: thumbnail + title + creator name + like/comment counts
- Location tag is optional (uses E1.1 Places proxy)
- On publish: `status='published'`, `type='post'`, `visibility='public'`, enqueue for image moderation

## Deliverables

### API (apps/api)
1. Post-specific creation handler (validates post rules: max 5 images, no price, body max 1000 chars)
2. Post detail endpoint (public, with optionalAuthenticate for like/save state)
3. Post list endpoint (paginated, filterable by vertical, creator)
4. Post validation schema (Zod, in packages/shared)

### Mobile (apps/mobile)
5. Post creation wizard (3 steps using E1.1 shell)
6. Post body editor (plain text, char counter, 1000 char max)
7. Post media step (select up to 5 images, reorder, remove)
8. Post detail screen (hero image, Fraunces body text, creator header, like/comment/share bar)
9. Post feed card widget (thumbnail, title, creator, engagement counts)
10. Post creation entry from content type picker

### Web (apps/web — minimal)
11. Post detail SSR page (/content/[id]) with OpenGraph meta tags
