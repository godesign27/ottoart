import { User as UserIcon, Heart, ShoppingBag, Settings, LogOut, LogIn, UserPlus, Moon, Sun, LayoutDashboard } from "lucide-react";
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
    // Unauthenticated state with improved UI
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-profile-menu">
            <UserIcon className="h-5 w-5" />
            <span className="hidden md:inline-block text-sm font-medium">Sign In</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="pb-3">
            <div className="text-sm font-normal text-muted-foreground">
              Sign in to access favorites, orders, and more
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <div className="p-2 space-y-2">
            <a href="/api/login" className="block" data-testid="menu-login">
              <Button className="w-full justify-start gap-2" variant="default">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </a>
            
            <a href="/api/login" className="block" data-testid="menu-register">
              <Button className="w-full justify-start gap-2" variant="outline">
                <UserPlus className="h-4 w-4" />
                Create Account
              </Button>
            </a>
          </div>

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

  // Authenticated state - properly typed user data
  const userData = user as any;
  const fullName = userData?.firstName && userData?.lastName 
    ? `${userData.firstName} ${userData.lastName}` 
    : userData?.firstName || userData?.email?.split('@')[0] || 'User';
  
  const userInitials = userData?.firstName && userData?.lastName
    ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase()
    : userData?.firstName?.[0]?.toUpperCase() || userData?.email?.[0]?.toUpperCase() || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" data-testid="button-profile-menu">
          <Avatar className="h-7 w-7">
            <AvatarImage 
              src={userData?.profileImageUrl || undefined} 
              alt={fullName} 
            />
            <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block text-sm font-medium max-w-[120px] truncate">
            {fullName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={userData?.profileImageUrl || undefined} 
                alt={fullName} 
              />
              <AvatarFallback className="text-sm font-medium bg-primary text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{fullName}</div>
              <div className="text-xs text-muted-foreground truncate">{userData?.email}</div>
              {userData?.role === 'admin' && (
                <div className="text-xs font-medium text-primary mt-0.5">Admin</div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {userData?.role === 'admin' && (
          <>
            <DropdownMenuItem asChild data-testid="menu-admin">
              <Link href="/admin">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
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
          <a href="/api/logout">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}