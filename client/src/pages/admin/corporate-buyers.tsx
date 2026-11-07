import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ExternalLink, EyeOff } from "lucide-react";
import type { PageSettings } from "@shared/schema";

const PAGE = "corporate-buyers";

export default function AdminCorporateBuyersPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    }
    return false;
  });
  const { toast } = useToast();

  // The list, not /api/page-settings/:page: there's no row until the first save, and a missing row means on.
  const { data: pageSettings, isLoading } = useQuery<PageSettings[]>({
    queryKey: ['/api/page-settings'],
  });
  const isEnabled = pageSettings?.find(p => p.page === PAGE)?.enabled ?? true;

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => apiRequest('PUT', `/api/page-settings/${PAGE}`, { enabled }),
    onSuccess: (_data, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['/api/page-settings'] });
      toast({
        title: enabled ? "Page turned on" : "Page turned off",
        description: enabled
          ? "Corporate Buyers is back on your site and in the footer."
          : "Corporate Buyers is hidden from visitors and removed from the footer.",
      });
    },
    onError: () => {
      toast({
        title: "Couldn't save",
        description: "The page setting didn't change. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'live') setLocation('/corporate-buyers');
  };

  const handleSidebarToggle = () => {
    const newCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsed);
    localStorage.setItem('admin-sidebar-collapsed', newCollapsed.toString());
  };

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar
        onNavigate={setLocation}
        isCollapsed={isSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ${
        isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        <AdminHeader
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          onSidebarToggle={handleSidebarToggle}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main className="flex-1 overflow-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto fade-in space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Corporate Buyers Page</h1>
                <p className="text-muted-foreground mt-2">The page for businesses buying art for offices, hotels and other spaces</p>
              </div>
              <Button asChild variant="outline" className="flex items-center gap-2">
                <Link href="/corporate-buyers" data-testid="link-view-corporate-page">
                  <ExternalLink className="h-4 w-4" />
                  View page
                </Link>
              </Button>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Page Settings
                      {!isLoading && (
                        <Badge variant={isEnabled ? "default" : "secondary"} data-testid="badge-corporate-status">
                          {isEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>When it's off, the page is hidden from visitors and its footer links are removed</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="corporate-enabled">Enable this page</Label>
                    <Switch
                      id="corporate-enabled"
                      checked={isEnabled}
                      onCheckedChange={(checked) => toggleMutation.mutate(checked)}
                      disabled={isLoading || toggleMutation.isPending}
                      data-testid="switch-corporate-enabled"
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>

            {!isLoading && !isEnabled && (
              <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-5 w-5 text-orange-600" />
                    <p className="text-orange-800 dark:text-orange-200">
                      This page is off. Visitors who open its link see a "page isn't available" message with links to Contact and Shop All. You can still view it while signed in as an admin.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Page content</CardTitle>
                <CardDescription>The words and images on this page are set in the site's code. Ask for a change and it can be made there.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
