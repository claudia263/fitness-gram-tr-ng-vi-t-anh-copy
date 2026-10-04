import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const SPRITE_URL =
  "https://base44.app/api/apps/6aa2ecca7110e8b5faae6a4b/files/mp/public/6aa2ecca7110e8b5faae6a4b/ce7562580_mascot_sprite.png";
const COLS = 8;
const ROWS = 5;
const FRAMES = 40;
const FPS = 10;

// Mascot animation from a sprite sheet (8 cols × 5 rows, 40 frames).
// Background sits directly on the sized box (width from className + aspect-ratio
// for height) so the frame always paints — no nested zero-height div.
export default function MascotSprite({ className = "", float = true }) {
  const reduce = useReducedMotion();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (reduce) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % FRAMES;
      setFrame(i);
    }, 1000 / FPS);
    return () => clearInterval(id);
  }, [reduce]);

  const col = frame % COLS;
  const row = Math.floor(frame / COLS);
  // For background-size > 100%, position % is relative to the overflow gap,
  // so 0%..100% maps across (COLS-1) frames.
  const bgX = (col / (COLS - 1)) * 100;
  const bgY = (row / (ROWS - 1)) * 100;

  return (
    <motion.div
      animate={reduce || !float ? {} : { y: [0, -6, 0] }}
      transition={reduce || !float ? {} : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      className={className}
      style={{
        willChange: "transform",
        aspectRatio: "512 / 286",
        backgroundImage: `url(${SPRITE_URL})`,
        backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
        backgroundPosition: `${bgX}% ${bgY}%`,
        backgroundRepeat: "no-repeat",
        minHeight: 120,
      }}
      role="img"
      aria-label="Sư tử mascot thể thao Trường Việt Anh"
    />
  );
}