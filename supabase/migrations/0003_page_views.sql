-- Visit tracking for Admin › Analytics (pageViews in shared/schema.ts).
-- Only the app's own server reads and writes it, so it is locked like every other table (see 0001).
CREATE TABLE IF NOT EXISTS public.page_views (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  product_id varchar,
  referrer text,
  visitor text NOT NULL,
  device text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views (created_at);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.page_views FROM anon, authenticated;
