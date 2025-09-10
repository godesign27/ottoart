import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Upload } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  year?: string;
  medium?: string;
  dimensions?: string;
  isPublished: boolean;
  order: number;
}

export function GalleryManager() {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Mock data - in real app this would come from API
  const mockGalleryItems: GalleryItem[] = [
    {
      id: "1",
      title: "Abstract Composition 1",
      description: "A vibrant exploration of color and form",
      imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      year: "2024",
      medium: "Acrylic on canvas",
      dimensions: "24\" x 36\"",
      isPublished: true,
      order: 1
    },
    {
      id: "2",
      title: "Urban Rhythms",
      description: "Inspired by city life and movement",
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      year: "2023",
      medium: "Mixed media",
      dimensions: "30\" x 40\"",
      isPublished: true,
      order: 2
    },
    {
      id: "3",
      title: "Color Study",
      description: "An experiment in color relationships",
      imageUrl: "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      year: "2024",
      medium: "Oil on canvas",
      dimensions: "18\" x 24\"",
      isPublished: false,
      order: 3
    }
  ];

  const { data: galleryItems = mockGalleryItems, isLoading } = useQuery({
    queryKey: ['/api/gallery'],
    queryFn: () => Promise.resolve(mockGalleryItems)
  });

  const handleEdit = (item: GalleryItem) => {
    setSelectedItem(item);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this gallery item?')) {
      // Implementation for delete
      console.log('Delete item:', id);
    }
  };

  const handleSave = () => {
    // Implementation for save
    setIsEditing(false);
    setSelectedItem(null);
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
        <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Gallery Item
        </Button>
      </div>

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
                  defaultValue={selectedItem?.year}
                  placeholder="e.g., 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medium">Medium</Label>
                <Input
                  id="medium"
                  defaultValue={selectedItem?.medium}
                  placeholder="e.g., Acrylic on canvas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  defaultValue={selectedItem?.dimensions}
                  placeholder="e.g., 24&quot; x 36&quot;"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                defaultValue={selectedItem?.description}
                placeholder="Brief description of the artwork"
              />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Click to upload image or drag and drop</p>
                <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {selectedItem ? 'Update' : 'Add'} Gallery Item
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
              <div className="absolute top-2 right-2">
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
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}