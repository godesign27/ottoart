import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { ActionLink, Frame, SectionTitle } from "@/components/marketing/primitives";
import { SpecimenWall } from "@/components/marketing/specimen-wall";
import { FaqTiles } from "@/components/marketing/faq";
import { AdminOffNotice, PageUnavailable } from "@/components/marketing/page-unavailable";
import { artSrc, artSrcSet } from "@/components/marketing/art";
import { RentalEstimator, type EstimateHandoff } from "@/components/marketing/rental-estimator";
import { RentalInquiryForm } from "@/components/marketing/rental-inquiry-form";
import { usePageAccess } from "@/hooks/use-page-access";
import { useRentalArtworks, type RentalArtwork } from "@/hooks/use-rental-artworks";
import { useReveal } from "@/hooks/use-reveal";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import {
  COLLECTION_TIERS, CUSTOM_QUOTE_FROM, MONTHLY_RATE_BPS, RENTAL_TERMS, formatCents, formatCentsShort, quoteUniform, type RentalQuote,
} from "@shared/rentalPricing";
import officeWallImage from "@assets/office-wall-corporate1_1761342062803.png";

const EXAMPLE_VALUE = 200000; // $2,000, the worked example

export default function ArtRentalLeasingPage() {
  const access = usePageAccess("art-rental-leasing");
  const { artworks } = useRentalArtworks();
  const [picked, setPicked] = useState<{ id: string; at: number } | null>(null);
  const [handoff, setHandoff] = useState<EstimateHandoff | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useReveal(rootRef, [access.canView, artworks.length]);

  useDocumentMeta({
    title: "Art Rental & Leasing | Originals & Prints | Otto Art",
    description: "Rent Otto Art originals and prints for 3, 6, or 12 months. Explore monthly rates, collection discounts, and request a quote for your space.",
  });

  if (access.isDeciding) return <div className="min-h-svh bg-background" />;
  if (!access.canView) {
    return <PageUnavailable suggestion="Looking for art for your space? Get in touch and we’ll help you find the right work." />;
  }

  const studio = artworks.filter((a) => a.studioKnown).map((a) => a.studio);
  const rooms = artworks.map((a) => a.room).filter((r): r is string => !!r);

  const priceThis = (art: RentalArtwork) => {
    setPicked({ id: art.id, at: Date.now() });
    document.getElementById("rental-estimator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sendToInquiry = (h: EstimateHandoff) => {
    setHandoff(h);
    const target = document.getElementById("rental-inquiry");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => document.getElementById("inquiry-name")?.focus({ preventScroll: true }), 600);
  };

  return (
    <div ref={rootRef} className="min-h-svh bg-background text-foreground">
      <LiveSiteNavigation />
      {access.showAdminNotice && <AdminOffNotice adminHref="/admin/art-rental-leasing" />}

      <main>
        <Hero images={studio} />
        <Intro rooms={rooms} />
        <OriginalsOrPrints artworks={artworks} onPrice={priceThis} />
        <Pricing />
        <section id="rental-estimator" aria-labelledby="estimator-title" className="scroll-mt-20 bg-ink text-ink-foreground">
          <RentalEstimator artworks={artworks} picked={picked} onRequestQuote={sendToInquiry} />
        </section>
        <HowItWorks artworks={artworks} />
        <Terms />
        <Questions />
        <section id="rental-inquiry" aria-labelledby="inquiry-title" className="scroll-mt-20 py-20 md:py-32">
          <Frame>
            <RentalInquiryForm handoff={handoff} />
          </Frame>
        </section>
        <ConsiderPurchase feature={studio[1] ?? studio[0]} />
      </main>
      <Footer />
    </div>
  );
}

/* ---------- Hero ---------- */

function Hero({ images }: { images: string[] }) {
  return (
    <SpecimenWall images={images} label="Art Rental & Leasing">
      <div className="w-full max-w-[66rem] bg-ink p-6 text-ink-foreground sm:p-8 md:p-10">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-muted">
          <ol className="flex flex-wrap gap-2">
            <li><Link href="/" className="underline-offset-4 hover:underline">Home</Link></li>
            <li aria-hidden>→</li>
            <li aria-current="page">Art Rental &amp; Leasing</li>
          </ol>
        </nav>
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="font-display text-[2.75rem] leading-[0.98] tracking-[-0.03em] md:text-[4.5rem] xl:text-[5.5rem]">Art Rental &amp; Leasing</h1>
            <p className="mt-4 text-xl font-semibold leading-snug md:text-2xl">Bring Otto Art into your space for a defined term.</p>
            <p className="mt-3 max-w-[46ch] text-base leading-relaxed text-ink-foreground/85">
              Rent original artwork or prints for 3, 6, or 12 months. Compare monthly rates, explore a collection for your space,
              and request a quote based on the artworks you choose.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <ActionLink href="#rental-inquiry" variant="paper" data-testid="hero-request-quote">Request a rental quote</ActionLink>
            <ActionLink href="#rental-pricing" variant="quietInk">Explore rental pricing</ActionLink>
          </div>
        </div>
        <p className="mt-8 text-sm text-ink-muted">Originals and prints · Fixed rental terms · Collection discounts from 11 artworks</p>
      </div>
    </SpecimenWall>
  );
}

/* ---------- Art for the space ---------- */

function Thumb({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={artSrc(src, 160)}
      alt={alt}
      width={64}
      height={44}
      loading="lazy"
      className="mx-[0.12em] inline-block h-[0.85em] w-[1.25em] rounded-[0.12em] object-cover align-[-0.08em]"
    />
  );
}

function Intro({ rooms }: { rooms: string[] }) {
  const [a, b] = rooms;
  return (
    <section aria-labelledby="space-title" className="py-24 md:py-40">
      <Frame className="grid gap-10 lg:grid-cols-12">
        <SectionTitle id="space-title" className="lg:col-span-4">Art for the space you’re creating</SectionTitle>
        <div className="lg:col-span-8 lg:col-start-5">
          <p data-reveal style={{ ["--reveal-i" as string]: 1 }} className="text-[1.5rem] font-medium leading-[1.3] tracking-[-0.01em] lg:text-[2rem]">
            Whether you’re planning an office <Thumb src={officeWallImage} alt="Otto Art work in an office, digital visualisation" />,
            refreshing a reception area{a && <Thumb src={a} alt="Otto Art work in a room, digital visualisation" />}, or sourcing art for an
            interior project{b && <Thumb src={b} alt="Otto Art work in an interior, digital visualisation" />}, renting gives you a defined
            period to live with the work.
          </p>
          <div data-reveal style={{ ["--reveal-i" as string]: 2 }} className="mt-10 grid gap-6 text-lg leading-relaxed md:grid-cols-2">
            <p>Choose an original for its individual presence, or explore prints of Otto Art works for your space.</p>
            <p>
              Share the setting, the number of artworks you have in mind, and your preferred term. The quote will identify the selected
              works, their pricing basis, and the proposed rental costs.
            </p>
          </div>
        </div>
      </Frame>
    </section>
  );
}

/* ---------- Originals or prints: the run of real works ---------- */

function OriginalsOrPrints({ artworks, onPrice }: { artworks: RentalArtwork[]; onPrice: (a: RentalArtwork) => void }) {
  const run = artworks.slice(0, 7);
  const [lifted, ...rest] = run;
  return (
    <section aria-labelledby="options-title" className="bg-muted/50 py-24 md:py-36">
      <Frame className="grid gap-12 lg:grid-cols-12">
        <div className="flex flex-col gap-10 lg:col-span-4">
          <SectionTitle id="options-title">Choose originals or prints</SectionTitle>
          <div data-reveal style={{ ["--reveal-i" as string]: 1 }}>
            <h3 className="text-xl font-semibold">Original artwork</h3>
            <p className="mt-3 text-base leading-relaxed">
              Rent an original Otto Art work for 3, 6, or 12 months. Monthly rent is calculated from that artwork’s retail value and the
              selected rental term. Available works are confirmed during the inquiry process.
            </p>
          </div>
          <div data-reveal style={{ ["--reveal-i" as string]: 2 }}>
            <h3 className="text-xl font-semibold">Art prints</h3>
            <p className="mt-3 text-base leading-relaxed">
              Rent prints of Otto Art works for the same fixed terms, at lower monthly percentage rates than originals. Print rent is
              calculated from the corresponding original artwork’s retail value—not the print’s purchase price. The quote identifies the
              original and the value used.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Print formats, sizes, framing, and availability are confirmed in your quote.
            </p>
          </div>
        </div>

        {lifted && (
          <div className="min-w-0 lg:col-span-8" data-reveal style={{ ["--reveal-i" as string]: 1 }}>
            <p className="mb-8 text-base text-muted-foreground">
              Some of Otto’s works with their original retail value. Choose one to see what renting it costs.
            </p>
            <div className="grid items-end gap-x-3 gap-y-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <WorkFrame art={lifted} tall onPrice={onPrice} />
              <div className="grid grid-cols-2 items-end gap-x-3 gap-y-8">
                {rest.slice(0, 4).map((art) => <WorkFrame key={art.id} art={art} onPrice={onPrice} />)}
              </div>
            </div>
          </div>
        )}
      </Frame>
    </section>
  );
}

function WorkFrame({ art, tall, onPrice }: { art: RentalArtwork; tall?: boolean; onPrice: (a: RentalArtwork) => void }) {
  // One row height, natural widths; the lifted work stands at about twice the row.
  const h = tall ? "h-[min(52vh,480px)]" : "h-[min(19vh,180px)]";
  return (
    <figure className="min-w-0">
      <button
        type="button"
        onClick={() => onPrice(art)}
        className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        aria-label={`See rental prices for ${art.name}`}
        data-testid={`price-work-${art.slug}`}
      >
        <img
          src={artSrc(art.studio, tall ? 960 : 480)}
          srcSet={artSrcSet(art.studio, tall ? [480, 960, 1280] : [320, 480, 640])}
          sizes={tall ? "520px" : "240px"}
          alt={`${art.name}, an original Otto Art work`}
          loading="lazy"
          className={`${h} w-full object-contain object-left-bottom transition-transform duration-300 [transition-timing-function:var(--ease-out)] group-hover:-translate-y-1`}
        />
      </button>
      <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
        <span className="font-medium">{art.name}</span>
        <span className="tabular whitespace-nowrap text-muted-foreground">{formatCentsShort(art.originalValueCents)}</span>
      </figcaption>
    </figure>
  );
}

/* ---------- Pricing ---------- */

function Pricing() {
  const examples = useMemo(() => (["original", "print"] as const).flatMap((type) =>
    RENTAL_TERMS.map((term) => ({ type, term, q: quoteUniform(type, term, 1, EXAMPLE_VALUE) as RentalQuote }))), []);
  const tone = ["bg-secondary", "bg-[hsl(38_18%_84%)]", "bg-[hsl(30_6%_30%)] text-ink-foreground", "bg-ink text-ink-foreground"];

  return (
    <section id="rental-pricing" aria-labelledby="pricing-title" className="scroll-mt-20 py-24 md:py-36">
      <Frame className="grid gap-14 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-4">
          <SectionTitle id="pricing-title">Rental pricing, clearly explained</SectionTitle>
          <p data-reveal style={{ ["--reveal-i" as string]: 1 }} className="mt-6 text-lg leading-relaxed">
            Rates below are monthly percentages of the original artwork’s retail value. For prints, the same original-value basis applies.
            The selected rate applies each month throughout the agreed term.
          </p>
          <div data-reveal style={{ ["--reveal-i" as string]: 2 }} className="mt-10 bg-brand-soft p-6">
            <h3 className="text-lg font-semibold">Compare the full commitment.</h3>
            <p className="mt-2 leading-relaxed">
              A 12-month original rental totals 108% of the original’s retail value before collection discounts and other charges. Renting
              does not transfer ownership, and rental payments do not automatically count toward a purchase.
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-14 lg:col-span-8">
          <div data-reveal style={{ ["--reveal-i" as string]: 1 }} className="overflow-x-auto" role="region" aria-label="Monthly rental rates" tabIndex={0}>
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <caption className="pb-4 text-left text-base text-muted-foreground">
                Monthly rental rates, as a percentage of the original artwork’s retail value (1–10 artworks)
              </caption>
              <thead>
                <tr className="border-b-2 border-foreground text-sm">
                  <th scope="col" className="py-3 pr-4 font-semibold">Fixed term</th>
                  <th scope="col" className="py-3 pr-4 text-right font-semibold">Original, per month</th>
                  <th scope="col" className="py-3 pr-4 text-right font-semibold">Original, whole term</th>
                  <th scope="col" className="py-3 pr-4 text-right font-semibold">Print, per month</th>
                  <th scope="col" className="py-3 text-right font-semibold">Print, whole term</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {RENTAL_TERMS.map((term) => (
                  <tr key={term} /* taste-skill-ignore: real table rows */ className="border-b border-border">
                    <th scope="row" className="py-4 pr-4 font-medium">{term} months</th>
                    <td className="py-4 pr-4 text-right text-2xl font-semibold">{MONTHLY_RATE_BPS.original[term] / 100}%</td>
                    <td className="py-4 pr-4 text-right text-muted-foreground">{(MONTHLY_RATE_BPS.original[term] * term) / 100}%</td>
                    <td className="py-4 pr-4 text-right text-2xl font-semibold">{MONTHLY_RATE_BPS.print[term] / 100}%</td>
                    <td className="py-4 text-right text-muted-foreground">{(MONTHLY_RATE_BPS.print[term] * term) / 100}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div data-reveal style={{ ["--reveal-i" as string]: 2 }} className="overflow-x-auto" role="region" aria-label="Worked examples" tabIndex={0}>
            <table className="w-full min-w-[30rem] border-collapse text-left">
              <caption className="pb-4 text-left">
                <span className="block text-lg font-semibold">For an artwork with an original retail value of $2,000:</span>
                <span className="block text-base text-muted-foreground">Illustrations only, not available inventory. Rental fees before discounts and other charges.</span>
              </caption>
              <thead>
                <tr className="border-b-2 border-foreground text-sm">
                  <th scope="col" className="py-3 pr-4 font-semibold">Type</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Term</th>
                  <th scope="col" className="py-3 pr-4 text-right font-semibold">Monthly rental</th>
                  <th scope="col" className="py-3 text-right font-semibold">Total rental for term</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {examples.map(({ type, term, q }) => (
                  <tr key={`${type}-${term}`} /* taste-skill-ignore: real table rows */ className="border-b border-border">
                    <th scope="row" className="py-3 pr-4 font-medium">{type === "original" ? "Original" : "Print"}</th>
                    <td className="py-3 pr-4">{term} months</td>
                    <td className="py-3 pr-4 text-right">{formatCents(q.monthlySubtotalCents)}</td>
                    <td className="py-3 text-right font-semibold">{formatCents(q.termSubtotalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div data-reveal style={{ ["--reveal-i" as string]: 1 }}>
            <h3 className="text-2xl font-semibold">Collection discounts</h3>
            <ul className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="Collection discounts by number of artworks">
              {[...COLLECTION_TIERS.map((t) => ({
                range: `${t.min}–${t.max} artworks`,
                deal: t.discountBps ? `${t.discountBps / 100}% off rental fees` : "Standard rates",
              })), { range: `${CUSTOM_QUOTE_FROM} or more`, deal: "Custom quote" }].map((tier, i) => (
                <li key={tier.range} className={`flex min-h-[9rem] flex-col justify-end p-5 ${tone[i]}`} style={{ minHeight: `${8 + i * 1.5}rem` }}>
                  <span className="text-sm">{tier.range}</span>
                  <span className="mt-1 text-xl font-semibold leading-tight">{tier.deal}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-[62ch] leading-relaxed">
              The applicable collection discount is applied to the rental fees for the whole collection. Other charges are listed separately in your quote.
            </p>
          </div>

          <div data-reveal className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h3 className="text-2xl font-semibold">What your estimate covers</h3>
              <p className="mt-3 max-w-[62ch] leading-relaxed">
                Displayed estimates cover rental fees only. Taxes and any applicable delivery, installation, framing, collection, deposit, or
                insurance requirements are confirmed separately in your quote and agreement. These services and charges are not assumed to be
                included or available in every location.
              </p>
            </div>
            <ActionLink href="#rental-estimator">Estimate rental fees</ActionLink>
          </div>
        </div>
      </Frame>
    </section>
  );
}

/* ---------- How renting works: tiles that grow ---------- */

function HowItWorks({ artworks }: { artworks: RentalArtwork[] }) {
  const rooms = artworks.map((a) => a.room).filter((r): r is string => !!r);
  const steps = [
    { title: "Tell us about your space.", text: "Share your location, project, approximate artwork count, and preferred rental term.",
      img: officeWallImage, cover: true, alt: "An Otto Art work in an office reception, digital visualisation", span: "md:col-span-2", h: "md:h-[30vh]", fill: "bg-secondary" },
    { title: "Review the artwork and quote.", text: "Discuss suitable available works and review the pricing basis, rental fees, and any additional requirements.",
      img: artworks[2]?.studio, cover: false, alt: artworks[2] ? `${artworks[2].name}, an original Otto Art work` : "", span: "md:col-span-3", h: "md:h-[38vh]", fill: "bg-[hsl(336_60%_93%)]" },
    { title: "Confirm the agreement.", text: "Review the selected artworks, dates, payment schedule, responsibilities, and any delivery or installation arrangements before committing.",
      img: rooms[2] ?? rooms[0], cover: true, alt: "An Otto Art work in a room, digital visualisation", span: "md:col-span-3", h: "md:h-[46vh]", fill: "bg-[hsl(188_28%_88%)]" },
    { title: "Plan the end of your term.", text: "Return arrangements and any proposed extension or purchase are handled under your written agreement. Extensions and purchases require a separate agreement.",
      img: rooms[3] ?? rooms[1], cover: true, alt: "An Otto Art work in a room, digital visualisation", span: "md:col-span-4", h: "md:h-[56vh]", fill: "bg-secondary" },
  ];
  return (
    <section aria-labelledby="how-title" className="py-24 md:py-36">
      <Frame>
        <ol className="grid grid-cols-1 gap-x-2 gap-y-12 md:grid-cols-12 md:items-end">
          <li className="md:col-span-12 md:mb-4 list-none">
            <SectionTitle id="how-title">How renting works</SectionTitle>
          </li>
          {steps.map((s, i) => (
            <li key={s.title} className={`${s.span} flex flex-col`}>
              <div className={`grid place-items-center overflow-hidden ${s.fill} ${["h-[48vw]", "h-[58vw]", "h-[68vw]", "h-[78vw]"][i]} ${s.h}`}>
                {s.img && (
                  <img
                    src={artSrc(s.img, 960)}
                    alt={s.alt}
                    loading="lazy"
                    width={800}
                    height={600}
                    className={s.cover ? "h-full w-full object-cover" : "h-[78%] w-[78%] object-contain mix-blend-multiply"}
                  />
                )}
              </div>
              <h3 data-reveal style={{ ["--reveal-i" as string]: i }} className="mt-5 text-xl font-medium">{s.title}</h3>
              <p data-reveal style={{ ["--reveal-i" as string]: i + 1 }} className="mt-2 max-w-[42ch] leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-sm text-muted-foreground">Room images are digital visualisations; artwork scale and placement may vary.</p>
      </Frame>
    </section>
  );
}

/* ---------- Terms ---------- */

function Terms() {
  const items = [
    "The artworks, formats, reference retail values, and rental period.",
    "Monthly rental fees, the collection discount, payment timing, and any other charges.",
    "Delivery, installation, collection, and return arrangements, where applicable.",
    "Any deposit, insurance, care, loss, or damage responsibilities.",
    "Cancellation, early return, and end-of-term requirements.",
  ];
  return (
    <section aria-labelledby="terms-title" className="bg-secondary py-24 md:py-32">
      <Frame className="grid gap-10 lg:grid-cols-12">
        <SectionTitle id="terms-title" className="lg:col-span-4">Know the terms before you commit</SectionTitle>
        <div className="lg:col-span-7 lg:col-start-6">
          <p data-reveal className="text-xl font-medium">Your written quote and rental agreement will set out:</p>
          <ul className="mt-6 flex flex-col gap-4">
            {items.map((t, i) => (
              <li key={t} data-reveal style={{ ["--reveal-i" as string]: i + 1 }} className="flex gap-4 text-lg leading-relaxed">
                <span aria-hidden className="mt-[0.6em] h-2 w-2 shrink-0 bg-brand" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p data-reveal className="mt-10 bg-background p-6 leading-relaxed">
            Submitting an inquiry does not reserve artwork or create a rental agreement. Availability and arrangements are confirmed
            individually. Rental does not include ownership, automatic purchase credits, or permission to reproduce the artwork.
          </p>
        </div>
      </Frame>
    </section>
  );
}

/* ---------- Questions ---------- */

function Questions() {
  return (
    <section aria-labelledby="faq-title" className="py-24 md:py-36">
      <Frame className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionTitle id="faq-title" className="lg:sticky lg:top-28">Art rental questions</SectionTitle>
        </div>
        <div className="lg:col-span-8">
          <FaqTiles
            name="rental-faq"
            items={[
              { q: "How much does it cost to rent original artwork?", a: <p>For 1–10 artworks, original rentals cost 15% of each original’s retail value per month for a 3-month term, 12% per month for 6 months, or 9% per month for 12 months. Collection discounts begin at 11 artworks. Other charges are quoted separately.</p> },
              { q: "How are print rentals priced?", a: <p>For 1–10 artworks, print rentals cost 5% of the corresponding original’s retail value per month for 3 months, 4% per month for 6 months, or 3% per month for 12 months. The basis is the original’s retail value, not the print’s purchase price. Collection discounts begin at 11 artworks.</p> },
              { q: "Are there discounts for larger collections?", a: <p>Yes. Collections of 11–20 artworks receive 10% off rental fees, and collections of 21–30 receive 15% off. Collections of 1–10 use standard rates. For 31 or more artworks, request a custom quote.</p> },
              { q: "Does a longer term mean a lower total cost?", a: <p>No. A longer term lowers the monthly percentage rate but increases the number of payments. At standard rates, a 12-month original rental totals 108% of the original’s retail value before other charges. Compare the full-term cost as well as the monthly fee.</p> },
              { q: "Are delivery, installation, and insurance included?", a: <p>The displayed rates cover rental fees only. Any applicable delivery, installation, collection, insurance, and other requirements are addressed separately in your quote and agreement. Share your location so the available arrangements can be discussed.</p> },
              { q: "Can I buy the artwork or apply rent toward a purchase?", a: <p>Ask about purchasing if ownership is your goal. Rental payments do not automatically count toward a purchase, and buying requires a separate agreement. <Link href="/corporate-buyers">Explore art for corporate buyers</Link>.</p> },
              { q: "Can I change the artwork or end the rental early?", a: <p>Artwork changes, early returns, and cancellations depend on the written agreement. Do not assume that changes, refunds, or early termination are included.</p> },
              { q: "What happens at the end of the rental?", a: <p>Return and collection arrangements are defined in your agreement. Any extension or purchase requires a separate agreement; neither is automatic.</p> },
            ]}
          />
        </div>
      </Frame>
    </section>
  );
}

/* ---------- Considering a purchase? (the action tile row) ---------- */

function ConsiderPurchase({ feature }: { feature?: string }) {
  return (
    <section aria-labelledby="purchase-title" className="overflow-hidden pb-24 md:pb-36">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-12 md:gap-3">
        <div className="order-2 h-32 overflow-hidden md:order-none md:col-span-2 md:h-[22rem]">
          <img src={officeWallImage} alt="" loading="lazy" width={896} height={812} className="h-full w-full object-cover" />
        </div>
        <div className="col-span-2 grid bg-brand text-brand-foreground md:col-span-8 md:h-[22rem] md:grid-cols-[1.4fr_1fr]">
          <div data-reveal className="flex flex-col justify-center p-8 md:p-12">
          <h2 id="purchase-title" className="font-display text-[2rem] leading-[1.05] tracking-[-0.02em] md:text-[2.75rem]">Considering a purchase?</h2>
          <p className="mt-4 max-w-[52ch] text-base leading-relaxed">
            Explore Otto Art for corporate buyers if you’re looking to own the work. Compare your options and choose the arrangement that fits your project.
          </p>
          <div className="mt-8">
            <ActionLink href="/corporate-buyers" variant="paper" data-testid="link-corporate-buyers">Explore corporate art purchasing</ActionLink>
          </div>
          </div>
          {feature && (
            <div className="hidden place-items-center p-8 md:grid">
              <img src={artSrc(feature, 640)} alt="" loading="lazy" className="max-h-full w-full object-contain" />
            </div>
          )}
        </div>
        <div className="order-3 h-32 bg-ink md:order-none md:col-span-2 md:h-[22rem]" aria-hidden />
      </div>
    </section>
  );
}
