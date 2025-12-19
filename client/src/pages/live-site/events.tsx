import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Event } from "@shared/schema";

export default function EventsPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('live');

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events/published'],
  });

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'admin') {
      setLocation('/admin');
    }
  };

  const formatDate = (dateStr: string, endDateStr?: string | null) => {
    const startDate = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const formattedStart = startDate.toLocaleDateString('en-US', options);
    
    if (endDateStr) {
      const endDate = new Date(endDateStr);
      const formattedEnd = endDate.toLocaleDateString('en-US', options);
      return `${formattedStart} - ${formattedEnd}`;
    }
    return formattedStart;
  };

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Upcoming Events</h1>
            <p className="text-muted-foreground mt-2">Join me at these upcoming exhibitions and workshops</p>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                      <div className="md:col-span-1">
                        <Skeleton className="w-full h-48 md:h-full" />
                      </div>
                      <div className="md:col-span-2 p-6 space-y-4">
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No Upcoming Events</h2>
              <p className="text-muted-foreground">Check back soon for new exhibitions and workshops.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow" data-testid={`event-card-${event.id}`}>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                      {event.imageUrl && (
                        <div className="md:col-span-1">
                          <img 
                            src={event.imageUrl} 
                            alt={event.title}
                            className="w-full h-48 md:h-full object-cover"
                          />
                        </div>
                      )}
                      <div className={`${event.imageUrl ? 'md:col-span-2' : 'md:col-span-3'} p-6`}>
                        <h2 className="text-xl font-semibold text-foreground mb-3">{event.title}</h2>
                        
                        <div className="flex flex-col gap-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(event.startDate, event.endDate)}</span>
                          </div>
                          {event.time && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{event.time}</span>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        
                        {event.description && (
                          <p className="text-muted-foreground leading-relaxed mb-4">{event.description}</p>
                        )}

                        {event.websiteUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={event.websiteUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Learn More
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}