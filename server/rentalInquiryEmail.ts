import { formatCents } from "@shared/rentalPricing";

// The email Otto gets when someone sends the art rental inquiry form. Every visitor-typed value is escaped,
// and the subject is kept to one line so a name can't inject extra headers.

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim().slice(0, 120);

const INTEREST: Record<string, string> = { originals: "Originals", prints: "Prints", both: "Both", "not-sure": "Not sure" };
const TERM: Record<string, string> = { "3": "3 months", "6": "6 months", "12": "12 months", "not-sure": "Not sure" };

export interface InquiryForEmail {
  reference: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  location: string;
  spaceType?: string | null;
  artworkInterest: string;
  artworkCount?: number | null;
  preferredTerm: string;
  preferredStartDate?: string | null;
  details?: string | null;
  estimate?: {
    type?: string; term?: number; count?: number; referenceValueCents?: number; artworkName?: string; pricingVersion?: string;
    result?: { status: string; monthlySubtotalCents?: number; termSubtotalCents?: number; discountBps?: number } | null;
  } | null;
}

export function rentalInquiryNotification(q: InquiryForEmail, adminUrl: string) {
  const rows: Array<[string, string | null | undefined]> = [
    ["Reference", q.reference],
    ["Name", q.name],
    ["Email", q.email],
    ["Company", q.company],
    ["Phone", q.phone],
    ["Location", q.location],
    ["Space", q.spaceType],
    ["Interest", INTEREST[q.artworkInterest] ?? q.artworkInterest],
    ["Artworks", q.artworkCount != null ? String(q.artworkCount) : "Not sure"],
    ["Term", TERM[q.preferredTerm] ?? q.preferredTerm],
    ["Preferred start", q.preferredStartDate],
  ];

  let estimate = "";
  const e = q.estimate;
  if (e?.type && e.term && e.count && e.referenceValueCents) {
    const basis = `${e.count} × ${e.type}${e.artworkName ? ` (${e.artworkName})` : ""}, ${e.term} months, reference ${formatCents(e.referenceValueCents)} each`;
    const result = e.result?.status === "priced" && e.result.monthlySubtotalCents != null
      ? `${formatCents(e.result.monthlySubtotalCents)} a month, ${formatCents(e.result.termSubtotalCents ?? 0)} over the term${e.result.discountBps ? ` (${e.result.discountBps / 100}% collection discount)` : ""}`
      : e.result?.status === "custom" ? "31+ artworks: custom quote" : "";
    estimate = `<h3 style="margin:24px 0 8px">Illustrative estimate (pricing ${escapeHtml(e.pricingVersion ?? "")})</h3>
      <p style="margin:0">${escapeHtml(basis)}</p>${result ? `<p style="margin:4px 0 0">${escapeHtml(result)}</p>` : ""}
      <p style="margin:4px 0 0;color:#666">Rental fees only, recalculated on the server. Not a quote.</p>`;
  }

  const company = q.company ? `, ${oneLine(q.company)}` : "";
  return {
    subject: `Art rental inquiry ${q.reference}: ${oneLine(q.name)}${company}`,
    replyTo: q.email,
    html: `<h2 style="margin:0 0 16px">New art rental inquiry</h2>
      <table cellpadding="4" style="border-collapse:collapse">
        ${rows.filter(([, v]) => v).map(([k, v]) => `<tr><td style="color:#666;padding-right:16px">${k}</td><td>${escapeHtml(v)}</td></tr>`).join("")}
      </table>
      ${q.details ? `<h3 style="margin:24px 0 8px">Project details</h3><p style="white-space:pre-wrap;margin:0">${escapeHtml(q.details)}</p>` : ""}
      ${estimate}
      <p style="margin-top:24px">Reply to this email to answer ${escapeHtml(q.name)} directly, or see it in the admin: <a href="${escapeHtml(adminUrl)}">${escapeHtml(adminUrl)}</a></p>`,
  };
}
