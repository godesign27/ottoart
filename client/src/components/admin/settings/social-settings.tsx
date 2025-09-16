import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Share2, Eye, EyeOff } from "lucide-react";
import { FaInstagram, FaTwitter, FaFacebook, FaLinkedin, FaTiktok, FaYoutube, FaPinterest } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SocialSettings, InsertSocialSettings } from "@shared/schema";

export function SocialSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load social settings from API
  const { data: socialSettings, isLoading } = useQuery<SocialSettings>({
    queryKey: ['/api/social-settings']
  });

  const [formData, setFormData] = useState({
    instagram: "",
    twitter: "", 
    facebook: "",
    linkedin: "",
    youtube: "",
    tiktok: "",
    pinterest: "",
    showInHeader: true,
    showInFooter: true,
    openInNewTab: true,
    socialSharing: true,
    metaDescription: "",
    ogImage: "",
    twitterCard: "summary_large_image"
  });

  // Update form data when social settings load
  useEffect(() => {
    if (socialSettings) {
      setFormData({
        instagram: socialSettings.instagram || "",
        twitter: socialSettings.twitter || "",
        facebook: socialSettings.facebook || "",
        linkedin: socialSettings.linkedin || "",
        youtube: socialSettings.youtube || "",
        tiktok: socialSettings.tiktok || "",
        pinterest: socialSettings.pinterest || "",
        showInHeader: socialSettings.showInHeader ?? true,
        showInFooter: socialSettings.showInFooter ?? true,
        openInNewTab: socialSettings.openInNewTab ?? true,
        socialSharing: socialSettings.socialSharing ?? true,
        metaDescription: socialSettings.metaDescription || "",
        ogImage: socialSettings.ogImage || "",
        twitterCard: socialSettings.twitterCard || "summary_large_image"
      });
    }
  }, [socialSettings]);

  const [visiblePreviews, setVisiblePreviews] = useState<{[key: string]: boolean}>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePreview = (platform: string) => {
    setVisiblePreviews(prev => ({...prev, [platform]: !prev[platform]}));
  };

  const saveSocialSettings = useMutation({
    mutationFn: async (data: InsertSocialSettings) => {
      return await apiRequest('PUT', '/api/social-settings', data);
    },
    onSuccess: () => {
      toast({
        title: "Settings saved!",
        description: "Your social media settings have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social-settings'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSocialSettings.mutate(formData);
  };

  const socialPlatforms = [
    { key: 'instagram', name: 'Instagram', icon: FaInstagram, color: '#E4405F' },
    { key: 'twitter', name: 'Twitter / X', icon: FaTwitter, color: '#1DA1F2' },
    { key: 'facebook', name: 'Facebook', icon: FaFacebook, color: '#1877F2' },
    { key: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: '#0A66C2' },
    { key: 'youtube', name: 'YouTube', icon: FaYoutube, color: '#FF0000' },
    { key: 'tiktok', name: 'TikTok', icon: FaTiktok, color: '#000000' },
    { key: 'pinterest', name: 'Pinterest', icon: FaPinterest, color: '#BD081C' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Social Media Settings</h1>
        <p className="text-muted-foreground">Manage your social media presence and sharing options</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Social Media Links */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Social Media Links
            </CardTitle>
            <CardDescription>Add your social media profile URLs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socialPlatforms.map((platform) => {
                const Icon = platform.icon;
                const value = formData[platform.key as keyof typeof formData] as string;
                return (
                  <div key={platform.key} className="space-y-2">
                    <Label htmlFor={platform.key} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: platform.color }} />
                      {platform.name}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={platform.key}
                        value={value}
                        onChange={(e) => handleInputChange(platform.key, e.target.value)}
                        placeholder={`https://${platform.key}.com/yourprofile`}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePreview(platform.key)}
                        className="px-3"
                      >
                        {visiblePreviews[platform.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {visiblePreviews[platform.key] && value && (
                      <div className="p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color: platform.color }} />
                          <a 
                            href={value} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {value}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>Configure where social links appear</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show in Header</Label>
                <p className="text-sm text-muted-foreground">Display social icons in the site header</p>
              </div>
              <Switch
                checked={formData.showInHeader}
                onCheckedChange={(checked) => handleInputChange('showInHeader', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show in Footer</Label>
                <p className="text-sm text-muted-foreground">Display social icons in the site footer</p>
              </div>
              <Switch
                checked={formData.showInFooter}
                onCheckedChange={(checked) => handleInputChange('showInFooter', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Open in New Tab</Label>
                <p className="text-sm text-muted-foreground">Open social links in new browser tab</p>
              </div>
              <Switch
                checked={formData.openInNewTab}
                onCheckedChange={(checked) => handleInputChange('openInNewTab', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Social Sharing</Label>
                <p className="text-sm text-muted-foreground">Enable share buttons on content</p>
              </div>
              <Switch
                checked={formData.socialSharing}
                onCheckedChange={(checked) => handleInputChange('socialSharing', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO & Meta Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO & Meta Settings</CardTitle>
            <CardDescription>Optimize for social media sharing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                className="w-full h-20 p-3 text-sm border border-border rounded-md bg-background resize-none"
                placeholder="Brief description for social media previews..."
              />
              <p className="text-xs text-muted-foreground">Used for Open Graph and Twitter Card descriptions</p>
            </div>
            <div className="space-y-2">
              <Label>Open Graph Image</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <div className="text-muted-foreground">
                  <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p className="text-sm">Upload image for social media previews</p>
                  <p className="text-xs">Recommended: 1200x630px</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          className="flex items-center gap-2"
          disabled={saveSocialSettings.isPending}
          data-testid="button-save-social-settings"
        >
          <Save className="h-4 w-4" />
          {saveSocialSettings.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}