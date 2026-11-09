import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import type { Product, Tag } from "@shared/schema";

// The two kinds of work Otto makes. Each one is a tag in Admin > Tags, set on the artwork in its drawer.
export const ART_TYPES = [
  { value: "abstract", label: "Abstract", tagNames: ["abstract"] },
  { value: "animal", label: "Animal", tagNames: ["animal", "animals"] },
] as const;

export type ArtType = (typeof ART_TYPES)[number]["value"];

/** The chosen type lives in the address (?type=animal), so a filtered page can be shared and survives Back. */
export function useArtType(): [ArtType | "all", (next: ArtType | "all") => void] {
  const search = useSearch();
  const [path, navigate] = useLocation();
  const raw = new URLSearchParams(search).get("type");
  const current = ART_TYPES.some((t) => t.value === raw) ? (raw as ArtType) : "all";
  const set = (next: ArtType | "all") => {
    const params = new URLSearchParams(search);
    if (next === "all") params.delete("type");
    else params.set("type", next);
    const qs = params.toString();
    navigate(qs ? `${path}?${qs}` : path, { replace: true });
  };
  return [current, set];
}

/** Tag ids for each type, from the tags that exist. */
export function useArtTypeTagIds(): Record<ArtType, string[]> {
  const { data: tags = [] } = useQuery<Tag[]>({ queryKey: ["/api/tags"] });
  const byName = (names: readonly string[]) =>
    tags.filter((t) => names.includes(t.name.trim().toLowerCase())).map((t) => t.id);
  return { abstract: byName(ART_TYPES[0].tagNames), animal: byName(ART_TYPES[1].tagNames) };
}

export function isArtType(product: Product, ids: string[]): boolean {
  return (product.tags ?? []).some((id) => ids.includes(id));
}

interface ArtTypeFilterProps {
  value: ArtType | "all";
  onChange: (next: ArtType | "all") => void;
  counts: Record<ArtType | "all", number>;
}

/** All / Abstract / Animal as one row of radio buttons: arrow keys move between them, Tab leaves the group. */
export function ArtTypeFilter({ value, onChange, counts }: ArtTypeFilterProps) {
  const options: Array<{ value: ArtType | "all"; label: string }> = [{ value: "all", label: "All" }, ...ART_TYPES];
  return (
    <fieldset data-testid="art-type-filter">
      <legend className="sr-only">Type of artwork</legend>
      <div className="inline-flex max-w-full bg-secondary p-1">
        {options.map((o) => (
          <label key={o.value} className="relative">
            <input
              type="radio"
              name="art-type"
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
              data-testid={`art-type-${o.value}`}
            />
            <span className="flex min-h-11 cursor-pointer items-center gap-2 px-4 text-[0.9375rem] text-muted-foreground transition-colors duration-150 [transition-timing-function:var(--ease-out)] hover:text-foreground peer-checked:bg-background peer-checked:text-foreground peer-checked:font-medium peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring sm:px-5">
              {o.label}
              <span className="tabular text-sm text-muted-foreground">{counts[o.value]}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
