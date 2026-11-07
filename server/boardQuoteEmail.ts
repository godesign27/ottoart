import { QUOTE_INTENTS } from "@shared/buyerBoards";

// The email Otto gets when a buyer sends one of their boards for a quote. Every buyer-typed value is escaped,
// and the subject is one line so a board name can't inject extra headers.

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim().slice(0, 120);

export interface BoardQuoteForEmail {
  boardName: string;
  intent: keyof typeof QUOTE_INTENTS;
  location: string;
  timing?: string | null;
  phone?: string | null;
  message?: string | null;
  buyerName: string | null;
  buyerEmail: string | null;
  items: { name: string; dimensions?: string | null; note?: string | null }[];
  adminUrl: string;
}

export function boardQuoteNotification(q: BoardQuoteForEmail) {
  const who = q.buyerName || q.buyerEmail || "A buyer";
  const rows: Array<[string, string | null | undefined]> = [
    ["From", [q.buyerName, q.buyerEmail].filter(Boolean).join(", ")],
    ["Phone", q.phone],
    ["Looking to", QUOTE_INTENTS[q.intent]],
    ["Location", q.location],
    ["Timing", q.timing],
  ];
  const pieces = q.items.map((i) =>
    `<li style="margin:0 0 6px">${escapeHtml(i.name)}${i.dimensions ? ` <span style="color:#666">(${escapeHtml(i.dimensions)})</span>` : ""}` +
    `${i.note ? `<br><span style="color:#444">Note: ${escapeHtml(i.note)}</span>` : ""}</li>`).join("");

  return {
    subject: `Board for a quote: ${oneLine(q.boardName)} (${q.items.length} ${q.items.length === 1 ? "artwork" : "artworks"}) from ${oneLine(who)}`,
    replyTo: q.buyerEmail ?? undefined,
    html: `<h2 style="margin:0 0 16px">${escapeHtml(who)} sent a board for a quote</h2>
      <table cellpadding="4" style="border-collapse:collapse">
        <tr><td style="color:#666;padding-right:16px">Board</td><td>${escapeHtml(q.boardName)}</td></tr>
        ${rows.filter(([, v]) => v).map(([k, v]) => `<tr><td style="color:#666;padding-right:16px">${k}</td><td>${escapeHtml(v)}</td></tr>`).join("")}
      </table>
      ${q.message ? `<h3 style="margin:24px 0 8px">Message</h3><p style="white-space:pre-wrap;margin:0">${escapeHtml(q.message)}</p>` : ""}
      <h3 style="margin:24px 0 8px">Artworks</h3>
      <ol style="margin:0;padding-left:20px">${pieces}</ol>
      <p style="margin-top:24px">${q.buyerEmail ? "Reply to this email to answer them directly, or see" : "See"} the board in the admin: <a href="${escapeHtml(q.adminUrl)}">${escapeHtml(q.adminUrl)}</a></p>`,
  };
}
