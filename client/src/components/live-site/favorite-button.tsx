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
      variant="ghost"
      size={buttonSize}
      onClick={handleClick}
      disabled={isToggling}
      className={cn(
        "transition-colors duration-200 text-foreground",
        // The colour lives on the heart, not the button, so it reads on any background a card puts behind it.
        // red-600 on white is 4.8:1 and red-500 on the dark ground is above 4.5:1 (WCAG non-text needs 3:1).
        favorite ? "hover:text-red-700" : "text-muted-foreground hover:text-red-600",
        className
      )}
      data-testid={`favorite-button-${productId}`}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorite}
    >
      <Heart
        className={cn(
          iconSize,
          "transition-colors duration-200",
          favorite ? "fill-red-600 text-red-600 dark:fill-red-500 dark:text-red-500" : ""
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