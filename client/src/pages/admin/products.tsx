import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { ProductGrid } from "@/components/admin/product-grid";

export default function AdminProducts() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    }
    return false;
  });

  const handleNavigate = (href: string) => {
    setLocation(href);
  };

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'live') {
      setLocation('/');
    }
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSidebarToggle = () => {
    const newCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsed);
    localStorage.setItem('admin-sidebar-collapsed', newCollapsed.toString());
  };

  // Handle mobile menu body scroll lock
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar 
        onNavigate={handleNavigate} 
        isCollapsed={isSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ${
        isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        <AdminHeader 
          viewMode={viewMode} 
          onViewModeChange={handleViewModeChange}
          onMenuToggle={handleMobileMenuToggle}
          isMobileMenuOpen={isMobileMenuOpen}
          onSidebarToggle={handleSidebarToggle}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        
        <main className="flex-1 overflow-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto fade-in">
            <ProductGrid />
          </div>
        </main>
      </div>
    </div>
  );
}
