import type { Request, Response } from "express";
import { createHmac } from "node:crypto";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "./db";
import { pageViews, products } from "@shared/schema";
import {
  ANALYTICS_RANGES, cleanPath, deviceOf, isBot, productIdOf, referrerHost,
  type AnalyticsRange, type AnalyticsSummary,
} from "@shared/pageViews";
import { isAdminRequest } from "./middlewares/requireAuth";

// Visit tracking for Admin › Analytics. See the pageViews table in shared/schema.ts for what is kept.

// The visitor hash is keyed with a server secret and the date, so it can't be reversed to an IP address
// and the same person reads as a new visitor the next day.
const SECRET = process.env.ANALYTICS_SALT || process.env.SESSION_SECRET || process.env.DATABASE_URL || "otto-art";

function visitorOf(ip: string, userAgent: string, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  return createHmac("sha256", SECRET).update(`${day}|${ip}|${userAgent}`).digest("base64url").slice(0, 22);
}

// Generous per-visitor ceiling: real browsing never gets near it, a script hammering the endpoint does.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 120;
const hits = new Map<string, number[]>();
function rateLimited(ip: string, now = Date.now()) {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

/** POST /api/track { path, referrer }. Always answers 204: tracking never gets in a visitor's way. */
export async function trackPageView(req: Request, res: Response) {
  res.status(204).end();
  try {
    const ua = req.get("user-agent") ?? "";
    const path = cleanPath(req.body?.path);
    const ip = req.ip ?? "";
    if (!path || isBot(ua) || rateLimited(ip)) return;
    if (await isAdminRequest(req)) return; // your own visits don't count
    await db.insert(pageViews).values({
      path,
      productId: productIdOf(path),
      referrer: referrerHost(req.body?.referrer, req.get("host") ?? ""),
      visitor: visitorOf(ip, ua),
      device: deviceOf(ua),
    });
  } catch (err) {
    console.error("Page view not saved:", (err as Error).message);
  }
}

function timeZoneOf(raw: unknown): string {
  if (typeof raw !== "string" || !/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+){0,2}$/.test(raw)) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: raw });
    return raw;
  } catch {
    return "UTC";
  }
}

/** GET /api/analytics?days=7|30|90&tz=Area/City (admin only). Days are counted in the admin's own time zone. */
export async function getAnalytics(req: Request, res: Response) {
  try {
    const n = Number(req.query.days);
    const days: AnalyticsRange = (ANALYTICS_RANGES as readonly number[]).includes(n) ? (n as AnalyticsRange) : 30;
    const tz = timeZoneOf(req.query.tz);
    const local = sql`((${pageViews.createdAt} AT TIME ZONE 'UTC') AT TIME ZONE ${tz})`;
    const today = sql`(now() AT TIME ZONE ${tz})::date`;
    const inRange = gte(sql`${local}::date`, sql`${today} - ${days - 1}::int`);
    const views = sql<number>`count(*)::int`;

    const [daily, topPages, topArtworks, referrers, devices, [first], [since]] = await Promise.all([
      db.select({
        date: sql<string>`to_char(${local}::date, 'YYYY-MM-DD')`,
        views,
        visitors: sql<number>`count(distinct ${pageViews.visitor})::int`,
      }).from(pageViews).where(inRange).groupBy(sql`1`).orderBy(sql`1`),
      db.select({ path: pageViews.path, name: products.name, views }).from(pageViews)
        .leftJoin(products, eq(products.id, pageViews.productId)).where(inRange)
        .groupBy(pageViews.path, products.name).orderBy(desc(views)).limit(10),
      db.select({ productId: sql<string>`${pageViews.productId}`, name: products.name, views }).from(pageViews)
        .leftJoin(products, eq(products.id, pageViews.productId))
        .where(and(inRange, isNotNull(pageViews.productId)))
        .groupBy(pageViews.productId, products.name).orderBy(desc(views)).limit(10),
      db.select({ host: sql<string>`${pageViews.referrer}`, views }).from(pageViews)
        .where(and(inRange, isNotNull(pageViews.referrer)))
        .groupBy(pageViews.referrer).orderBy(desc(views)).limit(10),
      db.select({ device: pageViews.device, views }).from(pageViews).where(inRange)
        .groupBy(pageViews.device).orderBy(desc(views)),
      db.select({ at: sql<string | null>`min(${pageViews.createdAt})` }).from(pageViews),
      db.select({ d: sql<string>`to_char(${today} - ${days - 1}::int, 'YYYY-MM-DD')` }).from(sql`(select 1) as one`),
    ]);

    const summary: AnalyticsSummary = {
      days,
      since: since.d,
      firstRecorded: first?.at ? new Date(first.at).toISOString() : null,
      views: daily.reduce((s, d) => s + d.views, 0),
      visitors: daily.reduce((s, d) => s + d.visitors, 0),
      daily,
      topPages,
      topArtworks,
      referrers,
      devices,
    };
    res.json(summary);
  } catch (err) {
    console.error("Analytics not loaded:", (err as Error).message);
    res.status(500).json({ message: "Analytics couldn't be loaded. Try again in a moment." });
  }
}
