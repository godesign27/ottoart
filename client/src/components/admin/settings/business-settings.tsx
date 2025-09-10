import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Building, CreditCard, Truck } from "lucide-react";

export function BusinessSettings() {
  const [formData, setFormData] = useState({
    businessName: "Otto Art Studio",
    taxId: "XX-XXXXXXX",
    address: "123 Artist Lane",
    city: "Chicago",
    state: "IL",
    zipCode: "60601",
    country: "United States",
    currency: "USD",
    taxRate: "8.25",
    shippingEnabled: true,
    localPickup: true,
    internationalShipping: false,
    freeShippingThreshold: "50",
    standardShippingRate: "15",
    expeditedShippingRate: "25"
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log('Saving business settings:', formData);
    // Implementation for saving settings
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Business Settings</h1>
        <p className="text-muted-foreground">Configure your business information and e-commerce settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>Legal business details and address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID / EIN</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                placeholder="XX-XXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Financial Settings
            </CardTitle>
            <CardDescription>Currency and tax configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                placeholder="USD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                value={formData.taxRate}
                onChange={(e) => handleInputChange('taxRate', e.target.value)}
                placeholder="8.25"
              />
            </div>
          </CardContent>
        </Card>

        {/* Shipping Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping Settings
            </CardTitle>
            <CardDescription>Configure shipping options and rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Shipping</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to have items shipped</p>
                </div>
                <Switch
                  checked={formData.shippingEnabled}
                  onCheckedChange={(checked) => handleInputChange('shippingEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Local Pickup</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to pick up items</p>
                </div>
                <Switch
                  checked={formData.localPickup}
                  onCheckedChange={(checked) => handleInputChange('localPickup', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>International Shipping</Label>
                  <p className="text-sm text-muted-foreground">Ship to international addresses</p>
                </div>
                <Switch
                  checked={formData.internationalShipping}
                  onCheckedChange={(checked) => handleInputChange('internationalShipping', checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="freeShippingThreshold">Free Shipping Threshold ($)</Label>
                <Input
                  id="freeShippingThreshold"
                  value={formData.freeShippingThreshold}
                  onChange={(e) => handleInputChange('freeShippingThreshold', e.target.value)}
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="standardShippingRate">Standard Shipping Rate ($)</Label>
                <Input
                  id="standardShippingRate"
                  value={formData.standardShippingRate}
                  onChange={(e) => handleInputChange('standardShippingRate', e.target.value)}
                  placeholder="15"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expeditedShippingRate">Expedited Shipping Rate ($)</Label>
                <Input
                  id="expeditedShippingRate"
                  value={formData.expeditedShippingRate}
                  onChange={(e) => handleInputChange('expeditedShippingRate', e.target.value)}
                  placeholder="25"
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
    </div>
  );
}