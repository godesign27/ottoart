import { useState } from "react";
import { useLocation } from "wouter";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <style>{`
        @keyframes gradient {
          0% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          100% {
            background-position: 0% 0%;
          }
        }

        @keyframes wave {
          2% {
            transform: translateX(1);
          }
          25% {
            transform: translateX(-25%);
          }
          50% {
            transform: translateX(-50%);
          }
          75% {
            transform: translateX(-25%);
          }
          100% {
            transform: translateX(1);
          }
        }

        .hero-gradient {
          background: linear-gradient(315deg, rgba(101,0,94,1) 3%, rgba(40,90,150,1) 38%, rgba(30,120,115,1) 68%, rgba(120,15,15,1) 98%);
          animation: gradient 15s ease infinite;
          background-size: 400% 400%;
        }

        .wave {
          background: rgb(255 255 255 / 25%);
          border-radius: 1000% 1000% 0 0;
          position: absolute;
          width: 200%;
          height: 12em;
          animation: wave 10s -3s linear infinite;
          transform: translate3d(0, 0, 0);
          opacity: 0.8;
          bottom: 0;
          left: 0;
          z-index: 1;
        }

        .wave:nth-of-type(2) {
          bottom: -1.25em;
          animation: wave 18s linear reverse infinite;
          opacity: 0.8;
        }

        .wave:nth-of-type(3) {
          bottom: -2.5em;
          animation: wave 20s -1s reverse infinite;
          opacity: 0.9;
        }
      `}</style>
      <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      
      {/* Hero Section */}
      <section 
        className="hero-gradient relative min-h-[70vh] flex items-center justify-center text-center overflow-hidden"
        data-testid="corporate-hero-section"
      >
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
          <Badge className="mb-6 text-sm font-semibold px-4 py-2 bg-white/20 text-white border-white/30" data-testid="hero-badge">
            Corporate Buyers
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-8 tracking-tight" data-testid="hero-headline">
            Elevate Your Space with Original Art
          </h1>
          <p className="text-xl md:text-2xl text-white/80 leading-relaxed max-w-4xl mx-auto" data-testid="hero-description">
            Art is more than decoration — it's a powerful way to shape how people feel in your space. 
            My work brings bold design, texture, and energy into environments where people gather, work, and travel.
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xl text-muted-foreground leading-relaxed text-center">
            Whether you're curating a welcoming lobby, energizing a boardroom, or creating memorable guest experiences, 
            the right artwork makes a lasting impression.
          </p>
        </div>
      </section>

      {/* Who I Work With */}
      <section className="py-20 bg-gray-100 dark:bg-slate-800">
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
                  className="bg-white dark:bg-slate-950 p-8 rounded-lg shadow-sm border border-border hover:shadow-lg transition-shadow"
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
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
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
                  className="flex gap-6 p-8 bg-white dark:bg-slate-950 rounded-lg border border-border shadow-sm"
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
      <section className="py-20 bg-gray-100 dark:bg-slate-800">
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
              onClick={() => window.open('https://cal.com/ottoart', '_blank')}
            >
              Schedule a Consultation
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold"
              data-testid="button-lets-talk"
              onClick={() => setLocation('/contact')}
            >
              Let's Talk
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
