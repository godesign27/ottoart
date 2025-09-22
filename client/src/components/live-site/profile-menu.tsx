import { User as UserIcon, Heart, ShoppingBag, Settings, LogOut, LogIn, UserPlus, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/use-theme";

export function ProfileMenu() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled data-testid="profile-loading">
        <UserIcon className="h-5 w-5" />
      </Button>
    );
  }

  if (!isAuthenticated) {
    // Unauthenticated state
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" data-testid="button-profile-menu">
            <UserIcon className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild data-testid="menu-login">
            <a href="/api/auth/login">
              <LogIn className="mr-2 h-4 w-4" />
              Log In
            </a>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild data-testid="menu-register">
            <a href="/api/auth/register">
              <UserPlus className="mr-2 h-4 w-4" />
              Register
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuItem data-testid="menu-theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? (
              <>
                <Moon className="mr-2 h-4 w-4" />
                Dark Mode
              </>
            ) : (
              <>
                <Sun className="mr-2 h-4 w-4" />
                Light Mode
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Authenticated state
  const userInitials = (user as any)?.name 
    ? (user as any).name.split(' ').map((n: string) => n[0]).join('').toUpperCase() 
    : (user as any)?.email?.[0]?.toUpperCase() || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" data-testid="button-profile-menu">
          <Avatar className="h-6 w-6">
            <AvatarImage src={(user as any)?.image || undefined} alt={(user as any)?.name || (user as any)?.email || 'User'} />
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div>
            <div className="font-medium">{(user as any)?.name || 'User'}</div>
            <div className="text-xs text-muted-foreground">{(user as any)?.email}</div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild data-testid="menu-profile">
          <Link href="/profile">
            <Settings className="mr-2 h-4 w-4" />
            Profile Settings
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild data-testid="menu-favorites">
          <Link href="/favorites">
            <Heart className="mr-2 h-4 w-4" />
            Favorites
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild data-testid="menu-orders">
          <Link href="/orders">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Orders
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuItem data-testid="menu-theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? (
            <>
              <Moon className="mr-2 h-4 w-4" />
              Dark Mode
            </>
          ) : (
            <>
              <Sun className="mr-2 h-4 w-4" />
              Light Mode
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild data-testid="menu-logout">
          <a href="/api/auth/logout">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}