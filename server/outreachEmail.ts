import { randomBytes } from "node:crypto";
import { outreachHtml } from "@shared/outreach";

// Builds the raw RFC 2822 message Gmail's API takes (base64url in `raw`). Pure: no network, tested in outreachEmail.test.ts.

export interface OutreachMime {
  to: { email: string; name?: string | null };
  subject: string;
  text: string;
  /** For the follow-up: the Message-ID header of Email 1, so mail apps thread it as a reply. */
  inReplyTo?: string | null;
}

const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

/** RFC 2047 encoded-word when a header has anything outside printable ASCII. */
function headerText(s: string) {
  const clean = oneLine(s);
  return /^[\x20-\x7e]*$/.test(clean) ? clean : `=?UTF-8?B?${Buffer.from(clean, "utf8").toString("base64")}?=`;
}

function address(to: OutreachMime["to"]) {
  const email = oneLine(to.email);
  if (!/^[^\s@<>",;]+@[^\s@<>",;]+$/.test(email)) throw new Error("Invalid recipient address");
  const name = to.name ? oneLine(to.name).replace(/["\\]/g, "") : "";
  if (!name) return email;
  return /^[\x20-\x7e]*$/.test(name) ? `"${name}" <${email}>` : `${headerText(name)} <${email}>`;
}

/** Base64 body lines of 76 characters, as MIME requires. */
const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64").replace(/.{76}/g, "$&\r\n");

export function buildOutreachMime(msg: OutreachMime, boundary = `otto-${randomBytes(12).toString("hex")}`): string {
  const headers = [
    `To: ${address(msg.to)}`,
    `Subject: ${headerText(msg.subject)}`,
    "MIME-Version: 1.0",
  ];
  if (msg.inReplyTo) {
    const ref = oneLine(msg.inReplyTo);
    if (!/^<[^<>\s]+>$/.test(ref)) throw new Error("Invalid Message-ID to reply to");
    headers.push(`In-Reply-To: ${ref}`, `References: ${ref}`);
  }
  headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  const text = msg.text.replace(/\r?\n/g, "\r\n");
  return [
    ...headers,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(text),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(`<div dir="ltr">${outreachHtml(msg.text)}</div>`),
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

/** The `raw` field Gmail's drafts and messages endpoints take. */
export const toGmailRaw = (mime: string) => Buffer.from(mime, "utf8").toString("base64url");
