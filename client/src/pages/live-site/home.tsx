import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { HeroSection } from "@/components/live-site/hero-section";
import { ProductGrid } from "@/components/live-site/product-grid";
import { Footer } from "@/components/live-site/footer";
import { Calendar, Clock, MapPin, ExternalLink } from "lucide-react";
import type { Product, Event } from "@shared/schema";

// Custom component to display featured products using ProductGrid
function FeaturedProductsSection() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    select: (data) => data?.filter(product => product.isFeatured) || []
  });

  if (isLoading) {
    return (
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Featured Artworks</h2>
            <p className="text-xl text-muted-foreground">Discover the latest additions to the collection</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                <div className="w-full h-64 bg-muted animate-pulse"></div>
                <div className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-6" data-testid="featured-artworks">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Featured Artworks</h2>
          <p className="text-xl text-muted-foreground">Discover the latest additions to the collection</p>
        </div>

        <ProductGrid products={products} />

        <div className="text-center mt-12">
          <Link href="/shop-all">
            <Button 
              variant="outline" 
              className="px-8 py-3 font-medium"
              data-testid="view-all-artworks"
            >
              View All Artworks
            </Button>
          </Link>
        </div>
      </div>
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
    <section className="py-16 px-6 bg-muted/30" data-testid="featured-event">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">Upcoming Event</h2>
          <p className="text-muted-foreground">Join me at this special event</p>
        </div>

        <Card className="overflow-hidden shadow-md">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {featuredEvent.imageUrl && (
                <div>
                  <img 
                    src={featuredEvent.imageUrl} 
                    alt={featuredEvent.title}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
              )}
              <div className={`${featuredEvent.imageUrl ? '' : 'md:col-span-2'} p-8 flex flex-col justify-center`}>
                <h3 className="text-2xl font-bold text-foreground mb-4">{featuredEvent.title}</h3>
                
                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    <span>{formatDate(featuredEvent.startDate, featuredEvent.endDate)}</span>
                  </div>
                  {featuredEvent.time && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="h-5 w-5" />
                      <span>{featuredEvent.time}</span>
                    </div>
                  )}
                  {featuredEvent.location && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="h-5 w-5" />
                      <span>{featuredEvent.location}</span>
                    </div>
                  )}
                </div>
                
                {featuredEvent.description && (
                  <p className="text-muted-foreground leading-relaxed mb-6">{featuredEvent.description}</p>
                )}

                <div className="flex gap-3">
                  {featuredEvent.websiteUrl && (
                    <Button asChild>
                      <a href={featuredEvent.websiteUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Learn More
                      </a>
                    </Button>
                  )}
                  <Link href="/events">
                    <Button variant="outline">
                      View All Events
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
