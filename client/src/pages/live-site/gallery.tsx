import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Palette, ArrowRight, Eye } from "lucide-react";
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

          {/* Art Wall Simulator CTA */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800" data-testid="art-wall-cta-card">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Palette className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Try Our Virtual Art Wall Simulator
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    See how these artworks will look in your home! Choose from different room settings and visualize the perfect placement for any piece.
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>Multiple room backgrounds</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Palette className="w-4 h-4" />
                      <span>Drag & drop placement</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Link href="/art-wall" data-testid="button-try-art-wall">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Try Art Wall
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

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
      
      <Footer />
    </div>
  );
}