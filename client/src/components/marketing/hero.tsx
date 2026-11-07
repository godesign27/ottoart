import type { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { artSrc, artSrcSet } from "./art";

// The first screen of a marketing page: the words on the light page ground, one large picture beside them
// running to the screen edge. On a phone the words and actions come first, the picture under them.
export function MarketingHero({
  crumb, title, titleClass, lead, body, actions, facts, image, imageAlt, caption, wide,
}: {
  crumb?: string;
  title: ReactNode;
  titleClass?: string;
  lead?: ReactNode;
  body: ReactNode;
  actions: ReactNode;
  facts?: ReactNode;
  image?: string | null;
  imageAlt: string;
  caption?: string;
  /** Give the words half the width at every size (for longer headlines). */
  wide?: boolean;
}) {
  return (
    <section aria-labelledby="page-title" className="relative bg-background">
      <div className="grid lg:min-h-[min(calc(100svh-4rem),56rem)] lg:grid-cols-12">
        <div className={`flex flex-col justify-center px-4 pb-14 pt-10 sm:px-6 lg:col-span-6 lg:py-20 lg:pl-[max(2.5rem,calc((100vw-90rem)/2+2.5rem))] lg:pr-14 xl:pr-16 ${wide ? "xl:col-span-6" : "xl:col-span-5"}`}>
          {crumb && (
            <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
              <ol className="flex flex-wrap gap-2">
                <li><Link href="/" className="underline-offset-4 hover:text-foreground hover:underline">Home</Link></li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="text-foreground">{crumb}</li>
              </ol>
            </nav>
          )}
          <h1 id="page-title" className={cn("font-display tracking-[-0.03em] text-balance", titleClass ?? "text-[3rem] md:text-[4.5rem] xl:text-[5.25rem]", "leading-[0.98]")}>
            {title}
          </h1>
          {lead && <p className="mt-6 text-xl font-semibold leading-snug md:text-2xl">{lead}</p>}
          <div className="mt-4 max-w-[48ch] text-lg leading-relaxed">{body}</div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">{actions}</div>
          {facts && <div className="mt-10 text-sm text-muted-foreground">{facts}</div>}
        </div>

        <figure className={`relative m-0 aspect-[4/3] bg-secondary lg:col-span-6 lg:aspect-auto ${wide ? "xl:col-span-6" : "xl:col-span-7"}`}>
          {image && (
            <img
              src={artSrc(image, 1600)}
              srcSet={artSrcSet(image, [640, 960, 1280, 1600])}
              sizes="(min-width: 1280px) 58vw, (min-width: 1024px) 50vw, 100vw"
              alt={imageAlt}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {caption && image && (
            <figcaption className="absolute bottom-0 left-0 bg-background/90 px-4 py-1.5 text-sm text-muted-foreground sm:px-6 lg:px-4">
              {caption}
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  );
}
