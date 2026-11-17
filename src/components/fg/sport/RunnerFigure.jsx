import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

// Hình vận động viên (GIF) đổi sang tông xanh lá của MGIS. Có nút tạm dừng (hình chuyển động quá 5 giây phải dừng được);
// người dùng bật "giảm chuyển động" thì hiện sẵn khung hình tĩnh. Nền tối của ảnh hoà vào nền trang (mix-blend-mode: lighten) và mép ảnh mờ dần bằng mặt nạ.
const LOOK = { filter: "hue-rotate(-105deg) saturate(1.15) brightness(1.05)", mixBlendMode: "lighten", WebkitMaskImage: "radial-gradient(closest-side, #000 70%, transparent 100%)", maskImage: "radial-gradient(closest-side, #000 70%, transparent 100%)" };

export default function RunnerFigure({ src, className = "" }) {
  const reduce = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [paused, setPaused] = useState(reduce);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  const freeze = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !img.naturalWidth) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);
  };

  useEffect(() => {
    if (paused && loaded) freeze();
  }, [paused, loaded]);

  const toggle = () => {
    if (!paused) freeze();
    setPaused((p) => !p);
  };

  return (
    <div className={`relative ${className}`}>
      <img
        ref={imgRef}
        src={src}
        alt=""
        width="358"
        height="356"
        onLoad={() => setLoaded(true)}
        className={paused ? "pointer-events-none invisible absolute inset-0 h-full w-full object-contain" : "h-full w-full object-contain"}
        style={LOOK}
      />
      <canvas ref={canvasRef} aria-hidden="true" className={paused ? "h-full w-full object-contain" : "hidden"} style={LOOK} />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={paused}
        aria-label={paused ? "Phát hình chuyển động" : "Tạm dừng hình chuyển động"}
        className="absolute bottom-1 right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white hover:bg-black/50 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
