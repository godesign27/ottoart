import { useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  FileText, 
  Settings,
  Star,
  ChevronDown,
  ChevronRight,
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
    title: "Categories & Tags",
    icon: Tags,
    href: "/admin/categories",
    view: "categories"
  }
];

const pageItems = [
  {
    title: "Bio",
    href: "/admin/bio",
    active: true
  },
  {
    title: "Gallery", 
    href: "/admin/gallery",
    active: true
  },
  {
    title: "Events",
    href: "/admin/events",
    active: true
  },
  {
    title: "CV",
    href: "/admin/cv", 
    active: true
  },
  {
    title: "Contact",
    href: "/admin/contact",
    active: false
  }
];

interface AdminSidebarProps {
  onNavigate: (href: string) => void;
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [settingsExpanded, setSettingsExpanded] = useState(false);

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
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <img 
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150" 
            alt="Otto Art Profile" 
            className="h-12 w-12 rounded-full object-cover border-2 border-primary/20" 
          />
          <div>
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
              {pageItems.map((page) => (
                <div 
                  key={page.href}
                  className="w-full flex items-center justify-between px-3 py-1 text-sm text-foreground hover:bg-accent rounded-md cursor-pointer"
                  onClick={() => onNavigate(page.href)}
                  data-testid={`page-${page.title.toLowerCase()}`}
                >
                  {page.title}
                  <div className={`w-6 h-3 rounded-full relative ${page.active ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`w-2 h-2 bg-white rounded-full absolute top-0.5 shadow-sm ${page.active ? 'right-0.5' : 'left-0.5'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="mt-4">
            <Button
              variant="ghost"
              className="w-full justify-between text-foreground hover:bg-accent"
              onClick={() => setSettingsExpanded(!settingsExpanded)}
              data-testid="nav-settings"
            >
              <div className="flex items-center">
                <Settings className="mr-3 h-4 w-4" />
                Site Settings
              </div>
              {settingsExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            
            {settingsExpanded && (
              <div className="ml-6 mt-1 space-y-1">
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
            )}
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
