import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, ShoppingCart } from "lucide-react";
import type { PageSettings, CartItem } from "@shared/schema";

interface LiveSiteNavigationProps {
  viewMode?: 'admin' | 'live';
  onViewModeChange?: (mode: 'admin' | 'live') => void;
}

export function LiveSiteNavigation({ viewMode = 'live', onViewModeChange }: LiveSiteNavigationProps) {
  const [location] = useLocation();

  // Fetch page settings
  const { data: pageSettings = [] } = useQuery({
    queryKey: ['/api/page-settings'],
    queryFn: () => fetch('/api/page-settings').then(res => res.json()) as Promise<PageSettings[]>
  });

  // Fetch cart items for badge count
  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ['/api/cart']
  });

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const getPageEnabled = (page: string) => {
    const setting = pageSettings.find(p => p.page === page);
    return setting?.enabled ?? true;
  };

  // Static navigation items (always shown)
  const staticNavItems = [
    { href: "/", label: "Home" },
    { href: "/shop-all", label: "Shop All" },
    { href: "/originals", label: "Originals" },
    { href: "/prints", label: "Prints" },
    { href: "/accessories", label: "Accessories" }
  ];

  // Page-based navigation items (filtered by page settings)
  const pageNavItems = [
    { href: "/bio", label: "Bio", page: "bio" },
    { href: "/gallery", label: "Gallery", page: "gallery" },
    { href: "/art-wall", label: "Art Wall", page: "gallery" }, // Link with Gallery page setting
    { href: "/events", label: "Events", page: "events" },
    { href: "/cv", label: "CV", page: "cv" }
  ].filter(item => getPageEnabled(item.page));

  // Contact is always last
  const contactNavItem = { href: "/contact", label: "Contact" };

  // Combine all navigation items
  const navItems = [...staticNavItems, ...pageNavItems, contactNavItem];

  return (
    <nav className="h-16 border-b border-border bg-background px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-8">
        <Link href="/" className="text-xl font-bold text-foreground" data-testid="logo">
          Otto Art
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={`nav-link transition-colors ${
                location === item.href 
                  ? 'text-primary font-medium' 
                  : 'text-foreground hover:text-primary'
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Link href="/checkout">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground relative" 
            data-testid="button-cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-0">
                {cartItemCount}
              </Badge>
            )}
          </Button>
        </Link>


        {onViewModeChange && (
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'admin' ? 'default' : 'ghost'}
              className={viewMode === 'admin' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}
              onClick={() => onViewModeChange('admin')}
              data-testid="admin-tab-live"
            >
              Studio Admin
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'live' ? 'default' : 'ghost'}
              className={viewMode === 'live' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}
              onClick={() => onViewModeChange('live')}
              data-testid="live-tab-live"
            >
              Live Site
            </Button>
          </div>
        )}

        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground" 
          data-testid="user-button-live"
        >
          <User className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  );
}