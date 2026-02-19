import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { ProductImageModal } from "@/components/live-site/product-image-modal";
import { ProductDetails } from "@/components/live-site/product-details";
import { FavoriteButton } from "@/components/live-site/favorite-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Star, ShoppingBag, ZoomIn } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

export default function ProductDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('live');
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
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

  // Reset and auto-select when product changes
  useEffect(() => {
    if (product?.id) {
      // Reset image index
      setSelectedImageIndex(0);
      
      // Auto-select the first original tier, or fallback to first tier
      if (product.pricingTiers && product.pricingTiers.length > 0) {
        // Try to find first original tier
        const firstOriginalTier = product.pricingTiers.find(tier => tier.type?.toLowerCase() === 'original');
        // Use first original tier if available, otherwise use first tier
        const tierToSelect = firstOriginalTier || product.pricingTiers[0];
        setSelectedTierId(tierToSelect.id);
      } else {
        // No pricing tiers, so no tier selection needed
        setSelectedTierId(null);
      }
    }
  }, [product?.id, product?.pricingTiers]);

  // Get selected tier details or fallback to base product
  const getSelectedTierOrProduct = () => {
    if (product?.pricingTiers && selectedTierId) {
      const selectedTier = product.pricingTiers.find(tier => tier.id === selectedTierId);
      if (selectedTier) {
        return {
          price: selectedTier.price,
          stock: selectedTier.stock,
          description: selectedTier.description,
          displayName: `${selectedTier.type}: ${selectedTier.size}`
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
      image: product.images?.[selectedImageIndex] || '',
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
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className={`relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg group bg-neutral-100 dark:bg-neutral-800 ${product.images && product.images.length > 0 ? 'cursor-pointer' : ''}`}>
                <img 
                  src={product.images?.[selectedImageIndex] || "/placeholder.svg"} 
                  alt={product.name} 
                  className="w-full h-full object-contain transition-transform group-hover:scale-105" 
                  onClick={() => product.images && product.images.length > 0 && setIsImageModalOpen(true)}
                  data-testid="product-main-image"
                />
                {/* Zoom overlay hint - only show if there are images */}
                {product.images && product.images.length > 0 && (
                  <div 
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center"
                    onClick={() => setIsImageModalOpen(true)}
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3">
                      <ZoomIn className="h-6 w-6 text-gray-800" />
                    </div>
                  </div>
                )}
                {/* Multiple images indicator */}
                {product.images && product.images.length > 1 && (
                  <Badge className="absolute bottom-4 left-4 bg-black/70 text-white">
                    {selectedImageIndex + 1} of {product.images.length}
                  </Badge>
                )}
              </div>

              {/* Thumbnail Gallery - only show if multiple images */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:border-primary/70 ${
                        index === selectedImageIndex 
                          ? 'border-primary' 
                          : 'border-border'
                      }`}
                      data-testid={`thumbnail-${index}`}
                      aria-label={`View image ${index + 1} of ${product.images?.length || 0}`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
                    <p className="text-3xl font-bold text-primary mt-2">${selectedOption.price}</p>
                    <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
                  </div>
                  <FavoriteButton productId={product.id} size="lg" />
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </div>

              {/* Pricing Tiers / Available Options */}
              {product.pricingTiers && product.pricingTiers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Available Options:</h3>
                  
                  {/* Original Tiers */}
                  {product.pricingTiers.filter(tier => tier.type === 'Original').length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-base font-semibold text-foreground">Original</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {product.pricingTiers.filter(tier => tier.type === 'Original').map((tier) => (
                          <div 
                            key={tier.id} 
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedTierId === tier.id 
                                ? 'border-2 border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedTierId(tier.id)}
                            data-testid={`tier-option-${tier.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-base text-foreground">{tier.size}</p>
                              <p className="text-xl font-bold text-foreground">${tier.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Print Tiers */}
                  {product.pricingTiers.filter(tier => tier.type === 'Print').length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-base font-semibold text-foreground">Print</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {product.pricingTiers.filter(tier => tier.type === 'Print').map((tier) => (
                          <div 
                            key={tier.id} 
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedTierId === tier.id 
                                ? 'border-2 border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedTierId(tier.id)}
                            data-testid={`tier-option-${tier.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-base text-foreground">{tier.size}</p>
                              <p className="text-xl font-bold text-foreground">${tier.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Canvas Print Tiers */}
                  {product.pricingTiers.filter(tier => tier.type === 'Canvas Print').length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-base font-semibold text-foreground">Canvas Print</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {product.pricingTiers.filter(tier => tier.type === 'Canvas Print').map((tier) => (
                          <div 
                            key={tier.id} 
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedTierId === tier.id 
                                ? 'border-2 border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedTierId(tier.id)}
                            data-testid={`tier-option-${tier.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-base text-foreground">{tier.size}</p>
                              <p className="text-xl font-bold text-foreground">${tier.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

            </div>
          </div>
        </div>
      </main>

      {/* Product Details Section */}
      <ProductDetails product={product} />
      
      <Footer />

      {/* Product Image Modal */}
      <ProductImageModal
        images={product.images || []}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        productName={product.name}
        initialImageIndex={selectedImageIndex}
      />
    </div>
  );
}