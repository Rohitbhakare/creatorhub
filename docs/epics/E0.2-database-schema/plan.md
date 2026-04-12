# E0.2 — Database Schema

## Overview
Deploy the full Supabase Postgres DDL: 25+ tables covering users, content, bookings, social, KYC, notifications, and search. Seed ~4000 Indian cities and 12 travel sub-categories. Configure RLS policies on all tables. This epic produces the data foundation every other epic builds on.

## SRS Requirements
- §5 DDL (all table definitions)
- DD-002 (waitlisted verticals)
- DD-006 (vertical sub-categories)
- DD-009 (cities, location columns)
- DD-015 (search queries)
- DD-021 (scheduled dates, meeting points)
- DD-023 (itinerary days, spots)
- DD-025 (event occurrences)
- DD-030 (saved lists)
- DD-035 (username cooldown)
- DD-039 (featured flag)
- DD-049–DD-056 (KYC)

## Dependencies
- E0.1 (repo scaffold must exist, Supabase project created)

## Architecture Decisions
- Direct SQL via Supabase JS client — no ORM (ADR-001)
- PostGIS for all geo queries (ADR-002)
- `tsvector` for MVP search, migrate to Meilisearch V1 (ADR-003)
- RLS on all tables; API uses service role key for admin ops (ADR-004)
- All monetary amounts stored as BIGINT (paisa)
- City IDs use stable slug format (`in.mh.pune`)

## Deliverables
1. Full DDL migration file with all tables, indexes, constraints, enums
2. Cities seed data (~4000 Indian cities with PostGIS points)
3. Vertical sub-categories seed data (12 travel sub-categories)
4. RLS policies on all tables
5. Database utility functions (search, geo queries)
6. Validation that schema matches SRS §5 exactly
