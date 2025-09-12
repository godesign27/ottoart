import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { PageSettings } from "@shared/schema";
import { 
  LayoutDashboard, 
  Package, 
  Users,
  ShoppingCart,
  Tags, 
  FileText, 
  Settings,
  Star,
  User,
  Building,
  Palette,
  Share2
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
    view: "dashboard"
  },
  {
    title: "Product Listings",
    icon: Package,
    href: "/admin/products",
    view: "products"
  },
  {
    title: "Customers",
    icon: Users,
    href: "/admin/customers",
    view: "customers"
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    href: "/admin/orders",
    view: "orders"
  },
  {
    title: "Categories & Tags",
    icon: Tags,
    href: "/admin/categories",
    view: "categories"
  }
];

const pageItems = [
  {
    title: "Home",
    href: "/admin/home",
    page: "home"
  },
  {
    title: "Bio",
    href: "/admin/bio",
    page: "bio"
  },
  {
    title: "Gallery", 
    href: "/admin/gallery",
    page: "gallery"
  },
  {
    title: "Events",
    href: "/admin/events",
    page: "events"
  },
  {
    title: "CV",
    href: "/admin/cv", 
    page: "cv"
  },
  {
    title: "Contact",
    href: "/admin/contact",
    page: "contact"
  }
];

interface AdminSidebarProps {
  onNavigate: (href: string) => void;
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [profileImage, setProfileImage] = useState("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150");

  // Listen for profile image updates
  useEffect(() => {
    const handleProfileImageUpdate = (event: CustomEvent) => {
      if (event.detail?.profileImage) {
        setProfileImage(event.detail.profileImage);
      }
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
    };
  }, []);

  // Fetch page settings
  const { data: pageSettings = [] } = useQuery({
    queryKey: ['/api/page-settings'],
    queryFn: () => fetch('/api/page-settings').then(res => res.json()) as Promise<PageSettings[]>
  });

  const getPageEnabled = (page: string) => {
    const setting = pageSettings.find(p => p.page === page);
    return setting?.enabled ?? true;
  };

  const settingsItems = [
    {
      title: "Artist Account",
      href: "/admin/settings/artist",
      icon: User
    },
    {
      title: "Business",
      href: "/admin/settings/business", 
      icon: Building
    },
    {
      title: "Theme",
      href: "/admin/settings/theme",
      icon: Palette
    },
    {
      title: "Social Media",
      href: "/admin/settings/social",
      icon: Share2
    }
  ];

  return (
    <div className="admin-sidebar w-64 bg-card border-r border-border flex flex-col shadow-sm">
      {/* User Profile Section */}
      <div className="px-6 py-12 border-b border-border">
        <div className="flex flex-col items-center space-y-3">
          <img 
            src={profileImage} 
            alt="Otto Art Profile" 
            className="h-24 w-24 rounded-full object-cover border-2 border-primary/20" 
          />
          <div className="text-center">
            <h2 className="font-semibold text-foreground">Otto Art</h2>
            <p className="text-sm text-muted-foreground">Artist & Creator</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(item.href + '/');
            
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'}`}
                onClick={() => onNavigate(item.href)}
                data-testid={`nav-${item.view}`}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.title}
              </Button>
            );
          })}

          {/* Pages Section */}
          <div className="space-y-1 mt-6">
            <div className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground">
              <FileText className="mr-3 h-4 w-4" />
              Pages
            </div>
            <div className="ml-6 space-y-1">
              {pageItems.map((page) => {
                const isEnabled = getPageEnabled(page.page);
                return (
                  <div 
                    key={page.href}
                    className="w-full flex items-center justify-between px-3 py-1 text-sm text-foreground hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => onNavigate(page.href)}
                    data-testid={`page-${page.title.toLowerCase()}`}
                  >
                    {page.title}
                    <Badge variant={isEnabled ? "default" : "secondary"} className="text-xs">
                      {isEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Site Settings */}
          <div className="space-y-1 mt-6">
            <div className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground">
              <Settings className="mr-3 h-4 w-4" />
              Site Settings
            </div>
            <div className="ml-6 space-y-1">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start text-sm ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                    onClick={() => onNavigate(item.href)}
                    data-testid={`nav-settings-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <Icon className="mr-3 h-3 w-3" />
                    {item.title}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Dark Mode Toggle */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
            <span className="text-sm text-foreground">Dark Mode</span>
          </div>
          <Switch 
            checked={theme === 'dark'} 
            onCheckedChange={toggleTheme}
            data-testid="theme-toggle"
          />
        </div>
      </div>
    </div>
  );
}
