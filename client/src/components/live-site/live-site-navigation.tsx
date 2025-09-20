import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, ShoppingCart, Menu, X } from "lucide-react";
import type { PageSettings, CartItem } from "@shared/schema";

interface LiveSiteNavigationProps {
  viewMode?: 'admin' | 'live';
  onViewModeChange?: (mode: 'admin' | 'live') => void;
}

export function LiveSiteNavigation({ 
  viewMode = 'live', 
  onViewModeChange
}: LiveSiteNavigationProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { href: "/events", label: "Events", page: "events" },
    { href: "/cv", label: "CV", page: "cv" }
  ].filter(item => getPageEnabled(item.page));

  // Contact is always last
  const contactNavItem = { href: "/contact", label: "Contact" };

  // Combine all navigation items
  const navItems = [...staticNavItems, ...pageNavItems, contactNavItem];

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
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
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={handleMobileMenuClose}
          data-testid="mobile-menu-overlay"
        />
      )}

      {/* Mobile Sidebar */}
      <div 
        className={`fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border z-50 transform transition-transform duration-200 md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        id="mobile-navigation"
        role={isMobileMenuOpen ? "dialog" : undefined}
        aria-modal={isMobileMenuOpen ? "true" : undefined}
        aria-label={isMobileMenuOpen ? "Mobile navigation menu" : undefined}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <Link href="/" className="text-xl font-bold text-foreground" onClick={handleMobileMenuClose}>
            Otto Art
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMobileMenuClose}
            data-testid="mobile-menu-close"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Navigation Items */}
        <div className="px-6 py-4 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={`block py-3 px-2 rounded-md transition-colors ${
                location === item.href 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-foreground hover:bg-muted hover:text-primary'
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase().replace(' ', '-')}`}
              onClick={handleMobileMenuClose}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile Actions */}
        <div className="px-6 py-4 border-t border-border mt-auto">
          <div className="space-y-3">
            <Link href="/checkout" onClick={handleMobileMenuClose}>
              <Button variant="outline" className="w-full justify-start" data-testid="mobile-cart-button">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart {cartItemCount > 0 && `(${cartItemCount})`}
              </Button>
            </Link>
            
            {onViewModeChange && (
              <div className="space-y-2">
                <Button
                  variant={viewMode === 'admin' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => {
                    onViewModeChange('admin');
                    handleMobileMenuClose();
                  }}
                  data-testid="mobile-admin-tab"
                >
                  Studio Admin
                </Button>
                <Button
                  variant={viewMode === 'live' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => {
                    onViewModeChange('live');
                    handleMobileMenuClose();
                  }}
                  data-testid="mobile-live-tab"
                >
                  Live Site
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="h-16 border-b border-border bg-background px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-8">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={handleMobileMenuToggle}
            data-testid="mobile-menu-toggle"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

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

        <div className="hidden md:flex items-center space-x-4">
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

        {/* Mobile-only Icons */}
        <div className="flex md:hidden items-center space-x-2">
          <Link href="/checkout">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground relative" 
              data-testid="mobile-cart-icon"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-0">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </nav>
    </>
  );
}