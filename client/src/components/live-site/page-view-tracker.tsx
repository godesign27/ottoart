import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

// Records each page a visitor opens, for Admin › Analytics. The server decides what counts (it skips the admin,
// sign-in, bots and your own visits) and never stores an IP address. Sends nothing on admin pages.
export function PageViewTracker() {
  const [path] = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (path.startsWith("/admin")) return;
    // Only the first page of a visit has a meaningful outside referrer; later ones are inside the site.
    const referrer = first.current ? document.referrer : "";
    first.current = false;
    try {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, referrer }),
        keepalive: true,
        credentials: "same-origin",
      }).catch(() => {});
    } catch {
      // Tracking must never affect the page.
    }
  }, [path]);

  return null;
}
