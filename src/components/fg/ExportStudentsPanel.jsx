// Xuất danh sách học sinh theo cơ sở ra Excel (mỗi lớp một sheet, cùng cột với file nhập liệu).
import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { enrichAnthro } from "@/lib/studentData";
import { campusLabel, sessionDateRange } from "@/lib/campus";
import { buildCampusWorkbook, latestSessionOf } from "@/lib/exportStudentsExcel";
import { toast } from "@/components/ui/use-toast";

export default function ExportStudentsPanel({ students, classes, sessions, campuses }) {
  const [busy, setBusy] = useState(null);

  // Gộp các mã cơ sở cùng tên hiển thị ("CS GVP", "Gò Vấp"…) thành một dòng
  const rows = useMemo(() => {
    const labels = [...new Set(campuses.map(campusLabel))];
    return labels.map((label) => {
      const list = students.filter((s) => campusLabel(s.campus) === label);
      const classIds = new Set(list.map((s) => s.class_id));
      return {
        label,
        students: list,
        classCount: classes.filter((c) => classIds.has(c.id)).length,
        session: latestSessionOf(sessions, (c) => campusLabel(c) === label),
      };
    });
  }, [campuses, students, classes, sessions]);

  const run = async (row) => {
    setBusy(row.label);
    try {
      const [XLSX, fitness, anthro] = await Promise.all([
        import("xlsx"),
        base44.entities.FitnessResult.list(null, 50000),
        base44.entities.AnthropometricResult.list(null, 50000),
      ]);
      const wb = buildCampusWorkbook(XLSX, { students: row.students, classes, fitness, anthro, session: row.session }, enrichAnthro);
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const url = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Danh sách học sinh - ${row.label}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast({ title: `Đã xuất ${row.students.length} học sinh`, description: `${row.label} · ${wb.SheetNames.length} lớp` });
    } catch (err) {
      toast({ title: "Không xuất được file", description: err.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  if (!rows.length) return null;
  return (
    <div className="fg-card p-5 sm:p-6 mb-6">
      <div className="mb-4 flex items-center gap-2">
        <FileSpreadsheet className="w-5 h-5 text-navy" aria-hidden="true" />
        <div>
          <h3 className="font-bold text-navy">Xuất danh sách học sinh ra Excel</h3>
          <p className="text-xs text-muted-foreground">Mỗi cơ sở một file, mỗi lớp một sheet. Kèm kết quả của đợt đo gần nhất nếu đã có.</p>
        </div>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3" style={{ background: "#F7F8FC" }}>
            <div className="min-w-0">
              <p className="text-sm font-bold text-navy">{r.label}</p>
              <p className="text-xs text-muted-foreground">
                {r.students.length} học sinh · {r.classCount} lớp
                {r.session ? ` · đợt đo ${sessionDateRange(r.session)}` : " · chưa có đợt đo"}
              </p>
            </div>
            <button
              type="button"
              disabled={busy !== null || r.students.length === 0}
              onClick={() => run(r)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-navy px-3 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50"
            >
              {busy === r.label ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              {r.students.length === 0 ? "Chưa có học sinh" : "Tải .xlsx"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
