import { useState } from "react";
import { useLocation } from "wouter";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";

export default function GalleryPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('live');

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'admin') {
      setLocation('/admin');
    }
  };

  const galleryImages = [
    { 
      id: 1, 
      title: "Abstract Composition 1", 
      image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      year: "2024"
    },
    { 
      id: 2, 
      title: "Urban Rhythms", 
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      year: "2023"
    },
    { 
      id: 3, 
      title: "Color Study", 
      image: "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      year: "2024"
    },
    { 
      id: 4, 
      title: "Vibrant Forms", 
      image: "https://images.unsplash.com/photo-1594736797933-d0c6dc309633?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      year: "2023"
    },
    { 
      id: 5, 
      title: "Emotional Landscape", 
      image: "https://images.unsplash.com/photo-1582201942988-eb80be9b45fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      year: "2024"
    },
    { 
      id: 6, 
      title: "Digital Dreams", 
      image: "https://images.unsplash.com/photo-1577083288073-40892c0860ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      year: "2023"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gallery</h1>
            <p className="text-muted-foreground mt-2">A collection of my recent works</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((item) => (
              <div key={item.id} className="group cursor-pointer">
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-end">
                    <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm">{item.year}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.year}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}