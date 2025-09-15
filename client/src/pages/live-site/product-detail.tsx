import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Star, Package, Shield, RotateCcw, ShoppingBag } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

export default function ProductDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('live');
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['/api/products', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${params.id}`);
      if (!response.ok) throw new Error('Product not found');
      return response.json();
    },
    enabled: !!params.id
  });

  // Auto-select the first pricing tier when product loads
  useEffect(() => {
    if (product?.pricingTiers && product.pricingTiers.length > 0 && !selectedTierId) {
      setSelectedTierId(product.pricingTiers[0].id);
    }
  }, [product, selectedTierId]);

  // Get selected tier details or fallback to base product
  const getSelectedTierOrProduct = () => {
    if (product?.pricingTiers && selectedTierId) {
      const selectedTier = product.pricingTiers.find(tier => tier.id === selectedTierId);
      if (selectedTier) {
        return {
          price: selectedTier.price,
          stock: selectedTier.stock,
          description: selectedTier.description,
          displayName: `${selectedTier.size} ${selectedTier.type.toLowerCase()}`
        };
      }
    }
    return {
      price: product?.price || 0,
      stock: product?.stock || 0,
      description: product?.description || '',
      displayName: product?.name || ''
    };
  };

  const selectedOption = getSelectedTierOrProduct();

  const addToCartMutation = useMutation({
    mutationFn: async (cartItem: any) => {
      const response = await apiRequest('POST', '/api/cart', cartItem);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Added to cart!",
        description: `${product?.name} (${selectedOption.displayName}) - $${selectedOption.price}`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAddToCart = () => {
    if (!product) return;
    
    const cartItem = {
      productId: product.id,
      productName: product.name,
      image: product.images?.[0] || '',
      tierId: selectedTierId,
      price: selectedOption.price.toString(),
      quantity: 1,
      tierDisplayName: selectedOption.displayName
    };

    addToCartMutation.mutate(cartItem);
  };

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
                <p className="text-3xl font-bold text-primary mt-2">${selectedOption.price}</p>
                <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </div>

              {/* Pricing Tiers / Available Options */}
              {product.pricingTiers && product.pricingTiers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Available Options:</h3>
                  <div className="space-y-3">
                    {product.pricingTiers.map((tier) => (
                      <div 
                        key={tier.id} 
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedTierId === tier.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedTierId(tier.id)}
                        data-testid={`tier-option-${tier.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                selectedTierId === tier.id 
                                  ? 'border-primary bg-primary' 
                                  : 'border-muted-foreground'
                              }`}
                            >
                              {selectedTierId === tier.id && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {tier.size} {tier.type.toLowerCase()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Stock: {tier.stock}
                              </p>
                            </div>
                          </div>
                          <p className="text-xl font-bold text-foreground">
                            ${tier.price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant={selectedOption.stock > 0 ? "default" : "destructive"}>
                    {selectedOption.stock > 0 ? `${selectedOption.stock} in stock` : 'Out of Stock'}
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

              {/* Add to Cart */}
              <Button 
                className="w-full py-3 text-lg font-semibold flex items-center justify-center gap-2"
                disabled={selectedOption.stock === 0 || addToCartMutation.isPending}
                onClick={handleAddToCart}
                data-testid="add-to-cart-button"
              >
                <ShoppingBag className="h-5 w-5" />
                {addToCartMutation.isPending 
                  ? 'Adding...' 
                  : selectedOption.stock > 0 
                    ? 'Add to cart' 
                    : 'Out of Stock'
                }
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