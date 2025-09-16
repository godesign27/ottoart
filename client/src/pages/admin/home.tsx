import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save, Eye, EyeOff, Upload, Image } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PageSettings } from "@shared/schema";

export default function AdminHomePage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');
  const [isPreview, setIsPreview] = useState(false);
  
  // Editable content state
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Welcome to Otto Art Studio\n\nDiscover unique contemporary artwork and connect with my creative journey. This is your gateway to exploring original paintings, limited edition prints, and exclusive artistic experiences."
  );
  const [featuredMessage, setFeaturedMessage] = useState(
    "## Featured Collections\n\nExplore my latest works and discover pieces that speak to your aesthetic vision. Each artwork tells a story and invites you to become part of its narrative."
  );
  const [heroImageUrl, setHeroImageUrl] = useState(
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
  );

  const handleNavigate = (href: string) => {
    setLocation(href);
  };

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'live') {
      setLocation('/');
    }
  };

  // Fetch page settings for home page
  const { data: pageSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/page-settings'],
    queryFn: () => fetch('/api/page-settings').then(res => res.json()) as Promise<PageSettings[]>
  });

  const homePageSettings = pageSettings?.find(p => p.page === 'home');
  const isEnabled = homePageSettings?.enabled ?? true;


  // Mutation for updating page settings
  const updatePageSettingsMutation = useMutation({
    mutationFn: (enabled: boolean) => 
      apiRequest('PUT', '/api/page-settings/home', { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/page-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/page-settings', 'home'] });
    }
  });

  const handleSave = () => {
    console.log('Saving home page content:', { welcomeMessage, featuredMessage, heroImageUrl });
    // TODO: Implement actual save functionality
  };

  const handlePageSave = () => {
    if (homePageSettings) {
      updatePageSettingsMutation.mutate(!homePageSettings.enabled);
    }
  };

  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  // Show loading state while any queries are loading
  if (isLoadingSettings) {
    return (
      <div className="flex h-screen bg-background">
        <AdminSidebar onNavigate={handleNavigate} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          
          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto">
              <div className="space-y-6">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-80 animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-6 bg-muted rounded w-20 animate-pulse"></div>
                    <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
                    <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
                  </div>
                </div>

                {/* Page Settings skeleton */}
                <div className="h-20 bg-muted rounded animate-pulse"></div>

                {/* Content Grid skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column skeleton */}
                  <div className="space-y-6">
                    <div className="h-80 bg-muted rounded animate-pulse"></div>
                  </div>

                  {/* Right Column skeleton */}
                  <div className="space-y-6">
                    <div className="h-60 bg-muted rounded animate-pulse"></div>
                    <div className="h-80 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar onNavigate={handleNavigate} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        
        <main className="flex-1 overflow-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto fade-in">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Home Page</h1>
                  <p className="text-muted-foreground">Manage your homepage content and hero image</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={isEnabled ? "default" : "secondary"}>
                      {isEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <Button onClick={togglePreview} variant="outline" className="flex items-center gap-2" data-testid="button-preview">
                    {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {isPreview ? 'Edit' : 'Preview'}
                  </Button>
                  <Button onClick={handleSave} className="flex items-center gap-2" data-testid="button-save">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>

              {/* Page Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Page Settings</CardTitle>
                      <CardDescription>Configure the visibility and content of your home page</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="home-enabled">Enable this page</Label>
                      <Switch
                        id="home-enabled"
                        checked={isEnabled}
                        onCheckedChange={() => handlePageSave()}
                        disabled={updatePageSettingsMutation.isPending}
                        data-testid="toggle-home-enabled"
                      />
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Hero Image Section */}
              <Card>
                <CardHeader>
                  <CardTitle>🖼️ Hero Image</CardTitle>
                  <CardDescription>Manage the main hero image displayed on your home page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Hero Image Preview */}
                  <div className="space-y-2">
                    <Label>Current Hero Image</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <img 
                        src={heroImageUrl} 
                        alt="Hero image preview" 
                        className="w-full h-48 object-cover" 
                        data-testid="hero-image-preview"
                      />
                    </div>
                  </div>

                  {/* Hero Image URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="hero-image-url">Hero Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="hero-image-url"
                        type="url"
                        placeholder="Enter image URL..."
                        value={heroImageUrl}
                        onChange={(e) => setHeroImageUrl(e.target.value)}
                        data-testid="input-hero-image-url"
                      />
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={() => setHeroImageUrl("https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600")}
                        data-testid="button-reset-hero-image"
                      >
                        <Image className="h-4 w-4" />
                        Reset
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enter a direct URL to an image. Recommended dimensions: 800x600px or larger.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Editable Content */}
              <Card>
                <CardHeader>
                  <CardTitle>✏️ Editable Content</CardTitle>
                  <CardDescription>Customize the content that appears on your home page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isPreview ? (
                    <div className="space-y-4">
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap">{welcomeMessage}</div>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap">{featuredMessage}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="welcome-message">Welcome Message</Label>
                        <Textarea
                          id="welcome-message"
                          placeholder="Enter your welcome message..."
                          value={welcomeMessage}
                          onChange={(e) => setWelcomeMessage(e.target.value)}
                          rows={4}
                          data-testid="input-welcome-message"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="featured-message">Featured Section</Label>
                        <Textarea
                          id="featured-message"
                          placeholder="Enter your featured section content (supports Markdown)..."
                          value={featuredMessage}
                          onChange={(e) => setFeaturedMessage(e.target.value)}
                          rows={4}
                          data-testid="input-featured-message"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Disabled page warning */}
              {!isEnabled && (
                <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-5 w-5 text-orange-600" />
                      <p className="text-orange-800 dark:text-orange-200">
                        This home page is currently disabled and will not appear on your live site. Enable it in the page settings to make it visible to visitors.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}