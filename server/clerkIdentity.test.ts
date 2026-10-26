import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveSessionIdentity } from "./clerkIdentity";

const clerkId = "user_identity_test";
const identity = {
  id: clerkId,
  externalId: "legacy-subject",
  primaryEmailAddressId: "email_primary",
  emailAddresses: [{ id: "email_primary", emailAddress: "identity@example.com" }],
};

test("managed claims retain the original subject without an API request", async () => {
  const result = await resolveSessionIdentity(clerkId,
    { userId: "legacy-subject", email: "identity@example.com" },
    async () => { throw new Error("Unexpected identity lookup"); });
  assert.deepEqual(result, { userId: "legacy-subject", email: "identity@example.com" });
});

test("a migrated session without custom claims resolves its trusted external ID", async () => {
  const result = await resolveSessionIdentity(clerkId, {}, async id => {
    assert.equal(id, clerkId);
    return identity;
  });
  assert.deepEqual(result, { userId: "legacy-subject", email: "identity@example.com" });
});

test("a new account without custom claims provisions with the verified native ID", async () => {
  const result = await resolveSessionIdentity(clerkId, {}, async () => ({ ...identity, externalId: null }));
  assert.deepEqual(result, { userId: clerkId, email: "identity@example.com" });
});

test("missing email claims use Clerk's current primary email", async () => {
  const result = await resolveSessionIdentity(clerkId, { userId: "legacy-subject" }, async () => identity);
  assert.equal(result.email, "identity@example.com");
});

test("an account with no primary email does not substitute another email", async () => {
  const result = await resolveSessionIdentity(clerkId, {}, async () => ({ ...identity, primaryEmailAddressId: null }));
  assert.equal(result.email, null);
});

test("an unresolved or mismatched Clerk account cannot create a local account", async () => {
  await assert.rejects(resolveSessionIdentity(clerkId, {}, async () => undefined));
  await assert.rejects(resolveSessionIdentity(clerkId, {}, async () => ({ ...identity, id: "user_other" })));
});
