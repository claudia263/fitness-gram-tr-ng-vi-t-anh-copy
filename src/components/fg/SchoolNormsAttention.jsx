import { useState } from "react";
import { buildNormsCsv, downloadNormsCsv } from "@/lib/normsSchool";
import { statusInfo } from "@/lib/fitnessNorms";
import { Download } from "lucide-react";

const TONE_STYLE = {
  green: { background: "rgba(22, 163, 74, 0.12)", color: "#15803D" },
  amber: { background: "rgba(249, 221, 14, 0.32)", color: "#8A6100" },
  red: { background: "rgba(192, 57, 43, 0.12)", color: "#C0392B" },
  grey: { background: "#F4F5F8", color: "#6B6E8F" },
};

const MAX_ROWS = 40;

export default function SchoolNormsAttention({ rows, attention }) {
  const [busy, setBusy] = useState(false);

  const handleExport = () => {
    setBusy(true);
    try {
      downloadNormsCsv(`So_sanh_chuan_${new Date().toISOString().slice(0, 10)}.csv`, buildNormsCsv(rows));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fg-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-navy">Học sinh cần chú ý ({attention.length})</h3>
          <p className="text-xs text-muted-foreground">Các em có bài chưa đạt chuẩn hoặc có nguy cơ sức khỏe</p>
        </div>
        <button
          onClick={handleExport}
          disabled={busy || rows.length === 0}
          className="fg-btn-secondary shrink-0 flex items-center gap-2 px-4 h-10 text-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Xuất CSV
        </button>
      </div>

      {attention.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tất cả học sinh trong phạm vi này đều đạt chuẩn ở các bài đã đo.</p>
      ) : (
        <div className="space-y-2">
          {attention.slice(0, MAX_ROWS).map((r) => (
            <div key={r.student.id} className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 rounded-xl" style={{ background: "#F7F8FC" }}>
              <div className="min-w-0">
                <div className="font-semibold text-navy text-sm truncate">{r.student.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  Lớp {r.student.grade} · {r.student.sex === "female" ? "Nữ" : "Nam"}
                  {r.session ? ` · ${r.session.name}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.flags.map((f) => {
                  const info = statusInfo(f.level === 2 ? "risk" : "improve");
                  return (
                    <span key={f.key} className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={TONE_STYLE[info.tone]}>
                      {f.name} · {info.label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
          {attention.length > MAX_ROWS && (
            <p className="text-xs text-muted-foreground pt-1">Hiển thị {MAX_ROWS} em đầu tiên — xuất CSV để xem đủ {attention.length} em.</p>
          )}
        </div>
      )}
    </div>
  );
}