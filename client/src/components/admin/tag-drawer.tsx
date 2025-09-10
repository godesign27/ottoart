import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTagSchema, type Tag } from "@shared/schema";

interface TagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editTag?: Tag | null;
}

// Form schema based on the tag schema
const tagFormSchema = insertTagSchema.extend({
  name: z.string().min(1, "Name is required"),
});

type TagFormData = z.infer<typeof tagFormSchema>;

export function TagDrawer({ isOpen, onClose, editTag }: TagDrawerProps) {
  const isEditing = !!editTag;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form setup with default values or edit values
  const form = useForm<TagFormData>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  // Reset form when editTag changes
  useEffect(() => {
    if (editTag) {
      form.reset({
        name: editTag.name || "",
        slug: editTag.slug || "",
      });
    } else {
      form.reset({
        name: "",
        slug: "",
      });
    }
  }, [editTag, form]);

  // Mutation for creating/updating tags
  const createTagMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditing && editTag) {
        return apiRequest('PUT', `/api/tags/${editTag.id}`, data);
      } else {
        return apiRequest('POST', '/api/tags', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      toast({
        title: isEditing ? "Tag updated" : "Tag added",
        description: isEditing 
          ? "The tag has been successfully updated."
          : "The tag has been successfully added.",
        variant: "default",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: isEditing 
          ? "Failed to update tag. Please try again."
          : "Failed to add tag. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: TagFormData) => {
    // Generate slug from name if not provided
    const slug = data.slug || data.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    const cleanedData = {
      ...data,
      slug,
    };
    createTagMutation.mutate(cleanedData);
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
              {isEditing ? "Edit Tag" : "Add Tag"}
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              data-testid="close-tag-drawer"
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
                          placeholder="Abstract" 
                          {...field}
                          data-testid="input-tag-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createTagMutation.isPending}
                  data-testid="submit-tag"
                >
                  {createTagMutation.isPending 
                    ? (isEditing ? "Updating..." : "Adding...") 
                    : (isEditing ? "Update Tag" : "Add Tag")
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