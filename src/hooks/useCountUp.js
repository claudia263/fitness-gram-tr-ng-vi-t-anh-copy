import { useEffect, useRef, useState } from "react";

// Count-up animation that runs once when `active` becomes true.
export function useCountUp(target, active, duration = 700, decimals = 0) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (!active) return;
    const t = Number(target) || 0;
    if (t === 0) {
      setValue(0);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(t);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(t * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setValue(t);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active, target, duration]);

  const factor = Math.pow(10, decimals);
  return decimals > 0 ? (Math.round(value * factor) / factor) : Math.round(value);
}