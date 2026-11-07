import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import type { PageSettings, User as AppUser } from "@shared/schema";

export type ToggleablePage = PageSettings["page"];

/**
 * Whether a page switched on/off in Admin > Pages should render for this visitor.
 * A page with no saved setting is on. While it's off, admins still see it (with a notice) and everyone else doesn't.
 */
export function usePageAccess(page: ToggleablePage) {
  const { data: pageSettings, isLoading: isLoadingSettings } = useQuery<PageSettings[]>({ queryKey: ["/api/page-settings"] });
  const isEnabled = pageSettings?.find((p) => p.page === page)?.enabled ?? true;
  const { isSignedIn, isLoaded: isUserLoaded } = useUser();
  const { data: localUser, isLoading: isLoadingUser } = useQuery<AppUser>({ queryKey: ["/api/me"], enabled: !!isSignedIn });
  const isAdmin = localUser?.role === "admin";
  // Only wait for the sign-in check when the page is off, so an admin doesn't see "not available" flash first.
  const isDeciding = !isEnabled && (!isUserLoaded || (!!isSignedIn && isLoadingUser));
  return {
    isEnabled,
    isAdmin,
    isDeciding,
    canView: isEnabled || isAdmin,
    showAdminNotice: !isLoadingSettings && !isEnabled && isAdmin,
  };
}

/** For menus: is this page switched on? (No saved setting counts as on.) */
export function usePageEnabled() {
  const { data: pageSettings = [] } = useQuery<PageSettings[]>({ queryKey: ["/api/page-settings"] });
  return (page: string) => pageSettings.find((p) => p.page === page)?.enabled ?? true;
}
