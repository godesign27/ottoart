import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Palette, Upload, Eye } from "lucide-react";

export function ThemeSettings() {
  const [formData, setFormData] = useState({
    siteName: "Otto Art",
    primaryColor: "#3b82f6",
    secondaryColor: "#64748b",
    accentColor: "#f59e0b",
    backgroundColor: "#ffffff",
    textColor: "#0f172a",
    darkMode: true,
    customLogo: "",
    favicon: "",
    fontFamily: "Inter",
    headerLayout: "centered",
    footerEnabled: true,
    customCSS: ""
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log('Saving theme settings:', formData);
    // Implementation for saving settings
  };

  const colorPresets = [
    { name: "Ocean Blue", primary: "#3b82f6", secondary: "#64748b", accent: "#06b6d4" },
    { name: "Forest Green", primary: "#10b981", secondary: "#6b7280", accent: "#fbbf24" },
    { name: "Sunset Orange", primary: "#f97316", secondary: "#6b7280", accent: "#ec4899" },
    { name: "Royal Purple", primary: "#8b5cf6", secondary: "#6b7280", accent: "#06b6d4" },
    { name: "Monochrome", primary: "#000000", secondary: "#6b7280", accent: "#f59e0b" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Theme Settings</h1>
        <p className="text-muted-foreground">Customize the appearance and branding of your site</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Site Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Site Branding
            </CardTitle>
            <CardDescription>Logo, name, and visual identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={formData.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Upload your logo</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Favicon</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Upload favicon (32x32px)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Scheme */}
        <Card>
          <CardHeader>
            <CardTitle>Color Scheme</CardTitle>
            <CardDescription>Customize your site's color palette</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="flex-1"
                  />
                  <div 
                    className="w-10 h-10 rounded border border-border"
                    style={{ backgroundColor: formData.primaryColor }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    className="flex-1"
                  />
                  <div 
                    className="w-10 h-10 rounded border border-border"
                    style={{ backgroundColor: formData.secondaryColor }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    value={formData.accentColor}
                    onChange={(e) => handleInputChange('accentColor', e.target.value)}
                    className="flex-1"
                  />
                  <div 
                    className="w-10 h-10 rounded border border-border"
                    style={{ backgroundColor: formData.accentColor }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="backgroundColor"
                    value={formData.backgroundColor}
                    onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                    className="flex-1"
                  />
                  <div 
                    className="w-10 h-10 rounded border border-border"
                    style={{ backgroundColor: formData.backgroundColor }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color Presets</Label>
              <div className="grid grid-cols-1 gap-2">
                {colorPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      handleInputChange('primaryColor', preset.primary);
                      handleInputChange('secondaryColor', preset.secondary);
                      handleInputChange('accentColor', preset.accent);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: preset.primary }}
                        ></div>
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: preset.secondary }}
                        ></div>
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: preset.accent }}
                        ></div>
                      </div>
                      <span className="text-sm">{preset.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layout Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Layout Settings</CardTitle>
            <CardDescription>Configure site layout and structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font Family</Label>
              <Input
                id="fontFamily"
                value={formData.fontFamily}
                onChange={(e) => handleInputChange('fontFamily', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode Support</Label>
                <p className="text-sm text-muted-foreground">Enable dark/light theme toggle</p>
              </div>
              <Switch
                checked={formData.darkMode}
                onCheckedChange={(checked) => handleInputChange('darkMode', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Footer Enabled</Label>
                <p className="text-sm text-muted-foreground">Show footer on all pages</p>
              </div>
              <Switch
                checked={formData.footerEnabled}
                onCheckedChange={(checked) => handleInputChange('footerEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Custom CSS */}
        <Card>
          <CardHeader>
            <CardTitle>Custom CSS</CardTitle>
            <CardDescription>Add custom styles to your site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customCSS">Custom CSS Code</Label>
              <textarea
                id="customCSS"
                value={formData.customCSS}
                onChange={(e) => handleInputChange('customCSS', e.target.value)}
                className="w-full h-32 p-3 text-sm font-mono border border-border rounded-md bg-background"
                placeholder="/* Add your custom CSS here */"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview Changes
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}