import { useState } from "react";
import { useLocation } from "wouter";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { Button } from "@/components/ui/button";
import { Building2, Hotel, Briefcase, Heart, Plane, Palette, Sparkles, RotateCw, Check } from "lucide-react";

export default function CorporateBuyersPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('live');

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'admin') {
      setLocation('/admin');
    }
  };

  const whoWeWorkWith = [
    {
      icon: Hotel,
      title: "Hotels & Resorts",
      description: "Enhance guest rooms, lobbies, spas, and restaurants with original art or curated series."
    },
    {
      icon: Briefcase,
      title: "Corporate Offices",
      description: "Inspire creativity and focus with artwork that reflects your company's brand and culture."
    },
    {
      icon: Heart,
      title: "Healthcare & Wellness",
      description: "Create calming environments in waiting rooms, clinics, and wellness centers."
    },
    {
      icon: Plane,
      title: "Airports & Transportation Hubs",
      description: "Transform lounges, concourses, and terminals into vibrant experiences."
    },
    {
      icon: Palette,
      title: "Architects & Interior Designers",
      description: "Partner on projects with custom commissions and tailored print programs."
    }
  ];

  const options = [
    {
      icon: Sparkles,
      title: "Originals",
      description: "Unique statement pieces designed to stand out."
    },
    {
      icon: Building2,
      title: "Limited Edition Prints",
      description: "High-quality, scalable art for multiple rooms or large spaces."
    },
    {
      icon: Palette,
      title: "Custom Commissions",
      description: "Collaborative, tailored pieces designed around your vision, brand, or space."
    },
    {
      icon: RotateCw,
      title: "Rotational Programs",
      description: "Seasonal or rotating art collections to keep environments fresh and dynamic."
    }
  ];

  const benefits = [
    {
      title: "Tailored Solutions",
      description: "Artwork created or selected to align with your brand, architecture, and goals."
    },
    {
      title: "Scalable Options",
      description: "From a single lobby centerpiece to an entire property collection."
    },
    {
      title: "Seamless Process",
      description: "Consultation, mockups, and delivery with professional packaging and installation support."
    },
    {
      title: "Proven Design Expertise",
      description: "20+ years of design experience, bringing both creativity and professionalism to every project."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      
      {/* Hero Section */}
      <section 
        className="relative min-h-[70vh] flex items-center justify-center text-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        data-testid="corporate-hero-section"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight" data-testid="hero-headline">
            Corporate Buyers
          </h1>
          <p className="text-3xl md:text-4xl text-white/90 font-light mb-8 tracking-wide" data-testid="hero-subheadline">
            Elevate Your Space with Original Art
          </p>
          <p className="text-xl md:text-2xl text-white/80 leading-relaxed max-w-4xl mx-auto" data-testid="hero-description">
            Art is more than decoration — it's a powerful way to shape how people feel in your space. 
            My work brings bold design, texture, and energy into environments where people gather, work, and travel.
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xl text-muted-foreground leading-relaxed text-center">
            Whether you're curating a welcoming lobby, energizing a boardroom, or creating memorable guest experiences, 
            the right artwork makes a lasting impression.
          </p>
        </div>
      </section>

      {/* Who I Work With */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16" data-testid="who-we-work-with-heading">
            Who I Work With
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whoWeWorkWith.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="bg-background p-8 rounded-lg shadow-sm border border-border hover:shadow-lg transition-shadow"
                  data-testid={`work-with-card-${index}`}
                >
                  <Icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Options for Corporate Buyers */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16" data-testid="options-heading">
            Options for Corporate Buyers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {options.map((option, index) => {
              const Icon = option.icon;
              return (
                <div 
                  key={index}
                  className="flex gap-6 p-8 bg-muted/30 rounded-lg border border-border"
                  data-testid={`option-card-${index}`}
                >
                  <div className="flex-shrink-0">
                    <Icon className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">{option.title}</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">{option.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Partner With Me */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16" data-testid="benefits-heading">
            Why Partner With Me
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex gap-4"
                data-testid={`benefit-item-${index}`}
              >
                <div className="flex-shrink-0 mt-1">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section 
        className="relative py-24 text-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        data-testid="cta-section"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" data-testid="cta-headline">
            Let's Talk About Your Space
          </h2>
          <p className="text-xl text-white/80 leading-relaxed mb-10 max-w-3xl mx-auto" data-testid="cta-description">
            I offer complimentary consultations to explore how my art can enhance your environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-6 text-lg font-semibold"
              data-testid="button-schedule-consultation"
              onClick={() => setLocation('/contact')}
            >
              Schedule a Consultation
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold"
              data-testid="button-request-portfolio"
              onClick={() => setLocation('/contact')}
            >
              Request a Portfolio PDF
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
