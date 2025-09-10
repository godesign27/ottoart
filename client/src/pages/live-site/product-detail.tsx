import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Star, Package, Shield, RotateCcw, ShoppingBag } from "lucide-react";
import type { Product } from "@shared/schema";

export default function ProductDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('live');

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['/api/products', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${params.id}`);
      if (!response.ok) throw new Error('Product not found');
      return response.json();
    },
    enabled: !!params.id
  });

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'admin') {
      setLocation('/admin');
    }
  };

  const handleBack = () => {
    setLocation('/shop-all');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-10 bg-muted rounded w-full"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Product not found</h1>
            <Button onClick={handleBack} className="mt-4">
              Return to Shop
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Shop
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
              <img 
                src={product.images?.[0] || "/placeholder.svg"} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
              {product.isFeatured && (
                <Badge className="absolute top-4 right-4 bg-yellow-500 text-yellow-900">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
                <p className="text-3xl font-bold text-primary mt-2">${product.price}</p>
                <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
              </div>

              {/* Product Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                  </Badge>
                  {product.isOriginal && (
                    <Badge variant="secondary">Original Artwork</Badge>
                  )}
                </div>

                {product.dimensions && (
                  <div>
                    <span className="font-medium">Dimensions: </span>
                    <span className="text-muted-foreground">{product.dimensions}</span>
                  </div>
                )}

                {product.medium && (
                  <div>
                    <span className="font-medium">Medium: </span>
                    <span className="text-muted-foreground">{product.medium}</span>
                  </div>
                )}

                {product.year && (
                  <div>
                    <span className="font-medium">Year: </span>
                    <span className="text-muted-foreground">{product.year}</span>
                  </div>
                )}
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </div>

              {/* Add to Cart */}
              <Button 
                className="w-full py-3 text-lg font-semibold flex items-center justify-center gap-2"
                disabled={product.stock === 0}
              >
                <ShoppingBag className="h-5 w-5" />
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>

              {/* Features */}
              <div className="space-y-4 pt-6 border-t border-border">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Free Shipping</p>
                    <p className="text-sm text-muted-foreground">On orders over $50</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Secure Payment</p>
                    <p className="text-sm text-muted-foreground">Your payment information is safe</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Easy Returns</p>
                    <p className="text-sm text-muted-foreground">30-day return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}