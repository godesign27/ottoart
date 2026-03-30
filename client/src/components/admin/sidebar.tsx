import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PageSettings } from "@shared/schema";
import { 
  LayoutDashboard, 
  Package, 
  Users,
  ShoppingCart,
  UserCheck,
  MessageSquare,
  Tags, 
  FileText, 
  Settings,
  Star,
  User,
  Building,
  Palette,
  Share2,
  Home,
  UserCircle,
  ImageIcon,
  Calendar,
  FileTextIcon,
  Mail,
  Layers,
  ClipboardList,
  ScanLine,
  Award
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
    title: "Subscriptions",
    icon: UserCheck,
    href: "/admin/subscriptions",
    view: "subscriptions"
  },
  {
    title: "Messages",
    icon: MessageSquare,
    href: "/admin/messages",
    view: "messages"
  },
  {
    title: "Commissions",
    icon: Palette,
    href: "/admin/commissions",
    view: "commissions"
  },
  {
    title: "Mail Club",
    icon: Mail,
    href: "/admin/mail-club",
    view: "mail-club"
  },
  {
    title: "Boards",
    icon: ClipboardList,
    href: "/admin/boards",
    view: "boards"
  },
  {
    title: "POS Art Shows",
    icon: ScanLine,
    href: "/admin/art-shows",
    view: "art-shows"
  },
  {
    title: "Certificates",
    icon: Award,
    href: "/admin/certificates",
    view: "certificates"
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
    page: "home",
    icon: Home
  },
  {
    title: "Bio",
    href: "/admin/bio",
    page: "bio",
    icon: UserCircle
  },
  {
    title: "Gallery", 
    href: "/admin/gallery",
    page: "gallery",
    icon: ImageIcon
  },
  {
    title: "Events",
    href: "/admin/events",
    page: "events",
    icon: Calendar
  },
  {
    title: "CV",
    href: "/admin/cv", 
    page: "cv",
    icon: FileTextIcon
  },
  {
    title: "Contact",
    href: "/admin/contact",
    page: "contact",
    icon: Mail
  }
];

interface AdminSidebarProps {
  onNavigate: (href: string) => void;
  isCollapsed?: boolean;
  isMobileMenuOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ onNavigate, isCollapsed = false, isMobileMenuOpen = false, onClose }: AdminSidebarProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [profileImage, setProfileImage] = useState("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150");
  const [artistName, setArtistName] = useState("Otto Art");

  // Fetch site settings to get the saved profile image
  const { data: siteSettings } = useQuery<any[]>({
    queryKey: ['/api/site-settings'],
    queryFn: () => fetch('/api/site-settings').then(res => res.json())
  });

  // Update profile image and name from site settings
  useEffect(() => {
    if (siteSettings && siteSettings.length > 0) {
      const profileImageSetting = siteSettings.find(setting => setting.key === 'artist_profileImage');
      const artistNameSetting = siteSettings.find(setting => setting.key === 'artist_artistName');
      
      if (profileImageSetting?.value) {
        setProfileImage(profileImageSetting.value);
      }
      if (artistNameSetting?.value) {
        setArtistName(artistNameSetting.value);
      }
    }
  }, [siteSettings]);

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
    },
    {
      title: "Tech Stack",
      href: "/admin/settings/tech-stack",
      icon: Layers
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={onClose}
          data-testid="mobile-menu-overlay"
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`admin-sidebar bg-card border-r border-border flex flex-col shadow-sm transition-all duration-200 fixed left-0 top-0 bottom-0 z-50 ${
          isMobileMenuOpen 
            ? 'w-64 translate-x-0' 
            : 'w-64 -translate-x-full md:translate-x-0'
        } ${
          isCollapsed ? 'md:w-16' : 'md:w-64'
        }`}
        id="mobile-sidebar"
        role={isMobileMenuOpen ? "dialog" : undefined}
        aria-modal={isMobileMenuOpen ? "true" : undefined}
        aria-label={isMobileMenuOpen ? "Navigation menu" : undefined}
      >
        {/* User Profile Section */}
        <div className={`px-6 py-8 border-b border-border transition-all duration-200 ${
          isCollapsed ? 'md:px-2' : 'md:px-6'
        }`}>
          <div className="flex flex-col items-center space-y-3">
            <img 
              src={profileImage} 
              alt="Otto Art Profile" 
              className={`rounded-full object-cover border-2 border-primary/20 transition-all duration-200 ${
                isCollapsed ? 'h-8 w-8 md:h-10 md:w-10' : 'h-16 w-16 md:h-24 md:w-24'
              }`} 
            />
            {(!isCollapsed || isMobileMenuOpen) && (
              <div className="text-center">
                <h2 className="font-semibold text-foreground text-sm md:text-base">{artistName}</h2>
                <p className="text-xs md:text-sm text-muted-foreground">Artist & Creator</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || location.startsWith(item.href + '/');
              
              return isCollapsed && !isMobileMenuOpen ? (
                <TooltipProvider key={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={`w-full transition-all duration-200 justify-center px-2 ${
                          isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
                        }`}
                        onClick={() => {
                          onNavigate(item.href);
                          if (isMobileMenuOpen && onClose) onClose();
                        }}
                        data-testid={`nav-${item.view}`}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full transition-all duration-200 justify-start ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
                  }`}
                  onClick={() => {
                    onNavigate(item.href);
                    if (isMobileMenuOpen && onClose) onClose();
                  }}
                  data-testid={`nav-${item.view}`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  <span className="transition-opacity duration-200">{item.title}</span>
                </Button>
              );
            })}

            {/* Pages Section */}
            <div className="space-y-1 mt-6">
              {(!isCollapsed || isMobileMenuOpen) && (
                <div className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground">
                  <FileText className="mr-3 h-4 w-4" />
                  Pages
                </div>
              )}
              {isCollapsed && !isMobileMenuOpen && (
                <div className="flex justify-center py-2" title="Pages">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className={`space-y-1 ${isCollapsed && !isMobileMenuOpen ? '' : 'ml-6'}`}>
                {pageItems.map((page) => {
                  const isEnabled = getPageEnabled(page.page);
                  return isCollapsed && !isMobileMenuOpen ? (
                    <TooltipProvider key={page.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="w-full flex items-center justify-center rounded-md cursor-pointer transition-all duration-200 px-2 py-2 text-xs hover:bg-accent text-foreground"
                            onClick={() => {
                              onNavigate(page.href);
                              if (isMobileMenuOpen && onClose) onClose();
                            }}
                            data-testid={`page-${page.title.toLowerCase()}`}
                          >
                            <page.icon className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{page.title} ({isEnabled ? 'Enabled' : 'Disabled'})</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <div 
                      key={page.href}
                      className="w-full flex items-center justify-between rounded-md cursor-pointer transition-all duration-200 px-3 py-1 text-sm hover:bg-accent text-foreground"
                      onClick={() => {
                        onNavigate(page.href);
                        if (isMobileMenuOpen && onClose) onClose();
                      }}
                      data-testid={`page-${page.title.toLowerCase()}`}
                    >
                      <span>{page.title}</span>
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
              {(!isCollapsed || isMobileMenuOpen) && (
                <div className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground">
                  <Settings className="mr-3 h-4 w-4" />
                  Site Settings
                </div>
              )}
              {isCollapsed && !isMobileMenuOpen && (
                <div className="flex justify-center py-2" title="Site Settings">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className={`space-y-1 ${isCollapsed && !isMobileMenuOpen ? '' : 'ml-6'}`}>
                {settingsItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return isCollapsed && !isMobileMenuOpen ? (
                    <TooltipProvider key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className={`w-full text-sm transition-all duration-200 justify-center px-2 ${
                              isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            }`}
                            onClick={() => {
                              onNavigate(item.href);
                              if (isMobileMenuOpen && onClose) onClose();
                            }}
                            data-testid={`nav-settings-${item.title.toLowerCase().replace(' ', '-')}`}
                          >
                            <Icon className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Button
                      key={item.href}
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full text-sm transition-all duration-200 justify-start ${
                        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                      onClick={() => {
                        onNavigate(item.href);
                        if (isMobileMenuOpen && onClose) onClose();
                      }}
                      data-testid={`nav-settings-${item.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <Icon className="h-3 w-3 mr-3" />
                      <span className="transition-opacity duration-200">{item.title}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Dark Mode Toggle */}
        <div className={`p-4 border-t border-border transition-all duration-200 ${
          isCollapsed && !isMobileMenuOpen ? 'px-2' : 'px-4'
        }`}>
          <div className={`flex items-center ${
            isCollapsed && !isMobileMenuOpen ? 'justify-center' : 'justify-between'
          }`}>
            {isCollapsed && !isMobileMenuOpen ? (
              <div className="flex flex-col items-center space-y-2" title="Dark Mode Toggle">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                </svg>
                <Switch 
                  checked={theme === 'dark'} 
                  onCheckedChange={toggleTheme}
                  data-testid="theme-toggle"
                  className="scale-75"
                />
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}