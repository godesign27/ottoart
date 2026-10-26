import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PageSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Plus, Edit, Trash2, Upload, EyeOff, Save, Eye } from "lucide-react";

import type { GalleryItem, InsertGalleryItem } from "@shared/schema";

export function GalleryManager() {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isSold, setIsSold] = useState(false);

  // Fetch page settings
  const { data: pageSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/page-settings', 'gallery'],
    queryFn: () => apiRequest("GET", '/api/page-settings/gallery').then(res => res.json()) as Promise<PageSettings>
  });

  // Mutation for updating page settings
  const updatePageSettingsMutation = useMutation({
    mutationFn: (enabled: boolean) => 
      apiRequest('PUT', '/api/page-settings/gallery', { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/page-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/page-settings', 'gallery'] });
    }
  });

  const { data: galleryItems = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['/api/gallery'],
    queryFn: () => apiRequest("GET", '/api/gallery').then(res => res.json())
  });

  // Create gallery item mutation
  const createGalleryItemMutation = useMutation({
    mutationFn: (item: InsertGalleryItem) => 
      apiRequest('POST', '/api/gallery', item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
    }
  });

  // Update gallery item mutation
  const updateGalleryItemMutation = useMutation({
    mutationFn: ({ id, item }: { id: string, item: Partial<InsertGalleryItem> }) => 
      apiRequest('PUT', `/api/gallery/${id}`, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
    }
  });

  // Delete gallery item mutation
  const deleteGalleryItemMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', `/api/gallery/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
    }
  });

  const handleEdit = (item: GalleryItem) => {
    setSelectedItem(item);
    setImageUrl(item.imageUrl);
    setIsSold(item.isSold ?? false);
    setIsEditing(true);
  };

  const handleImageUpload = (uploadedImageUrl: string) => {
    setImageUrl(uploadedImageUrl);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this gallery item?')) {
      try {
        await deleteGalleryItemMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete gallery item:', error);
        alert('Failed to delete gallery item. Please try again.');
      }
    }
  };

  const handleSave = async () => {
    const titleElement = document.getElementById('title') as HTMLInputElement;
    const yearElement = document.getElementById('year') as HTMLInputElement;
    const mediumElement = document.getElementById('medium') as HTMLInputElement;
    const dimensionsElement = document.getElementById('dimensions') as HTMLInputElement;
    const descriptionElement = document.getElementById('description') as HTMLInputElement;

    if (!titleElement?.value || !imageUrl) {
      alert('Title and image are required');
      return;
    }

    const galleryItemData: InsertGalleryItem = {
      title: titleElement.value,
      description: descriptionElement?.value || undefined,
      imageUrl: imageUrl,
      year: yearElement?.value || undefined,
      medium: mediumElement?.value || undefined,
      dimensions: dimensionsElement?.value || undefined,
      isPublished: true,
      isSold: isSold,
      sortOrder: 0
    };

    try {
      if (selectedItem) {
        await updateGalleryItemMutation.mutateAsync({ 
          id: selectedItem.id, 
          item: galleryItemData 
        });
      } else {
        await createGalleryItemMutation.mutateAsync(galleryItemData);
      }
      setIsEditing(false);
      setSelectedItem(null);
      setImageUrl('');
      setIsSold(false);
    } catch (error) {
      console.error('Failed to save gallery item:', error);
      alert('Failed to save gallery item. Please try again.');
    }
  };

  const handlePageSave = () => {
    if (pageSettings) {
      updatePageSettingsMutation.mutate(!pageSettings.enabled);
    }
  };

  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gallery Manager</h1>
          <p className="text-muted-foreground">Manage your gallery images and artwork</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={pageSettings?.enabled ? "default" : "secondary"}>
              {pageSettings?.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <Button onClick={() => { setIsEditing(true); setSelectedItem(null); setImageUrl(''); }} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Gallery Item
          </Button>
          <Button onClick={togglePreview} variant="outline" className="flex items-center gap-2">
            {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
          <Button onClick={handlePageSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Page Settings</CardTitle>
              <CardDescription>Configure the visibility and content of this page</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="gallery-enabled">Enable this page</Label>
              <Switch
                id="gallery-enabled"
                checked={pageSettings?.enabled ?? true}
                onCheckedChange={() => handlePageSave()}
                disabled={updatePageSettingsMutation.isPending}
              />
            </div>
          </div>
        </CardHeader>
      </Card>


      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedItem ? 'Edit Gallery Item' : 'Add New Gallery Item'}</CardTitle>
            <CardDescription>
              {selectedItem ? 'Update the gallery item details' : 'Add a new item to your gallery'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  defaultValue={selectedItem?.title}
                  placeholder="Enter artwork title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  defaultValue={selectedItem?.year || ''}
                  placeholder="e.g., 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medium">Medium</Label>
                <Input
                  id="medium"
                  defaultValue={selectedItem?.medium || ''}
                  placeholder="e.g., Acrylic on canvas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  defaultValue={selectedItem?.dimensions || ''}
                  placeholder="e.g., 24&quot; x 36&quot;"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                defaultValue={selectedItem?.description || ''}
                placeholder="Brief description of the artwork"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is-sold"
                checked={isSold}
                onCheckedChange={setIsSold}
              />
              <Label htmlFor="is-sold">Mark as Sold</Label>
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <ImageUploader
                onImageUploaded={handleImageUpload}
                data-testid="dropzone-gallery-image"
              >
                Upload Artwork Image
              </ImageUploader>
              <Input
                placeholder="Or enter image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="mt-2"
                data-testid="input-gallery-image"
              />
              {imageUrl && (
                <div className="mt-4">
                  <img 
                    src={imageUrl} 
                    alt="Gallery item preview" 
                    className="w-32 h-32 object-cover rounded-lg border" 
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={createGalleryItemMutation.isPending || updateGalleryItemMutation.isPending}
                data-testid="button-save-gallery"
              >
                {createGalleryItemMutation.isPending || updateGalleryItemMutation.isPending 
                  ? 'Saving...' 
                  : (selectedItem ? 'Update' : 'Add') + ' Gallery Item'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="relative aspect-square">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex items-center gap-2">
                {item.isSold && (
                  <Badge variant="destructive">Sold</Badge>
                )}
                <Badge variant={item.isPublished ? "default" : "secondary"}>
                  {item.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.year}</span>
                  <span>{item.medium}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(item)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteGalleryItemMutation.isPending}
                    className="flex items-center gap-1"
                    data-testid={`button-delete-${item.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                    {deleteGalleryItemMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!pageSettings?.enabled && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-orange-600" />
              <p className="text-orange-800 dark:text-orange-200">
                This gallery page is currently disabled and will not appear on your live site. Enable it in the page settings to make it visible to visitors.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}