import { useEffect, useRef } from "react";
import gsap from "gsap";

export function Sticker({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
    const ref = useRef(null);
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const tween = gsap.to(ref.current, { y: -15, rotation: 5, duration: 2 + Math.random(), yoyo: true, repeat: -1, ease: 'sine.inOut', delay });
        return () => { tween.kill(); };
    }, [delay]);
    return (
        <div ref={ref} className={`absolute z-10 flex items-center justify-center rounded-full border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${className}`}>
            {children}
        </div>
    );
}
