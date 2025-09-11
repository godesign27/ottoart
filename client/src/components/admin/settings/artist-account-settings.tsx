import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, User } from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";

export function ArtistAccountSettings() {
  const [showImageUploader, setShowImageUploader] = useState(false);
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

  const handleSave = () => {
    console.log('Saving artist settings:', formData);
    // Implementation for saving settings
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
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Changes
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