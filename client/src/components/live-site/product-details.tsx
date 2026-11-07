import type { Product } from "@shared/schema";

// The facts about a work, as a plain list. Only what's filled in is shown.
export function ProductDetails({ product }: { product: Product }) {
  const items = [
    { label: "Year created", value: product.year ? String(product.year) : null },
    { label: "Medium", value: product.medium },
    { label: "Rarity", value: product.rarity },
    { label: "Size", value: product.dimensions },
    { label: "Frame", value: product.frame },
    { label: "Packaging", value: product.packaging },
    { label: "Authenticity", value: product.authenticity },
  ].filter((i): i is { label: string; value: string } => !!i.value);

  if (!items.length) return null;

  return (
    <section aria-labelledby="details-title" className="bg-secondary">
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:px-10 lg:py-24">
        <h2 id="details-title" className="font-display text-[2.25rem] leading-[1.05] tracking-[-0.02em] md:text-[3rem] lg:col-span-4">
          Details
        </h2>
        <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-8">
          {items.map((item) => (
            <div key={item.label} data-testid={`detail-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <dt className="text-sm text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 text-lg">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
