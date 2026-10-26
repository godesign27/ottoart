import type { ReactNode } from "react";
import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

// Distinguish a missing session from a signed-in account the server rejects.
export function AccessBoundary({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { error, isPending } = useQuery<User>({
    queryKey: ["/api/me"],
    enabled: isLoaded && isSignedIn,
  });
  if (!isLoaded || (isSignedIn && isPending)) {
    return <div className="p-8" role="status">Loading your account...</div>;
  }
  if (isSignedIn && error) {
    return <main className="p-8" role="alert"><h1>Account access unavailable</h1><p>{error.message}</p><a href="/">Return home</a></main>;
  }
  return <>{children}</>;
}
