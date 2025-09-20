import { Button } from "@/components/ui/button";
import { Bell, ExternalLink, User, Settings, Eye, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface AdminHeaderProps {
  viewMode: 'admin' | 'live';
  onViewModeChange: (mode: 'admin' | 'live') => void;
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
}

export function AdminHeader({ viewMode, onViewModeChange, onMenuToggle, isMobileMenuOpen, onSidebarToggle, isSidebarCollapsed }: AdminHeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuToggle}
          data-testid="mobile-menu-toggle"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-sidebar"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-3">
          <h1 className="text-lg md:text-xl font-semibold text-foreground">Otto Art Studio</h1>
          {/* Desktop Sidebar Toggle */}
          {onSidebarToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={onSidebarToggle}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-pressed={isSidebarCollapsed}
              data-testid="sidebar-collapse-toggle"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* View Switcher */}
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            size="sm"
            variant={viewMode === 'admin' ? 'default' : 'ghost'}
            className={viewMode === 'admin' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}
            onClick={() => onViewModeChange('admin')}
            data-testid="admin-tab"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'live' ? 'default' : 'ghost'}
            className={viewMode === 'live' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}
            onClick={() => onViewModeChange('live')}
            data-testid="live-tab"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          data-testid="notifications-button"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          data-testid="user-button"
        >
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
