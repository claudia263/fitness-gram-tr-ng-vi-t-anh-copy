import { motion, useReducedMotion } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";
import { compareWithPrevious, formatDiff } from "@/lib/fitness";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const TEST_META = {
  pacer: { name: "PACER", subtitle: "Sức bền tim phổi", unit: "level", icon: "run", diffUnit: "level" },
  sit_and_reach: { name: "Sit & Reach", subtitle: "Độ linh hoạt", unit: "cm", icon: "stretch", diffUnit: "cm" },
  pushup: { name: "Push-up", subtitle: "Sức mạnh thân trên", unit: "lần", icon: "pushup", diffUnit: "lần" },
  plank: { name: "Plank", subtitle: "Sức bền Core", unit: "", icon: "plank", time: true, diffUnit: "giây" },
};

function TestIcon({ name, className }) {
  const common = { className, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  switch (name) {
    case "run":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="15" cy="5" r="2" fill="currentColor" stroke="none" />
          <path d="M13 9l-3 2 1.5 4-2.5 5" />
          <path d="M13 9l3 1.5 2-1" />
          <path d="M10 11l-3 1" />
        </svg>
      );
    case "stretch":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M3 12h18" />
          <path d="M6 12c0-3 2-5 6-5s6 2 6 5" />
          <circle cx="18" cy="7" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "pushup":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M3 18h18" />
          <path d="M5 18v-3l5-2 4 1 4 2v2" />
          <circle cx="18" cy="9" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "plank":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M3 15h18" />
          <path d="M5 15v-2h14v2" />
          <path d="M7 15v3M17 15v3" />
          <circle cx="19" cy="11" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

export default function FitnessCard({ testKey, current, previous, delay = 0, onOpen }) {
  const reduce = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1];
  const meta = TEST_META[testKey];

  const anim = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
    : { initial: { opacity: 0, y: 25, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.6, ease, delay } };

  const hasCurrent = current != null;
  const trend = compareWithPrevious(current, previous);
  const count = useCountUp(hasCurrent ? current : 0, hasCurrent && !reduce, 700, testKey === "sit_and_reach" ? 0 : 0);

  const displayValue = meta.time ? formatPlankDisplay(current) : (hasCurrent ? count : null);

  return (
    <motion.button
      {...anim}
      onClick={onOpen}
      type="button"
      className="fg-card fg-card-hover p-5 text-left w-full flex flex-col gap-3 min-h-[170px]"
    >
      <div className="flex items-start justify-between">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: "#F9DD0E", color: "#26275D" }}
        >
          <TestIcon name={meta.icon} className="w-6 h-6" />
        </div>
        {hasCurrent && (
          <span
            className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
            style={{ background: "#F4F5F8", color: "#6B6E8F" }}
          >
            Kết quả gần nhất
          </span>
        )}
      </div>

      <div>
        <div className="font-bold text-navy text-base">{meta.name}</div>
        <div className="text-xs text-muted-foreground">{meta.subtitle}</div>
      </div>

      <div className="mt-auto">
        {hasCurrent ? (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-navy tabular-nums">{displayValue}</span>
              {meta.unit && <span className="text-sm font-semibold text-muted-foreground">{meta.unit}</span>}
            </div>
            {trend && trend.dir !== "same" && previous != null && (
              <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold" style={{ color: trend.dir === "up" ? "#26275D" : "#C0392B" }}>
                {trend.dir === "up" ? <TrendingUp className="w-3.5 h-3.5" /> : trend.dir === "down" ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                <span>{formatDiff(trend.diff, meta.diffUnit)} so với kỳ trước</span>
              </div>
            )}
            {trend && trend.dir === "same" && previous != null && (
              <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <Minus className="w-3.5 h-3.5" />
                <span>Giữ nguyên so với kỳ trước</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">Chưa có kết quả</div>
        )}
      </div>
    </motion.button>
  );
}

function formatPlankDisplay(seconds) {
  if (seconds == null) return null;
  const s = Math.max(0, Math.floor(Number(seconds)));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}