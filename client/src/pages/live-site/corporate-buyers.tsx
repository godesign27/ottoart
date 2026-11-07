import { BoardsPromo } from "@/components/marketing/boards-promo";
import { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ActionButton, ActionLink, Frame, SectionTitle } from "@/components/marketing/primitives";
import { MarketingHero } from "@/components/marketing/hero";
import { AdminOffNotice, PageUnavailable } from "@/components/marketing/page-unavailable";
import { artSrc } from "@/components/marketing/art";
import { usePageAccess, usePageEnabled } from "@/hooks/use-page-access";
import { useRentalArtworks } from "@/hooks/use-rental-artworks";
import { useReveal } from "@/hooks/use-reveal";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import officeWallImage from "@assets/office-wall-corporate1_1761342062803.png";

export default function CorporateBuyersPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('live');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const access = usePageAccess("corporate-buyers");
  const pageEnabled = usePageEnabled();
  const { artworks } = useRentalArtworks();
  const rootRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState(0);
  useReveal(rootRef, [access.canView, artworks.length]);
  useDocumentMeta({
    title: "Corporate Art Buyers | Original Art & Prints | Otto Art",
    description: "Original abstract art, limited edition prints, commissions and rotational programs by Otto for offices, hotels, healthcare and hospitality spaces.",
  });

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'admin') {
      setLocation('/admin');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    // Add selected styles to form data
    selectedStyles.forEach(style => {
      data.append('style', style);
    });

    // Basic client-side validation
    if (!data.get("name") || !data.get("company") || !data.get("email")) {
      setSubmitting(false);
      setStatus({ ok: false, msg: "Please fill in your name, company, and email." });
      return;
    }

    try {
      const res = await fetch("https://formspree.io/f/xqayrpoe", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data
      });

      if (res.ok) {
        form.reset();
        setSelectedStyles([]);
        setStatus({ ok: true, msg: "Thanks! Your inquiry has been sent. I'll reply soon." });
      } else {
        const err = await res.json().catch(() => ({}));
        setStatus({
          ok: false,
          msg: err?.errors?.[0]?.message || "Something went wrong. Please try again."
        });
      }
    } catch {
      setStatus({ ok: false, msg: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style) 
        : [...prev, style]
    );
  };

  const whoWeWorkWith = [
    {
      title: "Hotels & Resorts",
      description: "Enhance guest rooms, lobbies, spas, and restaurants with original art or curated series."
    },
    {
      title: "Corporate Offices",
      description: "Inspire creativity and focus with artwork that reflects your company's brand and culture."
    },
    {
      title: "Healthcare & Wellness",
      description: "Create calming environments in waiting rooms, clinics, and wellness centers."
    },
    {
      title: "Airports & Transportation Hubs",
      description: "Transform lounges, concourses, and terminals into vibrant experiences."
    },
    {
      title: "Architects & Interior Designers",
      description: "Partner on projects with custom commissions and tailored print programs."
    }
  ];

  const options = [
    {
      title: "Originals",
      description: "Unique statement pieces designed to stand out."
    },
    {
      title: "Limited Edition Prints",
      description: "High-quality, scalable art for multiple rooms or large spaces."
    },
    {
      title: "Custom Commissions",
      description: "Collaborative, tailored pieces designed around your vision, brand, or space."
    },
    {
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

  if (access.isDeciding) return <div className="min-h-svh bg-background" />;
  if (!access.canView) {
    return <PageUnavailable suggestion="For artwork for your business, get in touch and we’ll help." />;
  }

  const rooms = artworks.map((x) => x.room).filter((r): r is string => !!r);
  const previews = [...rooms.slice(2), officeWallImage];
  const fields = ["bg-secondary", "bg-[hsl(336_60%_93%)]", "bg-[hsl(188_28%_88%)]", "bg-[hsl(38_18%_84%)]"];

  return (
    <div ref={rootRef} className="min-h-svh bg-background text-foreground">
      {access.showAdminNotice && <AdminOffNotice adminHref="/admin/corporate-buyers" />}
      <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />

      <main>
        <MarketingHero
          crumb="Corporate Buyers"
          title="Elevate your space with original art"
          titleClass="text-[2.5rem] md:text-[3.75rem] xl:text-[4.25rem]"
          wide
          body={<p data-testid="hero-description">Art is more than decoration — it’s a powerful way to shape how people feel in your space. My work brings bold design, texture, and energy into environments where people gather, work, and travel.</p>}
          actions={<>
            <ActionButton onClick={() => setIsFormOpen(true)} data-testid="button-hero-lets-talk">Let’s talk</ActionButton>
            <ActionLink href="#corporate-options" variant="quiet">See the options</ActionLink>
          </>}
          image={officeWallImage}
          imageAlt="Otto Art prints on an office wall"
          caption="Digital visualisation; artwork scale and placement may vary."
        />

        {/* The work in a real setting, with the introduction beside it */}
        <section aria-labelledby="impression-title" className="py-24 md:py-36">
          <Frame className="grid items-center gap-12 lg:grid-cols-12">
            <figure className="lg:col-span-7" data-reveal>
              <img src={rooms[1] ? artSrc(rooms[1], 1280) : officeWallImage} alt="An Otto Art work in a room, digital visualisation" width={896} height={812} loading="lazy" className="aspect-[4/3] w-full object-cover" data-testid="office-wall-image" />
              <figcaption className="mt-3 text-sm text-muted-foreground">Digital visualisation; artwork scale and placement may vary.</figcaption>
            </figure>
            <div className="lg:col-span-5">
              <SectionTitle id="impression-title">Make a lasting impression</SectionTitle>
              <p data-reveal style={{ ["--reveal-i" as string]: 1 }} className="mt-6 text-[1.375rem] leading-[1.4] md:text-[1.625rem]">
                Whether you’re curating a welcoming lobby, energizing a boardroom, or creating memorable guest experiences, the right artwork
                makes a lasting impression.
              </p>
            </div>
          </Frame>
        </section>

        {/* Who I work with: an index; pointing at a row shows that kind of space */}
        <section aria-labelledby="who-title" className="bg-muted/50 py-24 md:py-36">
          <Frame className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
              <SectionTitle id="who-title">Who I work with</SectionTitle>
              <div className="relative mt-10 hidden aspect-[4/3] overflow-hidden bg-secondary lg:block" aria-hidden>
                {previews.slice(0, whoWeWorkWith.length).map((src, i) => (
                  <img key={src + i} src={artSrc(src, 960)} alt="" loading="lazy"
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity [transition-duration:240ms] [transition-timing-function:var(--ease-out)] ${preview === i ? "opacity-100" : "opacity-0"}`} />
                ))}
              </div>
              </div>
            </div>
            <ul className="lg:col-span-7">
              {whoWeWorkWith.map((item, index) => (
                <li
                  key={item.title}
                  data-reveal
                  style={{ ["--reveal-i" as string]: index }}
                  onMouseEnter={() => setPreview(index)}
                  className="py-7"
                  data-testid={`work-with-card-${index}`}
                >
                  <h3 className={`font-display text-[1.75rem] leading-tight tracking-[-0.01em] transition-colors duration-200 md:text-[2.25rem] ${preview === index ? "text-foreground" : "lg:text-foreground/55"}`}>
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-[52ch] text-lg leading-relaxed">{item.description}</p>
                </li>
              ))}
            </ul>
          </Frame>
        </section>

        {/* Options: each its own tile, like the specimens */}
        <section id="corporate-options" aria-labelledby="options-heading" className="scroll-mt-20 py-24 md:py-36">
          <Frame>
            <SectionTitle id="options-heading" className="max-w-[18ch]">Options for corporate buyers</SectionTitle>
            <ul className="mt-14 grid gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {options.map((option, index) => {
                const art = artworks.filter((x) => x.studioKnown)[index * 3];
                return (
                  <li key={option.title} data-reveal style={{ ["--reveal-i" as string]: index }} data-testid={`option-card-${index}`}>
                    <div className={`grid aspect-square place-items-center ${fields[index % fields.length]}`}>
                      {art && <img src={artSrc(art.studio, 480)} alt="" loading="lazy" className="h-[70%] w-[70%] object-contain" />}
                    </div>
                    <h3 className="mt-5 text-xl font-semibold">{option.title}</h3>
                    <p className="mt-2 text-base leading-relaxed">{option.description}</p>
                  </li>
                );
              })}
            </ul>
          </Frame>
        </section>

        {/* Why partner */}
        <section aria-labelledby="benefits-heading" className="bg-secondary py-24 md:py-32">
          <Frame className="grid gap-12 lg:grid-cols-12">
            <SectionTitle id="benefits-heading" className="lg:col-span-4">Why partner with me</SectionTitle>
            <dl className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:col-span-8">
              {benefits.map((benefit, index) => (
                <div key={benefit.title} data-reveal style={{ ["--reveal-i" as string]: index }} data-testid={`benefit-item-${index}`}>
                  <dt className="text-2xl font-semibold leading-tight">{benefit.title}</dt>
                  <dd className="mt-3 text-lg leading-relaxed">{benefit.description}</dd>
                </div>
              ))}
            </dl>
          </Frame>
        </section>

        <BoardsPromo />

        {/* Prefer to rent? (shown while the rental page is on) */}
        {pageEnabled("art-rental-leasing") && (
          <section aria-labelledby="rent-title" className="overflow-hidden py-24 md:py-32">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-12 md:gap-3">
              <div className="order-2 h-32 bg-[hsl(188_28%_88%)] md:order-none md:col-span-2 md:h-[22rem]" aria-hidden />
              <div data-reveal className="col-span-2 flex flex-col justify-center bg-brand p-8 text-brand-foreground md:col-span-8 md:h-[22rem] md:p-12">
                <h2 id="rent-title" className="font-display text-[2rem] leading-[1.05] tracking-[-0.02em] md:text-[2.75rem]">Prefer to rent your artwork?</h2>
                <p className="mt-4 max-w-[56ch] text-base leading-relaxed">
                  Explore original artwork and print rentals for 3, 6, or 12 months. See monthly pricing, collection discounts, and the details to consider before requesting a quote.
                </p>
                <div className="mt-8">
                  <ActionLink href="/art-rental-leasing" variant="paper" data-testid="link-art-rental">Explore art rental &amp; leasing</ActionLink>
                </div>
              </div>
              <div className="order-3 h-32 overflow-hidden md:order-none md:col-span-2 md:h-[22rem]">
                {rooms[0] && <img src={artSrc(rooms[0], 640)} alt="" loading="lazy" className="h-full w-full object-cover" />}
              </div>
            </div>
          </section>
        )}

        {/* Call to action */}
        <section aria-labelledby="cta-headline" className="bg-secondary py-24 md:py-32" data-testid="cta-section">
          <Frame className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <h2 id="cta-headline" data-reveal className="font-display text-[2.5rem] leading-[1.02] tracking-[-0.03em] md:text-[4rem]" data-testid="cta-headline">
                Let’s talk about your space
              </h2>
              <p data-reveal style={{ ["--reveal-i" as string]: 1 }} className="mt-6 max-w-[48ch] text-xl leading-relaxed" data-testid="cta-description">
                I offer complimentary consultations to explore how my art can enhance your environment.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
              <ActionButton onClick={() => setIsFormOpen(true)} data-testid="button-lets-talk">Let’s talk</ActionButton>
              <ActionLink href="https://cal.com/ottoart" variant="quiet" target="_blank" rel="noopener noreferrer" data-testid="button-schedule-consultation">
                Schedule a consultation
              </ActionLink>
            </div>
          </Frame>
        </section>
      </main>

      <Footer />

      {/* Corporate Inquiry Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) {
          // Reset status when closing
          setTimeout(() => setStatus(null), 300);
        }
      }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {status?.ok ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Thank you for your inquiry!
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md mb-6">
                I've received your message and will be in touch within 1–2 business days to discuss your project.
              </p>
              <p className="text-base text-muted-foreground italic">
                — Otto, Abstract Artist
              </p>
            </div>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>Let's Talk About Your Space</SheetTitle>
                <SheetDescription>
                  Tell me a bit about your project — I'll follow up soon.
                </SheetDescription>
              </SheetHeader>

              <form onSubmit={handleFormSubmit} className="mt-6 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name"
                name="name" 
                required 
                data-testid="input-corporate-name"
              />
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company">Company / Organization *</Label>
              <Input 
                id="company"
                name="company" 
                required 
                data-testid="input-corporate-company"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email"
                name="email" 
                type="email" 
                required 
                data-testid="input-corporate-email"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input 
                id="phone"
                name="phone" 
                type="tel" 
                data-testid="input-corporate-phone"
              />
            </div>

            {/* Project Type */}
            <div className="space-y-2">
              <Label htmlFor="projectType">Type of Project</Label>
              <Select name="projectType" defaultValue="Office / Corporate HQ">
                <SelectTrigger id="projectType" data-testid="select-project-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Office / Corporate HQ">Office / Corporate HQ</SelectItem>
                  <SelectItem value="Hotel / Resort">Hotel / Resort</SelectItem>
                  <SelectItem value="Healthcare / Wellness">Healthcare / Wellness</SelectItem>
                  <SelectItem value="Real Estate Development">Real Estate Development</SelectItem>
                  <SelectItem value="Restaurant / Hospitality">Restaurant / Hospitality</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Budget Range */}
            <div className="space-y-2">
              <Label htmlFor="budget">Estimated Budget Range</Label>
              <Select name="budget" defaultValue="Under $5,000">
                <SelectTrigger id="budget" data-testid="select-budget">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Under $5,000">Under $5,000</SelectItem>
                  <SelectItem value="$5,000–$15,000">$5,000–$15,000</SelectItem>
                  <SelectItem value="$15,000–$50,000">$15,000–$50,000</SelectItem>
                  <SelectItem value="$50,000+">$50,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Number of Pieces */}
            <div className="space-y-2">
              <Label htmlFor="pieces">Number of Pieces</Label>
              <Input 
                id="pieces"
                name="pieces" 
                type="number" 
                min="0" 
                data-testid="input-corporate-pieces"
              />
            </div>

            {/* Art Preference */}
            <div className="space-y-3">
              <Label>Art Preference</Label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  "Abstract",
                  "Nature-Inspired",
                  "Textural / Mixed Media",
                  "Custom Commission",
                  "Unsure / Open to Ideas"
                ].map((style) => (
                  <div key={style} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`style-${style}`}
                      checked={selectedStyles.includes(style)}
                      onCheckedChange={() => toggleStyle(style)}
                      data-testid={`checkbox-style-${style.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                    <Label 
                      htmlFor={`style-${style}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {style}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Project Location</Label>
              <Input 
                id="location"
                name="location" 
                data-testid="input-corporate-location"
              />
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <Label htmlFor="timeline">Deadline / Timeline</Label>
              <Input 
                id="timeline"
                name="timeline" 
                placeholder="e.g., Installation by March 2026" 
                data-testid="input-corporate-timeline"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message / Vision</Label>
              <Textarea 
                id="message"
                name="message" 
                rows={4} 
                data-testid="textarea-corporate-message"
              />
            </div>

            {/* Hidden fields */}
            <input type="hidden" name="_subject" value="New Corporate Art Inquiry" />
            <input type="hidden" name="source" value="Corporate Art Buyers Page" />
            <input type="text" name="_gotcha" className="hidden" tabIndex={-1} autoComplete="off" />

            {/* Consent */}
            <div className="flex items-start space-x-2">
              <Checkbox id="consent" name="consent" value="yes" data-testid="checkbox-consent" />
              <Label 
                htmlFor="consent"
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                I agree to be contacted about this inquiry. I don't sell or share your info.
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
              data-testid="button-submit-corporate-form"
            >
              {submitting ? "Sending…" : "Send Inquiry"}
            </Button>

            {/* Status Message */}
            {status && !status.ok && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {status.msg}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              I typically respond within 24–48 hours.
            </p>
          </form>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
