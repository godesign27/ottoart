import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
            <div 
              key={product.id} 
              className="artwork-card bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              data-testid={`featured-artwork-${product.id}`}
            >
              <img 
                src={product.images?.[0] || "/placeholder.svg"} 
                alt={product.name} 
                className="w-full h-64 object-cover" 
              />
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">{product.name}</h3>
                    <p className="text-muted-foreground">
                      {product.isOriginal ? 'Original Painting' : 'Art Print'} • {product.dimensions}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">${product.price}</p>
                    <p className="text-sm text-green-600">
                      {product.stock > 0 ? (product.stock === 1 ? 'In Stock' : `${product.stock} Available`) : 'Out of Stock'}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  {product.description}
                </p>
                <Button 
                  className="w-full"
                  data-testid={`view-details-${product.id}`}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            className="px-8 py-3 font-medium"
            data-testid="view-all-artworks"
          >
            View All Artworks
          </Button>
        </div>
      </div>
    </section>
  );
}
