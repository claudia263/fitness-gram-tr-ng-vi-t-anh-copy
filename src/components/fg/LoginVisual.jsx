import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Image } from "@/components/ui/image";
import MascotSprite from "@/components/fg/MascotSprite";

const EMBLEM_URL =
  "https://media.base44.com/images/public/6aa2ecca7110e8b5faae6a4b/8474eed90_LOGOVANG10x.png";

// Left visual panel for the login page — Navy background, sporty school illustration
export default function LoginVisual({ onLoginClick, formOpen = false, children }) {
  const reduce = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1];

  const fade = (delay, y = 20) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
      : { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease, delay } };

  return (
    <div
      className="absolute inset-0 overflow-y-auto flex flex-col justify-between p-6 sm:p-10 lg:p-14"
      style={{ background: "#26275D" }}
    >
      {/* Decorative background graphics */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {/* curved track */}
        <path d="M-50 560 Q300 420 650 600" stroke="rgba(249,221,14,0.18)" strokeWidth="2" fill="none" />
        <path d="M-50 600 Q300 460 650 640" stroke="rgba(255,255,255,0.10)" strokeWidth="2" fill="none" />
        {/* big faint circle */}
        <circle cx="470" cy="180" r="150" stroke="rgba(249,221,14,0.14)" strokeWidth="2" fill="none" />
        <circle cx="470" cy="180" r="110" stroke="rgba(255,255,255,0.07)" strokeWidth="2" fill="none" />
        {/* dots */}
        <circle cx="90" cy="160" r="4" fill="#F9DD0E" opacity="0.7" />
        <circle cx="140" cy="220" r="3" fill="#FFFFFF" opacity="0.5" />
        <circle cx="520" cy="520" r="4" fill="#F9DD0E" opacity="0.6" />
        <circle cx="70" cy="640" r="3" fill="#FFFFFF" opacity="0.4" />
      </svg>

      {/* Floating decorative chips */}
      {!reduce && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{ width: 14, height: 14, background: "#F9DD0E", top: "22%", left: "12%", opacity: 0.6 }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{ width: 10, height: 10, background: "#FFFFFF", top: "62%", left: "78%", opacity: 0.5 }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{ width: 8, height: 8, background: "#F9DD0E", top: "78%", left: "20%", opacity: 0.5 }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
          />
        </>
      )}

      {/* Top: logo */}
      <motion.div {...fade(0.1, -15)} className="relative z-10 flex justify-center">
        <div className="flex items-center gap-3">
          <div className="shrink-0" style={{ width: 64, height: 64 }}>
            <Image src={EMBLEM_URL} alt="Logo Trường Việt Anh" className="w-full h-full" fittingType="fit" />
          </div>
          <div className="leading-tight">
            <div className="font-extrabold text-white text-xl tracking-tight">FITNESS GRAM</div>
          </div>
        </div>
      </motion.div>

      {/* Middle: headline + illustration */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center gap-5 sm:gap-7 py-4 sm:py-6 lg:max-w-[60%] mx-auto">
        <motion.div {...fade(0.25, 25)} className="w-full">
          <h1 className="text-white font-extrabold leading-tight" style={{ fontSize: "clamp(1.5rem, 4.5vw, 3rem)" }}>
            Theo dõi hành trình<br />phát triển thể chất của con
          </h1>
        </motion.div>
        <motion.p
          {...fade(0.4, 20)}
          className="max-w-md text-sm sm:text-base leading-relaxed"
          style={{ color: "rgba(255,255,255,0.72)" }}
        >
          Mỗi chỉ số hôm nay là một bước tiến trên hành trình khỏe mạnh và trưởng thành của học sinh Việt Anh.
        </motion.p>

        {/* Lion mascot illustration */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: -50, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={reduce ? { duration: 0.2 } : { duration: 0.9, ease, delay: 0.5 }}
          className="relative flex items-center justify-center w-full"
        >
          {/* Yellow motion trail behind mascot */}
          <motion.svg
            initial={reduce ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduce ? { duration: 0.2 } : { duration: 0.6, ease, delay: 0.65 }}
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 320"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <path d="M30 250 Q200 140 380 230" stroke="#F9DD0E" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.55" />
            <path d="M55 272 Q200 180 360 252" stroke="#F9DD0E" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.3" />
          </motion.svg>

          {/* Mascot sprite animation */}
          <MascotSprite
            float={!reduce}
            className={`relative z-10 w-[80%] sm:w-[70%] lg:w-[68%] ${formOpen ? "max-w-[200px] sm:max-w-[240px] lg:max-w-[280px]" : "max-w-[360px] sm:max-w-[460px] lg:max-w-[560px]"}`}
          />
        </motion.div>

        {!formOpen && !children && (
          <motion.button
            {...fade(0.75, 20)}
            type="button"
            onClick={onLoginClick}
            className="fg-btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base"
          >
            Đăng nhập <ArrowRight className="w-5 h-5" />
          </motion.button>
        )}

        {children}
      </div>

      {/* Bottom badge */}
      <motion.div {...fade(0.6, 20)} className="relative z-10 flex items-center justify-center gap-3">
        <div className="h-1 w-10 rounded-full" style={{ background: "#F9DD0E" }} />
        <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
          Hành trình khỏe mạnh – Tương lai vững vàng
        </span>
      </motion.div>
    </div>
  );
}