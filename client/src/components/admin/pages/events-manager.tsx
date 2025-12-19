import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PageSettings, Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Calendar, Clock, MapPin, EyeOff, Eye, Link, Image, Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function EventsManager() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState<string>("");
  const [formIsPublished, setFormIsPublished] = useState(false);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetFormState = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setFormImageUrl("");
    setFormIsPublished(false);
    setFormIsFeatured(false);
    setIsDragging(false);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openForm = (event?: Event) => {
    resetFormState();
    if (event) {
      setSelectedEvent(event);
      setFormImageUrl(event.imageUrl || "");
      setFormIsPublished(event.isPublished ?? false);
      setFormIsFeatured(event.isFeatured ?? false);
    } else {
      setSelectedEvent(null);
    }
    setIsEditing(true);
  };

  const closeForm = () => {
    resetFormState();
    setIsEditing(false);
    setSelectedEvent(null);
  };

  const handleImageUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    try {
      const uploadResponse = await fetch("/api/objects/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": "dev-admin-key-2024",
        },
      });

      if (!uploadResponse.ok) throw new Error("Failed to get upload URL");

      const { uploadURL } = await uploadResponse.json();

      const uploadFileResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadFileResponse.ok) throw new Error("Failed to upload file");

      const finalizeResponse = await fetch("/api/objects/finalize", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": "dev-admin-key-2024",
        },
        body: JSON.stringify({ imageURL: uploadURL }),
      });

      if (!finalizeResponse.ok) throw new Error("Failed to finalize upload");

      const { url } = await finalizeResponse.json();
      setFormImageUrl(url);
      
      toast({
        title: "Image uploaded",
        description: "Event image uploaded successfully!",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setImagePreview(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setFormImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Fetch page settings
  const { data: pageSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/page-settings', 'events'],
    queryFn: () => fetch('/api/page-settings/events').then(res => res.json()) as Promise<PageSettings>
  });

  // Mutation for updating page settings
  const updatePageSettingsMutation = useMutation({
    mutationFn: (enabled: boolean) => 
      apiRequest('PUT', '/api/page-settings/events', { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/page-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/page-settings', 'events'] });
    }
  });

  // Fetch events from API
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (eventData: Partial<Event>) =>
      apiRequest('POST', '/api/events', eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Event created",
        description: "Your event has been created successfully!",
      });
      closeForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to create event",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Event> }) =>
      apiRequest('PUT', `/api/events/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Event updated",
        description: "Your event has been updated successfully!",
      });
      closeForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to update event",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', `/api/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Event deleted",
        description: "The event has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete event",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (event: Event) => {
    openForm(event);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEventMutation.mutate(id);
    }
  };

  const handleSave = (formData: HTMLFormElement) => {
    const data = new FormData(formData);
    const eventData = {
      title: data.get('title') as string,
      description: data.get('description') as string,
      startDate: data.get('startDate') as string,
      endDate: (data.get('endDate') as string) || null,
      time: data.get('time') as string,
      location: data.get('location') as string,
      websiteUrl: (data.get('websiteUrl') as string) || null,
      imageUrl: formImageUrl || null,
      isPublished: formIsPublished,
      isFeatured: formIsFeatured,
      registrationRequired: false,
    };

    if (selectedEvent) {
      updateEventMutation.mutate({ id: selectedEvent.id, data: eventData });
    } else {
      createEventMutation.mutate(eventData);
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
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events Manager</h1>
          <p className="text-muted-foreground">Manage your exhibitions, workshops, and events</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={pageSettings?.enabled ? "default" : "secondary"}>
              {pageSettings?.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <Button onClick={togglePreview} variant="outline" className="flex items-center gap-2">
            {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isPreview ? 'Edit' : 'Preview'}
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
              <Label htmlFor="events-enabled">Enable this page</Label>
              <Switch
                id="events-enabled"
                checked={pageSettings?.enabled ?? true}
                onCheckedChange={() => handlePageSave()}
                disabled={updatePageSettingsMutation.isPending}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Button onClick={() => openForm()} className="flex items-center gap-2 mb-6">
        <Plus className="h-4 w-4" />
        Add Event
      </Button>

      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedEvent ? 'Edit Event' : 'Add New Event'}</CardTitle>
            <CardDescription>
              {selectedEvent ? 'Update the event details' : 'Create a new event for your calendar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="event-form" onSubmit={(e) => { e.preventDefault(); handleSave(e.currentTarget); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={selectedEvent?.title}
                placeholder="Enter event title"
                required
                data-testid="event-title-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={selectedEvent?.description ?? ""}
                placeholder="Describe your event"
                rows={3}
                data-testid="event-description-input"
              />
            </div>
            
            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Event Image
              </Label>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="event-image-file-input"
              />

              {imagePreview || formImageUrl ? (
                <div className="relative">
                  <img
                    src={imagePreview || formImageUrl}
                    alt="Event preview"
                    className="w-full h-48 object-cover rounded-lg border"
                    data-testid="event-image-preview"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                    disabled={isUploading}
                    data-testid="clear-event-image"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                  }`}
                  data-testid="event-image-dropzone"
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-10 h-10 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        Drag and drop an image here
                      </p>
                      <p className="text-xs text-muted-foreground">
                        or click to browse (recommended: 800x400)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Website URL */}
            <div className="space-y-2">
              <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Event Website URL
              </Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                defaultValue={selectedEvent?.websiteUrl ?? ""}
                placeholder="https://example.com/event-page"
                data-testid="event-website-url-input"
              />
              <p className="text-xs text-muted-foreground">
                Link to the event's official website or registration page
              </p>
            </div>

            {/* Date Range and Time */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={selectedEvent?.startDate ?? ""}
                  required
                  data-testid="event-start-date-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (optional)</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={selectedEvent?.endDate ?? ""}
                  data-testid="event-end-date-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  name="time"
                  defaultValue={selectedEvent?.time ?? ""}
                  placeholder="e.g., 14:00-17:00"
                  data-testid="event-time-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={selectedEvent?.location ?? ""}
                  placeholder="Enter venue location"
                  data-testid="event-location-input"
                />
              </div>
            </div>

            {/* Publish Settings */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div>
                <Label htmlFor="isPublished" className="font-medium">Publish Event</Label>
                <p className="text-sm text-muted-foreground">
                  Published events will appear on the public events page
                </p>
              </div>
              <Switch
                id="isPublished"
                checked={formIsPublished}
                onCheckedChange={setFormIsPublished}
                data-testid="event-publish-toggle"
              />
            </div>

            {/* Featured Settings */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div>
                <Label htmlFor="isFeatured" className="font-medium">Feature on Home Page</Label>
                <p className="text-sm text-muted-foreground">
                  Featured events will be displayed prominently on the home page
                </p>
              </div>
              <Switch
                id="isFeatured"
                checked={formIsFeatured}
                onCheckedChange={setFormIsFeatured}
                data-testid="event-featured-toggle"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeForm} data-testid="cancel-event-button">
                Cancel
              </Button>
              <Button type="submit" disabled={createEventMutation.isPending || updateEventMutation.isPending} data-testid="save-event-button">
                {(createEventMutation.isPending || updateEventMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {selectedEvent ? 'Update' : 'Add'} Event
              </Button>
            </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
                {event.imageUrl && (
                  <div className="md:col-span-1">
                    <img 
                      src={event.imageUrl} 
                      alt={event.title}
                      className="w-full h-32 md:h-full object-cover"
                    />
                  </div>
                )}
                <div className={`${event.imageUrl ? 'md:col-span-3' : 'md:col-span-4'} p-6`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold">{event.title}</h3>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant={event.isPublished ? "default" : "secondary"}>
                          {event.isPublished ? "Published" : "Draft"}
                        </Badge>
                        {event.isFeatured && (
                          <Badge variant="outline" className="border-amber-500 text-amber-600">
                            Featured
                          </Badge>
                        )}
                        {event.registrationRequired && (
                          <Badge variant="outline">Registration Required</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(event)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(event.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(event.startDate).toLocaleDateString()}
                        {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    {event.websiteUrl && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link className="h-4 w-4" />
                        <a 
                          href={event.websiteUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Event Website
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground text-sm">{event.description}</p>
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
                This events page is currently disabled and will not appear on your live site. Enable it in the page settings to make it visible to visitors.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}