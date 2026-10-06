// Thành phần giao diện dùng chung cho module CLB.
import { Music, Volleyball, Trophy, Hourglass, CircleCheck, CircleX, TriangleAlert, Check } from "lucide-react";
import { SPORTS, toneOf } from "@/lib/clubs/model";

export function SportIcon({ sport, className = "w-5 h-5" }) {
  const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (sport === "volleyball") return <Volleyball className={className} aria-hidden="true" />;
  if (sport === "dance") return <Music className={className} aria-hidden="true" />;
  if (sport === "other") return <Trophy className={className} aria-hidden="true" />;
  if (sport === "badminton")
    return (
      <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
        <circle cx="7" cy="17" r="3" />
        <path d="M9.2 14.8 16 4l4 4-10.8 6.8" />
        <path d="M12.5 9.5 16.5 13.5M14.5 7l3 3" />
      </svg>
    );
  if (sport === "football")
    return (
      <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="m12 7.5 4 2.9-1.5 4.7h-5L8 10.4z" />
        <path d="M12 3v4.5M16 10.4l4.3-1.4M14.5 15.1l2.7 3.7M9.5 15.1l-2.7 3.7M8 10.4 3.7 9" />
      </svg>
    );
  if (sport === "bjj")
    return (
      <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
        <path d="M2 10h20v4H2z" />
        <path d="m10 14-3 7M14 14l3 7M10 10l2 2 2-2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3v18M5.6 5.6c3 2.6 3 10.2 0 12.8M18.4 5.6c-3 2.6-3 10.2 0 12.8" />
    </svg>
  );
}

export function ClubChip({ club }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-semibold ${toneOf(club).chip}`}>
      <SportIcon sport={club.sport} className="w-3.5 h-3.5" />
      {club.name}
    </span>
  );
}

const STATUS = {
  pending: { label: "Chờ HR duyệt", icon: Hourglass, cls: "bg-amber-100 text-amber-800" },
  approved: { label: "Đã duyệt", icon: CircleCheck, cls: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Bị từ chối", icon: CircleX, cls: "bg-rose-100 text-rose-800" },
  missing: { label: "Thiếu minh chứng", icon: TriangleAlert, cls: "bg-slate-200 text-slate-700" },
};

export function StatusPill({ status }) {
  const m = STATUS[status];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {m.label}
    </span>
  );
}

export function CheckChip({ check }) {
  if (!check?.label) return null;
  return check.ok ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
      <Check className="w-3 h-3" aria-hidden="true" /> {check.label}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
      <TriangleAlert className="w-3 h-3" aria-hidden="true" /> {check.label}
    </span>
  );
}

export function PageHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center" style={{ background: "#26275D", color: "#F9DD0E" }}>
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// Nút dạng chip bật/tắt (bộ lọc, chế độ xem)
export const chipCls = (active) =>
  `inline-flex items-center gap-1.5 rounded-xl px-3 h-9 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy ${
    active ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-[rgba(38,39,93,0.12)] hover:bg-navy-soft"
  }`;

export const sportLabel = (sport) => SPORTS[sport]?.label || "Môn khác";
