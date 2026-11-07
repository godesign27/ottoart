import { useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { artSrc } from "./art";

// The first screen: a wall of Otto's real works, each a specimen on its own flat tile, brick-offset and
// cropped by the screen edges, with one docked panel carrying the words. Rows drift slowly (off under reduced motion).

const FIELDS = ["bg-[hsl(38_22%_90%)]", "bg-[hsl(336_60%_93%)]", "bg-white", "bg-[hsl(188_28%_88%)]"];

export function SpecimenWall({ images, children, label }: { images: string[]; children: ReactNode; label: string }) {
  const rows = useMemo(() => {
    const pool = images.length ? images : [];
    return Array.from({ length: 7 }, (_, r) =>
      Array.from({ length: 16 }, (_, c) => (pool.length ? pool[(r * 5 + c * 3) % pool.length] : null)),
    );
  }, [images]);

  return (
    <section aria-label={label} className="relative overflow-hidden bg-ink" data-testid="specimen-wall">
      <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col gap-2 py-2">
        {rows.map((row, r) => (
          <div
            key={r}
            className={cn("specimen-row flex shrink-0 gap-2", r % 2 ? "-ml-[calc(var(--tile)/2)]" : "")}
            style={{ animationDelay: `${-r * 7}s`, animationDirection: r % 2 ? "reverse" : "normal" }}
          >
            {row.map((src, c) => (
              <div key={c} className={cn("specimen-tile grid shrink-0 place-items-center", FIELDS[(r + c) % FIELDS.length])}>
                {src && (
                  <img
                    src={artSrc(src, 320)}
                    alt=""
                    width={160}
                    height={160}
                    loading={r < 4 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-[72%] w-[72%] object-contain mix-blend-multiply"
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="relative flex min-h-[min(92vh,880px)] items-end justify-center px-3 pb-3 pt-[22vh] sm:px-6 sm:pb-6 md:pt-[34vh]">
        {children}
      </div>
    </section>
  );
}
