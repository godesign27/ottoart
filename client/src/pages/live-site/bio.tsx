import { useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { ActionLink, Frame, SectionTitle } from "@/components/marketing/primitives";
import { artSrc, artSrcSet } from "@/components/marketing/art";
import { isArtType, useArtTypeTagIds, type ArtType } from "@/components/live-site/art-type-filter";
import { saveTrail } from "@/components/live-site/browse-trail";
import { useReveal } from "@/hooks/use-reveal";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { cn } from "@/lib/utils";

// The bio page. Everything written here comes from Admin › Bio; the works come from the shop.
// The bio is split into paragraphs: the first introduces Otto beside the portrait, the paragraphs that talk about
// the abstract and the animal work sit beside those works, and the rest are read under the "Art That Moves You" statement.

interface BioSettings {
  bioContent?: string;
  bioImage?: string;
  heroData?: { headline?: string; description?: string; backgroundImage?: string };
  ctaData?: { enabled?: boolean; headline?: string; description?: string; buttonText?: string; buttonUrl?: string; backgroundImage?: string };
}

const BODIES: Array<{ type: ArtType; title: string; match: RegExp; ground: string; seeAll: string }> = [
  { type: "abstract", title: "Abstract line paintings", match: /abstract|line painting/i, ground: "bg-secondary", seeAll: "See all abstract works" },
  { type: "animal", title: "Animal characters", match: /animal|character/i, ground: "bg-[hsl(336_60%_93%)]", seeAll: "See all animal works" },
];

// Each artwork has a room picture first and the framed work second; the bio shows the work itself.
function workImage(p: Product): string {
  const imgs = p.images ?? [];
  return imgs.find((u) => /framed/i.test(u)) ?? imgs[1] ?? imgs[0];
}

function splitParagraphs(text: string) {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

export default function BioPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"admin" | "live">("live");
  const rootRef = useRef<HTMLDivElement>(null);

  const { data: bio, isLoading } = useQuery<BioSettings>({ queryKey: ["/api/bio-settings"] });
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", { category: undefined, printOnly: false }],
    queryFn: async () => (await apiRequest("GET", "/api/products")).json(),
  });
  const tagIds = useArtTypeTagIds();

  useDocumentMeta({
    title: "About Otto | Timothy McGuire, artist and designer | Otto Art",
    description: "Otto is the working name of Timothy McGuire: abstract line paintings, an animal character series, and a career in UX and visual design.",
  });

  const handleViewModeChange = (mode: "admin" | "live") => {
    setViewMode(mode);
    if (mode === "admin") setLocation("/admin");
  };

  // Paragraphs, placed by what they talk about.
  const { intro, byBody, rest } = useMemo(() => {
    const paras = splitParagraphs(bio?.bioContent ?? "");
    const [first, ...others] = paras;
    const used = new Set<number>();
    const byBody: Partial<Record<ArtType, string>> = {};
    for (const body of BODIES) {
      const i = others.findIndex((p, idx) => !used.has(idx) && body.match.test(p));
      if (i !== -1) {
        used.add(i);
        byBody[body.type] = others[i];
      }
    }
    // The art comes first; what Otto does for a living (the design career) reads after it, at body size.
    const remaining = others.filter((_, idx) => !used.has(idx));
    const isDayJob = (p: string) => /career|UX|senior/i.test(p) && !/dual identity|invites viewers/i.test(p);
    const rest = [...remaining.filter((p) => !isDayJob(p)), ...remaining.filter(isDayJob)];
    return { intro: first, byBody, rest };
  }, [bio?.bioContent]);

  // Live works with a picture, featured first, for each body of work.
  const works = useMemo(() => {
    const live = products
      .filter((p) => p.status === "active" && p.images?.[0])
      .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || Number(b.showInGallery) - Number(a.showInGallery));
    return {
      abstract: live.filter((p) => isArtType(p, tagIds.abstract)).slice(0, 5),
      animal: live.filter((p) => isArtType(p, tagIds.animal)).slice(0, 5),
    } as Record<ArtType, Product[]>;
  }, [products, tagIds.abstract.join(), tagIds.animal.join()]);

  useReveal(rootRef, [isLoading, works.abstract.length, works.animal.length]);

  const hero = bio?.heroData ?? {};
  const cta = bio?.ctaData ?? {};
  const showCta = !isLoading && cta.enabled !== false && !!cta.headline;
  // The closing tile repeats the statement's description in the saved settings; show it once.
  const ctaDescription = cta.description && cta.description !== hero.description ? cta.description : null;
  const ctaPicture = cta.backgroundImage || works.abstract[0]?.images?.[0] || works.animal[0]?.images?.[0];
  const bodies = BODIES.filter((b) => byBody[b.type] || works[b.type].length);

  return (
    <div ref={rootRef} className="min-h-screen bg-background text-foreground">
      <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />

      <main>
        {/* Who: the name, the introduction and the portrait */}
        <section aria-labelledby="page-title" className="bg-background" data-testid="bio-hero-section">
          <div className="grid lg:min-h-[min(calc(100svh-4rem),54rem)] lg:grid-cols-12">
            <div className="flex min-w-0 flex-col justify-center px-4 pb-14 pt-10 sm:px-6 lg:col-span-7 lg:py-20 lg:pl-[max(2.5rem,calc((100vw-90rem)/2+2.5rem))] lg:pr-16">
              <h1 id="page-title" className="font-display text-[5.5rem] leading-[0.9] tracking-[-0.04em] sm:text-[8rem] xl:text-[10.5rem]" data-testid="hero-headline">
                Otto
              </h1>
              <p className="mt-6 text-xl font-semibold leading-snug md:text-2xl">Timothy McGuire, artist and designer</p>
              {isLoading ? (
                <div className="mt-5 max-w-[52ch] space-y-3" aria-hidden>
                  <div className="h-5 w-full bg-secondary" />
                  <div className="h-5 w-11/12 bg-secondary" />
                  <div className="h-5 w-2/3 bg-secondary" />
                </div>
              ) : (
                intro && <p className="mt-5 max-w-[52ch] text-lg leading-relaxed md:text-xl" data-testid="bio-intro">{intro}</p>
              )}
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <ActionLink href="#work">See the two bodies of work</ActionLink>
                {showCta && cta.buttonUrl && cta.buttonText && (
                  <ActionLink href={cta.buttonUrl} variant="quiet">{cta.buttonText}</ActionLink>
                )}
              </div>
            </div>

            {/* The stone ground holds the space while the portrait loads; nothing else is shown in its place. */}
            <figure className="relative m-0 aspect-[4/5] bg-secondary sm:aspect-[4/3] lg:col-span-5 lg:aspect-auto">
              {bio?.bioImage && (
                <img
                  src={artSrc(bio.bioImage, 1280)}
                  srcSet={artSrcSet(bio.bioImage, [640, 960, 1280, 1600])}
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  alt="Timothy McGuire, who works as Otto"
                  fetchPriority="high"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                  data-testid="artist-photo"
                />
              )}
            </figure>
          </div>
        </section>

        {/* What: the two bodies of work, each beside its own paintings */}
        {bodies.length > 0 && (
          <section id="work" aria-labelledby="work-title" className="scroll-mt-24 py-20 md:py-28">
            <Frame>
              <SectionTitle id="work-title">Two bodies of work</SectionTitle>
              <div className="mt-12 grid gap-16 md:mt-16 lg:grid-cols-12 lg:gap-10">
                {bodies.map((body, i) => (
                  <BodyOfWork
                    key={body.type}
                    title={body.title}
                    text={byBody[body.type]}
                    works={works[body.type]}
                    ground={body.ground}
                    seeAllHref={`/shop-all?type=${body.type}`}
                    seeAllLabel={body.seeAll}
                    className={cn("lg:col-span-6", i === 1 && "lg:mt-40")}
                  />
                ))}
              </div>
            </Frame>
          </section>
        )}

        {/* Why: the statement, then the rest of the story */}
        {(hero.headline || rest.length > 0) && (
          <section aria-labelledby="statement-title" className="bg-muted/40 py-20 md:py-28">
            <Frame className="grid gap-12 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-5">
                <div className="lg:sticky lg:top-28">
                  <SectionTitle id="statement-title" className="md:text-[4rem]">{hero.headline || "Designer and artist"}</SectionTitle>
                  {hero.description && (
                    <p data-reveal style={{ ["--reveal-i" as string]: 1 }} className="mt-6 max-w-[40ch] text-lg leading-relaxed text-muted-foreground md:text-xl" data-testid="hero-description">
                      {hero.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-6 lg:col-span-6 lg:col-start-7" data-testid="bio-content">
                {rest.map((p, i) => (
                  <p
                    key={i}
                    data-reveal
                    style={{ ["--reveal-i" as string]: i }}
                    className={cn("max-w-[60ch] leading-relaxed", i === 0 ? "font-display text-[1.75rem] leading-[1.25] tracking-[-0.01em] md:text-[2.125rem]" : "text-lg")}
                  >
                    {p}
                  </p>
                ))}
              </div>
            </Frame>
          </section>
        )}

        {/* Next step: the closing tile row */}
        {showCta && (
          <section aria-labelledby="cta-headline" className="overflow-hidden py-24 md:py-32" data-testid="bio-cta-section">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-12 md:gap-3">
              <div className="order-2 h-32 bg-[hsl(188_28%_88%)] md:order-none md:col-span-2 md:h-[24rem]" aria-hidden />
              <div data-reveal className="col-span-2 flex flex-col justify-center bg-brand p-8 text-brand-foreground md:col-span-7 md:h-[24rem] md:p-12">
                <h2 id="cta-headline" className="font-display text-[2rem] leading-[1.05] tracking-[-0.02em] text-balance md:text-[2.75rem]" data-testid="cta-headline">
                  {cta.headline}
                </h2>
                {ctaDescription && (
                  <p className="mt-4 max-w-[56ch] text-base leading-relaxed" data-testid="cta-description">{ctaDescription}</p>
                )}
                {cta.buttonText && cta.buttonUrl && (
                  <div className="mt-8">
                    <ActionLink href={cta.buttonUrl} variant="paper" data-testid="cta-button">{cta.buttonText}</ActionLink>
                  </div>
                )}
              </div>
              <div className="order-3 h-32 overflow-hidden bg-secondary md:order-none md:col-span-3 md:h-[24rem]">
                {ctaPicture && <img src={artSrc(ctaPicture, 640)} alt="" loading="lazy" className="h-full w-full object-cover" />}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

/** One body of work: a large picture you can change by pointing at (or tapping) the works under it, and its paragraph. */
function BodyOfWork({ title, text, works, ground, seeAllHref, seeAllLabel, className }: {
  title: string;
  text?: string;
  works: Product[];
  ground: string;
  seeAllHref: string;
  seeAllLabel: string;
  className?: string;
}) {
  const [shown, setShown] = useState(0);
  const id = `body-${title.split(" ")[0].toLowerCase()}`;
  const current = works[Math.min(shown, works.length - 1)];
  const keepTrail = () => saveTrail(works.map((w) => w.id), "/bio");

  return (
    <article aria-labelledby={id} className={className}>
      {current && (
        <figure className="m-0">
          <Link href={`/product/${current.id}`} onClick={keepTrail} className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            <div className={cn("relative aspect-[4/5] overflow-hidden lg:aspect-auto lg:h-[min(44rem,76vh)]", ground)}>
              {works.map((w, i) => (
                <img
                  key={w.id}
                  src={artSrc(workImage(w), 960)}
                  srcSet={artSrcSet(workImage(w), [480, 640, 960, 1280])}
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  alt={i === shown ? w.name : ""}
                  aria-hidden={i !== shown}
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    "absolute inset-0 h-full w-full object-contain p-6 mix-blend-multiply dark:mix-blend-normal transition-[opacity,transform] sm:p-10 duration-300 [transition-timing-function:var(--ease-out)] group-hover:scale-[1.02]",
                    i === shown ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
            </div>
            <figcaption className="mt-3 flex items-baseline justify-between gap-4 text-base">
              <span className="font-semibold underline-offset-4 group-hover:underline">{current.name}</span>
              {current.dimensions && <span className="shrink-0 text-sm text-muted-foreground">{current.dimensions}</span>}
            </figcaption>
          </Link>
        </figure>
      )}

      {works.length > 1 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label={`More ${title.toLowerCase()}`}>
          {works.map((w, i) => (
            <li key={w.id}>
              <button
                type="button"
                aria-pressed={i === shown}
                aria-label={`Show ${w.name}`}
                onClick={() => setShown(i)}
                onPointerEnter={(e) => e.pointerType === "mouse" && setShown(i)}
                onFocus={() => setShown(i)}
                className={cn(
                  "block h-14 w-14 overflow-hidden transition-[opacity,outline-color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:h-16 sm:w-16",
                  ground,
                  i === shown ? "outline outline-2 outline-offset-2 outline-foreground" : "opacity-70 hover:opacity-100",
                )}
              >
                <img src={artSrc(workImage(w), 160)} alt="" loading="lazy" className="h-full w-full object-contain p-1 mix-blend-multiply dark:mix-blend-normal" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 id={id} data-reveal className="mt-10 font-display text-[1.75rem] leading-tight tracking-[-0.01em] md:text-[2.25rem]">{title}</h3>
      {text && <p data-reveal style={{ ["--reveal-i" as string]: 1 }} className="mt-4 max-w-[60ch] text-lg leading-relaxed">{text}</p>}
      {works.length > 0 && (
        <Link href={seeAllHref} className="mt-6 inline-flex min-h-12 items-center text-base font-semibold underline underline-offset-4 hover:no-underline">
          {seeAllLabel}
        </Link>
      )}
    </article>
  );
}
