import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { DraftBadge } from "@/components/live-site/draft-badge";
import { FavoriteButton } from "@/components/live-site/favorite-button";
import { artSrc, artSrcSet } from "@/components/marketing/art";
import { ArtTypeFilter, isArtType, useArtType, useArtTypeTagIds } from "@/components/live-site/art-type-filter";
import type { Product } from "@shared/schema";

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);

/** "Original $3,227 · Prints from $185": the original's price and the lowest print price, when there are tiers. */
export function formatProductPricing(product: Product): string {
  const tiers = product.pricingTiers ?? [];
  if (!tiers.length) return usd(parseFloat(product.price));
  const original = tiers.find((t) => t.type?.toLowerCase() === "original");
  const prints = tiers.filter((t) => t.type?.toLowerCase().includes("print")).map((t) => Number(t.price)).filter((n) => n > 0);
  const parts: string[] = [];
  if (original && !product.isSold) parts.push(`Original ${usd(Number(original.price))}`);
  if (prints.length) parts.push(`${prints.length > 1 ? "Prints from" : "Print"} ${usd(Math.min(...prints))}`);
  return parts.length ? parts.join(" · ") : usd(parseFloat(product.price));
}

function soldState(product: Product) {
  const originalTier = product.pricingTiers?.find((tier) => tier.type?.toLowerCase() === "original");
  const originalSoldOut = (product as any).isSold || (originalTier ? originalTier.stock === 0 : (product.isOriginal ? (product.stock ?? 0) === 0 : false));
  const hasPrintTiers = product.pricingTiers?.some((tier) => tier.type?.toLowerCase().includes("print")) === true;
  return { originalSoldOut, hasPrintTiers };
}

function StatusBadges({ product }: { product: Product }) {
  const { originalSoldOut, hasPrintTiers } = soldState(product);
  return (
    <>
      <DraftBadge product={product} />
      {originalSoldOut && <Badge variant="destructive" data-testid={`badge-sold-${product.id}`}>Sold</Badge>}
      {originalSoldOut && hasPrintTiers && <Badge variant="secondary" data-testid={`badge-prints-${product.id}`}>Prints available</Badge>}
    </>
  );
}

export type SortOption = "newest" | "oldest" | "price-low" | "price-high" | "name-az" | "name-za";

interface ProductGridProps {
  category?: string;
  searchQuery?: string;
  viewMode?: "grid" | "list";
  filterByPrintTiers?: boolean;
  products?: Product[];
  sortBy?: SortOption;
  /** Show All / Abstract / Animal above the grid, once both kinds have works on this page. */
  showArtTypes?: boolean;
}

function sortProducts(products: Product[], sortBy: SortOption): Product[] {
  return [...products].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case "oldest":
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "name-az":
        return a.name.localeCompare(b.name);
      case "name-za":
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });
}

export function ProductGrid({ showArtTypes = false, ...props }: ProductGridProps) {
  const [artType, setArtType] = useArtType();
  const typeIds = useArtTypeTagIds();
  if (!showArtTypes) return <ProductGridBody {...props} />;
  return (
    <ProductGridBody
      {...props}
      renderFilter={(all) => {
        const counts = {
          all: all.length,
          abstract: all.filter((p) => isArtType(p, typeIds.abstract)).length,
          animal: all.filter((p) => isArtType(p, typeIds.animal)).length,
        };
        // One kind on its own is not a choice, so the control waits until both have works here.
        if (!counts.abstract || !counts.animal) return null;
        return <ArtTypeFilter value={artType} onChange={setArtType} counts={counts} />;
      }}
      typeFilter={artType === "all" || !typeIds.abstract.length || !typeIds.animal.length ? undefined : typeIds[artType]}
    />
  );
}

interface ProductGridBodyProps extends Omit<ProductGridProps, "showArtTypes"> {
  renderFilter?: (all: Product[]) => React.ReactNode;
  typeFilter?: string[];
}

function ProductGridBody({ category, searchQuery = "", viewMode = "grid", filterByPrintTiers = false, products: customProducts, sortBy = "newest", renderFilter, typeFilter }: ProductGridBodyProps) {
  const categorySlug = category ? category.toLowerCase().replace(/\s+/g, '-') : undefined;
  
  const { data: fetchedProducts, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products', { category: categorySlug, printOnly: filterByPrintTiers }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categorySlug) {
        params.append('category', categorySlug);
      }
      const url = `/api/products${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
    select: (data) => {
      let filtered = data || [];
      
      if (searchQuery) {
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (filterByPrintTiers) {
        filtered = filtered.filter(product => 
          product.pricingTiers?.some(tier => tier.type?.toLowerCase() === 'print')
        );
      }
      
      return filtered.filter(product => product.status === 'active');
    },
    enabled: !customProducts
  });

  const rawProducts = customProducts || fetchedProducts || [];
  const filter = renderFilter?.(rawProducts);
  const typed = filter && typeFilter ? rawProducts.filter((p) => isArtType(p, typeFilter)) : rawProducts;
  const products = sortProducts(typed, sortBy);
  return (
    <div className="space-y-8">
      {filter}
      <GridItems products={products} isLoading={isLoading && !customProducts} viewMode={viewMode} />
    </div>
  );
}

function GridItems({ products, isLoading, viewMode }: { products: Product[]; isLoading: boolean; viewMode: "grid" | "list" }) {

  if (isLoading) {
    return (
      <div className={viewMode === "grid" ? "grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"} aria-busy="true">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/5] animate-pulse bg-muted" />
            <div className="mt-4 h-5 w-2/3 animate-pulse bg-muted" />
            <div className="mt-2 h-4 w-1/2 animate-pulse bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="bg-secondary px-6 py-16 text-center">
        <p className="text-lg">No artworks match.</p>
        <p className="mt-2 text-muted-foreground">Try another search or category.</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <ul className="flex flex-col gap-2">
        {products.map((product) => (
          <li key={product.id}>
            <Link href={`/product/${product.id}`} className="group flex items-center gap-5 bg-card p-3 transition-colors duration-200 hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <div className="h-24 w-20 shrink-0 overflow-hidden bg-secondary">
                <img src={artSrc(product.images?.[0] || "/placeholder.svg", 160)} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-medium">{product.name}</h3>
                {product.dimensions && <p className="text-sm text-muted-foreground">{product.dimensions}</p>}
                <p className="tabular mt-1 text-[0.9375rem]">{formatProductPricing(product)}</p>
              </div>
              <div className="hidden flex-wrap justify-end gap-2 sm:flex"><StatusBadges product={product} /></div>
              <FavoriteButton productId={product.id} size="sm" iconOnly />
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, i) => {
        const src = product.images?.[0] || "/placeholder.svg";
        return (
          <li key={product.id} className="relative">
            <Link href={`/product/${product.id}`} className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" data-testid={`product-card-${product.id}`}>
              <div className="aspect-[4/5] overflow-hidden bg-secondary">
                <img
                  src={artSrc(src, 640)}
                  srcSet={artSrcSet(src, [480, 640, 960])}
                  sizes="(min-width: 1024px) 31vw, (min-width: 640px) 47vw, 92vw"
                  alt={product.name}
                  loading={i < 3 ? "eager" : "lazy"}
                  width={640}
                  height={800}
                  className="h-full w-full object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out)] group-hover:scale-[1.03]"
                />
              </div>
              <h3 className="mt-4 text-lg font-medium leading-snug">{product.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{[product.dimensions, product.medium].filter(Boolean).join(" · ")}</p>
              <p className="tabular mt-2 text-[0.9375rem]">{formatProductPricing(product)}</p>
              <div className="mt-3 flex flex-wrap gap-2 empty:hidden"><StatusBadges product={product} /></div>
            </Link>
            <div className="absolute right-3 top-3">
              <FavoriteButton productId={product.id} size="sm" iconOnly className="bg-background/90 hover:bg-background" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
