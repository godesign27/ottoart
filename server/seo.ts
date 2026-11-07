import type { Express, Request } from "express";
import { storage } from "./storage";

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
          breadcrumb: { "@id": `${SITE}/corporate-buyers#breadcrumb` },
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

/** Write page-specific head tags into index.html for this request. */
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
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(meta.description)}" />`);
    const url = `${SITE}${path}`;
    tags.push(
      `<link rel="canonical" href="${url}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="Otto Art" />`,
      `<meta property="og:title" content="${esc(meta.title.replace(/ \| Originals & Prints| \| Original Art & Prints/, ""))}" />`,
      `<meta property="og:description" content="${esc(meta.description)}" />`,
      `<meta property="og:url" content="${url}" />`,
      `<meta name="twitter:card" content="summary" />`,
    );
    if (meta.jsonLd) tags.push(`<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c")}</script>`);
  } else if (path === "/") {
    tags.push(`<link rel="canonical" href="${SITE}/" />`);
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
