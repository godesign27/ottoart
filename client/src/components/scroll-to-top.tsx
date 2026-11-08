import { useLayoutEffect } from "react";
import { useLocation } from "wouter";

// Wouter keeps the scroll position between pages, so a link clicked at the foot of one page opens the next
// page at its foot too. Start every new page at the top; a link with #section still lands on that section.
// "instant" overrides the html { scroll-behavior: smooth } rule so the old page doesn't visibly scroll away.
export function ScrollToTop() {
  const [path] = useLocation();
  useLayoutEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (target) target.scrollIntoView({ behavior: "instant" as ScrollBehavior });
    else window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [path]);
  return null;
}
