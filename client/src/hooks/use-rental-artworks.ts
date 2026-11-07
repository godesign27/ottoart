import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { artSrc } from "@/components/marketing/art";

export interface RentalArtwork {
  id: string;
  name: string;
  slug: string;
  dimensions: string | null;
  medium: string | null;
  year: number | null;
  /** Retail value of the original, in cents: the basis for both original and print rent. */
  originalValueCents: number;
  /** All images; `studio` is the work on a plain background, `room` a room visualisation, when we can tell. */
  images: string[];
  studio: string;
  room: string | null;
  /** True once `studio` is known to be the plain-background shot (false while still checking, or if none). */
  studioKnown: boolean;
}

// The listed price of the original is the first "Original" pricing tier, or the product price for an original-only work.
function originalValueCents(p: Product): number | null {
  const tier = (p.pricingTiers ?? []).find((t) => t.type?.toLowerCase() === "original" && Number(t.price) > 0);
  if (tier) return Math.round(Number(tier.price) * 100);
  return null;
}

/**
 * Otto's works that can be priced for rental: published, not sold, with a listed original value.
 * Sorted by value, highest first. Availability is still confirmed in the quote.
 */
export function useRentalArtworks() {
  const { data: products = [], isLoading } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const base = useMemo(() => {
    return products
      .filter((p) => p.status === "active" && !p.isSold && (p.images?.length ?? 0) > 0)
      .map((p) => {
        const value = originalValueCents(p);
        return value ? { p, value } : null;
      })
      .filter((x): x is { p: Product; value: number } => !!x)
      .sort((a, b) => b.value - a.value || a.p.name.localeCompare(b.p.name))
      .map(({ p, value }) => ({
        id: p.id, name: p.name, slug: p.slug, dimensions: p.dimensions, medium: p.medium, year: p.year,
        originalValueCents: value, images: p.images ?? [],
      }));
  }, [products]);

  const kinds = useStudioShots(base.flatMap((a) => a.images.slice(0, 2)));

  const artworks: RentalArtwork[] = useMemo(() => base.map((a) => {
    const studio = a.images.find((src) => kinds[src] === "studio");
    const room = a.images.find((src) => kinds[src] === "room") ?? null;
    return { ...a, studio: studio ?? a.images[0], room, studioKnown: !!studio };
  }), [base, kinds]);

  return { artworks, isLoading };
}

type ShotKind = "studio" | "room";
const kindCache = new Map<string, ShotKind>();

/**
 * Each product has the work photographed on white and the work shown in a room, in no fixed order.
 * Tell them apart from a tiny thumbnail: a studio shot has transparent (cut-out) or near-white corners.
 */
function useStudioShots(srcs: string[]): Record<string, ShotKind> {
  const [kinds, setKinds] = useState<Record<string, ShotKind>>(() => Object.fromEntries(
    srcs.filter((s) => kindCache.has(s)).map((s) => [s, kindCache.get(s)!]),
  ));
  const key = srcs.join("|");
  useEffect(() => {
    let cancelled = false;
    srcs.forEach((src) => {
      if (kindCache.has(src)) {
        setKinds((k) => (k[src] ? k : { ...k, [src]: kindCache.get(src)! }));
        return;
      }
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        const kind = classify(img);
        kindCache.set(src, kind);
        if (!cancelled) setKinds((k) => ({ ...k, [src]: kind }));
      };
      img.src = artSrc(src, 160);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return kinds;
}

function classify(img: HTMLImageElement): ShotKind {
  try {
    const w = 32, h = Math.max(1, Math.round((32 * img.naturalHeight) / img.naturalWidth));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "studio";
    ctx.drawImage(img, 0, 0, w, h);
    const corners = [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]];
    const white = corners.filter(([x, y]) => {
      const d = ctx.getImageData(x, y, 1, 1).data;
      return d[3] < 32 || (d[0] > 230 && d[1] > 230 && d[2] > 230); // transparent cut-out or white studio ground
    }).length;
    return white >= 3 ? "studio" : "room";
  } catch {
    return "studio";
  }
}
