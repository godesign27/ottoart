import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

function send(body: Record<string, string>) {
  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {});
  } catch {
    // Tracking must never affect the page.
  }
}

/** Counts an artwork opened without leaving the page (an image popup) toward Top artworks. */
export function trackArtworkOpened(artworkId: string) {
  send({ path: window.location.pathname, artworkId });
}

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
    send({ path, referrer });
  }, [path]);

  return null;
}
