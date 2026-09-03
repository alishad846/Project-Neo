import { useEffect, useRef, useState } from "react";

// A lightweight scroll-reveal: fades/slides an element in the first time it
// crosses the viewport, then leaves it alone. Deliberately subtle (short
// distance, short duration) to match the "sketchy, not bouncy" motion brief.
// No-ops entirely under prefers-reduced-motion — the element is just visible.
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}
