import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton } from "@/components/live-site/favorite-button";
import type { Product } from "@shared/schema";

// Helper function to format pricing display
function formatProductPricing(product: Product): string {
  if (!product.pricingTiers || product.pricingTiers.length === 0) {
    return `$${parseFloat(product.price).toFixed(2)}`;
  }

  const originalTier = product.pricingTiers.find(tier => tier.type?.toLowerCase() === 'original');
  const printTier = product.pricingTiers.find(tier => tier.type?.toLowerCase() === 'print');

  let priceParts: string[] = [];

  if (originalTier) {
    priceParts.push(`$${originalTier.price.toFixed(2)} Original`);
  }
  
  if (printTier) {
    priceParts.push(`$${printTier.price} Print`);
  }

  // If we have both original and print tiers
  if (priceParts.length > 1) {
    return priceParts.join(' / ');
  }

  // If we only have one tier or no recognized tiers, fall back to main price
  return priceParts.length > 0 ? priceParts[0] : `$${parseFloat(product.price).toFixed(2)}`;
}

interface ProductGridProps {
  category?: string;
  searchQuery?: string;
  viewMode?: "grid" | "list";
  filterByPrintTiers?: boolean;
}

export function ProductGrid({ category, searchQuery = "", viewMode = "grid", filterByPrintTiers = false }: ProductGridProps) {
  // Convert category name to slug for API call
  const categorySlug = category ? category.toLowerCase().replace(/\s+/g, '-') : undefined;
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products', { category: categorySlug, printOnly: filterByPrintTiers }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categorySlug) {
        params.append('category', categorySlug);
      }
      const url = `/api/products${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      return response.json();
    },
    select: (data) => {
      let filtered = data || [];
      
      // Filter by search query
      if (searchQuery) {
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Filter by print tiers if requested
      if (filterByPrintTiers) {
        filtered = filtered.filter(product => 
          product.pricingTiers?.some(tier => tier.type?.toLowerCase() === 'print')
        );
      }
      
      // Only show active products
      return filtered.filter(product => product.status === 'active');
    }
  });

  if (isLoading) {
    return (
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="w-full h-64 bg-muted animate-pulse"></div>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found.</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {products.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <div className="flex gap-4 p-4">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <img
                      src={product.images?.[0] || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-md"
                    />
                    <div className="absolute top-1 right-1">
                      <FavoriteButton 
                        productId={product.id} 
                        size="sm" 
                        iconOnly
                        className="bg-white/80 backdrop-blur-sm hover:bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        {product.dimensions && (
                          <p className="text-sm text-muted-foreground">{product.dimensions}</p>
                        )}
                        <p className="text-sm font-medium text-foreground mt-1">{formatProductPricing(product)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          // Check if original is sold out (case-insensitive and safer fallback)
                          const originalTier = product.pricingTiers?.find(tier => tier.type?.toLowerCase() === 'original');
                          const originalSoldOut = originalTier ? originalTier.stock === 0 : (product.isOriginal ? (product.stock ?? 0) === 0 : false);
                          
                          // Check if prints are available (case-insensitive)
                          const hasPrintTiers = product.pricingTiers?.some(tier => tier.type?.toLowerCase() === 'print') === true;
                          
                          return (
                            <>
                              {originalSoldOut && (
                                <Badge variant="destructive" data-testid={`badge-sold-${product.id}`}>Sold</Badge>
                              )}
                              {originalSoldOut && hasPrintTiers && (
                                <Badge variant="secondary" data-testid={`badge-prints-${product.id}`}>Prints Available</Badge>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Link key={product.id} href={`/product/${product.id}`}>
          <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="relative aspect-square">
              <img
                src={product.images?.[0] || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3">
                <FavoriteButton 
                  productId={product.id} 
                  size="sm" 
                  iconOnly
                  className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
                />
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                {product.dimensions && (
                  <p className="text-sm text-muted-foreground">{product.dimensions}</p>
                )}
                <p className="text-sm font-medium text-foreground">{formatProductPricing(product)}</p>
                <div className="flex gap-2 justify-start">
                  {(() => {
                    // Check if original is sold out (case-insensitive and safer fallback)
                    const originalTier = product.pricingTiers?.find(tier => tier.type?.toLowerCase() === 'original');
                    const originalSoldOut = originalTier ? originalTier.stock === 0 : (product.isOriginal ? (product.stock ?? 0) === 0 : false);
                    
                    // Check if prints are available (case-insensitive)
                    const hasPrintTiers = product.pricingTiers?.some(tier => tier.type?.toLowerCase() === 'print') === true;
                    
                    return (
                      <>
                        {originalSoldOut && (
                          <Badge variant="destructive" data-testid={`badge-sold-${product.id}`}>Sold</Badge>
                        )}
                        {originalSoldOut && hasPrintTiers && (
                          <Badge variant="secondary" data-testid={`badge-prints-${product.id}`}>Prints Available</Badge>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}