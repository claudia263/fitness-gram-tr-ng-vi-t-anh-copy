import { motion, useReducedMotion } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";
import { formatAge } from "@/lib/fitness";
import { NUTRITION_ADVICE } from "@/lib/healthAdvice";

export default function GrowthCard({ anthro, student, delay = 0.7, className = "" }) {
  const reduce = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1];
  const anim = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
    : { initial: { opacity: 0, y: 25, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.6, ease, delay } };

  const bmi = anthro?.bmi;
  const bmiDisplay = useCountUp(bmi != null ? bmi : 0, bmi != null && !reduce, 900, 2);
  const status = anthro?.nutritional_status || "Chờ dữ liệu tham chiếu WHO";
  const zScore = anthro?.bmi_for_age_zscore;
  const ageLabel = anthro?.age_months != null ? formatAge(anthro.age_months) : null;
  const statusStyle = NUTRITION_ADVICE[status] || NUTRITION_ADVICE["Chờ dữ liệu tham chiếu WHO"];

  return (
    <motion.div {...anim} className={`fg-card p-5 sm:p-7 ${className}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#F9DD0E", color: "#26275D" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3v18M7 7h6l3 3 3-3h2" />
            <path d="M7 14h6l3 3 3-3h2" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-navy text-base sm:text-lg">Tăng trưởng & Thể trạng</h3>
          <p className="text-xs text-muted-foreground">Chiều cao, cân nặng, BMI và dinh dưỡng</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
        <Metric label="Chiều cao" value={anthro?.height_cm} unit="cm" />
        <Metric label="Cân nặng" value={anthro?.weight_kg} unit="kg" />
        <div className="col-span-2 sm:col-span-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">BMI</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-extrabold text-navy tabular-nums">
              {bmi != null ? bmiDisplay.toFixed(2) : "--"}
            </span>
          </div>
          {ageLabel && <div className="text-xs text-muted-foreground mt-1">Tuổi lúc đo: {ageLabel}</div>}
        </div>
      </div>

      <div className="mt-5 pt-5 border-t" style={{ borderColor: "rgba(38,39,93,0.08)" }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-navy">Tình trạng dinh dưỡng:</span>
          <span
            className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold"
            style={{ background: statusStyle.bg, color: statusStyle.color }}
          >
            {status}
            {zScore != null && ` · Z-score ${zScore > 0 ? "+" : ""}${zScore.toFixed(2)}`}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          Đánh giá BMI-for-age theo WHO Growth Reference 2007 (z-score nội suy từ bảng SD chuẩn WHO).
        </p>
      </div>
    </motion.div>
  );
}

function Metric({ label, value, unit }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl sm:text-3xl font-extrabold text-navy tabular-nums">{value ?? "--"}</span>
        {value != null && <span className="text-sm font-semibold text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}