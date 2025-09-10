import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Search, User } from "lucide-react";

interface LiveSiteNavigationProps {
  viewMode: 'admin' | 'live';
  onViewModeChange: (mode: 'admin' | 'live') => void;
}

export function LiveSiteNavigation({ viewMode, onViewModeChange }: LiveSiteNavigationProps) {
  const navItems = [
    { href: "/", label: "Home", active: true },
    { href: "/shop", label: "Shop All" },
    { href: "/originals", label: "Originals" },
    { href: "/prints", label: "Prints" },
    { href: "/bio", label: "Bio" },
    { href: "/gallery", label: "Gallery" },
    { href: "/events", label: "Events" }
  ];

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
              className={`nav-link ${item.active ? 'active text-primary font-medium' : 'text-foreground hover:text-primary'}`}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" data-testid="search-button">
          <Search className="h-5 w-5" />
        </Button>

        <Button data-testid="contact-button">
          Contact
        </Button>

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

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" data-testid="user-button-live">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  );
}
