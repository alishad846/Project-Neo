import { useEffect, useRef, useState } from "react";

/**
 * Attach the returned ref to a container. Once the container scrolls into view,
 * every `.reveal` element inside it (and the container itself, if it is one)
 * animates in with a gentle stagger. Respects reduced motion.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets: HTMLElement[] = [];
    if (el.classList.contains("reveal")) targets.push(el);
    el.querySelectorAll<HTMLElement>(".reveal").forEach((n) => targets.push(n));

    const revealAll = (stagger: boolean) => {
      targets.forEach((t, i) => {
        if (stagger) t.style.transitionDelay = `${Math.min(i, 8) * 70}ms`;
        t.classList.add("in");
      });
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealAll(false);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            revealAll(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);

    // Safety net: never leave content invisible if the observer never fires.
    const failsafe = window.setTimeout(() => revealAll(false), 2500);

    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [threshold]);
  return ref;
}

/** Track vertical scroll position (throttled to animation frames). */
export function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setY(window.scrollY);
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return y;
}
