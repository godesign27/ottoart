import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Drafts only reach the shop for a signed-in admin (the server hides them from everyone else),
// so this label is how an admin tells a draft apart from a product shoppers can see.
export function DraftBadge({ product, className }: { product: { id: string; status?: string | null }; className?: string }) {
  if (product.status !== "draft") return null;
  return (
    <Badge
      variant="outline"
      title="Draft: only admins can see this product"
      className={cn("border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200", className)}
      data-testid={`badge-draft-${product.id}`}
    >
      Draft
    </Badge>
  );
}
