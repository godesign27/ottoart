import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import {
  boardItems, boards, outreachSteps, outreachTemplates, pageViews, products, prospects, siteSettings,
  type OutreachStep, type Product, type Prospect,
} from "@shared/schema";
import {
  blockReason, CLOSED_STATUSES, composeOutreachEmail, DEFAULT_CATEGORY_LINES, DEFAULT_TEMPLATES, firstNameOf,
  followUpDueAt, isFollowUpDue, OUTREACH_CATEGORIES, outreachHtml, prospectInputSchema, prospectKey, prospectsFromCsv,
  STATUS_VALUES, weekOf, type MergeValues,
} from "@shared/outreach";
import { boardSlug } from "@shared/buyerBoards";
import { MONTHLY_RATE_BPS } from "@shared/rentalPricing";
import { isDraft } from "./productVisibility";
import { buildOutreachMime, toGmailRaw } from "./outreachEmail";
import * as gmail from "./gmail";

// Admin › Outreach (all admin-only, registered in routes.ts) and the public /for/:slug board.
// Nothing here emails anyone on its own: drafts are created on a click, and a draft is sent only on a second,
// confirmed click. Opted-out prospects are refused on the server, whatever the browser sends.

const FOOTER_KEY = "outreach_footer"; // { postalAddress } — public (site_settings is readable by anyone), and in every email anyway
const LINES_KEY = "outreach_category_lines"; // { [category]: sentence }

function siteBase() {
  if (process.env.LOCAL_DEV === "1") return `http://localhost:${process.env.PORT || 5050}`;
  return (process.env.SITE_URL || "https://ottoart.app").replace(/\/$/, "");
}

const fail = (res: Response, status: number, message: string, extra: object = {}) => res.status(status).json({ message, ...extra });

function handle(fn: (req: Request, res: Response) => Promise<unknown>) {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (error instanceof z.ZodError) return fail(res, 400, error.issues[0]?.message ?? "Invalid request");
      if (error instanceof gmail.GmailError) return fail(res, error.status, error.message, { reconnect: error.reconnect });
      console.error("Outreach error:", error);
      fail(res, 500, "Something went wrong. Try again.");
    }
  };
}

// ---------- Settings ----------

async function getSetting<T>(key: string): Promise<T | null> {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
  return (row?.value as T) ?? null;
}

async function putSetting(key: string, value: unknown) {
  await db.insert(siteSettings).values({ key, value })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
}

async function loadTemplates() {
  let rows = await db.select().from(outreachTemplates);
  if (rows.length < 2) {
    await db.insert(outreachTemplates)
      .values(([1, 2] as const).map((step) => ({ step, ...DEFAULT_TEMPLATES[step] })))
      .onConflictDoNothing();
    rows = await db.select().from(outreachTemplates);
  }
  const byStep = Object.fromEntries(rows.map((r) => [r.step, { subject: r.subject, body: r.body }])) as Record<1 | 2, { subject: string; body: string }>;
  const categoryLines = { ...DEFAULT_CATEGORY_LINES, ...((await getSetting<Record<string, string>>(LINES_KEY)) ?? {}) };
  const postalAddress = (await getSetting<{ postalAddress?: string }>(FOOTER_KEY))?.postalAddress ?? "";
  return { templates: byStep, categoryLines, postalAddress };
}

export const getTemplates = handle(async (_req, res) => {
  res.json({ ...(await loadTemplates()), categories: OUTREACH_CATEGORIES });
});

const templateSchema = z.object({ subject: z.string().trim().min(1).max(300), body: z.string().trim().min(1).max(10_000) });
const templatesUpdateSchema = z.object({
  templates: z.object({ 1: templateSchema, 2: templateSchema }).partial().optional(),
  categoryLines: z.record(z.string().max(80), z.string().trim().max(500)).optional(),
  postalAddress: z.string().trim().max(300).optional(),
}).strict();

export const updateTemplates = handle(async (req, res) => {
  const body = templatesUpdateSchema.parse(req.body);
  for (const step of [1, 2] as const) {
    const t = body.templates?.[step];
    if (t) {
      await db.insert(outreachTemplates).values({ step, ...t })
        .onConflictDoUpdate({ target: outreachTemplates.step, set: { ...t, updatedAt: new Date() } });
    }
  }
  if (body.categoryLines) await putSetting(LINES_KEY, body.categoryLines);
  if (body.postalAddress !== undefined) await putSetting(FOOTER_KEY, { postalAddress: body.postalAddress });
  res.json({ ...(await loadTemplates()), categories: OUTREACH_CATEGORIES });
});

// ---------- Prospects ----------

interface BoardInfo { id: string; slug: string; name: string; productIds: string[]; works: Pick<Product, "id" | "name" | "dimensions">[] }

async function boardsFor(list: Prospect[]): Promise<Map<string, BoardInfo>> {
  const ids = Array.from(new Set(list.map((p) => p.boardId).filter(Boolean))) as string[];
  const map = new Map<string, BoardInfo>();
  if (!ids.length) return map;
  const bs = await db.select().from(boards).where(inArray(boards.id, ids));
  const items = await db.select({ boardId: boardItems.boardId, productId: products.id, name: products.name, dimensions: products.dimensions })
    .from(boardItems).innerJoin(products, eq(products.id, boardItems.productId))
    .where(inArray(boardItems.boardId, ids)).orderBy(asc(boardItems.sortOrder), asc(boardItems.createdAt));
  for (const b of bs) {
    const works = items.filter((i) => i.boardId === b.id).map((i) => ({ id: i.productId, name: i.name, dimensions: i.dimensions }));
    map.set(b.id, { id: b.id, slug: b.slug, name: b.name, productIds: works.map((w) => w.id), works });
  }
  return map;
}

/** Visits to each /for/<slug> page (page opens only; the admin's own visits are never recorded). */
async function boardViews(slugs: string[]) {
  const map = new Map<string, { views: number; lastViewedAt: Date | null }>();
  if (!slugs.length) return map;
  const rows = await db.select({ path: pageViews.path, views: sql<number>`count(*)::int`, last: sql<Date>`max(${pageViews.createdAt})` })
    .from(pageViews)
    .where(and(inArray(pageViews.path, slugs.map((s) => `/for/${s}`)), isNull(pageViews.productId)))
    .groupBy(pageViews.path);
  for (const r of rows) map.set(r.path.slice(5), { views: Number(r.views), lastViewedAt: r.last ? new Date(r.last) : null });
  return map;
}

function stepSummary(s: OutreachStep | undefined) {
  if (!s) return null;
  return {
    id: s.id, step: s.step, subject: s.subject, body: s.body, productIds: s.productIds,
    hasDraft: !!s.gmailDraftId && !s.sentAt, threadId: s.gmailThreadId,
    draftCreatedAt: s.draftCreatedAt, sentAt: s.sentAt,
  };
}

async function decorate(list: Prospect[]) {
  const [bmap, steps] = await Promise.all([
    boardsFor(list),
    list.length ? db.select().from(outreachSteps).where(inArray(outreachSteps.prospectId, list.map((p) => p.id))) : Promise.resolve([] as OutreachStep[]),
  ]);
  const views = await boardViews(Array.from(bmap.values()).map((b) => b.slug));
  const now = new Date();
  return list.map((p) => {
    const s1 = steps.find((s) => s.prospectId === p.id && s.step === 1);
    const s2 = steps.find((s) => s.prospectId === p.id && s.step === 2);
    const board = p.boardId ? bmap.get(p.boardId) ?? null : null;
    const seq = { status: p.status, optedOutAt: p.optedOutAt, step1SentAt: s1?.sentAt, step2DraftedOrSent: !!s2 };
    return {
      ...p,
      board: board ? { ...board, url: `${siteBase()}/for/${board.slug}`, ...(views.get(board.slug) ?? { views: 0, lastViewedAt: null }) } : null,
      steps: { 1: stepSummary(s1), 2: stepSummary(s2) },
      followUpDueAt: followUpDueAt(seq),
      followUpDue: isFollowUpDue(seq, now),
    };
  });
}

export type DecoratedProspect = Awaited<ReturnType<typeof decorate>>[number];

export const listProspects = handle(async (_req, res) => {
  const list = await db.select().from(prospects).orderBy(asc(prospects.plannedWeek), asc(prospects.company));
  res.json(await decorate(list));
});

async function loadProspect(id: string) {
  const [p] = await db.select().from(prospects).where(eq(prospects.id, id));
  return p;
}

export const getProspect = handle(async (req, res) => {
  const p = await loadProspect(req.params.id);
  if (!p) return fail(res, 404, "Prospect not found");
  res.json((await decorate([p]))[0]);
});

const nullable = (v: string | null | undefined) => (v?.trim() ? v.trim() : null);

function prospectValues(input: z.infer<typeof prospectInputSchema>) {
  return {
    company: input.company, category: input.category,
    contactName: nullable(input.contactName), title: nullable(input.title), email: nullable(input.email)?.toLowerCase() ?? null,
    website: nullable(input.website), city: nullable(input.city) ?? "Boulder, CO", hook: nullable(input.hook), notes: nullable(input.notes),
    plannedWeek: input.plannedWeek ?? null,
  };
}

export const createProspect = handle(async (req, res) => {
  const input = prospectInputSchema.parse(req.body);
  const status = input.status ?? "not_contacted";
  const [p] = await db.insert(prospects).values({ ...prospectValues(input), status, optedOutAt: status === "opted_out" ? new Date() : null }).returning();
  res.status(201).json((await decorate([p]))[0]);
});

export const updateProspect = handle(async (req, res) => {
  const p = await loadProspect(req.params.id);
  if (!p) return fail(res, 404, "Prospect not found");
  const input = prospectInputSchema.partial().parse(req.body);
  const set: Partial<typeof prospects.$inferInsert> = { updatedAt: new Date() };
  for (const k of ["contactName", "title", "website", "hook", "notes"] as const) if (k in input) set[k] = nullable(input[k]);
  if (input.company) set.company = input.company;
  if (input.category) set.category = input.category;
  if ("email" in input) set.email = nullable(input.email)?.toLowerCase() ?? null;
  if ("city" in input) set.city = nullable(input.city) ?? "Boulder, CO";
  if ("plannedWeek" in input) set.plannedWeek = input.plannedWeek ?? null;
  if (input.status && input.status !== p.status) {
    set.status = input.status;
    set.optedOutAt = input.status === "opted_out" ? new Date() : null;
  }
  const [updated] = await db.update(prospects).set(set).where(eq(prospects.id, p.id)).returning();
  res.json((await decorate([updated]))[0]);
});

export const deleteProspect = handle(async (req, res) => {
  const p = await loadProspect(req.params.id);
  if (!p) return fail(res, 404, "Prospect not found");
  await db.delete(prospects).where(eq(prospects.id, p.id));
  res.json({ success: true });
});

const importSchema = z.object({ csv: z.string().min(1, "The file is empty").max(2_000_000), confirm: z.boolean().optional() });

/** Dry run by default: says what would be added, filled in, or skipped. With confirm: true, saves it. */
export const importProspects = handle(async (req, res) => {
  const { csv, confirm } = importSchema.parse(req.body);
  const parsed = prospectsFromCsv(csv);
  const existing = await db.select().from(prospects);
  const byKey = new Map(existing.map((p) => [prospectKey(p), p]));
  const byCompany = new Map(existing.map((p) => [p.company.trim().toLowerCase(), p]));
  const toAdd: typeof parsed.prospects = [];
  const toFill: { id: string; company: string; set: Partial<typeof prospects.$inferInsert> }[] = [];
  const seen = new Set<string>();
  let duplicates = 0;
  for (const row of parsed.prospects) {
    const key = prospectKey(row);
    if (seen.has(key)) { duplicates++; continue; }
    seen.add(key);
    // Same company and email, or same company where the saved one has no email yet (the sheet's contacts were blank).
    const match = byKey.get(key) ?? (() => {
      const c = byCompany.get(row.company.trim().toLowerCase());
      return c && (!c.email || !row.email) ? c : undefined;
    })();
    if (!match) { toAdd.push(row); continue; }
    const values = prospectValues(row);
    const set: Partial<typeof prospects.$inferInsert> = {};
    for (const k of ["contactName", "title", "email", "website", "hook", "notes", "plannedWeek"] as const) {
      if (!match[k] && values[k]) (set as any)[k] = values[k];
    }
    if (Object.keys(set).length) toFill.push({ id: match.id, company: match.company, set });
    else duplicates++;
  }
  if (confirm) {
    if (toAdd.length) {
      await db.insert(prospects).values(toAdd.map((r) => ({ ...prospectValues(r), status: r.status ?? "not_contacted", optedOutAt: r.status === "opted_out" ? new Date() : null })));
    }
    for (const f of toFill) await db.update(prospects).set({ ...f.set, updatedAt: new Date() }).where(eq(prospects.id, f.id));
  }
  res.json({
    saved: !!confirm,
    added: toAdd.length,
    filledIn: toFill.map((f) => ({ company: f.company, fields: Object.keys(f.set) })),
    unchanged: duplicates,
    errors: parsed.errors,
    ignoredColumns: parsed.ignoredColumns,
    preview: toAdd.slice(0, 10).map((r) => ({ company: r.company, category: r.category, plannedWeek: r.plannedWeek ?? null, email: r.email ?? null })),
  });
});

// ---------- Boards ----------

const boardSchema = z.union([
  z.object({ productIds: z.array(z.string().min(1).max(64)).min(1, "Pick at least one work").max(24) }).strict(),
  z.object({ boardId: z.string().min(1).max(64) }).strict(),
]);

/** Set the prospect's works (creating their board the first time), or point them at an existing admin board. */
export const setProspectBoard = handle(async (req, res) => {
  const p = await loadProspect(req.params.id);
  if (!p) return fail(res, 404, "Prospect not found");
  const body = boardSchema.parse(req.body);

  if ("boardId" in body) {
    const [b] = await db.select().from(boards).where(eq(boards.id, body.boardId));
    if (!b || b.ownerUserId) return fail(res, 400, "Pick one of your own boards");
    await db.update(boards).set({ status: "active", updatedAt: new Date() }).where(eq(boards.id, b.id));
    await db.update(prospects).set({ boardId: b.id, updatedAt: new Date() }).where(eq(prospects.id, p.id));
    return res.json((await decorate([{ ...p, boardId: b.id }]))[0]);
  }

  const ids = Array.from(new Set(body.productIds));
  const found = await db.select().from(products).where(inArray(products.id, ids));
  const usable = new Set(found.filter((x) => !isDraft(x) && x.status !== "archived").map((x) => x.id));
  const bad = ids.filter((id) => !usable.has(id));
  if (bad.length) return fail(res, 400, "Some of those works aren't listed in the shop");

  let boardId = p.boardId;
  const [current] = boardId ? await db.select().from(boards).where(eq(boards.id, boardId)) : [];
  await db.transaction(async (tx) => {
    if (!current) {
      const [b] = await tx.insert(boards).values({
        name: p.company,
        description: `A selection of original work for ${p.company}.`,
        slug: boardSlug(p.company, randomBytes(8).toString("hex")),
        status: "active",
      }).returning();
      boardId = b.id;
      await tx.update(prospects).set({ boardId, updatedAt: new Date() }).where(eq(prospects.id, p.id));
    } else {
      await tx.update(boards).set({ status: "active", updatedAt: new Date() }).where(eq(boards.id, current.id));
      await tx.delete(boardItems).where(eq(boardItems.boardId, current.id));
    }
    await tx.insert(boardItems).values(ids.map((productId, i) => ({ boardId: boardId!, productId, sortOrder: i })));
  });
  res.json((await decorate([{ ...p, boardId }]))[0]);
});

/** Admin boards (no owner) that can be reused for a prospect. */
export const listReusableBoards = handle(async (_req, res) => {
  const rows = await db.select({ id: boards.id, name: boards.name, slug: boards.slug, status: boards.status })
    .from(boards).where(isNull(boards.ownerUserId)).orderBy(asc(boards.name));
  res.json(rows);
});

/** Works that can go on a prospect board: listed, newest first, with the live price. */
export const listPickableWorks = handle(async (_req, res) => {
  const rows = await db.select({
    id: products.id, name: products.name, price: products.price, dimensions: products.dimensions, medium: products.medium,
    images: products.images, isSold: products.isSold, isOriginal: products.isOriginal, status: products.status,
  }).from(products).orderBy(sql`${products.createdAt} desc nulls last`);
  res.json(rows.filter((r) => !isDraft(r) && r.status !== "archived").map(({ status, ...r }) => ({ ...r, image: r.images?.[0] ?? null })));
});

// ---------- Compose ----------

function mergeValues(p: Prospect, board: BoardInfo | null, categoryLines: Record<string, string>): MergeValues {
  const last = board?.works.at(-1);
  return {
    first_name: firstNameOf(p.contactName),
    company: p.company,
    board_link: board && board.works.length ? `${siteBase()}/for/${board.slug}` : "",
    category_line: categoryLines[p.category] ?? "",
    featured_work: last ? [last.name, last.dimensions].filter(Boolean).join(", ") : "",
  };
}

const composeSchema = z.object({
  subject: z.string().max(300).optional(),
  body: z.string().max(10_000).optional(),
  early: z.boolean().optional(),
});

async function compose(p: Prospect, step: 1 | 2, overrides: { subject?: string; body?: string }) {
  const { templates, categoryLines, postalAddress } = await loadTemplates();
  const board = (await boardsFor([p])).get(p.boardId ?? "") ?? null;
  const values = mergeValues(p, board, categoryLines);
  const email = composeOutreachEmail({
    subject: overrides.subject ?? templates[step].subject,
    body: overrides.body ?? templates[step].body,
    values,
    postalAddress,
  });
  if (!values.board_link) email.problems.unshift("Pick the works for this prospect's board first");
  return { ...email, html: outreachHtml(email.text), board, values };
}

async function stepsOf(prospectId: string) {
  const rows = await db.select().from(outreachSteps).where(eq(outreachSteps.prospectId, prospectId));
  return { 1: rows.find((r) => r.step === 1), 2: rows.find((r) => r.step === 2) };
}

const stepParam = (raw: string) => (raw === "1" ? 1 : raw === "2" ? 2 : null);

export const previewEmail = handle(async (req, res) => {
  const p = await loadProspect(req.params.id);
  const step = stepParam(req.params.step);
  if (!p || !step) return fail(res, 404, "Prospect not found");
  const body = composeSchema.parse(req.body ?? {});
  const email = await compose(p, step, body);
  const steps = await stepsOf(p.id);
  const blocked = blockReason(p, step, { step1SentAt: steps[1]?.sentAt, step2DraftedOrSent: !!steps[2] }, { early: body.early });
  res.json({
    to: p.email, subject: email.subject, text: email.text, html: email.html,
    problems: [...(blocked ? [blocked] : []), ...email.problems],
  });
});

export const createDraft = handle(async (req, res) => {
  const p = await loadProspect(req.params.id);
  const step = stepParam(req.params.step);
  if (!p || !step) return fail(res, 404, "Prospect not found");
  const body = composeSchema.parse(req.body ?? {});
  const steps = await stepsOf(p.id);
  const existing = steps[step];
  if (existing?.sentAt) return fail(res, 409, `Email ${step} was already sent.`);
  const blocked = blockReason(p, step, { step1SentAt: steps[1]?.sentAt }, { early: body.early });
  if (blocked) return fail(res, 400, blocked);
  const email = await compose(p, step, body);
  if (email.problems.length) return fail(res, 400, email.problems[0], { problems: email.problems });

  const inReplyTo = step === 2 ? steps[1]?.rfcMessageId : null;
  const threadId = step === 2 ? steps[1]?.gmailThreadId : null;
  const raw = toGmailRaw(buildOutreachMime({ to: { email: p.email!, name: p.contactName }, subject: email.subject, text: email.text, inReplyTo }));
  const draft = await gmail.saveDraft(raw, { draftId: existing?.gmailDraftId, threadId });

  const values = {
    subject: email.subject, body: email.text, productIds: email.board?.productIds ?? [],
    gmailDraftId: draft.draftId, gmailMessageId: draft.messageId, gmailThreadId: draft.threadId, draftCreatedAt: new Date(),
  };
  if (existing) await db.update(outreachSteps).set(values).where(eq(outreachSteps.id, existing.id));
  else await db.insert(outreachSteps).values({ prospectId: p.id, step, ...values });
  res.json({ prospect: (await decorate([p]))[0], gmailUrl: `https://mail.google.com/mail/u/0/#drafts?compose=${encodeURIComponent(draft.messageId)}` });
});

async function markSent(p: Prospect, step: OutreachStep, sentAt: Date, messageId: string, threadId: string) {
  const rfc = await gmail.messageIdHeader(messageId).catch(() => null);
  await db.update(outreachSteps)
    .set({ sentAt, gmailMessageId: messageId, gmailThreadId: threadId, rfcMessageId: rfc, gmailDraftId: null })
    .where(eq(outreachSteps.id, step.id));
  const advance = step.step === 1 ? ["not_contacted"] : ["not_contacted", "email1_sent"];
  if (advance.includes(p.status)) {
    await db.update(prospects).set({ status: step.step === 1 ? "email1_sent" : "followup_sent", updatedAt: new Date() }).where(eq(prospects.id, p.id));
  }
}

const sendSchema = z.object({ confirm: z.literal(true, { errorMap: () => ({ message: "Confirm before sending" }) }), early: z.boolean().optional() });

/** Sends the Gmail draft for this step. Only ever called from the confirmed "Send now" button. */
export const sendStep = handle(async (req, res) => {
  const p = await loadProspect(req.params.id);
  const step = stepParam(req.params.step);
  if (!p || !step) return fail(res, 404, "Prospect not found");
  const { early } = sendSchema.parse(req.body ?? {});
  const steps = await stepsOf(p.id);
  const row = steps[step];
  if (!row?.gmailDraftId) return fail(res, 400, "Create the Gmail draft first.");
  if (row.sentAt) return fail(res, 409, `Email ${step} was already sent.`);
  const blocked = blockReason(p, step, { step1SentAt: steps[1]?.sentAt }, { early });
  if (blocked) return fail(res, 400, blocked);

  const sent = await gmail.sendDraft(row.gmailDraftId);
  if (!sent) {
    await syncSteps([row]);
    return fail(res, 409, "That draft is no longer in Gmail. If you sent it from Gmail, it's now marked as sent; otherwise create the draft again.");
  }
  await markSent(p, row, new Date(), sent.messageId, sent.threadId);
  res.json((await decorate([(await loadProspect(p.id))!]))[0]);
});

// ---------- Sync with Gmail (on opening the Outreach page; there is no background job) ----------

const BOUNCE = /mailer-daemon|postmaster/i;
const emailIn = (from: string) => (from.match(/<([^>]+)>/)?.[1] ?? from).trim().toLowerCase();

/** Drafts sent (or deleted) in Gmail itself since they were created here. */
async function syncSteps(rows: OutreachStep[]) {
  let sent = 0, gone = 0;
  for (const row of rows) {
    if (!row.gmailDraftId || row.sentAt) continue;
    if (await gmail.draftExists(row.gmailDraftId)) continue;
    const msgs = row.gmailThreadId ? await gmail.threadMessages(row.gmailThreadId) : null;
    const after = row.draftCreatedAt?.getTime() ?? 0;
    const mine = (msgs ?? []).filter((m) => m.labelIds.includes("SENT") && !m.labelIds.includes("DRAFT") && m.internalDate >= after - 60_000);
    const first = mine.sort((a, b) => a.internalDate - b.internalDate)[0];
    const p = await loadProspect(row.prospectId);
    if (first && p) {
      await markSent(p, row, new Date(first.internalDate), first.id, row.gmailThreadId!);
      sent++;
    } else {
      await db.update(outreachSteps).set({ gmailDraftId: null }).where(eq(outreachSteps.id, row.id));
      gone++;
    }
  }
  return { sent, gone };
}

export const syncWithGmail = handle(async (_req, res) => {
  const status = await gmail.connectionStatus();
  if (!status.connected) return res.json({ connected: false, replied: [], sent: 0, gone: 0 });
  const me = status.email!.toLowerCase();
  const open = await db.select().from(outreachSteps);
  const { sent, gone } = await syncSteps(open.filter((s) => s.gmailDraftId && !s.sentAt).slice(0, 40));

  const waiting = await db.select().from(prospects).where(inArray(prospects.status, ["email1_sent", "followup_sent"]));
  const replied: string[] = [];
  for (const p of waiting.slice(0, 60)) {
    const s1 = (await stepsOf(p.id))[1];
    if (!s1?.sentAt || !s1.gmailThreadId) continue;
    const msgs = await gmail.threadMessages(s1.gmailThreadId);
    const reply = (msgs ?? []).find((m) => !m.labelIds.includes("SENT") && !m.labelIds.includes("DRAFT")
      && emailIn(m.from) !== me && !BOUNCE.test(m.from) && m.internalDate > s1.sentAt!.getTime());
    if (reply) {
      await db.update(prospects).set({ status: "replied", updatedAt: new Date() }).where(and(eq(prospects.id, p.id), inArray(prospects.status, ["email1_sent", "followup_sent"])));
      replied.push(p.company);
    }
  }
  res.json({ connected: true, replied, sent, gone });
});

// ---------- This week ----------

export const getDashboard = handle(async (_req, res) => {
  const all = await decorate(await db.select().from(prospects));
  const now = new Date();
  const thisWeek = weekOf(now);
  const contacted = (p: DecoratedProspect) => !!p.steps[1]?.sentAt;
  const byPlan = (a: DecoratedProspect, b: DecoratedProspect) =>
    (a.plannedWeek ?? "9999").localeCompare(b.plannedWeek ?? "9999") || a.createdAt.getTime() - b.createdAt.getTime();

  const categories = OUTREACH_CATEGORIES.map((category) => {
    const inCat = all.filter((p) => p.category === category);
    const plannedNow = inCat.filter((p) => p.plannedWeek === thisWeek);
    const doneThisWeek = plannedNow.find((p) => contacted(p) || (CLOSED_STATUSES as readonly string[]).includes(p.status)) ?? null;
    const next = plannedNow.find((p) => !contacted(p) && p.status === "not_contacted")
      ?? inCat.filter((p) => !contacted(p) && p.status === "not_contacted").sort(byPlan)[0] ?? null;
    return {
      category,
      prospect: next,
      plannedForThisWeek: !!next && next.plannedWeek === thisWeek,
      doneThisWeek: doneThisWeek ? { id: doneThisWeek.id, company: doneThisWeek.company } : null,
      remaining: inCat.filter((p) => !contacted(p) && p.status === "not_contacted").length,
    };
  });

  const followUps = all.filter((p) => p.followUpDueAt)
    .sort((a, b) => a.followUpDueAt!.getTime() - b.followUpDueAt!.getTime());

  res.json({
    weekOf: thisWeek,
    categories,
    followUpsDue: followUps.filter((p) => p.followUpDue),
    followUpsSoon: followUps.filter((p) => !p.followUpDue).slice(0, 10),
    totals: {
      prospects: all.length,
      contacted: all.filter(contacted).length,
      replied: all.filter((p) => ["replied", "meeting", "won"].includes(p.status)).length,
      meetings: all.filter((p) => ["meeting", "won"].includes(p.status)).length,
      won: all.filter((p) => p.status === "won").length,
      boardViews: all.reduce((n, p) => n + (p.board?.views ?? 0), 0),
      boardsViewed: all.filter((p) => (p.board?.views ?? 0) > 0).length,
    },
  });
});

// ---------- Gmail connection ----------

export const gmailStatus = handle(async (_req, res) => res.json(await gmail.connectionStatus()));

export const gmailConnect = handle(async (_req, res) => res.json({ url: gmail.connectUrl() }));

/** Google's redirect back. Public by necessity; only a state this server signed for an admin, used once, is accepted. */
export async function gmailCallback(req: Request, res: Response) {
  const back = (q: string) => res.redirect(`/admin/outreach?tab=settings&${q}`);
  const { code, state, error } = req.query;
  if (typeof error === "string") return back(`gmail_error=${encodeURIComponent(error === "access_denied" ? "You cancelled the Google screen." : error)}`);
  if (typeof code !== "string" || typeof state !== "string") return back("gmail_error=Missing+code");
  try {
    await gmail.completeConnect(code, state);
    back("gmail=connected");
  } catch (e) {
    const message = e instanceof gmail.GmailError ? e.message : "Couldn't connect Gmail.";
    if (!(e instanceof gmail.GmailError)) console.error("Gmail connect failed:", e);
    back(`gmail_error=${encodeURIComponent(message)}`);
  }
}

export const gmailDisconnect = handle(async (_req, res) => {
  await gmail.disconnect();
  res.json(await gmail.connectionStatus());
});

// ---------- Public: /for/:slug ----------

/** Monthly rate in whole cents, rounded half up, with integer arithmetic. */
const leaseCents = (valueCents: number, bps: number) => Number((BigInt(valueCents) * BigInt(bps) + BigInt(5000)) / BigInt(10000));

/** The prospect's board as anyone with the link sees it: works with live prices. Nothing about the prospect. */
export async function getForBoard(req: Request, res: Response) {
  try {
    const slug = String(req.params.slug);
    if (!/^[a-z0-9-]{8,80}$/.test(slug)) return fail(res, 404, "Not found");
    const [b] = await db.select().from(boards).where(and(eq(boards.slug, slug), eq(boards.status, "active"), isNull(boards.ownerUserId)));
    if (!b) return fail(res, 404, "Not found");
    const rows = await db.select({ item: boardItems, product: products }).from(boardItems)
      .innerJoin(products, eq(products.id, boardItems.productId))
      .where(eq(boardItems.boardId, b.id)).orderBy(asc(boardItems.sortOrder), asc(boardItems.createdAt));
    const works = rows.filter((r) => !isDraft(r.product) && r.product.status !== "archived").map(({ product: p }) => {
      const cents = (v: unknown) => Math.round(Number(v) * 100);
      const tiers = (p.pricingTiers ?? []).filter((t) => t.size && Number(t.price) > 0);
      // The shop lists the original as a pricing tier of type "Original"; everything else is a print.
      const originalTier = tiers.find((t) => t.type === "Original");
      const originalCents = originalTier ? cents(originalTier.price) : p.isOriginal ? cents(p.price) : null;
      const prints = tiers.filter((t) => t !== originalTier)
        .map((t) => ({ size: t.size, type: t.type, priceCents: cents(t.price) }))
        .sort((a, b) => a.priceCents - b.priceCents);
      const images = p.images ?? [];
      const framed = images.find((u) => /framed/i.test(u));
      return {
        id: p.id, name: p.name, dimensions: p.dimensions, medium: p.medium, year: p.year,
        image: framed ?? images[0] ?? null,
        hasOriginal: originalCents != null, isSold: !!p.isSold,
        originalSize: originalTier?.size ?? null,
        priceCents: originalCents != null ? (p.isSold ? null : originalCents) : prints[0]?.priceCents ?? cents(p.price),
        // Lowest monthly lease (the 12-month term, shared/rentalPricing.ts). Rates come from the original's value:
        // the original itself while it's available, otherwise a print of it.
        lease: originalCents == null ? null : !p.isSold
          ? { kind: "original" as const, fromCents: leaseCents(originalCents, MONTHLY_RATE_BPS.original[12]) }
          : prints.length ? { kind: "print" as const, fromCents: leaseCents(originalCents, MONTHLY_RATE_BPS.print[12]) } : null,
        prints,
      };
    });
    res.set("X-Robots-Tag", "noindex, nofollow");
    res.json({ name: b.name, description: b.description, slug: b.slug, works });
  } catch (error) {
    console.error("Error fetching outreach board:", error);
    fail(res, 500, "Failed to load");
  }
}

export const OUTREACH_STATUS_VALUES = STATUS_VALUES;
