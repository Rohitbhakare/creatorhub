-- Migration 022: T&C consent audit table
-- Records user acceptance of Terms & Conditions per content item at publish time.

CREATE TABLE IF NOT EXISTS public.tnc_consents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_id    UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  ip_address    TEXT,
  user_agent    TEXT,
  consented_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tnc_consents_user_content_unique UNIQUE (user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_tnc_consents_user_id    ON public.tnc_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_tnc_consents_content_id ON public.tnc_consents(content_id);
