import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ActionButton, ActionLink, Frame, SectionTitle } from "@/components/marketing/primitives";
import { artSrc } from "@/components/marketing/art";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { HeroSection } from "@/components/live-site/hero-section";
import { ProductGrid } from "@/components/live-site/product-grid";
import { Footer } from "@/components/live-site/footer";
import { usePageEnabled } from "@/hooks/use-page-access";
import { useRentalArtworks } from "@/hooks/use-rental-artworks";
import officeWallImage from "@assets/office-wall-corporate1_1761342062803.png";
import { Calendar, Clock, MapPin, ExternalLink } from "lucide-react";
import type { Product, Event } from "@shared/schema";

// How many columns the product grid has at the current width (it is 1, 2 or 3 across: sm and lg breakpoints).
function useGridColumns() {
  const read = () => (typeof window === "undefined" ? 3 : window.matchMedia("(min-width: 1024px)").matches ? 3 : window.matchMedia("(min-width: 640px)").matches ? 2 : 1);
  const [cols, setCols] = useState(read);
  useEffect(() => {
    const queries = [window.matchMedia("(min-width: 1024px)"), window.matchMedia("(min-width: 640px)")];
    const update = () => setCols(read());
    queries.forEach((q) => q.addEventListener("change", update));
    return () => queries.forEach((q) => q.removeEventListener("change", update));
  }, []);
  return cols;
}

const ROWS_PER_STEP = 3;
const newestFirst = (a: Product, b: Product) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();

// Featured products: the works marked "featured" in the admin, three rows at a time, newest first.
function FeaturedProductsSection() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    select: (data) => (data?.filter(product => product.isFeatured) || []).sort(newestFirst),
  });
  const cols = useGridColumns();
  const [rows, setRows] = useState(ROWS_PER_STEP);
  const gridRef = useRef<HTMLDivElement>(null);
  const firstNew = useRef<number | null>(null);

  // After "Show more", move focus to the first newly shown work so keyboard users carry on from there.
  useEffect(() => {
    if (firstNew.current === null) return;
    gridRef.current?.querySelectorAll<HTMLAnchorElement>("li a")[firstNew.current]?.focus();
    firstNew.current = null;
  }, [rows]);

  if (!isLoading && (!products || products.length === 0)) {
    return null;
  }

  const shown = products?.slice(0, rows * cols) ?? [];
  const hasMore = (products?.length ?? 0) > shown.length;

  return (
    <section aria-labelledby="featured-title" className="py-24 md:py-32" data-testid="featured-artworks">
      <Frame>
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionTitle id="featured-title">Featured artworks</SectionTitle>
            <p className="mt-4 max-w-[48ch] text-lg text-muted-foreground">The latest additions to the collection.</p>
          </div>
          <ActionLink href="/shop-all" variant="quiet" data-testid="view-all-artworks">View all artworks</ActionLink>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="aspect-[4/5] animate-pulse bg-muted" />)}
          </div>
        ) : (
          <div ref={gridRef}><ProductGrid products={shown} /></div>
        )}
        {hasMore && (
          <div className="mt-14 flex justify-center">
            <ActionButton
              type="button"
              variant="quiet"
              onClick={() => { firstNew.current = shown.length; setRows((r) => r + ROWS_PER_STEP); }}
              data-testid="button-show-more-artworks"
            >
              Show more artworks
            </ActionButton>
          </div>
        )}
      </Frame>
    </section>
  );
}

// The way into the two business pages: buying for a workplace, and renting. Each tile only shows while its page is switched on.
function ForBusinessSection() {
  const pageEnabled = usePageEnabled();
  const { artworks } = useRentalArtworks();
  const room = artworks.map((a) => a.room).find((r): r is string => !!r) ?? null;
  const tiles = [
    pageEnabled("corporate-buyers") && {
      key: "corporate",
      href: "/corporate-buyers",
      title: "Corporate buyers",
      body: "Originals and prints for a lobby, an office or a whole building. Plan the pieces on a board with your team, then send it to Otto for a quote.",
      action: "Art for your workplace",
      image: officeWallImage,
      alt: "An Otto Art work on an office wall, digital visualisation",
    },
    pageEnabled("art-rental-leasing") && {
      key: "rental",
      href: "/art-rental-leasing",
      title: "Art rental & leasing",
      body: "Rent originals or prints for 3, 6 or 12 months, priced from each work's retail value. Estimate the monthly fee before you ask.",
      action: "Estimate a rental",
      image: room ? artSrc(room, 1280) : officeWallImage,
      alt: "An Otto Art work in a room, digital visualisation",
    },
  ].filter(Boolean) as Array<{ key: string; href: string; title: string; body: string; action: string; image: string; alt: string }>;

  if (!tiles.length) return null;

  return (
    <section aria-labelledby="business-title" className="bg-muted/40 py-24 md:py-32" data-testid="for-business">
      <Frame>
        <SectionTitle id="business-title" className="max-w-[18ch]">For workplaces and spaces</SectionTitle>
        <p className="mt-4 max-w-[52ch] text-lg text-muted-foreground">Buy for good, or rent for a season. Either way, the work comes from the same collection.</p>
        <div className={`mt-12 grid gap-x-6 gap-y-14 ${tiles.length > 1 ? "md:grid-cols-2" : "md:max-w-3xl"}`}>
          {tiles.map((t) => (
            <Link key={t.key} href={t.href} className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" data-testid={`home-${t.key}`}>
              <div className="aspect-[4/3] overflow-hidden bg-secondary">
                <img src={t.image} alt={t.alt} loading="lazy" decoding="async" width={1280} height={960}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
              </div>
              <h3 className="mt-6 font-display text-[1.75rem] leading-tight md:text-[2.25rem]">{t.title}</h3>
              <p className="mt-3 max-w-[48ch] text-base leading-relaxed">{t.body}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-base font-semibold underline-offset-4 group-hover:underline">
                {t.action} <span aria-hidden>→</span>
              </span>
            </Link>
          ))}
        </div>
      </Frame>
    </section>
  );
}

function FeaturedEventSection() {
  const { data: featuredEvent, isLoading } = useQuery<Event | null>({
    queryKey: ['/api/events/featured'],
  });

  const formatDate = (dateStr: string, endDateStr?: string | null) => {
    const startDate = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const formattedStart = startDate.toLocaleDateString('en-US', options);
    
    if (endDateStr) {
      const endDate = new Date(endDateStr);
      const formattedEnd = endDate.toLocaleDateString('en-US', options);
      return `${formattedStart} - ${formattedEnd}`;
    }
    return formattedStart;
  };

  if (isLoading || !featuredEvent) {
    return null;
  }

  return (
    <section aria-labelledby="event-title" className="bg-secondary" data-testid="featured-event">
      <div className="grid md:grid-cols-2">
        {featuredEvent.imageUrl && (
          <div className="aspect-[4/3] md:aspect-auto">
            <img src={artSrc(featuredEvent.imageUrl, 1280)} alt={featuredEvent.title} loading="lazy" className="h-full w-full object-cover" />
          </div>
        )}
        <div className={`${featuredEvent.imageUrl ? "" : "md:col-span-2"} flex flex-col justify-center px-4 py-16 sm:px-6 md:px-12 lg:px-16 lg:py-24`}>
          <p className="text-lg text-muted-foreground">Upcoming event</p>
          <h2 id="event-title" className="mt-2 font-display text-[2.25rem] leading-[1.05] tracking-[-0.02em] md:text-[3rem]">{featuredEvent.title}</h2>
          <dl className="mt-8 flex flex-col gap-3 text-base">
            <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-muted-foreground" aria-hidden /><dt className="sr-only">Date</dt><dd>{formatDate(featuredEvent.startDate, featuredEvent.endDate)}</dd></div>
            {featuredEvent.time && <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-muted-foreground" aria-hidden /><dt className="sr-only">Time</dt><dd>{featuredEvent.time}</dd></div>}
            {featuredEvent.location && <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-muted-foreground" aria-hidden /><dt className="sr-only">Place</dt><dd>{featuredEvent.location}</dd></div>}
          </dl>
          {featuredEvent.description && <p className="mt-6 max-w-[56ch] text-lg leading-relaxed">{featuredEvent.description}</p>}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            {featuredEvent.websiteUrl && (
              <ActionLink href={featuredEvent.websiteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden /> Learn more
              </ActionLink>
            )}
            <ActionLink href="/events" variant={featuredEvent.websiteUrl ? "quiet" : "solid"}>View all events</ActionLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LiveSiteHome() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('live');

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'admin') {
      setLocation('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      
      <main className="bg-background">
        <HeroSection />
        <FeaturedEventSection />
        <FeaturedProductsSection />
        <ForBusinessSection />
      </main>
      
      <Footer />
    </div>
  );
}
