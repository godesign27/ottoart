import { useEffect, type RefObject } from "react";

/**
 * Section entrances: elements marked `data-reveal` rise and fade in once as they enter the screen,
 * staggered by `data-reveal-i` (0, 1, 2…). Content is only hidden after this script runs (the
 * `reveal-on` class), so nothing stays invisible if it fails. Reduced motion: shown at once, no travel.
 */
export function useReveal(root: RefObject<HTMLElement>, deps: unknown[] = []) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("is-in"));
      return;
    }
    el.classList.add("reveal-on");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0 });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
