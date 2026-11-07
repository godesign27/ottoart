import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Questions as filled tiles; one open at a time (shared `name`). Native details/summary: the answers are in
// the HTML, readable without JavaScript, and work with the keyboard and screen readers out of the box.
export function FaqTiles({ name, items }: { name: string; items: Array<{ q: string; a: ReactNode }> }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <details
          key={item.q}
          name={name}
          data-reveal
          style={{ ["--reveal-i" as string]: Math.min(i, 5) }}
          className={cn(
            "faq-tile group bg-secondary text-foreground transition-colors duration-200",
            "open:bg-brand open:text-brand-foreground",
          )}
        >
          <summary className="flex min-h-[4.5rem] cursor-pointer list-none items-center justify-between gap-6 px-6 py-4 text-lg font-medium md:text-xl [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <span aria-hidden className="relative h-4 w-4 shrink-0">
              <span className="absolute left-0 top-1/2 h-[3px] w-4 -translate-y-1/2 bg-current" />
              <span className="absolute left-1/2 top-0 h-4 w-[3px] -translate-x-1/2 bg-current transition-transform duration-200 group-open:rotate-90 group-open:scale-y-0" />
            </span>
          </summary>
          <div className="max-w-[56ch] px-6 pb-6 text-base leading-relaxed [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-4">
            {item.a}
          </div>
        </details>
      ))}
    </div>
  );
}
