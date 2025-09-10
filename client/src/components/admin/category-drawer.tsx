import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCategorySchema, type Category } from "@shared/schema";

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editCategory?: Category | null;
}

// Form schema based on the category schema
const categoryFormSchema = insertCategorySchema.extend({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

export function CategoryDrawer({ isOpen, onClose, editCategory }: CategoryDrawerProps) {
  const isEditing = !!editCategory;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form setup with default values or edit values
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      isFeatured: false,
      slug: "",
      sortOrder: 0,
    },
  });

  // Reset form when editCategory changes
  useEffect(() => {
    if (editCategory) {
      form.reset({
        name: editCategory.name || "",
        description: editCategory.description || "",
        isActive: editCategory.isActive ?? true,
        isFeatured: editCategory.isFeatured ?? false,
        slug: editCategory.slug || "",
        sortOrder: editCategory.sortOrder || 0,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        isActive: true,
        isFeatured: false,
        slug: "",
        sortOrder: 0,
      });
    }
  }, [editCategory, form]);

  // Mutation for creating/updating categories
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditing && editCategory) {
        return apiRequest('PUT', `/api/categories/${editCategory.id}`, data);
      } else {
        return apiRequest('POST', '/api/categories', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: isEditing ? "Category updated" : "Category added",
        description: isEditing 
          ? "The category has been successfully updated."
          : "The category has been successfully added.",
        variant: "default",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: isEditing 
          ? "Failed to update category. Please try again."
          : "Failed to add category. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CategoryFormData) => {
    // Generate slug from name if not provided
    const slug = data.slug || data.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    const cleanedData = {
      ...data,
      slug,
    };
    createCategoryMutation.mutate(cleanedData);
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
      <div className={`fixed right-0 top-0 h-full w-[400px] bg-background border-l border-border z-50 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">
              {isEditing ? "Edit Category" : "Add Category"}
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              data-testid="close-category-drawer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-auto p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Prints" 
                          {...field}
                          data-testid="input-category-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description Field */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="High quality prints of the original artwork"
                          {...field}
                          data-testid="input-category-description"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Feature on Home Page Toggle */}
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Feature on Home Page</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Featured categories will display their top products on the home page
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="toggle-category-featured"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Show in Navigation Toggle */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show in Navigation</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Display this category in the top navigation of the live site
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="toggle-category-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createCategoryMutation.isPending}
                  data-testid="submit-category"
                >
                  {createCategoryMutation.isPending 
                    ? (isEditing ? "Updating..." : "Adding...") 
                    : (isEditing ? "Update Category" : "Add Category")
                  }
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}