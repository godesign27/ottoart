import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/live-site/favorite-button";
import { useUser } from "@clerk/react";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@shared/schema";

export default function FavoritesPage() {
  const { isSignedIn: isAuthenticated, isLoaded } = useUser();
  const authLoading = !isLoaded;

  const { data: favorites, isLoading: favoritesLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/favorites'],
    enabled: isAuthenticated,
  });

  const isLoading = authLoading || favoritesLoading;

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <LiveSiteNavigation />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">My Favorites</h1>
            <p className="text-muted-foreground mb-8">Please log in to view your favorite products</p>
            <Link href="/sign-in">
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                Log In
              </button>
            </Link>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <LiveSiteNavigation />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">My Favorites</h1>
            <p className="text-muted-foreground mt-2">Your favorited products</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="w-full h-64 bg-muted animate-pulse"></div>
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  if (error) {
    return <main className="p-8" role="alert"><h1>Unable to load favorites</h1><p>{error.message}</p></main>;
  }

  if (!favorites?.length) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <LiveSiteNavigation />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">My Favorites</h1>
            <p className="text-muted-foreground mt-2">Your favorited products</p>
          </div>

          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-medium text-foreground mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-8">Start browsing products and click the heart icon to add favorites</p>
            <Link href="/shop">
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Browse Products
              </button>
            </Link>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LiveSiteNavigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Favorites</h1>
          <p className="text-muted-foreground mt-2">
            {favorites.length} favorite{favorites.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((product) => (
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
                      className="shadow-sm"
                    />
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold">${product.price}</p>
                      <div className="flex gap-2">
                        {(() => {
                          // Check if original is sold out
                          const originalTier = product.pricingTiers?.find(tier => tier.type?.toLowerCase() === 'original');
                          const originalSoldOut = originalTier ? originalTier.stock === 0 : (product.isOriginal ? (product.stock ?? 0) === 0 : false);
                          
                          // Check if prints are available
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
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}