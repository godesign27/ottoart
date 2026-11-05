# Supabase administrator upload verification

## Status: available checks passed; browser verification deferred by user

Checked on November 5, 2026 against the development preview. No production
operations were performed.

The user chose to perform the upload test on the live site rather than wait
for browser-testing access. This closes the revised task as a verification
handoff, **not** as a successful authenticated upload test or a deployment.
This isolated task copy was not published.

The required browser tester could not start: its invocation rejected the
`testing` configuration as unavailable. The sanctioned `signInClerkUser`
helper is scoped to that browser-testing environment. Authentication was not
bypassed or weakened to work around this limitation.

## Confirmed checks

- The existing preview workflow started successfully with
  `DATABASE_URL="$SUPABASE_DATABASE_URL" npm run dev`.
- The storefront rendered in a signed-out screenshot.
- Signed-out `POST /api/objects/upload` returned HTTP 401 with
  `{"message":"Unauthorized"}`.
- Signed-out `PUT /api/objects/finalize` returned HTTP 401 with the same response.
- `npm run check` passed.
- `npm run build` passed. Non-blocking warnings: large JavaScript bundle and
  outdated Browserslist browser-support data.
- `node --import tsx --test server/clerkIdentity.test.ts server/adminRoutes.test.ts server/payment-utils.test.ts`
  passed all 19 tests. These cover route guards, identity resolution, payment
  utilities, and webhook signature handling, not a real Stripe checkout.

These checks do **not** establish successful authenticated uploads, storage
persistence, or visibility enforcement for a newly uploaded image.

## Live-site self-test checklist

1. Sign in on the live site with an administrator account. Development Clerk
   accounts and sessions do not establish production access.
2. In Gallery, open the form to add a **new** image. Do not open an existing
   artwork for editing. Choose a small, clearly recognizable test PNG.
3. Confirm the upload-success message appears and the preview displays
   correctly. In browser developer tools, confirm upload URL creation,
   the Supabase image PUT, and finalization succeed. Do not share the signed
   upload URL or session credentials.
4. Record only the finalized `/objects/uploads/<uuid>` path. Open that path
   on the live site's origin in a private/signed-out window and confirm the
   public image loads.
5. Cancel the add form without saving a gallery item. **Uploading happens
   immediately; canceling the form does not delete the stored image.**
   Keep the exact path for cleanup; do not delete unrelated images.
6. Public/private ACL testing and permanent storage cleanup require the
   authenticated API/storage procedure below; there is no private-visibility
   control or stored-object delete operation in this add form. Those checks
   remain unverified until performed. Delete only the recorded test object
   and its matching ACL sidecar using authorized storage administration.

The separate Stripe checkout/subscription test task remains pending. Passing
the utility tests above does not verify live checkout, subscription changes,
or production configuration.

## Remaining browser journey

1. Use `signInClerkUser` with a unique, isolated development test account.
   Resolve its application identity through `/api/me`. Promote only that
   newly created account in the Supabase application database, using its
   exact resolved ID, and confirm the admin role after refreshing.
2. Open the add-item form at `/admin/gallery`. Upload a tiny test PNG using
   `input[data-testid="input-file"]`. Do not save a gallery item, edit an
   existing item, or save site settings.
3. Record every newly allocated object path immediately in a cleanup manifest.
   Do not retain signed URLs, authentication tokens, or credentials.
4. Confirm successful upload-URL creation, direct Supabase PUT, finalization
   to `/objects/uploads/<uuid>`, success feedback, and a decoded image preview.
5. Confirm an anonymous, uncached GET returns the PNG bytes and image content
   type when public. Finalize only the new image as private and confirm an
   anonymous, uncached GET returns 403. Inspect its exact ACL sidecar for
   persistence. Restore public visibility and confirm anonymous reads again.
6. Demote only the test account and confirm upload and finalization return
   403 for a signed-in non-admin.
7. In cleanup, delete only the exact manifest-listed image and its
   `_meta/<object path>.json` sidecar. Confirm both are absent and the app
   image route returns 404. Remove only the new application user and Clerk
   test identity, confirming cleanup even if a check fails.

## Visibility interpretation

Source inspection shows that `/objects/*` intentionally omits the signed-in
user ID when checking ACLs. Currently a private image is therefore denied
through that route even to its signed-in owner. The remaining test should
record this behavior, not change authentication or silently assume
owner-authorized reads are supported.

## Safety and cleanup

No test identities, database rows, uploads, or ACL sidecars were created in
this attempt. No artwork or application code was changed. There are no
new test resources requiring cleanup.
