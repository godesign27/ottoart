import { clerkClient } from "@clerk/express";

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
