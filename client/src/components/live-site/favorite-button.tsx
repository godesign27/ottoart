import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  productId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  iconOnly?: boolean;
}

export function FavoriteButton({ 
  productId, 
  size = "md", 
  className,
  iconOnly = false 
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();
  const favorite = isFavorite(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(productId);
  };

  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const buttonSize = size === "sm" ? "icon" : "sm";

  return (
    <Button
      variant={favorite ? "default" : "ghost"}
      size={buttonSize}
      onClick={handleClick}
      disabled={isToggling}
      className={cn(
        "transition-all duration-200 hover:scale-105",
        favorite 
          ? "bg-red-500 hover:bg-red-600 text-white border-red-500" 
          : "text-muted-foreground hover:text-red-500 border-transparent hover:border-red-200",
        className
      )}
      data-testid={`favorite-button-${productId}`}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart 
        className={cn(
          iconSize,
          "transition-all duration-200",
          favorite ? "fill-current" : ""
        )} 
      />
      {!iconOnly && (
        <span className="ml-2">
          {favorite ? "Favorited" : "Add to Favorites"}
        </span>
      )}
    </Button>
  );
}