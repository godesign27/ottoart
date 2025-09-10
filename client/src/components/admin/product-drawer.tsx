import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Upload, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProductSchema, type Category, type Tag, type Product } from "@shared/schema";

interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editProduct?: Product | null;
}

// Pricing tier schema
const pricingTierSchema = z.object({
  id: z.string(),
  size: z.string().min(1, "Size is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  type: z.string().min(1, "Type is required"),
  stock: z.coerce.number().nonnegative("Stock must be 0 or greater"),
  description: z.string().min(1, "Description is required"),
});

// Form schema based on the product schema with proper coercion
const productFormSchema = insertProductSchema.extend({
  price: z.coerce.number().nonnegative(),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]), // Will store tag IDs
  pricingTiers: z.array(pricingTierSchema).default([]),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export function ProductDrawer({ isOpen, onClose, editProduct }: ProductDrawerProps) {
  const isEditing = !!editProduct;
  const [activeTab, setActiveTab] = useState("content");
  const [imageUrl, setImageUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories and tags for the forms
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: tags } = useQuery<Tag[]>({
    queryKey: ['/api/tags'],
  });

  // Form setup with default values or edit values
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: editProduct ? {
      name: editProduct.name || "",
      sku: editProduct.sku || "",
      description: editProduct.description || "",
      price: parseFloat(editProduct.price.toString()) || 0,
      status: editProduct.status || "active",
      stock: editProduct.stock || 0,
      isFeatured: editProduct.isFeatured || false,
      images: editProduct.images || [],
      tags: editProduct.tags || [],
      categoryId: editProduct.categoryId || undefined,
      pricingTiers: editProduct.pricingTiers || [],
    } : {
      name: "",
      sku: "",
      description: "",
      price: 0,
      status: "active",
      stock: 0,
      isFeatured: false,
      images: [],
      tags: [],
      categoryId: undefined,
      pricingTiers: [],
    },
  });

  // Mutation for creating/updating products
  const createProductMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditing && editProduct) {
        return apiRequest('PUT', `/api/products/${editProduct.id}`, data);
      } else {
        return apiRequest('POST', '/api/products', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: isEditing ? "Product updated" : "Product added",
        description: isEditing 
          ? "The product has been successfully updated."
          : "The product has been successfully added to your catalog.",
        variant: "default",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: isEditing 
          ? "Failed to update product. Please try again."
          : "Failed to add product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ProductFormData) => {
    // Clean up data before submission
    const cleanedData = {
      ...data,
      price: data.price.toString(), // Convert number to string for decimal field
      categoryId: data.categoryId || undefined, // Convert empty string to undefined
      sku: data.sku || undefined, // Convert empty string to undefined 
    };
    createProductMutation.mutate(cleanedData);
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      const currentImages = form.getValues("images");
      form.setValue("images", [...currentImages, imageUrl.trim()]);
      setImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = form.getValues("images");
    form.setValue("images", currentImages.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-[600px] bg-background border-l border-border z-50 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">
              {isEditing ? "Edit Product" : "Add Product"}
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              data-testid="close-drawer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-hidden">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="h-full flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  {/* Tab Navigation */}
                  <div className="px-6 pt-4">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="content" data-testid="tab-content">Content</TabsTrigger>
                      <TabsTrigger value="pricing" data-testid="tab-pricing">Pricing</TabsTrigger>
                      <TabsTrigger value="images" data-testid="tab-images">Images</TabsTrigger>
                      <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-auto p-6">
                    <TabsContent value="content" className="space-y-6 mt-0">
                      <ContentTab form={form} />
                    </TabsContent>

                    <TabsContent value="pricing" className="space-y-6 mt-0">
                      <PricingTab form={form} />
                    </TabsContent>

                    <TabsContent value="images" className="space-y-6 mt-0">
                      <ImagesTab 
                        form={form} 
                        imageUrl={imageUrl}
                        setImageUrl={setImageUrl}
                        onAddImage={handleAddImage}
                        onRemoveImage={handleRemoveImage}
                      />
                    </TabsContent>

                    <TabsContent value="categories" className="space-y-6 mt-0">
                      <CategoriesTab 
                        form={form} 
                        categories={categories || []}
                        tags={tags || []}
                      />
                    </TabsContent>
                  </div>
                </Tabs>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-border">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    data-testid="cancel-button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createProductMutation.isPending}
                    data-testid="add-product-submit"
                  >
                    {createProductMutation.isPending 
                      ? (isEditing ? "Updating..." : "Adding...") 
                      : (isEditing ? "Update Product" : "Add Product")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}

// Content Tab Component
function ContentTab({ form }: { form: any }) {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Name</FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter product name" 
                {...field} 
                data-testid="input-product-name"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sku"
        render={({ field }) => (
          <FormItem>
            <FormLabel>SKU</FormLabel>
            <FormControl>
              <Input 
                placeholder="Optional" 
                {...field} 
                data-testid="input-sku"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="stock"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Quantity in Stock</FormLabel>
            <FormControl>
              <Input 
                type="number"
                min="0"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                data-testid="input-stock"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter product description..."
                className="min-h-[120px]"
                {...field} 
                data-testid="input-description"
              />
            </FormControl>
            <FormDescription>
              Use the toolbar to format your text with bold, italic, lists, and more.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Price</FormLabel>
            <FormControl>
              <Input 
                type="number"
                step="0.01"
                min="0"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                data-testid="input-price"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isFeatured"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox 
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-featured"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Featured Product</FormLabel>
              <FormDescription>
                Featured products appear on the home page and at the top of product listings
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </>
  );
}

// Pricing Tab Component
function PricingTab({ form }: { form: any }) {
  const price = form.watch("price");
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "pricingTiers"
  });

  const addTier = () => {
    append({
      id: `tier-${Date.now()}`,
      size: "",
      price: 0,
      type: "Original",
      stock: 0,
      description: ""
    });
  };

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Base Price</h3>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">1 item</p>
              <p className="text-sm text-muted-foreground">${price || "0.00"} each</p>
            </div>
            <p className="text-xl font-bold">${price || "0.00"}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Pricing Tiers</h3>
          <Button 
            variant="outline" 
            size="sm" 
            type="button"
            onClick={addTier}
            data-testid="add-tier-button"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Tier
          </Button>
        </div>
        
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Add pricing tiers to offer different sizes, types, or framing options.
          </p>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Tier {index + 1}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => remove(index)}
                  data-testid={`remove-tier-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`pricingTiers.${index}.size`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 42x42"
                          {...field}
                          data-testid={`tier-size-${index}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`pricingTiers.${index}.price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid={`tier-price-${index}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`pricingTiers.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid={`tier-type-${index}`}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Original">Original</SelectItem>
                          <SelectItem value="Canvas">Canvas</SelectItem>
                          <SelectItem value="Print">Print</SelectItem>
                          <SelectItem value="Framed">Framed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`pricingTiers.${index}.stock`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid={`tier-stock-${index}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name={`pricingTiers.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 42x42 original"
                        {...field}
                        data-testid={`tier-description-${index}`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// Images Tab Component
function ImagesTab({ 
  form, 
  imageUrl, 
  setImageUrl, 
  onAddImage, 
  onRemoveImage 
}: { 
  form: any;
  imageUrl: string;
  setImageUrl: (url: string) => void;
  onAddImage: () => void;
  onRemoveImage: (index: number) => void;
}) {
  const images = form.watch("images");

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Product Images</h3>
        
        {/* Image Upload Area */}
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">Drag and drop an image here, or click to select</p>
          <Button 
            variant="outline" 
            type="button"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  // For now, we'll use a real working Unsplash image
                  // In a real app, you'd upload to a storage service
                  const placeholderUrl = `https://picsum.photos/400/400?random=${Date.now()}`;
                  const currentImages = form.getValues('images');
                  form.setValue('images', [...currentImages, placeholderUrl]);
                }
              };
              input.click();
            }}
            data-testid="select-image-button"
          >
            Select Image
          </Button>
        </div>

        {/* Image URL Input */}
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <div className="flex gap-2">
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              data-testid="input-image-url"
            />
            <Button 
              type="button" 
              onClick={onAddImage}
              disabled={!imageUrl.trim()}
              data-testid="add-image-button"
            >
              Add
            </Button>
          </div>
        </div>

        {/* Current Images */}
        {images.length > 0 && (
          <div className="space-y-2">
            <Label>Current Images</Label>
            <div className="grid grid-cols-2 gap-4">
              {images.map((image: string, index: number) => (
                <div key={index} className="relative group">
                  <img 
                    src={image} 
                    alt={`Product image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveImage(index)}
                    data-testid={`remove-image-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Categories Tab Component
function CategoriesTab({ 
  form, 
  categories, 
  tags 
}: { 
  form: any;
  categories: Category[];
  tags: Tag[];
}) {
  const selectedTags = form.watch("tags");

  const handleTagToggle = (tagId: string) => {
    const current = selectedTags || [];
    const updated = current.includes(tagId)
      ? current.filter((t: string) => t !== tagId)
      : [...current, tagId];
    form.setValue("tags", updated);
  };

  return (
    <>
      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      {category.name}
                      {category.isFeatured && (
                        <span className="text-xs bg-primary text-primary-foreground px-1 py-0.5 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Tags</h3>
        <div className="space-y-3">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center space-x-2">
              <Checkbox
                id={`tag-${tag.id}`}
                checked={selectedTags?.includes(tag.id) || false}
                onCheckedChange={() => handleTagToggle(tag.id)}
                data-testid={`checkbox-tag-${tag.slug}`}
              />
              <Label htmlFor={`tag-${tag.id}`}>
                {tag.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}