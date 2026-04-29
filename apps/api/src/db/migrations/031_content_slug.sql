-- ═══════════════════════════════════════════════════════════════════
-- Migration 031: content.slug — human-readable URLs
-- ═══════════════════════════════════════════════════════════════════
-- Adds a `slug` column so /content/{slug} URLs replace raw UUIDs.
-- Slug rules:
--   · lower-case, ASCII letters + digits + hyphens only
--   · derived from title at publish time
--   · unique across published content; collisions get -2, -3, … suffix
--   · 80 char hard cap
--
-- Lookup precedence (web): slug first, UUID fallback for legacy links.

-- ── Column + index ──────────────────────────────────────────────────

ALTER TABLE content
  ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS content_slug_unique_idx ON content (slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS content_slug_lookup_idx ON content (slug, status)
  WHERE slug IS NOT NULL AND status = 'published';

-- ── Slugify helper (Postgres function) ──────────────────────────────
-- Used by the backfill below + new-content trigger. Stable, deterministic,
-- pure SQL so it works inside generated columns / index expressions if
-- ever needed later.

CREATE OR REPLACE FUNCTION slugify_title(input text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(
           regexp_replace(
             regexp_replace(
               lower(coalesce(input, '')),
               '[^a-z0-9]+', '-', 'g'           -- non-alnum → hyphen
             ),
             '^-+|-+$', '', 'g'                 -- trim hyphens
           ),
           '-{2,}', '-', 'g'                    -- collapse runs
         )
$$;

-- ── Trigger to auto-populate slug on insert / title-update ──────────
-- Suffix -2, -3 … on collision so the unique index never blocks a publish.

CREATE OR REPLACE FUNCTION content_set_slug() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  base text;
  candidate text;
  n int := 1;
BEGIN
  -- Skip if caller set slug explicitly OR we're updating a row whose
  -- title didn't change.
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.title = NEW.title AND OLD.slug IS NOT NULL THEN
    NEW.slug := OLD.slug;
    RETURN NEW;
  END IF;

  base := left(slugify_title(NEW.title), 80);
  IF base = '' OR base IS NULL THEN
    base := 'untitled';
  END IF;

  candidate := base;
  WHILE EXISTS (
    SELECT 1 FROM content WHERE slug = candidate AND id <> NEW.id
  ) LOOP
    n := n + 1;
    candidate := left(base, 76) || '-' || n::text;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS content_set_slug_trg ON content;
CREATE TRIGGER content_set_slug_trg
  BEFORE INSERT OR UPDATE OF title ON content
  FOR EACH ROW
  EXECUTE FUNCTION content_set_slug();

-- ── Backfill existing rows ──────────────────────────────────────────
-- Walk in published_at ASC order so the oldest row keeps the un-suffixed
-- slug if there are collisions on title. Uses the trigger by clearing
-- slug and re-saving.

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM content
    WHERE slug IS NULL OR slug = ''
    ORDER BY published_at NULLS LAST, created_at
  LOOP
    UPDATE content SET slug = NULL WHERE id = r.id;
    UPDATE content SET title = title WHERE id = r.id;  -- fires trigger
  END LOOP;
END
$$;

-- ── Sanity check ────────────────────────────────────────────────────
-- After migration, every row should have a slug. Surface remaining NULLs
-- so the operator sees them in the migration log.

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM content WHERE slug IS NULL;
  IF n > 0 THEN
    RAISE NOTICE 'content rows still without slug: %', n;
  END IF;
END
$$;
