import { clerkClient } from "@clerk/express";

type IdentityUser = {
  id: string;
  externalId: string | null;
  primaryEmailAddressId: string | null;
  emailAddresses: Array<{ id: string; emailAddress: string }>;
};

async function lookupIdentity(clerkUserId: string): Promise<IdentityUser | undefined> {
  const result = await clerkClient.users.getUserList({ userId: [clerkUserId], limit: 1 });
  return result.data.find(user => user.id === clerkUserId);
}

export async function resolveSessionIdentity(
  clerkUserId: string,
  claims: { userId?: unknown; email?: unknown } | null | undefined,
  lookup: (id: string) => Promise<IdentityUser | undefined> = lookupIdentity,
): Promise<{ userId: string; email: string | null }> {
  const claimedId = typeof claims?.userId === "string" && claims.userId ? claims.userId : null;
  const claimedEmail = typeof claims?.email === "string" && claims.email ? claims.email : null;
  if (claimedId && claimedEmail) return { userId: claimedId, email: claimedEmail };

  // Managed instances normally include these claims. If either is absent,
  // resolve only by Clerk's cryptographically verified native ID, never by
  // client input or an email match. A migrated externalId must win over id.
  const user = await lookup(clerkUserId);
  if (!user || user.id !== clerkUserId) throw new Error("Authenticated Clerk account could not be resolved");
  const email = user.emailAddresses.find(address => address.id === user.primaryEmailAddressId)?.emailAddress;
  return { userId: user.externalId || user.id, email: email || null };
}

// Admin lists need other users' identities. Resolve in batches rather than
// reading stale local identity columns or making per-request getUser calls.
export async function getClerkEmails(ids: string[]): Promise<Map<string, string>> {
  const unique = Array.from(new Set(ids));
  const emails = new Map<string, string>();
  for (let offset = 0; offset < unique.length; offset += 100) {
    const batch = unique.slice(offset, offset + 100);
    const migrated = await clerkClient.users.getUserList({ externalId: batch, limit: 100 });
    for (const user of migrated.data) {
      const email = user.emailAddresses.find(address => address.id === user.primaryEmailAddressId)?.emailAddress;
      if (user.externalId && email) emails.set(user.externalId, email);
    }
    const nativeIds = batch.filter(id => !emails.has(id) && id.startsWith("user_"));
    if (!nativeIds.length) continue;
    const native = await clerkClient.users.getUserList({ userId: nativeIds, limit: 100 });
    for (const user of native.data) {
      const email = user.emailAddresses.find(address => address.id === user.primaryEmailAddressId)?.emailAddress;
      if (email) emails.set(user.id, email);
    }
  }
  return emails;
}
