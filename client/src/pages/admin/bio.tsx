import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, Upload } from "lucide-react";
import type { BioSettings } from "@shared/schema";

export default function BioPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');
  const { toast } = useToast();

  // Load bio settings from API
  const { data: bioSettings, isLoading } = useQuery<any>({
    queryKey: ['/api/bio-settings']
  });

  // Bio settings state - initialize from API data
  const [heroData, setHeroData] = useState({
    headline: "Art That Moves You",
    description: "I don't just create pieces—I build experiences that spark curiosity, boldness, and reflection. This is more than art on a wall—it's energy you can feel every time you walk by.",
    backgroundImage: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&h=800"
  });

  const [ctaData, setCtaData] = useState({
    enabled: true,
    headline: "From Vision to Canvas—Made Just for You",
    description: "I don't just create pieces—I build experiences that spark curiosity, boldness, and reflection. This is more than art on a wall—it's energy you can feel every time you walk by.",
    buttonText: "Claim Your Artwork",
    buttonUrl: "/contact",
    backgroundImage: ""
  });

  // Update local state when API data loads
  useEffect(() => {
    if (bioSettings?.heroData) {
      setHeroData(bioSettings.heroData);
    }
    if (bioSettings?.ctaData) {
      setCtaData(bioSettings.ctaData);
    }
  }, [bioSettings]);

  const handleNavigate = (href: string) => {
    setLocation(href);
  };

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'live') {
      setLocation('/bio');
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (settings: { heroData: any; ctaData: any }) => {
      return await apiRequest('PUT', '/api/bio-settings', settings);
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your bio page settings have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bio-settings'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save bio settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ heroData, ctaData });
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar onNavigate={handleNavigate} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        
        <main className="flex-1 overflow-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto fade-in space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Bio Page</h1>
                <p className="text-muted-foreground mt-2">Manage your artist biography page content</p>
              </div>
              <Button 
                onClick={handleSave} 
                className="flex items-center gap-2" 
                data-testid="button-save-bio"
                disabled={saveMutation.isPending}
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            {/* Hero Section */}
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="hero-headline">Hero Headline</Label>
                  <Input
                    id="hero-headline"
                    value={heroData.headline}
                    onChange={(e) => setHeroData(prev => ({ ...prev, headline: e.target.value }))}
                    data-testid="input-hero-headline"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-description">Hero Descriptive Statement</Label>
                  <Textarea
                    id="hero-description"
                    value={heroData.description}
                    onChange={(e) => setHeroData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    data-testid="textarea-hero-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-bg-image">Hero Background Image</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Drag image here</p>
                    <p className="text-gray-500 text-sm">or click to upload</p>
                  </div>
                  <Input
                    id="hero-bg-image"
                    placeholder="Or enter image URL"
                    value={heroData.backgroundImage}
                    onChange={(e) => setHeroData(prev => ({ ...prev, backgroundImage: e.target.value }))}
                    className="mt-2"
                    data-testid="input-hero-bg-image"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Call to Action Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                <div>
                  <CardTitle>Call to Action Section</CardTitle>
                  <CardDescription>Add a compelling call-to-action to engage your visitors</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="cta-enabled" className="text-sm font-medium">Enable CTA Section</Label>
                  <Switch
                    id="cta-enabled"
                    checked={ctaData.enabled}
                    onCheckedChange={(checked) => setCtaData(prev => ({ ...prev, enabled: checked }))}
                    data-testid="switch-cta-enabled"
                  />
                </div>
              </CardHeader>
              <CardContent className={`space-y-6 ${!ctaData.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="space-y-2">
                  <Label htmlFor="cta-headline">CTA Headline</Label>
                  <Input
                    id="cta-headline"
                    value={ctaData.headline}
                    onChange={(e) => setCtaData(prev => ({ ...prev, headline: e.target.value }))}
                    data-testid="input-cta-headline"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cta-description">CTA Description</Label>
                  <Textarea
                    id="cta-description"
                    value={ctaData.description}
                    onChange={(e) => setCtaData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    data-testid="textarea-cta-description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="button-text">Button Text</Label>
                    <Input
                      id="button-text"
                      value={ctaData.buttonText}
                      onChange={(e) => setCtaData(prev => ({ ...prev, buttonText: e.target.value }))}
                      data-testid="input-button-text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="button-url">Button URL</Label>
                    <Input
                      id="button-url"
                      value={ctaData.buttonUrl}
                      onChange={(e) => setCtaData(prev => ({ ...prev, buttonUrl: e.target.value }))}
                      data-testid="input-button-url"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cta-bg-image">CTA Background Image (Optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Drag image here</p>
                    <p className="text-gray-500 text-sm">or click to upload</p>
                  </div>
                  <Input
                    id="cta-bg-image"
                    placeholder="Or enter image URL"
                    value={ctaData.backgroundImage}
                    onChange={(e) => setCtaData(prev => ({ ...prev, backgroundImage: e.target.value }))}
                    className="mt-2"
                    data-testid="input-cta-bg-image"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}