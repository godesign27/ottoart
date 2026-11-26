-- Corporate outreach (Admin › Outreach; prospects, outreachSteps, outreachTemplates, gmailConnection in shared/schema.ts).
-- Only the app's own server reads and writes these, so they are locked like every other table (see 0001).
CREATE TABLE IF NOT EXISTS public.prospects (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  category text NOT NULL,
  contact_name text,
  title text,
  email text,
  website text,
  city text NOT NULL DEFAULT 'Boulder, CO',
  hook text,
  notes text,
  planned_week text,
  status text NOT NULL DEFAULT 'not_contacted',
  board_id varchar REFERENCES public.boards(id) ON DELETE SET NULL,
  opted_out_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prospects_category ON public.prospects (category);

CREATE TABLE IF NOT EXISTS public.outreach_steps (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id varchar NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  step integer NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  product_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  gmail_draft_id text,
  gmail_message_id text,
  gmail_thread_id text,
  rfc_message_id text,
  draft_created_at timestamp,
  sent_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outreach_steps_prospect_id ON public.outreach_steps (prospect_id);

CREATE TABLE IF NOT EXISTS public.outreach_templates (
  step integer PRIMARY KEY,
  subject text NOT NULL,
  body text NOT NULL,
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gmail_connection (
  id text PRIMARY KEY,
  email text NOT NULL,
  refresh_token_enc text NOT NULL,
  scopes text NOT NULL,
  connected_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_connection ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.prospects, public.outreach_steps, public.outreach_templates, public.gmail_connection FROM anon, authenticated;
