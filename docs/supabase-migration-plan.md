# Supabase migration plan

Branch: `supabase-migration`
Goal: move Otto Art off Replit-only services (database, image storage and sign-in) onto Supabase. The site keeps working the same way for shoppers and for the admin.

## Why

| Replit piece | Problem | Supabase replacement |
|---|---|---|
| Replit Auth | Shoppers must grant access to a **Replit account** to sign in. Most buyers don't have one. | Supabase Auth: email magic link, Google, and others |
| Replit Object Storage | Only reachable from inside Replit, so it ties hosting to Replit | Supabase Storage (public bucket) |
| Replit/Neon Postgres | Fine as a database, but kept on Replit with no backups we control | Supabase Postgres, the same engine, so the data copies across as-is |

What stays the same: Postgres, Drizzle, `shared/schema.ts`, Stripe, and the React frontend apart from the sign-in screens.

## Current footprint (measured on the local copy)

- 27 tables. The public catalogue (39 products, 4 categories, 3 gallery items, 2 events, settings) is about 9 MB.
- 85 catalogue images, 166 MB. The live bucket may also hold private or orphaned files that the public API doesn't list.
- Image URLs are stored in rows as `/objects/uploads/<id>`.
- The server reads the signed-in user in 11 places (`req.user.claims.sub` / `.email`).
- `users.id` is `varchar`, so Supabase Auth's UUIDs fit without a schema change.

## Phases

Each phase can ship and be tested on its own. The order goes from lowest to highest risk.

### Phase 1: Database (low risk)

1. Create the Supabase project in the US region closest to the server.
2. Connection: use Supabase's **pooled** connection string (transaction mode, port 6543) with the `pg` driver. `server/db.ts` already has a `pg` path for local dev. Generalise it so the driver is chosen by the connection string instead of by `LOCAL_DEV`.
3. Schema: create it from `shared/schema.ts` with `drizzle-kit`. Switch from `push` to `generate` + `migrate` so that future changes are reviewed SQL files kept in git.
4. **Lock down the Data API.** Supabase automatically publishes every table through its REST API using the public anon key. The app only talks to the database from the server, so turn on Row Level Security on every table **with no policies**. That blocks all API access while the server's direct connection keeps working. **Do this before loading real customer data.**
5. Data: in production, `pg_dump` from Replit's `DATABASE_URL` and `pg_restore` into Supabase. This moves everything, including orders, customers and messages. For testing, use `npm run import:live` (public data only).

### Phase 2: Image storage (low–medium risk)

1. Create a public bucket, `artwork`.
2. **Keep the URLs that are already stored.** Rows hold `/objects/uploads/<id>`, so the server keeps serving that path and fetches from Supabase Storage (or redirects to its public URL). No rows need rewriting.
3. Uploads: replace the Replit "signed URL" call with Supabase's `createSignedUploadUrl`. The upload flow in the browser (get a URL, PUT the file, finalize) stays the same.
4. Copy the images: a script downloads each `/objects/uploads/*` file (from the live site, or from Replit's Object Storage pane for private ones) and uploads it to the bucket.
5. Files: `server/objectStorage.ts`, `server/objectAcl.ts` (public/private moves to the bucket level), and the two upload routes in `server/routes.ts`.

### Phase 3: Sign-in (medium risk, the main piece of work)

1. Turn on Supabase Auth with email magic link, plus Google if wanted.
2. Frontend: replace the `/api/login` links with a sign-in page that uses `@supabase/supabase-js`. `useAuth` reads the Supabase session.
3. Server: check the Supabase access token sent with each request and look up the matching row in `users`. Add a small helper, `getUserId(req)`, and replace the 11 `req.user.claims.*` reads with it. `isAuthenticated` and `isAdmin` keep the same names, so the routes don't change.
4. **Linking existing users:** add a `users.auth_user_id` column. On someone's first Supabase sign-in, match them by **email** to their existing row and save the link, so their favorites, subscriptions and orders follow them. The admin keeps `role = 'admin'`.
5. Remove `server/replitAuth.ts`, `openid-client`, `passport`, and the `sessions` table once the switch is done.

### Phase 4: Hosting (decide separately)

Once phases 1–3 are done, nothing requires Replit. The Express server can keep running on Replit or move to Render, Railway or Fly with almost no changes. Moving to Vercel would mean splitting the API into serverless functions, which is a bigger job, so treat it as its own decision.

## Testing (on this branch, before touching production)

1. Create a **separate test project** in Supabase.
2. Run phase 1 against it: schema, RLS lock-down, then `npm run import:live`.
3. Run the app locally pointed at the test project and check:
   - The shop, product pages, gallery and events load the same data.
   - Admin sign-in works. Signed-out visitors get 401 and regular users get 403 on admin routes, as before.
   - Admin create, edit and delete of a product actually writes to Supabase.
   - The anon key **cannot** read `users` or `orders` through the Supabase REST API (this confirms the RLS lock-down).
4. Repeat for phases 2 and 3 as each one is built.

## Cutover (production)

1. Announce a short maintenance window and pause checkout so no orders are lost mid-copy.
2. Take a final `pg_dump` of the Replit database, restore it to Supabase, and compare row counts table by table.
3. Copy any images uploaded since the test copy.
4. Switch the production secrets (`DATABASE_URL`, Supabase URL and keys) and redeploy.
5. Smoke test: browse, admin sign-in, a test-mode Stripe order, an image upload.
6. **Rollback:** keep the Replit database and bucket untouched for at least 2 weeks. Rolling back means restoring the old secrets.

## Ongoing

- Backups: Supabase's plan backups plus a scheduled `pg_dump` to storage we control.
- Schema changes only go through `drizzle-kit generate` migrations committed to git.

## Open questions

- Hosting after the move (phase 4)?
- Which sign-in methods: email only, or Google too?
- Supabase plan: free projects pause when idle, so production should be on a paid plan. Check current pricing before cutover.
- Are there private images in the Replit bucket that aren't linked from public pages? Check the Object Storage pane.
