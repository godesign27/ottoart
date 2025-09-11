import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@shared/schema";

interface ProductGridProps {
  category?: string;
  searchQuery?: string;
  viewMode?: "grid" | "list";
}

export function ProductGrid({ category, searchQuery = "", viewMode = "grid" }: ProductGridProps) {
  // Convert category name to slug for API call
  const categorySlug = category ? category.toLowerCase().replace(/\s+/g, '-') : undefined;
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products', { category: categorySlug }],
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
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                        <p className="text-lg font-bold mt-2">${product.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {product.isFeatured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                        <Badge variant={(product.stock ?? 0) > 0 ? "default" : "destructive"}>
                          {(product.stock ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
                        </Badge>
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
              {product.isFeatured && (
                <Badge className="absolute top-3 right-3 bg-yellow-500 text-yellow-900">
                  Featured
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold">${product.price}</p>
                  <Badge variant={(product.stock ?? 0) > 0 ? "default" : "destructive"}>
                    {(product.stock ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}