import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@shared/schema";

export function FeaturedArtworks() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    select: (data) => data?.filter(product => product.isFeatured) || []
  });

  if (isLoading) {
    return (
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Featured Artworks</h2>
            <p className="text-xl text-muted-foreground">Discover the latest additions to the collection</p>
          </div>
          
          <div className="product-grid">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                <div className="w-full h-64 bg-muted animate-pulse"></div>
                <div className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-6" data-testid="featured-artworks">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Featured Artworks</h2>
          <p className="text-xl text-muted-foreground">Discover the latest additions to the collection</p>
        </div>

        <div className="product-grid">
          {products?.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <div 
                className="artwork-card bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                data-testid={`featured-artwork-${product.id}`}
              >
                <img 
                  src={product.images?.[0] || "/placeholder.svg"} 
                  alt={product.name} 
                  className="w-full h-64 object-cover" 
                />
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-1">{product.name}</h3>
                      <p className="text-muted-foreground mb-3">
                        {product.dimensions}
                      </p>
                      
                      {/* Badge Logic */}
                      <div className="flex gap-2 mb-2">
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
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">${product.price}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/shop-all">
            <Button 
              variant="outline" 
              className="px-8 py-3 font-medium"
              data-testid="view-all-artworks"
            >
              View All Artworks
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
