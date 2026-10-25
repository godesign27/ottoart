import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

// Blocks every /admin page unless the signed-in user has role "admin".
// The API enforces the same rule server-side; this keeps non-admins from
// seeing an empty admin shell full of failed requests.
export function AdminGate({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();
  const isAdminPath = location === "/admin" || location.startsWith("/admin/");

  if (!isAdminPath) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <GateMessage
        title="Sign in required"
        body="You need to sign in with an admin account to view this page."
        action={
          <Button asChild>
            <a href="/api/login">Sign in</a>
          </Button>
        }
      />
    );
  }

  if ((user as any)?.role !== "admin") {
    return (
      <GateMessage
        title="Admins only"
        body="Your account doesn't have access to the admin area."
        action={
          <Button asChild variant="outline">
            <a href="/">Back to the site</a>
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}

function GateMessage({ title, body, action }: { title: string; body: string; action: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-sm text-center space-y-4" data-testid="admin-gate">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{body}</p>
        <div>{action}</div>
      </div>
    </div>
  );
}
