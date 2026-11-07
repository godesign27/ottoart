import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ActionLink, Frame, SectionTitle } from "@/components/marketing/primitives";
import { artSrc } from "@/components/marketing/art";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { HeroSection } from "@/components/live-site/hero-section";
import { ProductGrid } from "@/components/live-site/product-grid";
import { Footer } from "@/components/live-site/footer";
import { Calendar, Clock, MapPin, ExternalLink } from "lucide-react";
import type { Product, Event } from "@shared/schema";

// Featured products: the works marked "featured" in the admin, in the shared product grid.
function FeaturedProductsSection() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    select: (data) => data?.filter(product => product.isFeatured) || []
  });

  if (!isLoading && (!products || products.length === 0)) {
    return null;
  }

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
        ) : <ProductGrid products={products} />}
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
      </main>
      
      <Footer />
    </div>
  );
}
