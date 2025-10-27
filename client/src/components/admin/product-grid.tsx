import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ProductDrawer } from "@/components/admin/product-drawer";
import type { Product } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function ProductGrid() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { toast } = useToast();
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    select: (data) => {
      if (!searchQuery) return data;
      return data?.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest('DELETE', `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="product-grid">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden shadow-sm">
            <div className="w-full h-48 bg-muted animate-pulse"></div>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Product Listings</h2>
          <p className="text-muted-foreground">Manage your artwork and products</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64" 
              data-testid="product-search"
            />
          </div>
          <Button 
            onClick={() => setIsDrawerOpen(true)}
            data-testid="add-product-button"
          >
            Add Product
          </Button>
        </div>
      </div>

      <div className="product-grid">
        {products?.map((product) => (
          <Card key={product.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow" data-testid={`product-card-${product.id}`}>
            <img 
              src={product.images?.[0] ? decodeURIComponent(product.images[0].replace(/&amp;/g, '&')) : "/placeholder.svg"} 
              alt={product.name} 
              className="w-full h-48 object-cover" 
              onError={(e) => {
                console.log('Image failed to load:', product.images?.[0]);
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.categoryId}</p>
                  <p className="text-lg font-bold text-foreground mt-2">${product.price}</p>
                </div>
                <Badge 
                  variant={product.status === 'active' ? 'default' : 'secondary'}
                  className={product.status === 'active' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' : ''}
                >
                  {product.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Stock: {product.stock}</span>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary/80" 
                    onClick={() => {
                      setEditingProduct(product);
                      setIsDrawerOpen(true);
                    }}
                    data-testid={`edit-product-${product.id}`}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-destructive" 
                    onClick={() => setProductToDelete(product)}
                    data-testid={`delete-product-${product.id}`}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!products?.length && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No products found.</p>
          <Button onClick={() => setIsDrawerOpen(true)}>
            Add your first product
          </Button>
        </div>
      )}

      <ProductDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingProduct(null);
        }}
        editProduct={editingProduct}
      />

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent data-testid="delete-confirmation-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{productToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete">Cancel</AlertDialogCancel>
            <Button
              onClick={() => productToDelete && deleteProductMutation.mutate(productToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProductMutation.isPending}
              data-testid="confirm-delete"
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
