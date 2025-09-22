import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/use-theme";
import type { User } from "@shared/schema";

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
          
          <DropdownMenuItem asChild>
            <a href="/api/login" data-testid="link-login">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </a>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <a href="/api/login" data-testid="link-register">
              <UserPlus className="mr-2 h-4 w-4" />
              Register
            </a>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Theme Toggle */}
          <DropdownMenuItem 
            onClick={(e) => {
              e.preventDefault();
              toggleTheme();
            }}
            data-testid="toggle-theme"
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              {theme === 'dark' ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </div>
            <Switch 
              checked={theme === 'dark'} 
              onCheckedChange={toggleTheme}
              className="ml-2 scale-75"
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Authenticated state - type cast the user
  const authenticatedUser = user as User;
  const displayName = authenticatedUser?.firstName 
    ? `${authenticatedUser.firstName} ${authenticatedUser.lastName || ''}`.trim() 
    : authenticatedUser?.email || 'User';
  
  const initials = authenticatedUser?.firstName 
    ? `${authenticatedUser.firstName[0]}${authenticatedUser.lastName?.[0] || ''}`.toUpperCase()
    : authenticatedUser?.email?.[0].toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-profile-menu">
          <Avatar className="h-8 w-8">
            <AvatarImage src={authenticatedUser?.profileImageUrl || ""} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {authenticatedUser?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/profile/settings" data-testid="link-profile-settings">
            <Settings className="mr-2 h-4 w-4" />
            Profile Settings
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/favorites" data-testid="link-favorites">
            <Heart className="mr-2 h-4 w-4" />
            Favorites
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/orders" data-testid="link-orders">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Orders
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Theme Toggle */}
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            toggleTheme();
          }}
          data-testid="toggle-theme"
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </div>
          <Switch 
            checked={theme === 'dark'} 
            onCheckedChange={toggleTheme}
            className="ml-2 scale-75"
          />
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <a href="/api/logout" data-testid="link-logout">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}