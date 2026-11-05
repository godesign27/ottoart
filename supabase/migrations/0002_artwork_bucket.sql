-- Private bucket for all uploaded images. Only the app server (secret key)
-- reads and writes it; storage.objects has RLS on with no policies, so the
-- anon/authenticated keys cannot list, read or upload. The server enforces
-- per-image public/private visibility before streaming a file.
insert into storage.buckets (id, name, public, file_size_limit)
values ('artwork', 'artwork', false, 52428800)
on conflict (id) do nothing;
