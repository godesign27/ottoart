import type { Express, Request } from "express";
import { storage } from "./storage";
import { CORPORATE_AUDIENCES, CORPORATE_OPTIONS, RENTAL_FAQ, pageSummary } from "@shared/seoContent";

// What search engines and link previews see before any JavaScript runs: a page-specific title, description,
// canonical URL, social tags and structured data, written into index.html on the server.
// Copies of the site on other hosts (Replit preview URLs, localhost) are marked noindex so only the real
// domain is indexed.

const SITE = (process.env.SITE_URL || "https://ottoart.app").replace(/\/$/, "");
const SITE_HOST = new URL(SITE).host;
const ORG_ID = `${SITE}/#organization`;

interface PageMeta {
  title: string;
  description: string;
  page?: string; // page_settings key: switched-off pages are noindex
  jsonLd?: object;
}

const breadcrumb = (path: string, name: string) => ({
  "@type": "BreadcrumbList",
  "@id": `${SITE}${path}#breadcrumb`,
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
    { "@type": "ListItem", position: 2, name, item: `${SITE}${path}` },
  ],
});

const PAGES: Record<string, PageMeta> = {
  "/": {
    title: "Otto Art | Original Art and Prints",
    description: "Original abstract paintings and art prints by Otto. Shop the collection, commission a piece, or bring Otto Art into your space.",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${SITE}/#website`,
          url: `${SITE}/`,
          name: "Otto Art",
          publisher: { "@id": ORG_ID },
        },
        {
          "@type": "WebPage",
          "@id": `${SITE}/#webpage`,
          url: `${SITE}/`,
          name: "Otto Art | Original Art and Prints",
          isPartOf: { "@id": `${SITE}/#website` },
          about: { "@id": ORG_ID },
        },
      ],
    },
  },
  "/art-rental-leasing": {
    title: "Art Rental & Leasing | Originals & Prints | Otto Art",
    description: "Rent Otto Art originals and prints for 3, 6, or 12 months. Explore monthly rates, collection discounts, and request a quote for your space.",
    page: "art-rental-leasing",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Organization", "@id": ORG_ID, name: "Otto Art", url: `${SITE}/` },
        {
          "@type": "WebPage",
          "@id": `${SITE}/art-rental-leasing#webpage`,
          url: `${SITE}/art-rental-leasing`,
          name: "Art Rental & Leasing | Originals & Prints | Otto Art",
          description: "Explore Otto Art original artwork and print rentals for 3, 6, or 12 months, with collection discounts and quotes for your space.",
          mainEntity: { "@id": `${SITE}/art-rental-leasing#service` },
          breadcrumb: { "@id": `${SITE}/art-rental-leasing#breadcrumb` },
        },
        {
          "@type": "Service",
          "@id": `${SITE}/art-rental-leasing#service`,
          name: "Otto Art Art Rental & Leasing",
          serviceType: "Original artwork and print rental",
          url: `${SITE}/art-rental-leasing`,
          provider: { "@id": ORG_ID },
          description: "Fixed-term original artwork and print rentals for 3, 6, or 12 months. Monthly fees use original artwork retail values. Collection discounts begin at 11 artworks; 31 or more require a custom quote.",
        },
        {
          "@type": "FAQPage",
          "@id": `${SITE}/art-rental-leasing#faq`,
          mainEntity: RENTAL_FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        },
        breadcrumb("/art-rental-leasing", "Art Rental & Leasing"),
      ],
    },
  },
  "/corporate-buyers": {
    title: "Corporate Art Buyers | Original Art & Prints | Otto Art",
    description: "Original abstract art, limited edition prints, commissions and rotational programs by Otto for offices, hotels, healthcare and hospitality spaces.",
    page: "corporate-buyers",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Organization", "@id": ORG_ID, name: "Otto Art", url: `${SITE}/` },
        {
          "@type": "WebPage",
          "@id": `${SITE}/corporate-buyers#webpage`,
          url: `${SITE}/corporate-buyers`,
          name: "Corporate Art Buyers | Original Art & Prints | Otto Art",
          description: "Original abstract art, limited edition prints, custom commissions and rotational art programs by Otto for offices, hotels, healthcare and hospitality spaces.",
          mainEntity: { "@id": `${SITE}/corporate-buyers#service` },
          breadcrumb: { "@id": `${SITE}/corporate-buyers#breadcrumb` },
        },
        {
          "@type": "Service",
          "@id": `${SITE}/corporate-buyers#service`,
          name: "Otto Art for Corporate Buyers",
          serviceType: "Original art and prints for businesses",
          url: `${SITE}/corporate-buyers`,
          provider: { "@id": ORG_ID },
          audience: CORPORATE_AUDIENCES.map((a) => ({ "@type": "BusinessAudience", name: a.name, description: a.description })),
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Corporate art options",
            itemListElement: CORPORATE_OPTIONS.map((o) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: o.name, description: o.description } })),
          },
        },
        breadcrumb("/corporate-buyers", "Corporate Buyers"),
      ],
    },
  },
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Only hosts that are clearly not the public site are kept out of search results. (Checking for "not ottoart.app"
// instead would be riskier: a proxy that rewrites the host would quietly de-index the real site.)
const PREVIEW_HOST = /(^localhost|^127\.0\.0\.1|^\[::1\]|\.replit\.dev|\.repl\.co)(:\d+)?$/i;
function isCanonicalHost(req: Request) {
  const host = (req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim();
  return host === SITE_HOST || !PREVIEW_HOST.test(host);
}

// Facts from Admin > Settings (artist name, city, social profiles, share image). Cached briefly: they rarely change.
interface SiteFacts { artist: string; location?: string; bio?: string; logo?: string; shareImage?: string; sameAs: string[] }
let factsCache: { at: number; facts: SiteFacts } | null = null;
async function siteFacts(): Promise<SiteFacts> {
  if (factsCache && Date.now() - factsCache.at < 5 * 60_000) return factsCache.facts;
  const [settings, social] = await Promise.all([
    storage.getSiteSettings().catch(() => []),
    storage.getSocialSettings().catch(() => undefined),
  ]);
  const get = (key: string) => {
    const v = settings.find((s) => s.key === key)?.value;
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  const abs = (u?: string) => (!u ? undefined : /^https?:\/\//.test(u) ? u : `${SITE}${u.startsWith("/") ? "" : "/"}${u}`);
  const sized = (u?: string) => (u && u.startsWith("/objects/") ? `${abs(u)}?w=1200` : abs(u));
  const sameAs = social
    ? [social.instagram, social.facebook, social.twitter, social.linkedin, social.tiktok, social.pinterest, social.youtube]
        .filter((u): u is string => !!u && /^https?:\/\//.test(u))
    : [];
  const facts: SiteFacts = {
    artist: get("artist_artistName") || "Otto Art",
    location: get("artist_location"),
    bio: get("artist_bio"),
    logo: sized(get("artist_profileImage")),
    shareImage: sized(social?.ogImage || undefined) || sized(get("home_heroImageUrl")),
    sameAs,
  };
  factsCache = { at: Date.now(), facts };
  return facts;
}

// The Organization node, filled in from settings, so every page describes the same Otto Art.
function organization(f: SiteFacts) {
  const [city, region] = (f.location ?? "").split(",").map((x) => x.trim());
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: "Otto Art",
    url: `${SITE}/`,
    ...(f.bio ? { description: f.bio } : {}),
    ...(f.logo ? { logo: f.logo, image: f.logo } : {}),
    ...(city ? { address: { "@type": "PostalAddress", addressLocality: city, ...(region ? { addressRegion: region } : {}), addressCountry: "US" } } : {}),
    ...(f.sameAs.length ? { sameAs: f.sameAs } : {}),
  };
}

// Readable page text for crawlers that don't run JavaScript (most AI assistants). It sits inside #root, so the
// app replaces it on load; a class set by an inline script hides it until then, so visitors never see it flash.
function fallbackBody(path: string, f: SiteFacts): string {
  const sum = pageSummary(path, { artist: f.artist, location: f.location });
  if (!sum) return "";
  const p = (t: string) => `<p>${esc(t)}</p>`;
  const sections = sum.sections.map((s) =>
    `<section><h2>${esc(s.heading)}</h2>${s.text ? p(s.text) : ""}${s.items ? `<ul>${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}</section>`,
  ).join("");
  const links = `<nav aria-label="Related pages"><ul>${sum.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join("")}</ul></nav>`;
  return `<div class="seo-fallback"><main><h1>${esc(sum.h1)}</h1>${sum.intro.map(p).join("")}${sections}${links}</main></div>`;
}

/** Write page-specific head tags (and readable page text) into index.html for this request. */
export async function injectSeo(html: string, req: Request): Promise<string> {
  const path = (req.originalUrl || "/").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const meta = PAGES[path];
  const tags: string[] = [];
  let noindex = !isCanonicalHost(req);

  if (meta) {
    if (meta.page) {
      const setting = await storage.getPageSetting(meta.page).catch(() => undefined);
      if (setting && !setting.enabled) noindex = true;
    }
    const facts = await siteFacts();
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(meta.description)}" />`);
    const url = `${SITE}${path === "/" ? "/" : path}`;
    const ogTitle = meta.title.replace(/ \| Originals & Prints| \| Original Art & Prints| \| Original Art and Prints/, "");
    tags.push(
      `<link rel="canonical" href="${url}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="Otto Art" />`,
      `<meta property="og:locale" content="en_US" />`,
      `<meta property="og:title" content="${esc(ogTitle)}" />`,
      `<meta property="og:description" content="${esc(meta.description)}" />`,
      `<meta property="og:url" content="${url}" />`,
      `<meta name="twitter:card" content="${facts.shareImage ? "summary_large_image" : "summary"}" />`,
      `<meta name="twitter:title" content="${esc(ogTitle)}" />`,
      `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    );
    if (facts.shareImage) {
      tags.push(
        `<meta property="og:image" content="${esc(facts.shareImage)}" />`,
        `<meta property="og:image:alt" content="An Otto Art work in a room" />`,
        `<meta name="twitter:image" content="${esc(facts.shareImage)}" />`,
      );
    }
    if (meta.jsonLd) {
      // Swap the bare Organization stub for the full one built from settings.
      const ld = meta.jsonLd as { "@graph": Array<{ "@type": string }> };
      const graph = [organization(facts), ...ld["@graph"].filter((n) => n["@type"] !== "Organization")];
      tags.push(`<script type="application/ld+json">${JSON.stringify({ ...ld, "@graph": graph }).replace(/</g, "\\u003c")}</script>`);
    }
    const body = fallbackBody(path, facts);
    if (body) html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  }
  if (noindex) tags.push(`<meta name="robots" content="noindex" />`);
  return tags.length ? html.replace("</head>", `    ${tags.join("\n    ")}\n  </head>`) : html;
}

const STATIC_ROUTES: Array<{ path: string; page?: string }> = [
  { path: "/" }, { path: "/shop-all" }, { path: "/originals" }, { path: "/prints" }, { path: "/accessories" },
  { path: "/mail-club" }, { path: "/bio", page: "bio" }, { path: "/gallery", page: "gallery" }, { path: "/events", page: "events" },
  { path: "/cv", page: "cv" }, { path: "/contact" }, { path: "/corporate-buyers", page: "corporate-buyers" },
  { path: "/art-rental-leasing", page: "art-rental-leasing" },
];

/** robots.txt and sitemap.xml. Registered before the page catch-all. */
export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    if (!isCanonicalHost(req)) return res.send("User-agent: *\nDisallow: /\n");
    res.send(`User-agent: *\nDisallow: /admin\nDisallow: /api/\nDisallow: /checkout\n\nSitemap: ${SITE}/sitemap.xml\n`);
  });

  // llms.txt: a short plain-text guide to the site for AI assistants (llmstxt.org).
  app.get("/llms.txt", async (req, res) => {
    res.type("text/plain; charset=utf-8");
    if (!isCanonicalHost(req)) return res.status(404).send("Not found\n");
    const f = await siteFacts();
    const settings = await storage.getPageSettings().catch(() => []);
    const on = (page: string) => settings.find((s) => s.page === page)?.enabled ?? true;
    const where = f.location ? ` based in ${f.location}` : "";
    const lines = [
      "# Otto Art",
      "",
      `> ${f.artist} is a contemporary artist${where}, making abstract paintings, mixed media works and art prints. The site sells originals and prints, takes commissions, and works with businesses that buy or rent art.`,
      "",
      "## Shop",
      `- [Original paintings](${SITE}/originals): one-of-a-kind works`,
      `- [Art prints](${SITE}/prints): prints of Otto's originals`,
      `- [All artworks](${SITE}/shop-all)`,
      `- [Commission a piece](${SITE}/commission)`,
      "",
      "## For businesses",
      ...(on("corporate-buyers") ? [`- [Corporate buyers](${SITE}/corporate-buyers): originals, limited edition prints, custom commissions and rotational programs for offices, hotels, healthcare and hospitality. Buyers can plan works on a shared board and send it for a quote.`] : []),
      ...(on("art-rental-leasing") ? [`- [Art rental & leasing](${SITE}/art-rental-leasing): rent originals or prints for 3, 6 or 12 months. Monthly fees are a percentage of each original's retail value: originals 15%, 12% or 9% per month; prints 5%, 4% or 3%. 10% off for 11–20 artworks, 15% off for 21–30, custom quote for 31 or more. Delivery, installation and insurance are quoted separately.`] : []),
      "",
      "## About",
      ...(on("bio") ? [`- [Biography](${SITE}/bio)`] : []),
      ...(on("cv") ? [`- [CV](${SITE}/cv)`] : []),
      `- [Contact](${SITE}/contact)`,
      "",
    ];
    res.send(lines.join("\n"));
  });

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const settings = await storage.getPageSettings();
      const off = new Set(settings.filter((s) => !s.enabled).map((s) => s.page as string));
      const urls = STATIC_ROUTES.filter((r) => !r.page || !off.has(r.page)).map((r) => `${SITE}${r.path === "/" ? "/" : r.path}`);
      const products = await storage.getProducts();
      for (const p of products) if (p.status === "active") urls.push(`${SITE}/product/${p.id}`);
      res.type("application/xml").send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join("\n")}\n</urlset>\n`,
      );
    } catch {
      res.status(500).type("text/plain").send("Sitemap unavailable");
    }
  });
}
