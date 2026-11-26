import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { gmailConnection } from "@shared/schema";
import { decryptToken, encryptToken, signState, tokenKey, verifyState } from "./outreachCrypto";

// Gmail for Admin › Outreach, through Google's REST API with fetch (no SDK).
// Scopes: gmail.compose (create, update and send drafts) and gmail.metadata (read headers to see replies and sent
// drafts; never message bodies). The refresh token is stored encrypted and never sent to the browser.

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.metadata",
];
const ROW_ID = "default";
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

export class GmailError extends Error {
  constructor(message: string, readonly status = 502, readonly reconnect = false) { super(message); }
}

export function gmailConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const key = tokenKey();
  const missing = [
    !clientId && "GOOGLE_CLIENT_ID",
    !clientSecret && "GOOGLE_CLIENT_SECRET",
    !key && "OUTREACH_TOKEN_KEY (32 bytes, base64)",
  ].filter(Boolean) as string[];
  return { clientId, clientSecret, key, missing };
}

/** Where Google sends the admin back. Must be one of the redirect URIs on the Google Cloud OAuth client. */
export function redirectUri() {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI.trim();
  const base = process.env.LOCAL_DEV === "1"
    ? `http://localhost:${process.env.PORT || 5050}`
    : (process.env.SITE_URL || "https://ottoart.app").replace(/\/$/, "");
  return `${base}/api/admin/gmail/callback`;
}

// Nonces for "Connect Gmail" clicks that haven't come back yet; each works once.
const pendingNonces = new Map<string, number>();

export function connectUrl(): string {
  const { clientId, key, missing } = gmailConfig();
  if (missing.length) throw new GmailError(`Missing settings: ${missing.join(", ")}`, 400);
  const now = Date.now();
  for (const [n, at] of Array.from(pendingNonces)) if (now - at > 15 * 60 * 1000) pendingNonces.delete(n);
  const nonce = randomBytes(16).toString("base64url");
  pendingNonces.set(nonce, now);
  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: GMAIL_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent", // always returns a refresh token
    state: signState(nonce, key!),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Finish the connection after Google's redirect. Throws a GmailError with a message fit to show the admin. */
export async function completeConnect(code: string, state: string) {
  const { clientId, clientSecret, key, missing } = gmailConfig();
  if (missing.length) throw new GmailError(`Missing settings: ${missing.join(", ")}`, 400);
  const nonce = verifyState(state, key!);
  if (!nonce || !pendingNonces.delete(nonce)) throw new GmailError("This link expired. Start again from Outreach settings.", 400);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId!, client_secret: clientSecret!, redirect_uri: redirectUri(), grant_type: "authorization_code" }),
  });
  const token = await res.json().catch(() => ({}));
  if (!res.ok) throw new GmailError(`Google refused the connection (${token.error ?? res.status}).`, 400);
  if (!token.refresh_token) throw new GmailError("Google didn't return a refresh token. Remove Otto Art's access in your Google account and connect again.", 400);
  const granted = String(token.scope ?? "").split(" ");
  const absent = GMAIL_SCOPES.filter((s) => !granted.includes(s));
  if (absent.length) {
    await revoke(token.refresh_token);
    throw new GmailError("Both Gmail permissions are needed (create drafts, and see message headers for replies). Connect again and tick both.", 400);
  }
  const profile = await gmailFetch(token.access_token, "/profile");
  await db.insert(gmailConnection)
    .values({ id: ROW_ID, email: profile.emailAddress, refreshTokenEnc: encryptToken(token.refresh_token, key!), scopes: granted.join(" ") })
    .onConflictDoUpdate({
      target: gmailConnection.id,
      set: { email: profile.emailAddress, refreshTokenEnc: encryptToken(token.refresh_token, key!), scopes: granted.join(" "), connectedAt: new Date() },
    });
  accessCache = { token: token.access_token, expiresAt: Date.now() + (Number(token.expires_in) - 60) * 1000 };
  return profile.emailAddress as string;
}

/** What the admin may see: never a token. */
export async function connectionStatus() {
  const { missing } = gmailConfig();
  const [row] = await db.select({ email: gmailConnection.email, connectedAt: gmailConnection.connectedAt }).from(gmailConnection).where(eq(gmailConnection.id, ROW_ID));
  return { configured: missing.length === 0, missing, connected: !!row, email: row?.email ?? null, connectedAt: row?.connectedAt ?? null, redirectUri: redirectUri() };
}

async function revoke(token: string) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST" }).catch(() => undefined);
}

export async function disconnect() {
  const [row] = await db.select().from(gmailConnection).where(eq(gmailConnection.id, ROW_ID));
  const key = tokenKey();
  if (row && key) {
    try { await revoke(decryptToken(row.refreshTokenEnc, key)); } catch { /* already unusable */ }
  }
  await db.delete(gmailConnection).where(eq(gmailConnection.id, ROW_ID));
  accessCache = null;
}

let accessCache: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<{ token: string; email: string }> {
  const { clientId, clientSecret, key, missing } = gmailConfig();
  if (missing.length) throw new GmailError(`Gmail isn't set up: missing ${missing.join(", ")}`, 400);
  const [row] = await db.select().from(gmailConnection).where(eq(gmailConnection.id, ROW_ID));
  if (!row) throw new GmailError("Connect Gmail in Outreach settings first.", 400, true);
  if (accessCache && accessCache.expiresAt > Date.now()) return { token: accessCache.token, email: row.email };
  let refresh: string;
  try { refresh = decryptToken(row.refreshTokenEnc, key!); } catch {
    throw new GmailError("The saved Gmail connection can't be read (OUTREACH_TOKEN_KEY changed?). Connect Gmail again.", 400, true);
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: refresh, client_id: clientId!, client_secret: clientSecret!, grant_type: "refresh_token" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.error === "invalid_grant") throw new GmailError("Gmail access was removed or expired. Connect Gmail again.", 400, true);
    throw new GmailError(`Google didn't renew access (${data.error ?? res.status}).`);
  }
  accessCache = { token: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) - 60) * 1000 };
  return { token: data.access_token, email: row.email };
}

async function gmailFetch(token: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}) },
  });
  if (res.status === 404) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) accessCache = null;
    throw new GmailError(`Gmail error ${res.status}: ${data?.error?.message ?? "request failed"}`, res.status === 401 || res.status === 403 ? 400 : 502, res.status === 401);
  }
  return data;
}

async function call(path: string, init?: RequestInit) {
  const { token } = await accessToken();
  return gmailFetch(token, path, init);
}

export async function connectedEmail() {
  return (await accessToken()).email;
}

export interface DraftRef { draftId: string; messageId: string; threadId: string }

/** Create a draft, or replace the text of an existing one. Returns null only if `draftId` no longer exists. */
export async function saveDraft(raw: string, opts: { draftId?: string | null; threadId?: string | null }): Promise<DraftRef> {
  const message: Record<string, string> = { raw };
  if (opts.threadId) message.threadId = opts.threadId;
  if (opts.draftId) {
    const updated = await call(`/drafts/${encodeURIComponent(opts.draftId)}`, { method: "PUT", body: JSON.stringify({ id: opts.draftId, message }) });
    if (updated) return { draftId: updated.id, messageId: updated.message.id, threadId: updated.message.threadId };
  }
  const created = await call("/drafts", { method: "POST", body: JSON.stringify({ message }) });
  return { draftId: created.id, messageId: created.message.id, threadId: created.message.threadId };
}

/** Send an existing draft. Returns null if the draft is gone (sent or deleted in Gmail). */
export async function sendDraft(draftId: string): Promise<{ messageId: string; threadId: string } | null> {
  const sent = await call("/drafts/send", { method: "POST", body: JSON.stringify({ id: draftId }) });
  return sent ? { messageId: sent.id, threadId: sent.threadId } : null;
}

export async function draftExists(draftId: string) {
  return !!(await call(`/drafts/${encodeURIComponent(draftId)}?format=minimal`));
}

export interface ThreadMessage {
  id: string;
  labelIds: string[];
  internalDate: number;
  from: string;
  messageIdHeader: string | null;
}

/** A thread's messages with headers only. Null if the thread is gone. */
export async function threadMessages(threadId: string): Promise<ThreadMessage[] | null> {
  const q = new URLSearchParams({ format: "metadata" });
  for (const h of ["From", "Message-ID"]) q.append("metadataHeaders", h);
  const thread = await call(`/threads/${encodeURIComponent(threadId)}?${q}`);
  if (!thread) return null;
  return (thread.messages ?? []).map((m: any) => {
    const header = (name: string) => m.payload?.headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value ?? null;
    return { id: m.id, labelIds: m.labelIds ?? [], internalDate: Number(m.internalDate), from: header("From") ?? "", messageIdHeader: header("Message-ID") };
  });
}

/** The Message-ID header Gmail gave a sent message, for In-Reply-To on the follow-up. */
export async function messageIdHeader(messageId: string): Promise<string | null> {
  const q = new URLSearchParams({ format: "metadata", metadataHeaders: "Message-ID" });
  const m = await call(`/messages/${encodeURIComponent(messageId)}?${q}`);
  return m?.payload?.headers?.find((h: any) => h.name.toLowerCase() === "message-id")?.value ?? null;
}
