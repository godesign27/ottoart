import { useQuery } from "@tanstack/react-query";
import { ArtWallSimulator } from "@/components/live-site/art-wall-simulator";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Palette } from "lucide-react";
import type { Product } from "@shared/schema";

export function ArtWallPage() {
  // Fetch available products for the simulator
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" data-testid="link-back-home">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Gallery
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Palette className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Art Wall Simulator
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/gallery" data-testid="link-view-gallery">
                <Button variant="outline" size="sm">
                  Browse Artworks
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <ArtWallSimulator 
          products={products} 
          className="w-full"
          data-testid="main-art-wall-simulator"
        />
        
        {/* Additional Info Section */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Choose a Room</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select from our collection of realistic room backgrounds to match your space.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Add Artwork</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click on any artwork to place it on the wall. Drag to position it exactly where you want.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Customize & Save</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Adjust size and rotation to get the perfect look. Save or share your design when ready.
                </p>
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400">
                Need help choosing the perfect artwork? 
                <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                  Contact our art consultants
                </Link>
                {" "}for personalized recommendations.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}