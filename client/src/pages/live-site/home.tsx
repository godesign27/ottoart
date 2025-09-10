import { useState } from "react";
import { useLocation } from "wouter";
import { LiveSiteNavigation } from "@/components/live-site/navigation";
import { HeroSection } from "@/components/live-site/hero-section";
import { FeaturedArtworks } from "@/components/live-site/featured-artworks";
import { AboutSection } from "@/components/live-site/about-section";
import { ContactSection } from "@/components/live-site/contact-section";

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
        <FeaturedArtworks />
        <AboutSection />
        <ContactSection />
      </main>
    </div>
  );
}
