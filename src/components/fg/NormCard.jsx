import { statusInfo } from "@/lib/fitnessNorms";

// Màu badge theo 4 nhóm xếp loại: đạt chuẩn / cần cải thiện / nguy cơ sức khỏe / hoàn thành bài
const TONES = {
  green: { bg: "rgba(22, 163, 74, 0.12)", fg: "#15803D" },
  amber: { bg: "rgba(249, 221, 14, 0.32)", fg: "#8A6100" },
  red: { bg: "rgba(192, 57, 43, 0.12)", fg: "#C0392B" },
  grey: { bg: "#F4F5F8", fg: "#6B6E8F" },
};

export default function NormCard({ title, subtitle, value, unit, status, meta, note, tip, children }) {
  const info = statusInfo(status);
  const tone = TONES[info.tone] || TONES.grey;
  const showTip = tip && (status === "improve" || status === "risk");

  return (
    <div className="fg-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-navy text-base">{title}</h3>
          {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        <span
          className="shrink-0 max-w-[52%] text-[10px] font-bold uppercase tracking-wide leading-tight px-2.5 py-1 rounded-full text-center"
          style={{ background: tone.bg, color: tone.fg }}
        >
          {info.label}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-extrabold text-navy tabular-nums">{value}</span>
        {unit && <span className="text-sm font-semibold text-muted-foreground">{unit}</span>}
      </div>

      {children}

      {meta && <div className="text-xs text-muted-foreground leading-snug">{meta}</div>}
      {note && <div className="text-[11px] text-muted-foreground/80 leading-snug">{note}</div>}

      {showTip && (
        <div className="mt-auto rounded-xl px-3 py-2 text-xs font-medium leading-snug" style={{ background: "#FEF3B0", color: "#26275D" }}>
          {tip}
        </div>
      )}
    </div>
  );
}