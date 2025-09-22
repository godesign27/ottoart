import { User as UserIcon, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

export function ProfileMenu() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled data-testid="profile-loading">
        <UserIcon className="h-5 w-5" />
      </Button>
    );
  }

  if (!isAuthenticated) {
    // Unauthenticated state - simple login/register menu
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
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // For now, just show the button for authenticated users
  // We'll add more functionality later
  return (
    <Button variant="ghost" size="sm" data-testid="button-profile-menu">
      <UserIcon className="h-5 w-5" />
    </Button>
  );
}