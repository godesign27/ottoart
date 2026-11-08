// Plain-text page content for search engines and AI assistants (SEO and GEO).
// Most AI crawlers don't run JavaScript, so the server writes this into the page before the app loads.
// Keep it to what the pages themselves say: no claims the site can't show.

/** The rental FAQ: shown on /art-rental-leasing and sent as FAQPage structured data. One source for both. */
export const RENTAL_FAQ: Array<{ q: string; a: string }> = [
  { q: "How much does it cost to rent original artwork?", a: "For 1–10 artworks, original rentals cost 15% of each original’s retail value per month for a 3-month term, 12% per month for 6 months, or 9% per month for 12 months. Collection discounts begin at 11 artworks. Other charges are quoted separately." },
  { q: "How are print rentals priced?", a: "For 1–10 artworks, print rentals cost 5% of the corresponding original’s retail value per month for 3 months, 4% per month for 6 months, or 3% per month for 12 months. The basis is the original’s retail value, not the print’s purchase price. Collection discounts begin at 11 artworks." },
  { q: "Are there discounts for larger collections?", a: "Yes. Collections of 11–20 artworks receive 10% off rental fees, and collections of 21–30 receive 15% off. Collections of 1–10 use standard rates. For 31 or more artworks, request a custom quote." },
  { q: "Does a longer term mean a lower total cost?", a: "No. A longer term lowers the monthly percentage rate but increases the number of payments. At standard rates, a 12-month original rental totals 108% of the original’s retail value before other charges. Compare the full-term cost as well as the monthly fee." },
  { q: "Are delivery, installation, and insurance included?", a: "The displayed rates cover rental fees only. Any applicable delivery, installation, collection, insurance, and other requirements are addressed separately in your quote and agreement. Share your location so the available arrangements can be discussed." },
  { q: "Can I buy the artwork or apply rent toward a purchase?", a: "Ask about purchasing if ownership is your goal. Rental payments do not automatically count toward a purchase, and buying requires a separate agreement." },
  { q: "Can I change the artwork or end the rental early?", a: "Artwork changes, early returns, and cancellations depend on the written agreement. Do not assume that changes, refunds, or early termination are included." },
  { q: "What happens at the end of the rental?", a: "Return and collection arrangements are defined in your agreement. Any extension or purchase requires a separate agreement; neither is automatic." },
];

/** Who the corporate page is for, and what it offers (mirrors the page's own lists). */
export const CORPORATE_AUDIENCES: Array<{ name: string; description: string }> = [
  { name: "Hotels & Resorts", description: "Guest rooms, lobbies, spas, and restaurants, with original art or curated series." },
  { name: "Corporate Offices", description: "Artwork that reflects a company's brand and culture." },
  { name: "Healthcare & Wellness", description: "Calming environments in waiting rooms, clinics, and wellness centers." },
  { name: "Airports & Transportation Hubs", description: "Lounges, concourses, and terminals." },
  { name: "Architects & Interior Designers", description: "Project partnerships with custom commissions and tailored print programs." },
];

export const CORPORATE_OPTIONS: Array<{ name: string; description: string }> = [
  { name: "Originals", description: "Unique statement pieces designed to stand out." },
  { name: "Limited Edition Prints", description: "Art for multiple rooms or large spaces." },
  { name: "Custom Commissions", description: "Collaborative pieces designed around your vision, brand, or space." },
  { name: "Rotational Programs", description: "Seasonal or rotating art collections." },
];

export interface PageSummary {
  h1: string;
  intro: string[];
  sections: Array<{ heading: string; items?: string[]; text?: string }>;
  links: Array<{ href: string; label: string }>;
}

/** What each page is about, in plain HTML-ready text. `artist` and `location` come from Admin > Settings. */
export function pageSummary(path: string, ctx: { artist: string; location?: string }): PageSummary | null {
  const where = ctx.location ? ` based in ${ctx.location}` : "";
  const aside = ctx.location ? `, based in ${ctx.location},` : "";
  switch (path) {
    case "/":
      return {
        h1: "Contemporary art, redefined",
        intro: [
          `${ctx.artist} is a contemporary artist${where}, making abstract paintings, mixed media works and art prints.`,
          "Shop original paintings and prints, commission a piece, or bring Otto Art into a workplace by buying or renting.",
        ],
        sections: [
          {
            heading: "For workplaces and spaces",
            items: [
              "Corporate buyers: originals and prints for a lobby, an office or a whole building. Plan the pieces on a board with your team, then send it to Otto for a quote.",
              "Art rental & leasing: rent originals or prints for 3, 6 or 12 months, priced from each work's retail value, with an estimate of the monthly fee before you ask.",
            ],
          },
        ],
        links: [
          { href: "/originals", label: "Original paintings" },
          { href: "/prints", label: "Art prints" },
          { href: "/shop-all", label: "All artworks" },
          { href: "/commission", label: "Commission a piece" },
          { href: "/corporate-buyers", label: "Art for corporate buyers" },
          { href: "/art-rental-leasing", label: "Art rental & leasing" },
          { href: "/contact", label: "Contact" },
        ],
      };
    case "/corporate-buyers":
      return {
        h1: "Original art for offices, hotels, healthcare and hospitality",
        intro: [
          `${ctx.artist}${aside} supplies original abstract art, limited edition prints, custom commissions and rotational art programs for businesses.`,
          "Buyers can gather works on a shared board, add notes for each wall, invite colleagues to pick favourites, and send the board to Otto for a quote.",
        ],
        sections: [
          { heading: "Who it's for", items: CORPORATE_AUDIENCES.map((a) => `${a.name}: ${a.description}`) },
          { heading: "Options", items: CORPORATE_OPTIONS.map((o) => `${o.name}: ${o.description}`) },
          { heading: "How it works", text: "Consultation, mockups of the work in your space, then delivery with professional packaging and installation support. Artwork is selected or created to suit the brand, architecture and goals of the space." },
        ],
        links: [
          { href: "/art-rental-leasing", label: "Rent instead of buying" },
          { href: "/boards", label: "Start a board" },
          { href: "/shop-all", label: "Browse the collection" },
          { href: "/contact", label: "Contact Otto" },
        ],
      };
    case "/art-rental-leasing":
      return {
        h1: "Art rental & leasing: originals and prints for 3, 6 or 12 months",
        intro: [
          `Rent original artwork or prints by ${ctx.artist}${aside} for a fixed term of 3, 6 or 12 months.`,
          "Monthly rental fees are a percentage of each original's retail value. Collection discounts start at 11 artworks, and 31 or more artworks get a custom quote. Delivery, installation and insurance are quoted separately.",
        ],
        sections: [{ heading: "Art rental questions", items: RENTAL_FAQ.map((f) => `${f.q} ${f.a}`) }],
        links: [
          { href: "/corporate-buyers", label: "Buy art for your workplace" },
          { href: "/shop-all", label: "Browse the collection" },
          { href: "/contact", label: "Contact Otto" },
        ],
      };
    default:
      return null;
  }
}
