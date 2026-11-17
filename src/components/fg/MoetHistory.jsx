// Các đợt kiểm tra theo chuẩn Bộ GD&ĐT (QĐ 53) của một học sinh: mỗi đợt một dòng, kèm xếp loại và từng bài.
import { Award } from "lucide-react";
import { evaluateMoet, hasMoetData } from "@/lib/moetNorms";
import { sessionDateRange } from "@/lib/campus";
import { LevelPill } from "@/components/fg/MoetResultCard";

const fmtValue = (v) => (v == null ? "—" : Number(v).toLocaleString("vi-VN", { maximumFractionDigits: 2 }));

export default function MoetHistory({ student, fitnessRows }) {
  const rows = (fitnessRows || [])
    .filter(hasMoetData)
    .slice()
    .sort((a, b) => String(b.session?.test_date || "").localeCompare(String(a.session?.test_date || "")));
  if (rows.length === 0) return null;

  return (
    <section className="fg-card p-5 sm:p-6" aria-labelledby="moet-history-title">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "#26275D", color: "#F9DD0E" }}>
          <Award className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 id="moet-history-title" className="font-bold text-navy">
            Các đợt kiểm tra theo chuẩn Bộ GD&ĐT
          </h3>
          <p className="text-xs text-muted-foreground">{rows.length} đợt, mới nhất ở trên</p>
        </div>
      </div>
      <ul className="space-y-3">
        {rows.map((r) => {
          const ev = evaluateMoet({ sex: student.sex, birthDate: student.birth_date, testDate: r.session?.test_date, result: r });
          const tests = ev.tests.filter((t) => t.value != null);
          return (
            <li key={r.id || r.session_id} className="rounded-2xl p-4" style={{ background: "#F7F8FC" }}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-navy">{r.session?.name || "Đợt kiểm tra"}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{r.session ? sessionDateRange(r.session) : "--"}{ev.age != null ? ` · ${ev.age} tuổi` : ""}</p>
                </div>
                {ev.overall ? <LevelPill level={ev.overall} /> : <span className="text-xs text-muted-foreground">Chưa đủ bài để xếp loại</span>}
              </div>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {tests.map((t) => (
                  <li key={t.key} className="rounded-xl bg-white px-3 py-2">
                    <p className="text-xs font-semibold text-muted-foreground">{t.label}</p>
                    <p className="flex items-baseline gap-1">
                      <span className="text-sm font-extrabold tabular-nums text-navy">{fmtValue(t.value)}</span>
                      <span className="text-xs text-muted-foreground">{t.unit}</span>
                    </p>
                    <div className="mt-1">
                      <LevelPill level={t.level} />
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
