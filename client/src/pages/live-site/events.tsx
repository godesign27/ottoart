import { useState } from "react";
import { useLocation } from "wouter";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin } from "lucide-react";

export default function EventsPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('live');

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'admin') {
      setLocation('/admin');
    }
  };

  const events = [
    {
      id: 1,
      title: "Abstract Art Workshop",
      date: "March 15, 2024",
      time: "2:00 PM - 5:00 PM",
      location: "Studio Gallery, Chicago",
      description: "Join me for a hands-on workshop exploring abstract painting techniques. Learn about color theory, composition, and expressive mark-making in this interactive session.",
      image: "https://images.unsplash.com/photo-1456327102063-fb5054efe647?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
    },
    {
      id: 2,
      title: "Gallery Opening: New Works",
      date: "April 8, 2024",
      time: "6:00 PM - 9:00 PM",
      location: "River North Gallery, Chicago",
      description: "Opening reception for my latest collection of abstract paintings. Meet the artist, enjoy refreshments, and be among the first to see these new works.",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
    },
    {
      id: 3,
      title: "Artist Talk: Color & Emotion",
      date: "May 20, 2024",
      time: "7:00 PM - 8:30 PM",
      location: "Art Institute of Chicago",
      description: "A discussion on the role of color in contemporary abstract art and how emotional expression translates through visual elements.",
      image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Upcoming Events</h1>
            <p className="text-muted-foreground mt-2">Join me at these upcoming exhibitions and workshops</p>
          </div>

          <div className="space-y-6">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                    <div className="md:col-span-1">
                      <img 
                        src={event.image} 
                        alt={event.title}
                        className="w-full h-48 md:h-full object-cover"
                      />
                    </div>
                    <div className="md:col-span-2 p-6">
                      <h2 className="text-xl font-semibold text-foreground mb-3">{event.title}</h2>
                      
                      <div className="flex flex-col gap-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{event.date}</span>
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
                      
                      <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}