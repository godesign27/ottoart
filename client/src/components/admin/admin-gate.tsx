import type { ReactNode } from "react";
import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";

// Keeps non-admins from seeing an empty admin screen full of failed requests.
// This is only for the page: the server enforces the same rule on every admin route.
export function AdminGate({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const isAdminPath = location === "/admin" || location.startsWith("/admin/");
  const { data: account, isPending } = useQuery<User>({
    queryKey: ["/api/me"],
    enabled: isAdminPath && isLoaded && !!isSignedIn,
  });

  if (!isAdminPath) return <>{children}</>;
  if (!isLoaded || (isSignedIn && isPending)) {
    return <div className="p-8" role="status">Loading your account...</div>;
  }
  if (!isSignedIn) {
    return (
      <Message title="Sign in required" body="You need to sign in with an admin account to view this page.">
        <Button asChild><Link href="/sign-in">Sign in</Link></Button>
      </Message>
    );
  }
  if (account?.role !== "admin") {
    return (
      <Message title="Admins only" body="This account doesn't have access to the admin area.">
        <Button asChild variant="outline"><Link href="/">Back to the site</Link></Button>
      </Message>
    );
  }
  return <>{children}</>;
}

function Message({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-8" role="alert">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{body}</p>
        {children}
      </div>
    </main>
  );
}
