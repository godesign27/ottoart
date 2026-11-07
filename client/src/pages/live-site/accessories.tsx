import { useState } from "react";
import { useLocation } from "wouter";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { ProductGrid } from "@/components/live-site/product-grid";

export default function AccessoriesPage() {
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
      
      <main className="mx-auto w-full max-w-[90rem] px-4 pb-24 pt-12 sm:px-6 lg:px-10 lg:pt-16">
        <div className="space-y-10">
          <div>
            <h1 className="font-display text-[2.5rem] leading-[1.02] tracking-[-0.02em] md:text-[3.5rem]">Accessories</h1>
            <p className="mt-3 max-w-[52ch] text-lg text-muted-foreground">Art-related accessories and items</p>
          </div>
          <ProductGrid category="Accessories" />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}