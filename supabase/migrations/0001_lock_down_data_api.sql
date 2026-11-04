-- Applied to the OttoArt Supabase project after migrations/0000_baseline.sql.
-- The app reads/writes the database only from its own server over a direct
-- connection, so the Supabase Data API (REST/GraphQL via anon/authenticated
-- keys) is shut off completely:
--   1. RLS on every public table with NO policies -> no rows readable/writable
--   2. anon/authenticated lose all privileges -> tables not even discoverable
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
-- Re-run this whole file after adding new tables (step 1 is per-table).
