// What counts as a page view, decided the same way everywhere. Pure functions, so they're tested on their own.

/** Pages that are never counted: the admin, sign-in, checkout steps and anything that isn't a page. */
const SKIP = [/^\/admin(\/|$)/, /^\/api(\/|$)/, /^\/sign-(in|up)(\/|$)/, /^\/objects\//, /^\/assets\//];

/** The path to record, or null when this visit isn't counted. Drops the query string and hash; caps the length. */
export function cleanPath(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return null;
  const path = raw.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path.length > 200 || SKIP.some((re) => re.test(path))) return null;
  return path;
}

/** The artwork id on an artwork page (/product/:id), else null. */
export function productIdOf(path: string): string | null {
  const m = /^\/product\/([A-Za-z0-9-]{1,64})$/.exec(path);
  return m ? m[1] : null;
}

/** The other site's host when the visit came from outside ottoart.app (www. removed), else null. */
export function referrerHost(raw: unknown, siteHost: string): string | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const host = new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
    const site = siteHost.toLowerCase().replace(/^www\./, "").split(":")[0];
    if (!host || host === site || host === "localhost" || host.endsWith(".replit.dev") || host.endsWith(".replit.app")) return null;
    return host.slice(0, 120);
  } catch {
    return null;
  }
}

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|quora link|whatsapp|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http/i;

export function isBot(userAgent: string | undefined): boolean {
  return !userAgent || BOT.test(userAgent);
}

export function deviceOf(userAgent: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

export const ANALYTICS_RANGES = [7, 30, 90] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export interface AnalyticsSummary {
  days: AnalyticsRange;
  since: string; // ISO date the range starts
  firstRecorded: string | null; // when tracking first saved a view
  views: number;
  visitors: number; // daily visitors added up across the range
  daily: Array<{ date: string; views: number; visitors: number }>;
  topPages: Array<{ path: string; name: string | null; views: number }>; // name: the artwork, on artwork pages
  topArtworks: Array<{ productId: string; name: string | null; views: number }>;
  referrers: Array<{ host: string; views: number }>;
  devices: Array<{ device: string; views: number }>;
}
