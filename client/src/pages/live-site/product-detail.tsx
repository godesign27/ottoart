import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { ProductImageModal } from "@/components/live-site/product-image-modal";
import { ProductDetails } from "@/components/live-site/product-details";
import { artSrc, artSrcSet } from "@/components/marketing/art";

const formatUsd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
import { FavoriteButton } from "@/components/live-site/favorite-button";
import { SaveToBoard } from "@/components/live-site/save-to-board";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DraftBadge } from "@/components/live-site/draft-badge";
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
      const response = await apiRequest("GET", `/api/products/${params.id}`);
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
      
      // Auto-select tier: if sold, skip original and pick first print; otherwise pick first original
      if (product.pricingTiers && product.pricingTiers.length > 0) {
        const isSold = (product as any).isSold;
        if (isSold) {
          // Skip original tiers, pick first non-original
          const firstPrintTier = product.pricingTiers.find(tier => tier.type?.toLowerCase() !== 'original');
          const tierToSelect = firstPrintTier || product.pricingTiers[0];
          setSelectedTierId(tierToSelect.id);
        } else {
          // Try to find first original tier
          const firstOriginalTier = product.pricingTiers.find(tier => tier.type?.toLowerCase() === 'original');
          // Use first original tier if available, otherwise use first tier
          const tierToSelect = firstOriginalTier || product.pricingTiers[0];
          setSelectedTierId(tierToSelect.id);
        }
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
        <main className="mx-auto w-full max-w-[90rem] px-4 pb-24 pt-8 sm:px-6 lg:px-10">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted w-3/4"></div>
                <div className="h-6 bg-muted w-1/2"></div>
                <div className="h-4 bg-muted w-full"></div>
                <div className="h-4 bg-muted w-full"></div>
                <div className="h-10 bg-muted w-full"></div>
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
        <main className="mx-auto w-full max-w-[90rem] px-4 pb-24 pt-8 sm:px-6 lg:px-10">
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
      
      <main className="mx-auto w-full max-w-[90rem] px-4 pb-24 pt-8 sm:px-6 lg:px-10">
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Shop
          </Button>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
            {/* Product Images */}
            <div className="space-y-3 lg:col-span-7">
              {/* Main Image */}
              <div className={`relative overflow-hidden group bg-secondary ${product.images && product.images.length > 0 ? 'cursor-pointer' : ''}`}>
                <img 
                  src={artSrc(product.images?.[selectedImageIndex] || "/placeholder.svg", 1280)}
                  srcSet={artSrcSet(product.images?.[selectedImageIndex] || "/placeholder.svg", [640, 960, 1280, 1600])}
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  alt={product.name} 
                  className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.02]" 
                  onClick={() => product.images && product.images.length > 0 && setIsImageModalOpen(true)}
                  data-testid="product-main-image"
                />
                {/* Zoom overlay hint - only show if there are images */}
                {product.images && product.images.length > 0 && (
                  <div 
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center"
                    onClick={() => setIsImageModalOpen(true)}
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-3">
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
                      className={`flex-shrink-0 w-20 h-20 overflow-hidden border-2 transition-colors ${
                        index === selectedImageIndex 
                          ? 'border-foreground' 
                          : 'border-transparent hover:border-muted-foreground'
                      }`}
                      data-testid={`thumbnail-${index}`}
                      aria-label={`View image ${index + 1} of ${product.images?.length || 0}`}
                    >
                      <img
                        src={artSrc(image, 160)}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-8 lg:col-span-5">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-display text-[2.5rem] leading-[1.02] tracking-[-0.02em] md:text-[3.25rem]">{product.name}</h1>
                      <DraftBadge product={product} className="text-sm px-3 py-1" />
                      {(product as any).isSold && (
                        <Badge variant="destructive" className="text-sm px-3 py-1">Sold</Badge>
                      )}
                    </div>
                    <p className="tabular mt-4 text-2xl font-semibold">{formatUsd(Number(selectedOption.price))}</p>
                    <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
                  </div>
                  <FavoriteButton productId={product.id} size="lg" />
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-lg leading-relaxed text-foreground">{product.description}</p>
              </div>

              {/* Pricing Tiers / Available Options */}
              {product.pricingTiers && product.pricingTiers.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Choose an option</h2>
                  
                  {/* Original Tiers */}
                  {product.pricingTiers.filter(tier => tier.type === 'Original').length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-foreground">Original</h4>
                        {(product as any).isSold && (
                          <Badge variant="destructive" className="text-xs">Sold</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {product.pricingTiers.filter(tier => tier.type === 'Original').map((tier) => {
                          const isOriginalSold = (product as any).isSold;
                          return (
                            <div 
                              key={tier.id} 
                              className={`border p-4 transition-colors ${
                                isOriginalSold
                                  ? 'border-border bg-muted/50 opacity-60 cursor-not-allowed'
                                  : selectedTierId === tier.id 
                                    ? 'border-foreground bg-secondary cursor-pointer' 
                                    : 'border-border hover:border-muted-foreground cursor-pointer'
                              }`}
                              onClick={() => !isOriginalSold && setSelectedTierId(tier.id)}
                              data-testid={`tier-option-${tier.id}`}
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-base text-foreground">{tier.size}</p>
                                {isOriginalSold
                                  ? <span className="text-sm font-semibold text-destructive">Sold</span>
                                  : <p className="tabular text-lg font-semibold text-foreground">{formatUsd(Number(tier.price))}</p>
                                }
                              </div>
                            </div>
                          );
                        })}
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
                            className={`border p-4 cursor-pointer transition-colors ${
                              selectedTierId === tier.id 
                                ? 'border-foreground bg-secondary' 
                                : 'border-border hover:border-muted-foreground'
                            }`}
                            onClick={() => setSelectedTierId(tier.id)}
                            data-testid={`tier-option-${tier.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-base text-foreground">{tier.size}</p>
                              <p className="tabular text-lg font-semibold text-foreground">{formatUsd(Number(tier.price))}</p>
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
                            className={`border p-4 cursor-pointer transition-colors ${
                              selectedTierId === tier.id 
                                ? 'border-foreground bg-secondary' 
                                : 'border-border hover:border-muted-foreground'
                            }`}
                            onClick={() => setSelectedTierId(tier.id)}
                            data-testid={`tier-option-${tier.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-base text-foreground">{tier.size}</p>
                              <p className="tabular text-lg font-semibold text-foreground">{formatUsd(Number(tier.price))}</p>
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

              </div>

              {/* Add to Cart */}
              {(() => {
                const isSold = (product as any).isSold;
                const selectedTier = product.pricingTiers?.find(t => t.id === selectedTierId);
                const isSelectedOriginalSold = isSold && (!selectedTier || selectedTier.type === 'Original');
                const isDisabled = selectedOption.stock === 0 || addToCartMutation.isPending || isSelectedOriginalSold;
                return (
                  <Button 
                    className="h-12 w-full text-base font-semibold flex items-center justify-center gap-2"
                    disabled={isDisabled}
                    onClick={handleAddToCart}
                    data-testid="add-to-cart-button"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {addToCartMutation.isPending 
                      ? 'Adding...' 
                      : isSelectedOriginalSold
                        ? 'Original Sold'
                        : selectedOption.stock > 0 
                          ? 'Add to cart' 
                          : 'Out of Stock'
                    }
                  </Button>
                );
              })()}

              {/* Corporate and rental buyers plan a space on a board, then send it for a quote */}
              <div className="space-y-2">
                <SaveToBoard productId={product.id} productName={product.name} className="w-full" />
                <p className="text-sm text-muted-foreground">Furnishing an office or renting? Gather works on a board, add notes and send it to Otto for a quote.</p>
              </div>

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