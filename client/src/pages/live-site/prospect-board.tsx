import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { ActionLink, Frame } from "@/components/marketing/primitives";
import { artSrc, artSrcSet } from "@/components/marketing/art";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { formatCentsShort } from "@shared/rentalPricing";

// /for/:slug — the selection Otto made for one company (Admin › Outreach). A private link: never indexed,
// and it shows only the works and their live prices, nothing about the company or the person it was sent to.

interface ForWork {
  id: string;
  name: string;
  dimensions: string | null;
  medium: string | null;
  year: number | null;
  image: string | null;
  hasOriginal: boolean;
  originalSize: string | null;
  isSold: boolean;
  priceCents: number | null;
  lease: { kind: "original" | "print"; fromCents: number } | null;
  prints: { size: string; type: string; priceCents: number }[];
}
interface ForBoard { name: string; description: string | null; works: ForWork[] }

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}

export default function ProspectBoardPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  useNoIndex();
  const { data, isLoading, error } = useQuery<ForBoard>({
    queryKey: [`/api/for/${slug}`],
    enabled: !!slug,
  });
  useDocumentMeta({ title: data ? `Selected for ${data.name} | Otto Art` : "Otto Art", description: "A selection of original work by Otto, a Boulder artist." });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LiveSiteNavigation />
      <main id="main" className="flex-1">
        <Frame className="py-10 md:py-16">
          {isLoading ? (
            <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Loading the selection</p>
          ) : error || !data ? (
            <div className="max-w-xl bg-muted/50 p-6 md:p-8">
              <h1 className="text-lg font-semibold">This selection isn't available</h1>
              <p className="mt-2 text-muted-foreground">The link may be mistyped, or the selection was taken down. You can still see every work in the shop.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <ActionLink href="/originals">Browse originals</ActionLink>
                <ActionLink href="/contact" variant="quiet">Contact Otto</ActionLink>
              </div>
            </div>
          ) : (
            <Selection board={data} />
          )}
        </Frame>
      </main>
      <Footer />
    </div>
  );
}

function Selection({ board }: { board: ForBoard }) {
  return (
    <>
      <header className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="text-sm font-medium text-muted-foreground">Selected for {board.name}</p>
          <h1 className="mt-3 font-display text-[2.5rem] leading-[1.02] tracking-[-0.02em] text-balance md:text-[4rem]">
            Original work for your space
          </h1>
          <p className="mt-5 max-w-[60ch] text-lg text-muted-foreground">
            {board.works.length} {board.works.length === 1 ? "piece" : "pieces"} by Otto, a Boulder artist, chosen with {board.name} in mind.
            Each can be bought outright, leased by the month, or used as the starting point for a commission sized to your walls.
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:col-span-4 lg:items-end">
          <ActionLink href="/contact" className="w-full lg:w-auto" data-testid="for-contact-top">Arrange a visit</ActionLink>
          <p className="text-sm text-muted-foreground lg:text-right">Or simply reply to Otto's email.</p>
        </div>
      </header>

      {board.works.length === 0 ? (
        <p className="mt-14 text-muted-foreground">Otto is still choosing the works for this selection.</p>
      ) : (
        <ol className="mt-14 grid gap-x-8 gap-y-16 md:grid-cols-2">
          {board.works.map((w) => <WorkCard key={w.id} work={w} />)}
        </ol>
      )}

      <section aria-labelledby="for-next" className="mt-20 grid gap-8 bg-secondary p-6 md:grid-cols-12 md:p-10">
        <div className="md:col-span-7">
          <h2 id="for-next" className="font-display text-[2rem] leading-[1.05] tracking-[-0.02em] md:text-[2.5rem]">See them on your walls</h2>
          <p className="mt-4 max-w-[56ch] text-muted-foreground">
            Otto can bring a few pieces to your office for 15 minutes, propose sizes for a lobby or common area, or set up a lease that rotates work every few months.
          </p>
        </div>
        <div className="flex flex-col gap-3 md:col-span-5 md:justify-center">
          <ActionLink href="/contact" data-testid="for-contact-bottom">Arrange a visit</ActionLink>
          <Link href="/art-rental-leasing" className="text-center font-medium underline underline-offset-4">How leasing works</Link>
        </div>
      </section>
    </>
  );
}

function WorkCard({ work: w }: { work: ForWork }) {
  const facts = [w.originalSize ?? w.dimensions, w.medium, w.year].filter(Boolean).join(" · ");
  return (
    <li className="min-w-0">
      <Link href={`/product/${w.id}`} className="block bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
        {w.image ? (
          <img src={artSrc(w.image, 960)} srcSet={artSrcSet(w.image, [480, 640, 960, 1280])} sizes="(min-width: 768px) 45vw, 100vw"
            alt={w.name} loading="lazy" decoding="async" className="aspect-[4/5] w-full object-contain" />
        ) : <span className="flex aspect-[4/5] items-center justify-center text-sm text-muted-foreground">No image</span>}
      </Link>
      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="text-xl font-semibold">
          <Link href={`/product/${w.id}`} className="underline-offset-4 hover:underline">{w.name}</Link>
        </h2>
        <p className="tabular text-lg">
          {w.hasOriginal ? (w.isSold ? "Original sold" : w.priceCents != null ? `Original ${formatCentsShort(w.priceCents)}` : null)
            : w.priceCents != null ? `Prints from ${formatCentsShort(w.priceCents)}` : null}
        </p>
      </div>
      {facts && <p className="mt-1 text-sm text-muted-foreground">{facts}</p>}
      <dl className="mt-4 space-y-2 text-sm">
        {w.lease && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium">{w.lease.kind === "original" ? "Lease" : "Lease a print"}</dt>
            <dd>from {formatCentsShort(w.lease.fromCents)}/month on a 12-month term</dd>
          </div>
        )}
        {w.prints.length > 0 && (
          <div>
            <dt className="font-medium">Prints</dt>
            <dd>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {w.prints.map((p) => (
                  <li key={`${p.size}-${p.type}`} className="flex justify-between gap-4 sm:max-w-sm">
                    <span>{p.size}{p.type ? ` · ${p.type}` : ""}</span>
                    <span className="tabular">{formatCentsShort(p.priceCents)}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>
    </li>
  );
}
