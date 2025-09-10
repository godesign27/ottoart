import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PageSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Calendar, Clock, MapPin, EyeOff, Save, Eye } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  imageUrl?: string;
  isPublished: boolean;
  registrationRequired: boolean;
}

export function EventsManager() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  // Fetch page settings
  const { data: pageSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/page-settings', 'events'],
    queryFn: () => fetch('/api/page-settings/events').then(res => res.json()) as Promise<PageSettings>
  });

  // Mutation for updating page settings
  const updatePageSettingsMutation = useMutation({
    mutationFn: (enabled: boolean) => 
      apiRequest('/api/page-settings/events', {
        method: 'PUT',
        body: { enabled }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/page-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/page-settings', 'events'] });
    }
  });

  // Mock data - in real app this would come from API
  const mockEvents: Event[] = [
    {
      id: "1",
      title: "Abstract Art Workshop",
      description: "Join me for a hands-on workshop exploring abstract painting techniques. Learn about color theory, composition, and expressive mark-making in this interactive session.",
      date: "2024-03-15",
      time: "14:00-17:00",
      location: "Studio Gallery, Chicago",
      imageUrl: "https://images.unsplash.com/photo-1456327102063-fb5054efe647?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
      isPublished: true,
      registrationRequired: true
    },
    {
      id: "2",
      title: "Gallery Opening: New Works",
      description: "Opening reception for my latest collection of abstract paintings. Meet the artist, enjoy refreshments, and be among the first to see these new works.",
      date: "2024-04-08",
      time: "18:00-21:00",
      location: "River North Gallery, Chicago",
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
      isPublished: true,
      registrationRequired: false
    },
    {
      id: "3",
      title: "Artist Talk: Color & Emotion",
      description: "A discussion on the role of color in contemporary abstract art and how emotional expression translates through visual elements.",
      date: "2024-05-20",
      time: "19:00-20:30",
      location: "Art Institute of Chicago",
      isPublished: false,
      registrationRequired: true
    }
  ];

  const { data: events = mockEvents, isLoading } = useQuery({
    queryKey: ['/api/events'],
    queryFn: () => Promise.resolve(mockEvents)
  });

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      // Implementation for delete
      console.log('Delete event:', id);
    }
  };

  const handleSave = () => {
    // Implementation for save
    setIsEditing(false);
    setSelectedEvent(null);
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

      <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2 mb-6">
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                defaultValue={selectedEvent?.title}
                placeholder="Enter event title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                defaultValue={selectedEvent?.description}
                placeholder="Describe your event"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  defaultValue={selectedEvent?.date}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  defaultValue={selectedEvent?.time}
                  placeholder="e.g., 14:00-17:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  defaultValue={selectedEvent?.location}
                  placeholder="Enter venue location"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {selectedEvent ? 'Update' : 'Add'} Event
              </Button>
            </div>
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
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant={event.isPublished ? "default" : "secondary"}>
                          {event.isPublished ? "Published" : "Draft"}
                        </Badge>
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
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
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