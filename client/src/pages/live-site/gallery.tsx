import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import type { GalleryItem } from "@shared/schema";

export default function GalleryPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('live');

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'admin') {
      setLocation('/admin');
    }
  };

  // Fetch gallery items from the API
  const { data: galleryItems = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['/api/gallery'],
    queryFn: () => fetch('/api/gallery').then(res => res.json())
  });

  // Show only published items and sort by order
  const publishedGalleryItems = galleryItems
    .filter(item => item.isPublished)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gallery</h1>
            <p className="text-muted-foreground mt-2">A collection of my recent works</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-lg text-muted-foreground">Loading gallery...</div>
            </div>
          ) : publishedGalleryItems.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No gallery items yet</h3>
                <p className="text-sm text-muted-foreground">Gallery items will appear here when they are published.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedGalleryItems.map((item) => (
                <div key={item.id} className="group cursor-pointer">
                  <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-end">
                      <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <h3 className="font-semibold">{item.title}</h3>
                        {item.year && <p className="text-sm">{item.year}</p>}
                        {item.medium && <p className="text-xs mt-1">{item.medium}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="font-medium text-foreground">{item.title}</h3>
                    <div className="space-y-1">
                      {item.year && <p className="text-sm text-muted-foreground">{item.year}</p>}
                      {item.medium && <p className="text-xs text-muted-foreground">{item.medium}</p>}
                      {item.dimensions && <p className="text-xs text-muted-foreground">{item.dimensions}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}