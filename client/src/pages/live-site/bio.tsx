import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Button } from "@/components/ui/button";

export default function BioPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('live');

  // Load bio settings from API
  const { data: bioSettings, isLoading } = useQuery<any>({
    queryKey: ['/api/bio-settings']
  });

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'admin') {
      setLocation('/admin');
    }
  };

  // Default values if no data
  const bioContent = bioSettings?.bioContent || "Welcome to my artistic journey. I am a contemporary artist specializing in abstract paintings and mixed media works that explore the intersection of color, form, and emotion.";
  
  const bioImage = bioSettings?.bioImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400";
  
  const heroData = bioSettings?.heroData || {
    headline: "Art That Moves You",
    description: "I don't just create pieces—I build experiences that spark curiosity, boldness, and reflection. This is more than art on a wall—it's energy you can feel every time you walk by.",
    backgroundImage: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&h=800"
  };

  const ctaData = bioSettings?.ctaData || {
    enabled: true,
    headline: "From Vision to Canvas—Made Just for You",
    description: "I don't just create pieces—I build experiences that spark curiosity, boldness, and reflection. This is more than art on a wall—it's energy you can feel every time you walk by.",
    buttonText: "Claim Your Artwork",
    buttonUrl: "/contact",
    backgroundImage: ""
  };

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      
      {/* Hero Section */}
      <section 
        className="relative min-h-[60vh] flex items-center justify-center text-center bg-cover bg-center"
        style={{
          backgroundImage: `url('${heroData.backgroundImage}')`,
        }}
        data-testid="bio-hero-section"
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6" data-testid="hero-headline">
            {heroData.headline}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 leading-relaxed" data-testid="hero-description">
            {heroData.description}
          </p>
        </div>
      </section>
      
      {/* Bio Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <img 
                src={bioImage} 
                alt="Otto Artist" 
                className="w-full h-80 object-cover rounded-lg shadow-lg" 
                data-testid="artist-photo"
              />
            </div>
            
            <div className="space-y-6">
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-line" data-testid="bio-content">
                  {bioContent}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Call to Action Section - Only render if enabled */}
      {ctaData.enabled && (
        <section 
          className="relative py-20 text-center"
          style={{
            backgroundColor: ctaData.backgroundImage ? 'transparent' : '#1e293b',
            backgroundImage: ctaData.backgroundImage ? `url('${ctaData.backgroundImage}')` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          data-testid="bio-cta-section"
        >
          {ctaData.backgroundImage && <div className="absolute inset-0 bg-black/50"></div>}
          <div className="relative z-10 max-w-4xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" data-testid="cta-headline">
              {ctaData.headline}
            </h2>
            <p className="text-xl text-white/80 leading-relaxed mb-8 max-w-3xl mx-auto" data-testid="cta-description">
              {ctaData.description}
            </p>
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
              data-testid="cta-button"
              onClick={() => setLocation(ctaData.buttonUrl)}
            >
              {ctaData.buttonText}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}