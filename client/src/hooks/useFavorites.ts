import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['/api/favorites'],
    enabled: isAuthenticated,
  });

  const addFavoriteMutation = useMutation({
    mutationFn: async (productId: string) => 
      await apiRequest('POST', '/api/favorites', { productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: "Added to favorites",
        description: "Product has been added to your favorites",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Please log in to add favorites",
        variant: "destructive",
      });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (productId: string) => 
      await apiRequest('DELETE', `/api/favorites/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: "Removed from favorites",
        description: "Product has been removed from your favorites",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    },
  });

  const isFavorite = (productId: string) => {
    return (favorites as any[]).some((fav: any) => fav.id === productId || fav.productId === productId);
  };

  const toggleFavorite = (productId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add favorites",
        variant: "destructive",
      });
      return;
    }

    if (isFavorite(productId)) {
      removeFavoriteMutation.mutate(productId);
    } else {
      addFavoriteMutation.mutate(productId);
    }
  };

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    isToggling: addFavoriteMutation.isPending || removeFavoriteMutation.isPending,
  };
}