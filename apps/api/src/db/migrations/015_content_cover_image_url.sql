-- ═══════════════════════════════════════════════════════════════════
-- Migration 015: Add cover_image_url to content table
-- Why: content.service.ts listPublished() selects this column for
--      feed cards. Media lives in content_media; this is a denormalized
--      cache column, auto-synced by trigger on content_media changes.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE content
  ADD COLUMN IF NOT EXISTS cover_image_url text;

-- ── Trigger: keep cover_image_url in sync with content_media ───────
-- Fires after INSERT / UPDATE / DELETE on content_media.
-- Sets cover_image_url to the url of the first image (lowest display_order).

CREATE OR REPLACE FUNCTION sync_cover_image_url()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_content_id uuid;
  v_url        text;
BEGIN
  -- Determine which content row was affected
  IF TG_OP = 'DELETE' THEN
    v_content_id := OLD.content_id;
  ELSE
    v_content_id := NEW.content_id;
  END IF;

  -- Fetch the first image (lowest display_order)
  SELECT url INTO v_url
  FROM   content_media
  WHERE  content_id = v_content_id
    AND  media_type = 'image'
  ORDER  BY display_order ASC
  LIMIT  1;

  -- Update the denormalized column (NULL when no images)
  UPDATE content
  SET    cover_image_url = v_url
  WHERE  id = v_content_id;

  RETURN NULL; -- AFTER trigger, return value unused
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_cover_image_url ON content_media;
CREATE TRIGGER trg_sync_cover_image_url
  AFTER INSERT OR UPDATE OR DELETE ON content_media
  FOR EACH ROW EXECUTE FUNCTION sync_cover_image_url();
