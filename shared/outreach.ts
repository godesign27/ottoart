import { z } from "zod";

// Corporate outreach rules, shared by the server and Admin › Outreach so the preview and the Gmail draft always agree.
// Nothing here sends mail: these are pure functions, tested in shared/outreach.test.ts.

export const OUTREACH_STATUSES = [
  { value: "not_contacted", label: "Not contacted" },
  { value: "email1_sent", label: "Email 1 sent" },
  { value: "followup_sent", label: "Follow-up sent" },
  { value: "replied", label: "Replied" },
  { value: "meeting", label: "Meeting" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "opted_out", label: "Opted out" },
] as const;
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number]["value"];
export const STATUS_VALUES = OUTREACH_STATUSES.map((s) => s.value) as [OutreachStatus, ...OutreachStatus[]];
export const statusLabel = (v: string) => OUTREACH_STATUSES.find((s) => s.value === v)?.label ?? v;

/** Statuses that end the sequence: no follow-up is due and no new draft is offered. */
export const CLOSED_STATUSES: readonly OutreachStatus[] = ["replied", "meeting", "won", "lost", "opted_out"];

export const OUTREACH_CATEGORIES = [
  "Art Consultant", "Interior Design", "Architecture", "Hospitality",
  "Healthcare & Wellness", "Real Estate / Property", "Corporate Office",
] as const;

/** The spreadsheet's shorter names for two categories. */
const CATEGORY_ALIASES: Record<string, string> = {
  healthcare: "Healthcare & Wellness",
  "real estate": "Real Estate / Property",
};

export function normalizeCategory(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  if (CATEGORY_ALIASES[key]) return CATEGORY_ALIASES[key];
  return OUTREACH_CATEGORIES.find((c) => c.toLowerCase() === key) ?? null;
}

/** One sentence per category for {{category_line}}, from the outreach spreadsheet. Editable in Templates. */
export const DEFAULT_CATEGORY_LINES: Record<string, string> = {
  "Art Consultant": "I'd love to be considered for your artist roster for upcoming hospitality, healthcare or office projects.",
  "Interior Design": "For commercial projects that need art, I can work to your palette and sizes, and I'm open to discussing trade pricing.",
  "Architecture": "For projects nearing completion, I can propose pieces sized for lobbies and common areas.",
  "Hospitality": "Local, original work gives guests something they won't see in any other hotel.",
  "Healthcare & Wellness": "Original art can make waiting rooms and patient areas feel calmer and more personal.",
  "Real Estate / Property": "In new or repositioned buildings, art in the lobby and amenity spaces helps on leasing tours.",
  "Corporate Office": "Leasing lets you rotate work every few months without a large up-front purchase.",
};

// The two emails from the spreadsheet. The footer (postal address and opt-out line) is not part of the template:
// the server always adds it, so a template edit can't remove it.
export const DEFAULT_TEMPLATES: Record<1 | 2, { subject: string; body: string }> = {
  1: {
    subject: "Original Boulder art for {{company}}",
    body: [
      "Hi {{first_name}},",
      "",
      "I'm Timothy, a Boulder artist who works as Otto (Otto Artwork). I'm reaching out to a few local companies and design teams about original art for offices, lobbies and guest spaces. {{category_line}}",
      "",
      "I put together a short selection I think would suit {{company}}, with sizes and pricing:",
      "{{board_link}}",
      "",
      "Works can be bought, commissioned to fit a space, or leased. I'm happy to bring a couple of pieces by. Would a 15-minute visit in the next two weeks work?",
      "",
      "Thanks,",
      "Timothy (Otto)",
    ].join("\n"),
  },
  2: {
    subject: "Re: Original Boulder art for {{company}}",
    body: [
      "Hi {{first_name}},",
      "",
      "Following up on my note last week. I added one more piece to your selection that I think suits {{company}} especially well: {{featured_work}}.",
      "",
      "Here's the link again: {{board_link}}",
      "",
      "If art isn't on your plate right now, who would be the right person to ask?",
      "",
      "Thanks,",
      "Timothy (Otto)",
    ].join("\n"),
  },
};

export const MERGE_FIELDS = {
  first_name: "The contact's first name",
  company: "The company name",
  board_link: "The link to their board on ottoart.app",
  category_line: "The sentence for their category",
  featured_work: "The last work on their board, with its size",
} as const;
export type MergeField = keyof typeof MERGE_FIELDS;
export type MergeValues = Partial<Record<MergeField, string | null | undefined>>;

const FIELD = /\{\{\s*([a-z_]+)\s*\}\}/g;

/**
 * Fill {{fields}} in a template. A field that is unknown, or whose value is empty, is reported rather than left
 * blank, so a draft never goes out as "Hi ,". The caller must refuse to draft while `problems` is not empty.
 */
export function mergeTemplate(template: string, values: MergeValues) {
  const missing = new Set<string>();
  const unknown = new Set<string>();
  const text = template.replace(FIELD, (whole, name: string) => {
    if (!(name in MERGE_FIELDS)) { unknown.add(name); return whole; }
    const value = values[name as MergeField]?.trim();
    if (!value) { missing.add(name); return whole; }
    return value;
  });
  return { text, missing: Array.from(missing), unknown: Array.from(unknown) };
}

export const OPT_OUT_LINE = "If this isn't relevant, reply \"no thanks\" and I won't write again.";

/** The footer every outreach email ends with (CAN-SPAM: a postal address and a way to opt out). */
export function outreachFooter(postalAddress: string) {
  return `Otto Artwork · ${postalAddress.trim().replace(/\s*\n\s*/g, ", ")}\n${OPT_OUT_LINE}`;
}

/** First word of a contact name ("Dr. Ana Ruiz" → "Ana"). */
export function firstNameOf(contactName: string | null | undefined): string {
  const words = (contactName ?? "").trim().split(/\s+/).filter(Boolean);
  const titles = /^(mr|mrs|ms|mx|dr|prof)\.?$/i;
  return words.find((w) => !titles.test(w)) ?? "";
}

export interface ComposeInput {
  subject: string;
  body: string;
  values: MergeValues;
  postalAddress: string | null | undefined;
}

/** Merge subject and body and add the footer. `problems` lists everything that blocks a draft, in plain words. */
export function composeOutreachEmail({ subject, body, values, postalAddress }: ComposeInput) {
  const s = mergeTemplate(subject, values);
  const b = mergeTemplate(body, values);
  const problems: string[] = [];
  const missing = Array.from(new Set(s.missing.concat(b.missing)));
  const unknown = Array.from(new Set(s.unknown.concat(b.unknown)));
  for (const f of missing) problems.push(`{{${f}}} has no value for this prospect`);
  for (const f of unknown) problems.push(`{{${f}}} isn't a merge field`);
  if (!postalAddress?.trim()) problems.push("Add your business postal address in Outreach settings");
  const subjectLine = s.text.replace(/[\r\n]+/g, " ").trim();
  if (!subjectLine) problems.push("The subject is empty");
  const footer = postalAddress?.trim() ? outreachFooter(postalAddress) : "";
  const text = footer ? `${b.text.trimEnd()}\n\n${footer}` : b.text.trimEnd();
  return { subject: subjectLine, text, problems };
}

/** The email as simple HTML: escaped text, paragraphs, and clickable links. */
export function outreachHtml(text: string) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const link = (s: string) => s.replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)]/g, (u) => `<a href="${u}">${u}</a>`);
  return text.split(/\n{2,}/).map((p) => `<p>${link(esc(p)).replace(/\n/g, "<br>")}</p>`).join("\n");
}

// ---------- Sequence timing ----------

export const FOLLOW_UP_BUSINESS_DAYS = 5;

/** Add business days (Monday to Friday; holidays are not counted). */
export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  let left = days;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d;
}

export interface SequenceState {
  status: string;
  optedOutAt?: Date | string | null;
  step1SentAt?: Date | string | null;
  step2DraftedOrSent?: boolean;
}

/** When the follow-up becomes due, or null when it never will (not sent yet, already followed up, or closed). */
export function followUpDueAt(state: SequenceState): Date | null {
  if (!state.step1SentAt || state.step2DraftedOrSent || state.optedOutAt) return null;
  if ((CLOSED_STATUSES as readonly string[]).includes(state.status)) return null;
  return addBusinessDays(new Date(state.step1SentAt), FOLLOW_UP_BUSINESS_DAYS);
}

export function isFollowUpDue(state: SequenceState, now: Date = new Date()): boolean {
  const at = followUpDueAt(state);
  return !!at && at.getTime() <= now.getTime();
}

const EMAIL = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/;
export const isEmail = (s: string | null | undefined) => !!s && EMAIL.test(s.trim());

/**
 * Why a draft or send for this step must be refused, or null when it may go ahead.
 * Opted out always blocks. Step 2 needs step 1 sent and, unless `early` is set, the 5 business days to have passed.
 */
export function blockReason(
  prospect: { status: string; optedOutAt?: Date | string | null; email?: string | null },
  step: 1 | 2,
  seq: { step1SentAt?: Date | string | null; step2DraftedOrSent?: boolean },
  opts: { now?: Date; early?: boolean } = {},
): string | null {
  if (prospect.optedOutAt || prospect.status === "opted_out") return "This prospect opted out. Nothing can be drafted or sent to them.";
  if (!isEmail(prospect.email)) return "Add a valid email address first.";
  if (step === 2) {
    if (!seq.step1SentAt) return "Email 1 hasn't been sent yet.";
    if (!opts.early && !isFollowUpDue({ status: prospect.status, step1SentAt: seq.step1SentAt }, opts.now)) {
      return "The follow-up isn't due yet (5 business days after Email 1).";
    }
  }
  return null;
}

// ---------- Weeks ----------

/** The Monday (YYYY-MM-DD, UTC) of the week containing this date. */
export function weekOf(d: Date): string {
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const wd = day.getUTCDay();
  day.setUTCDate(day.getUTCDate() - ((wd + 6) % 7));
  return day.toISOString().slice(0, 10);
}

/** A spreadsheet date ("46356", "11/30/2026", "2026-11-30") as YYYY-MM-DD, or null. */
export function parseSheetDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(s)) * 86_400_000);
    return d.toISOString().slice(0, 10);
  }
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (m) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[1], +m[2]);
  return null;
}

function iso(y: number, mo: number, d: number): string | null {
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}

// ---------- CSV import ----------

/** RFC 4180 CSV: quoted fields, doubled quotes, commas and line breaks inside quotes, a leading BOM. */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

/** Column names accepted on import, including the spreadsheet's own headers. */
const HEADER_ALIASES: Record<string, ProspectField> = {
  company: "company", organization: "company", organisation: "company",
  category: "category",
  "contact name": "contactName", contact: "contactName", name: "contactName",
  title: "title", role: "title",
  email: "email", "contact email": "email",
  website: "website", url: "website",
  city: "city", location: "city",
  "why they fit / hook": "hook", "why they fit": "hook", hook: "hook",
  notes: "notes",
  "week of": "plannedWeek", "planned week": "plannedWeek",
  status: "status",
};
type ProspectField = "company" | "category" | "contactName" | "title" | "email" | "website" | "city" | "hook" | "notes" | "plannedWeek" | "status";

export const prospectInputSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(200),
  category: z.string().trim().min(1, "Category is required").max(80),
  contactName: z.string().trim().max(120).nullish(),
  title: z.string().trim().max(120).nullish(),
  email: z.string().trim().max(254).nullish().refine((v) => !v || isEmail(v), "Not a valid email address"),
  website: z.string().trim().max(300).nullish(),
  city: z.string().trim().max(120).nullish(),
  hook: z.string().trim().max(2000).nullish(),
  notes: z.string().trim().max(5000).nullish(),
  plannedWeek: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  status: z.enum(STATUS_VALUES).optional(),
});
export type ProspectInput = z.infer<typeof prospectInputSchema>;

export interface ImportResult {
  prospects: ProspectInput[];
  errors: { line: number; message: string }[];
  ignoredColumns: string[];
}

/** Turn CSV text into prospects. Rows with problems are reported by line number and left out. */
export function prospectsFromCsv(csv: string): ImportResult {
  const rows = parseCsv(csv);
  if (rows.length === 0) return { prospects: [], errors: [{ line: 1, message: "The file is empty" }], ignoredColumns: [] };
  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, " "));
  const fields = headers.map((h) => HEADER_ALIASES[h]);
  const ignoredColumns = rows[0].filter((_, i) => !fields[i] && rows[0][i].trim()).map((h) => h.trim());
  if (!fields.includes("company")) {
    return { prospects: [], errors: [{ line: 1, message: "No Company or Organization column" }], ignoredColumns };
  }
  const prospects: ProspectInput[] = [];
  const errors: ImportResult["errors"] = [];
  rows.slice(1).forEach((row, i) => {
    const line = i + 2;
    const raw: Partial<Record<ProspectField, string>> = {};
    fields.forEach((f, col) => { if (f && row[col]?.trim()) raw[f] = row[col].trim(); });
    if (!raw.company) return; // blank or note rows
    const category = raw.category ? normalizeCategory(raw.category) : null;
    if (!category) { errors.push({ line, message: raw.category ? `Unknown category "${raw.category}"` : "No category" }); return; }
    const status = raw.status ? OUTREACH_STATUSES.find((s) => s.label.toLowerCase() === raw.status!.toLowerCase() || s.value === raw.status)?.value : undefined;
    const parsed = prospectInputSchema.safeParse({
      ...raw,
      category,
      status,
      plannedWeek: raw.plannedWeek ? parseSheetDate(raw.plannedWeek) : null,
    });
    if (!parsed.success) { errors.push({ line, message: parsed.error.issues[0].message }); return; }
    prospects.push(parsed.data);
  });
  return { prospects, errors, ignoredColumns };
}

/** How an import row is matched to an existing prospect: same company, and same email when both have one. */
export function prospectKey(p: { company: string; email?: string | null }) {
  return `${p.company.trim().toLowerCase()}|${(p.email ?? "").trim().toLowerCase()}`;
}
