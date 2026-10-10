// Kết quả theo chuẩn Bộ GD&ĐT (QĐ 53) của một học sinh: từng bài + xếp loại chung, lần kiểm tra mới nhất.
import { Link } from "react-router-dom";
import { Award, ChevronRight } from "lucide-react";
import { MOET_LEVELS, evaluateMoet, formatThreshold, hasMoetData } from "@/lib/moetNorms";

const LEVEL_CLS = {
  tot: "bg-emerald-100 text-emerald-800",
  dat: "bg-amber-100 text-amber-800",
  chua_dat: "bg-rose-100 text-rose-800",
};

export function LevelPill({ level, large = false }) {
  if (!level) return <span className="text-xs text-muted-foreground">—</span>;
  return <span className={`inline-flex items-center rounded-full font-semibold ${large ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"} ${LEVEL_CLS[level]}`}>{MOET_LEVELS[level].label}</span>;
}

const fmtValue = (v) => (v == null ? "—" : Number(v).toLocaleString("vi-VN", { maximumFractionDigits: 2 }));

export default function MoetResultCard({ student, fitnessRows }) {
  const rows = (fitnessRows || []).filter(hasMoetData);
  const latest = rows[rows.length - 1];
  const ev = latest ? evaluateMoet({ sex: student.sex, birthDate: student.birth_date, testDate: latest.session?.test_date, result: latest }) : null;
  const shown = ev ? ev.tests.filter((t) => t.chosen || t.value != null) : [];

  return (
    <section className="fg-card p-5 sm:p-6" aria-labelledby="moet-title">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "#26275D", color: "#F9DD0E" }}>
            <Award className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 id="moet-title" className="font-bold text-navy">
              Theo chuẩn Bộ GD&ĐT
            </h3>
            <p className="text-xs text-muted-foreground">
              Quyết định 53/2008/QĐ-BGDĐT{latest?.session?.name ? ` · ${latest.session.name}` : ""}
              {ev?.age != null ? ` · ${ev.age} tuổi` : ""}
            </p>
          </div>
        </div>
        {ev && (
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Xếp loại thể lực</p>
            {ev.overall ? <LevelPill level={ev.overall} large /> : <p className="max-w-[260px] text-xs text-muted-foreground">{ev.missing}</p>}
          </div>
        )}
      </div>

      {!latest ? (
        <p className="rounded-xl px-4 py-6 text-center text-sm text-muted-foreground" style={{ background: "#F7F8FC" }}>
          Chưa có kết quả các bài kiểm tra của Bộ GD&ĐT (bật xa tại chỗ, chạy tuỳ sức 5 phút, nằm ngửa gập bụng, chạy 30m).
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shown.map((t) => (
            <li key={t.key} className="rounded-xl p-3" style={{ background: "#F7F8FC" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy">
                    {t.label}
                    {t.required && <span className="text-rose-600"> ★</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{t.ability}</p>
                </div>
                <LevelPill level={t.level} />
              </div>
              <p className="mt-1.5 flex items-baseline gap-1">
                <span className="text-xl font-extrabold tabular-nums text-navy">{fmtValue(t.value)}</span>
                <span className="text-xs font-semibold text-muted-foreground">{t.unit}</span>
              </p>
              {t.threshold && (
                <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                  Tốt {formatThreshold(t, t.threshold.good, "good")} · Đạt {formatThreshold(t, t.threshold.pass, "pass")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <Link to="/chuan-the-luc" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-navy hover:underline">
        Xem bảng tiêu chuẩn của Bộ (nam, nữ 6–20 tuổi) <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
