import { Button } from "@/components/ui/button";
import { Bell, ExternalLink, User } from "lucide-react";

interface AdminHeaderProps {
  viewMode: 'admin' | 'live';
  onViewModeChange: (mode: 'admin' | 'live') => void;
}

export function AdminHeader({ viewMode, onViewModeChange }: AdminHeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-foreground">Otto Art Studio</h1>
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
            Studio Admin
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'live' ? 'default' : 'ghost'}
            className={viewMode === 'live' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}
            onClick={() => onViewModeChange('live')}
            data-testid="live-tab"
          >
            Live Site
          </Button>
        </div>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          data-testid="notifications-button"
        >
          <ExternalLink className="h-5 w-5" />
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
