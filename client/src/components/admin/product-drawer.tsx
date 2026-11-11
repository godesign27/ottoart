import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Upload, Image as ImageIcon, Plus, Trash2, Sparkles, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProductSchema, type Category, type Tag, type Product } from "@shared/schema";
import { ImageUploader } from "@/components/ui/image-uploader";

interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editProduct?: Product | null;
}

// Pricing tier schema
/** A number field that treats a blank box as missing (not 0), with one message for blank and not-a-number. */
const num = (message: string) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined || (typeof v === "number" && Number.isNaN(v)) ? undefined : Number(v)),
    z.number({ required_error: message, invalid_type_error: message }),
  );

// Every message says what to enter and gives an example, so the fix is obvious from the message alone.
const pricingTierSchema = z.object({
  id: z.string(),
  size: z.string().trim().min(1, "Choose a size, or pick Custom size and enter one, e.g. 24 x 30 inches"),
  price: num("Enter a price in dollars, e.g. 275").pipe(z.number().positive("Enter a price above $0, e.g. 275")),
  type: z.string().min(1, "Choose a type, e.g. Print"),
  stock: num("Enter how many are in stock, e.g. 5").pipe(z.number().int("Enter a whole number, e.g. 5").nonnegative("Enter 0 or more, e.g. 5")),
  // Optional: several live works have tiers without one, and the shop doesn't need it.
  description: z.string().optional().default(""),
});

// Form schema based on the product schema with proper coercion
const productFormSchema = insertProductSchema.extend({
  name: z.string().trim().min(1, "Enter the artwork's name, e.g. Wolf Moon"),
  price: num("Enter a price in dollars, e.g. 3227").pipe(z.number().nonnegative("Enter a price of $0 or more, e.g. 3227")),
  stock: z.coerce.number({ invalid_type_error: "Enter a whole number, e.g. 1" }).int("Enter a whole number, e.g. 1").nonnegative("Enter 0 or more, e.g. 1").optional(),
  year: z.coerce.number({ invalid_type_error: "Enter a 4-digit year, e.g. 2024" }).int("Enter a 4-digit year, e.g. 2024").min(1900, "Enter a 4-digit year, e.g. 2024").max(2100, "Enter a 4-digit year, e.g. 2024").optional().nullable(),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]), // Will store tag IDs
  pricingTiers: z.array(pricingTierSchema).default([]),
  slug: z.string().min(1, "Enter a URL slug, e.g. wolf-moon").regex(/^[a-z0-9-]+$/, "Use only lowercase letters, numbers and hyphens, no spaces, e.g. wolf-moon"),
});

/** Which tab each field lives on, so a failed save can open the right one. */
function tabForField(path: string): "content" | "pricing" | "images" | "categories" {
  if (path.startsWith("pricingTiers")) return "pricing";
  if (path.startsWith("images")) return "images";
  if (path === "categoryId" || path.startsWith("tags")) return "categories";
  return "content";
}

const FIELD_LABELS: Record<string, string> = {
  name: "Product name", slug: "URL slug", sku: "SKU", stock: "Quantity in stock", price: "Price", status: "Status",
  description: "Description", year: "Year created", medium: "Method/medium", dimensions: "Dimensions", rarity: "Rarity",
  frame: "Frame", packaging: "Packaging", authenticity: "Authenticity", images: "Images", categoryId: "Category", tags: "Tags",
  size: "Size", type: "Type",
};

/** Flatten react-hook-form errors into [{ path, label }] in form order: "Pricing › Tier 2 › Price". */
function listErrors(errors: Record<string, any>, prefix = ""): Array<{ path: string; label: string }> {
  const out: Array<{ path: string; label: string }> = [];
  for (const [key, value] of Object.entries(errors ?? {})) {
    if (!value) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value.message === "string" && value.message) {
      const tier = path.match(/^pricingTiers\.(\d+)\.(\w+)$/);
      const label = tier ? `Pricing › Tier ${Number(tier[1]) + 1} › ${FIELD_LABELS[tier[2]] ?? tier[2]}` : FIELD_LABELS[key] ?? key;
      out.push({ path, label });
    } else if (typeof value === "object") {
      out.push(...listErrors(value, path));
    }
  }
  return out;
}

/** "(required)" in text, not just an asterisk. */
function Required() {
  return <span className="ml-1 font-normal text-muted-foreground">(required)</span>;
}

type ProductFormData = z.infer<typeof productFormSchema>;

// Content Tab Component with Accordions
function ContentTab({ form }: { form: any }) {
  return (
    <Accordion type="multiple" defaultValue={["production", "details"]} className="space-y-4">
      <AccordionItem value="production" data-testid="section-production">
        <AccordionTrigger data-testid="accordion-trigger-production" className="text-lg font-semibold">
          Production Information
        </AccordionTrigger>
        <AccordionContent className="space-y-6 pt-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name<Required /></FormLabel>
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
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Slug<Required /></FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., abstract-art-painting"
                    {...field} 
                    data-testid="input-product-slug"
                  />
                </FormControl>
                <FormDescription>
                  Used in the product URL. Only lowercase letters, numbers, and hyphens allowed.
                </FormDescription>
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
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)}
                    data-testid="input-stock"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price<Required /></FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)}
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
                <Select onValueChange={field.onChange} value={field.value || "active"}>
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

          <FormField
            control={form.control}
            name="isSold"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <FormControl>
                  <Checkbox 
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-sold"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-destructive">Mark as Sold</FormLabel>
                  <FormDescription>
                    The product stays visible with a "Sold" badge. Buyers cannot add it to cart.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showInGallery"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-show-in-gallery"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Show in Gallery</FormLabel>
                  <FormDescription>
                    Display this artwork in the gallery using the second image (framed version)
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="details" data-testid="section-details">
        <AccordionTrigger data-testid="accordion-trigger-details" className="text-lg font-semibold">
          Product Details
        </AccordionTrigger>
        <AccordionContent className="space-y-6 pt-4">
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

          {/* Physical Details Section */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-medium mb-4">Physical Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Created</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1900"
                        max="2100"
                        placeholder="e.g., 2023"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.valueAsNumber)}
                        data-testid="input-year"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="medium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method/Medium</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Oil on Canvas, Digital Art"
                        {...field} 
                        data-testid="input-medium"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dimensions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dimensions</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 24 x 36 inches"
                        {...field} 
                        data-testid="input-dimensions"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rarity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rarity</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Original, Limited Edition of 100"
                        {...field} 
                        data-testid="input-rarity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frame"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frame</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Black Wood Frame, Not Framed"
                        {...field} 
                        data-testid="input-frame"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="packaging"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Packaging</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Ships in a Box, Tube Shipping"
                        {...field} 
                        data-testid="input-packaging"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="authenticity"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Authenticity</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Certificate of Authenticity Included"
                      {...field} 
                      data-testid="input-authenticity"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

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
      slug: editProduct.slug || "",
      sku: editProduct.sku || "",
      description: editProduct.description || "",
      price: parseFloat(editProduct.price.toString()) || 0,
      status: editProduct.status || "active",
      stock: editProduct.stock || 0,
      isFeatured: editProduct.isFeatured || false,
      isSold: (editProduct as any).isSold || false,
      showInGallery: editProduct.showInGallery || false,
      images: editProduct.images || [],
      tags: editProduct.tags || [],
      categoryId: editProduct.categoryId || undefined,
      pricingTiers: editProduct.pricingTiers || [],
    } : {
      name: "",
      slug: "",
      sku: "",
      description: "",
      price: 0,
      status: "active",
      stock: 0,
      isFeatured: false,
      showInGallery: false,
      images: [],
      tags: [],
      categoryId: undefined,
      pricingTiers: [],
    },
  });

  // Open tiers on the Pricing tab; a failed save opens the tier that needs fixing.
  const [openTiers, setOpenTiers] = useState<string[]>([]);
  const errorList = listErrors(form.formState.errors);
  const tabErrors = (tab: string) => errorList.filter((e) => tabForField(e.path) === tab).length;

  const handleInvalid = (errors: Record<string, any>) => {
    const list = listErrors(errors);
    if (!list.length) return;
    const first = list[0];
    setActiveTab(tabForField(first.path));
    const tierIndexes = Array.from(new Set(list.map((e) => e.path.match(/^pricingTiers\.(\d+)\./)?.[1]).filter(Boolean))) as string[];
    if (tierIndexes.length) {
      const ids = tierIndexes.map((i) => form.getValues(`pricingTiers.${Number(i)}.id`) as string).filter(Boolean);
      setOpenTiers((open) => Array.from(new Set([...open, ...ids])));
    }
    // After the tab and tier have rendered, bring the first field into view and put the cursor in it.
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-drawer-form] [aria-invalid="true"]`);
      el?.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
      el?.focus({ preventScroll: true });
    }, 80);
    const names = list.map((e) => e.label);
    toast({
      title: list.length === 1 ? "1 field needs fixing" : `${list.length} fields need fixing`,
      description: names.length > 3 ? `${names.slice(0, 3).join(", ")} and ${names.length - 3} more. Each one is marked in red.` : `${names.join(", ")}. ${list.length === 1 ? "It's" : "Each one is"} marked in red.`,
      variant: "destructive",
    });
  };

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

  // Reset form when editProduct changes
  useEffect(() => {
    setOpenTiers([]);
    if (editProduct) {
      // Reset form with edit product data
      form.reset({
        name: editProduct.name || "",
        slug: editProduct.slug || "",
        sku: editProduct.sku || "",
        description: editProduct.description || "",
        price: parseFloat(editProduct.price.toString()) || 0,
        status: editProduct.status || "active",
        stock: editProduct.stock || 0,
        isFeatured: editProduct.isFeatured || false,
        isSold: (editProduct as any).isSold || false,
        showInGallery: editProduct.showInGallery || false,
        images: editProduct.images || [],
        tags: editProduct.tags || [],
        categoryId: editProduct.categoryId || undefined,
        pricingTiers: editProduct.pricingTiers || [],
        year: editProduct.year || undefined,
        medium: editProduct.medium || "",
        dimensions: editProduct.dimensions || "",
        rarity: editProduct.rarity || "",
        frame: editProduct.frame || "",
        packaging: editProduct.packaging || "",
        authenticity: editProduct.authenticity || "",
      });
    } else {
      // Reset form with empty values for new product
      form.reset({
        name: "",
        slug: "",
        sku: "",
        description: "",
        price: 0,
        status: "active",
        stock: 0,
        isFeatured: false,
        showInGallery: false,
        images: [],
        tags: [],
        categoryId: undefined,
        pricingTiers: [],
        year: undefined,
        medium: "",
        dimensions: "",
        rarity: "",
        frame: "",
        packaging: "",
        authenticity: "",
      });
    }
  }, [editProduct, form]);

  const handleSubmit = (data: ProductFormData) => {
    console.log('Form submitted successfully with data:', data);
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
      <div className={`fixed right-0 top-0 h-full w-full sm:w-[600px] bg-background border-l border-border z-50 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-border">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
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
          <div className="flex-1 min-h-0 overflow-hidden">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit, handleInvalid)} noValidate data-drawer-form className="h-full flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  {/* Tab Navigation */}
                  <div className="shrink-0 px-4 sm:px-6 pt-4 border-b">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="content" data-testid="tab-content" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Content<TabErrorMark count={tabErrors("content")} /></TabsTrigger>
                      <TabsTrigger value="pricing" data-testid="tab-pricing" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Pricing<TabErrorMark count={tabErrors("pricing")} /></TabsTrigger>
                      <TabsTrigger value="images" data-testid="tab-images" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Images<TabErrorMark count={tabErrors("images")} /></TabsTrigger>
                      <TabsTrigger value="categories" data-testid="tab-categories" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Categories<TabErrorMark count={tabErrors("categories")} /></TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Tab Content - Scrollable Area */}
                  <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth">
                    <TabsContent value="content" className="space-y-6 mt-0 p-4 sm:p-6 pb-24">
                      <ContentTab form={form} />
                    </TabsContent>

                    <TabsContent value="pricing" className="space-y-6 mt-0 p-4 sm:p-6 pb-24">
                      <PricingTab form={form} openTiers={openTiers} setOpenTiers={setOpenTiers} />
                    </TabsContent>

                    <TabsContent value="images" className="space-y-6 mt-0 p-4 sm:p-6 pb-24">
                      <ImagesTab 
                        form={form} 
                        imageUrl={imageUrl}
                        setImageUrl={setImageUrl}
                        onAddImage={handleAddImage}
                        onRemoveImage={handleRemoveImage}
                      />
                    </TabsContent>

                    <TabsContent value="categories" className="space-y-6 mt-0 p-4 sm:p-6 pb-24">
                      <CategoriesTab 
                        form={form} 
                        categories={categories || []}
                        tags={tags || []}
                      />
                    </TabsContent>
                  </div>
                </Tabs>

                {/* Footer - Sticky */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-3 p-4 sm:p-6 border-t border-border bg-background">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    data-testid="cancel-button"
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createProductMutation.isPending}
                    data-testid="add-product-submit"
                    className="flex-1 sm:flex-none"
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

// Pricing Tab Component
function TabErrorMark({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.6875rem] font-semibold leading-none text-destructive-foreground">
      {count}<span className="sr-only"> {count === 1 ? "field needs" : "fields need"} fixing</span>
    </span>
  );
}

function PricingTab({ form, openTiers, setOpenTiers }: { form: any; openTiers: string[]; setOpenTiers: (v: string[]) => void }) {
  const price = form.watch("price");
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "pricingTiers"
  });

  const addTier = () => {
    append({
      id: `tier-${Date.now()}`,
      size: "42x42",
      price: 100,
      type: "Original",
      stock: 1,
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

        <Accordion type="multiple" value={openTiers} onValueChange={setOpenTiers} className="space-y-4">
          {fields.map((field, index) => {
            const tierData = form.watch(`pricingTiers.${index}`);
            const tierHasError = !!form.formState.errors?.pricingTiers?.[index];
            return (
              <AccordionItem key={field.id} value={(tierData?.id as string) || field.id} className={`border rounded-lg ${tierHasError ? "border-destructive" : ""}`}>
                <div className="flex items-center justify-between pr-4">
                  <AccordionTrigger className="flex-1 py-3 pl-4 pr-0 hover:no-underline justify-start [&>svg]:order-first [&>svg]:mr-3" data-testid={`tier-trigger-${index}`}>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">Tier {index + 1}</span>
                      {tierData?.type && (
                        <span className="text-sm text-muted-foreground">
                          {tierData.type} - ${(Number(tierData.price) || 0).toFixed(2)}
                        </span>
                      )}
                      {tierHasError && <span className="text-sm font-medium text-destructive">Needs fixing</span>}
                    </div>
                  </AccordionTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(index);
                    }}
                    data-testid={`remove-tier-${index}`}
                    className="ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <AccordionContent className="px-4 pb-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`pricingTiers.${index}.size`}
                      render={({ field }) => {
                        const standardSizes = [
                          "16 x 20 inches",
                          "18 x 24 inches",
                          "18 x 18 inches",
                          "24 x 30 inches",
                          "24 x 24 inches",
                          "30 x 36 inches",
                          "30 x 30 inches",
                          "36 x 48 inches",
                          "36 x 36 inches",
                          "48 x 48 inches"
                        ];
                        
                        // Pricing map for auto-population
                        const pricingMap: Record<string, Record<string, number>> = {
                          "Print": {
                            "16 x 20 inches": 185,
                            "18 x 24 inches": 225,
                            "18 x 18 inches": 200,
                            "24 x 24 inches": 250,
                            "24 x 30 inches": 275,
                            "30 x 30 inches": 300,
                            "30 x 36 inches": 350,
                            "36 x 36 inches": 375,
                            "36 x 48 inches": 400,
                            "48 x 48 inches": 425,
                          },
                          "Canvas Print": {
                            "16 x 20 inches": 300,
                            "18 x 24 inches": 375,
                            "18 x 18 inches": 350,
                            "24 x 24 inches": 375,
                            "24 x 30 inches": 400,
                            "30 x 30 inches": 450,
                            "30 x 36 inches": 500,
                            "36 x 36 inches": 550,
                            "36 x 48 inches": 600,
                            "48 x 48 inches": 650,
                          }
                        };
                        
                        const isCustom = !standardSizes.includes(field.value);
                        
                        return (
                          <FormItem>
                            <FormLabel>Size<Required /></FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                if (value !== "custom") {
                                  field.onChange(value);
                                  // Auto-populate price based on size and type
                                  const currentType = form.getValues(`pricingTiers.${index}.type`);
                                  const price = pricingMap[currentType]?.[value];
                                  if (price) {
                                    form.setValue(`pricingTiers.${index}.price`, price);
                                  }
                                }
                              }} 
                              value={isCustom ? "custom" : field.value}
                            >
                              <FormControl>
                                <SelectTrigger data-testid={`tier-size-${index}`}>
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {standardSizes.map((size) => (
                                  <SelectItem key={size} value={size}>{size}</SelectItem>
                                ))}
                                <SelectItem value="custom">Custom size</SelectItem>
                              </SelectContent>
                            </Select>
                            {isCustom && (
                              <Input 
                                placeholder="e.g., 42 x 42 inches"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="mt-2"
                                data-testid={`tier-size-custom-${index}`}
                              />
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`pricingTiers.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($)<Required /></FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)}
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
                      render={({ field }) => {
                        // Pricing map for auto-population
                        const pricingMap: Record<string, Record<string, number>> = {
                          "Print": {
                            "16 x 20 inches": 185,
                            "18 x 24 inches": 225,
                            "18 x 18 inches": 200,
                            "24 x 24 inches": 250,
                            "24 x 30 inches": 275,
                            "30 x 30 inches": 300,
                            "30 x 36 inches": 350,
                            "36 x 36 inches": 375,
                            "36 x 48 inches": 400,
                            "48 x 48 inches": 425,
                          },
                          "Canvas Print": {
                            "16 x 20 inches": 300,
                            "18 x 24 inches": 375,
                            "18 x 18 inches": 350,
                            "24 x 24 inches": 375,
                            "24 x 30 inches": 400,
                            "30 x 30 inches": 450,
                            "30 x 36 inches": 500,
                            "36 x 36 inches": 550,
                            "36 x 48 inches": 600,
                            "48 x 48 inches": 650,
                          }
                        };
                        
                        return (
                          <FormItem>
                            <FormLabel>Type<Required /></FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Auto-populate price based on type and size
                                const currentSize = form.getValues(`pricingTiers.${index}.size`);
                                const price = pricingMap[value]?.[currentSize];
                                if (price) {
                                  form.setValue(`pricingTiers.${index}.price`, price);
                                }
                              }} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger data-testid={`tier-type-${index}`}>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Original">Original</SelectItem>
                                <SelectItem value="Canvas Print">Canvas Print</SelectItem>
                                <SelectItem value="Print">Print</SelectItem>
                                <SelectItem value="Framed">Framed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`pricingTiers.${index}.stock`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock<Required /></FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)}
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
                        <FormLabel>Description <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
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
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
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
  const images = form.watch("images") as string[];
  const { toast } = useToast();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const analyzeArtworkMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const response = await apiRequest('/api/ai/analyze-artwork', 'POST', { imageUrl });
      return response;
    },
    onSuccess: (data: any) => {
      form.setValue('name', data.title);
      form.setValue('description', data.description);
      toast({
        title: "AI Analysis Complete",
        description: "Title and description have been generated!",
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze artwork. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyzeArtwork = () => {
    if (images.length === 0) {
      toast({
        title: "No Image",
        description: "Please add an image first before analyzing.",
        variant: "destructive",
      });
      return;
    }
    analyzeArtworkMutation.mutate(images[0]);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== targetIndex) {
      const newImages = [...images];
      const [removed] = newImages.splice(dragIndex, 1);
      newImages.splice(targetIndex, 0, removed);
      form.setValue('images', newImages);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-medium">Product Images</h3>
        {images.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAnalyzeArtwork}
            disabled={analyzeArtworkMutation.isPending}
            data-testid="analyze-artwork-button"
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {analyzeArtworkMutation.isPending ? "Analyzing..." : "AI Generate Title & Description"}
          </Button>
        )}
      </div>
      
      <ImageUploader
        onImageUploaded={(imageUrl) => {
          const currentImages = form.getValues('images');
          form.setValue('images', [...currentImages, imageUrl]);
        }}
        maxFileSize={10 * 1024 * 1024}
        multiple={true}
      >
        Click or drag images here to upload
      </ImageUploader>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Or add by URL</Label>
        <div className="flex gap-2">
          <Input
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
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

      {images.length > 0 && (
        <div className="space-y-2">
          <Label>Current Images (drag to reorder)</Label>
          <div className="grid grid-cols-2 gap-3">
            {images.map((image: string, index: number) => (
              <div
                key={`${image}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group rounded-lg border-2 transition-all ${
                  dragOverIndex === index ? 'border-primary scale-[1.02]' : 'border-transparent'
                } ${dragIndex === index ? 'opacity-50' : ''}`}
              >
                <div className="absolute top-1 left-1 z-10 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
                <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-5 w-5 text-white drop-shadow-md" />
                </div>
                <img 
                  src={image} 
                  alt={`Product image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                  draggable={false}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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