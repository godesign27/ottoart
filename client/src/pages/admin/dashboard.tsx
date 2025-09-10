import { useState } from "react";
import { useLocation } from "wouter";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { StatsGrid } from "@/components/admin/stats-grid";
import { RecentActivity } from "@/components/admin/recent-activity";
import { QuickActions } from "@/components/admin/quick-actions";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');

  const handleNavigate = (href: string) => {
    setLocation(href);
  };

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'live') {
      setLocation('/');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar onNavigate={handleNavigate} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        
        <main className="flex-1 overflow-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto space-y-6 fade-in">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
                <p className="text-muted-foreground">Welcome back! Here's what's happening with your art business.</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button data-testid="add-new-product-button">
                  Add New Product
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <StatsGrid />

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RecentActivity />
              <QuickActions />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
