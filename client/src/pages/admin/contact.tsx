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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save } from "lucide-react";
import type { ContactSettings } from "@shared/schema";

export default function ContactPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');
  const { toast } = useToast();

  // Load contact settings from API
  const { data: contactSettings, isLoading } = useQuery<any>({
    queryKey: ['/api/contact-settings']
  });

  // Contact settings state - initialize from API data
  const [getInTouchText, setGetInTouchText] = useState(
    "I'd love to hear from you! Whether you're interested in commissioning a piece, purchasing artwork, or collaborating on a project, please don't hesitate to reach out."
  );
  
  const [contactInfo, setContactInfo] = useState({
    email: "hello@ottoart.com",
    phone: "(555) 123-4567",
    address: "123 Artist Lane, Chicago, IL 60601"
  });
  
  const [studioHours, setStudioHours] = useState({
    monday: "9:00 AM - 6:00 PM",
    tuesday: "9:00 AM - 6:00 PM",
    wednesday: "9:00 AM - 6:00 PM",
    thursday: "9:00 AM - 6:00 PM",
    friday: "9:00 AM - 6:00 PM",
    saturday: "10:00 AM - 4:00 PM",
    sunday: "By appointment only"
  });
  
  const [commissionsText, setCommissionsText] = useState(
    "I accept commissioned work and am always excited to discuss custom pieces. Please include details about your vision, preferred size, timeline, and budget. I typically respond to inquiries within 24-48 hours."
  );

  // Update local state when API data loads
  useEffect(() => {
    if (contactSettings?.getInTouchText) {
      setGetInTouchText(contactSettings.getInTouchText);
    }
    if (contactSettings?.contactInfo) {
      setContactInfo(contactSettings.contactInfo);
    }
    if (contactSettings?.studioHours) {
      setStudioHours(contactSettings.studioHours);
    }
    if (contactSettings?.commissionsText) {
      setCommissionsText(contactSettings.commissionsText);
    }
  }, [contactSettings]);

  const handleNavigate = (href: string) => {
    setLocation(href);
  };

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'live') {
      setLocation('/contact');
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (settings: { getInTouchText: string; contactInfo: any; studioHours: any; commissionsText: string }) => {
      return await apiRequest('PUT', '/api/contact-settings', settings);
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your contact page settings have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contact-settings'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save contact settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ getInTouchText, contactInfo, studioHours, commissionsText });
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
                <h1 className="text-3xl font-bold text-foreground">Contact Page</h1>
                <p className="text-muted-foreground mt-2">Manage your contact information and form settings</p>
              </div>
              <Button 
                onClick={handleSave} 
                className="flex items-center gap-2" 
                data-testid="button-save-contact"
                disabled={saveMutation.isPending}
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            {/* Get In Touch Section */}
            <Card>
              <CardHeader>
                <CardTitle>Get In Touch Section</CardTitle>
                <CardDescription>The introductory text that appears at the top of your contact page</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="get-in-touch">Get In Touch Text</Label>
                  <Textarea
                    id="get-in-touch"
                    value={getInTouchText}
                    onChange={(e) => setGetInTouchText(e.target.value)}
                    rows={4}
                    data-testid="textarea-get-in-touch"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information Section */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Your email, phone, and studio address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email Address</Label>
                  <Input
                    id="contact-email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    data-testid="input-contact-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Phone Number</Label>
                  <Input
                    id="contact-phone"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    data-testid="input-contact-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-address">Studio Address</Label>
                  <Input
                    id="contact-address"
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, address: e.target.value }))}
                    data-testid="input-contact-address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Studio Hours Section */}
            <Card>
              <CardHeader>
                <CardTitle>Studio Hours</CardTitle>
                <CardDescription>Set your availability for each day of the week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(studioHours).map(([day, hours]) => (
                  <div key={day} className="space-y-2">
                    <Label htmlFor={`hours-${day}`} className="capitalize">{day}</Label>
                    <Input
                      id={`hours-${day}`}
                      value={hours}
                      onChange={(e) => setStudioHours(prev => ({ ...prev, [day]: e.target.value }))}
                      placeholder="e.g., 9:00 AM - 6:00 PM or Closed"
                      data-testid={`input-hours-${day}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Commissions & Inquiries Section */}
            <Card>
              <CardHeader>
                <CardTitle>Commissions & Inquiries</CardTitle>
                <CardDescription>Information about your commission process and what clients should include</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="commissions-text">Commissions Text</Label>
                  <Textarea
                    id="commissions-text"
                    value={commissionsText}
                    onChange={(e) => setCommissionsText(e.target.value)}
                    rows={6}
                    data-testid="textarea-commissions-text"
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