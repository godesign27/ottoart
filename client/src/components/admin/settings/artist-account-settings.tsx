import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, User } from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function ArtistAccountSettings() {
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    artistName: "Otto Art",
    email: "hello@ottoart.com", 
    phone: "(555) 123-4567",
    bio: "Contemporary artist specializing in abstract paintings and mixed media works.",
    website: "https://ottoart.com",
    location: "Chicago, IL",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Mutation for saving artist profile settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Save each field as a separate site setting
      const savePromises = Object.entries(data).map(([key, value]) => 
        apiRequest('POST', `/api/site-settings/artist_${key}`, { value })
      );
      await Promise.all(savePromises);
      return data;
    },
    onSuccess: () => {
      setShowSuccessBanner(true);
      // Hide success banner after 5 seconds
      setTimeout(() => setShowSuccessBanner(false), 5000);
      toast({
        title: "Profile updated",
        description: "Your artist profile has been successfully saved.",
        variant: "default",
      });
      // Trigger a custom event to update the sidebar profile image
      window.dispatchEvent(new CustomEvent('profileImageUpdated', { detail: { profileImage: formData.profileImage } }));
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    console.log('Saving artist settings:', formData);
    saveSettingsMutation.mutate(formData);
  };

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, profileImage: imageUrl }));
    setShowImageUploader(false);
  };

  const handleUploadClick = () => {
    setShowImageUploader(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Artist Account Settings</h1>
        <p className="text-muted-foreground">Manage your personal artist information and profile</p>
      </div>

      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="w-full bg-green-500 text-white px-6 py-3 rounded-md flex items-center justify-between" data-testid="success-banner">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="font-medium">Profile successfully updated!</span>
          </div>
          <button 
            onClick={() => setShowSuccessBanner(false)}
            className="text-white hover:text-gray-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Image */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Image
            </CardTitle>
            <CardDescription>Your artist profile photo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <img 
                src={formData.profileImage} 
                alt="Artist Profile" 
                className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
              />
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleUploadClick}
                data-testid="upload-profile-image"
              >
                <Upload className="h-4 w-4" />
                Upload New Photo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your personal and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="artistName">Artist Name</Label>
                <Input
                  id="artistName"
                  value={formData.artistName}
                  onChange={(e) => handleInputChange('artistName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Artist Bio */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Artist Biography</CardTitle>
            <CardDescription>Tell your story and artistic journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={6}
                placeholder="Share your artistic background, influences, and journey..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>Manage your account password and security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          className="flex items-center gap-2" 
          disabled={saveSettingsMutation.isPending}
          data-testid="save-changes"
        >
          <Save className="h-4 w-4" />
          {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Image Uploader Modal */}
      {showImageUploader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Upload Profile Image</h3>
            <ImageUploader
              onImageUploaded={handleImageUpload}
              accept="image/*"
              maxFiles={1}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowImageUploader(false)}
                data-testid="cancel-upload"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}