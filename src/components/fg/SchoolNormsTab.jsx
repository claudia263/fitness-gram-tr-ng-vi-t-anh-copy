import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { buildSchoolRows, summarizeSchool } from "@/lib/normsSchool";
import SchoolNormsSummary from "@/components/fg/SchoolNormsSummary";
import SchoolNormsAttention from "@/components/fg/SchoolNormsAttention";

const EMPTY_FILTERS = { schoolYear: "", grade: "", classId: "", sex: "" };

export default function SchoolNormsTab({ classes, sessions }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const schoolYears = [...new Set([...classes, ...sessions].map((x) => x.school_year).filter(Boolean))].sort().reverse();
  const grades = [...new Set(classes.filter((c) => !filters.schoolYear || c.school_year === filters.schoolYear).map((c) => c.grade).filter(Boolean))]
    .sort((a, b) => Number(a) - Number(b));
  const classOptions = classes.filter(
    (c) => (!filters.schoolYear || c.school_year === filters.schoolYear) && (!filters.grade || c.grade === filters.grade)
  );

  const set = (k, v) =>
    setFilters((f) => {
      const next = { ...f, [k]: v };
      if (k === "schoolYear" || k === "grade") next.classId = "";
      return next;
    });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const query = {};
      if (filters.schoolYear) query.school_year = filters.schoolYear;
      if (filters.grade) query.grade = filters.grade;
      if (filters.classId) query.class_id = filters.classId;
      if (filters.sex) query.sex = filters.sex;

      const students = await base44.entities.Student.filter(query, null, 500);
      const ids = students.map((s) => s.id);
      let fitness = [];
      let anthro = [];
      if (ids.length) {
        [fitness, anthro] = await Promise.all([
          base44.entities.FitnessResult.filter({ student_id: { $in: ids } }, null, 2000),
          base44.entities.AnthropometricResult.filter({ student_id: { $in: ids } }, null, 2000),
        ]);
      }
      if (!alive) return;
      setRows(buildSchoolRows({ students, fitness, anthro, sessions, schoolYear: filters.schoolYear }));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [filters, sessions]);

  const summary = summarizeSchool(rows);

  return (
    <div className="space-y-4">
      <div className="fg-card p-5">
        <h3 className="font-bold text-navy mb-4">Bộ lọc</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Select label="Năm học" value={filters.schoolYear} onChange={(v) => set("schoolYear", v)} options={schoolYears.map((y) => ({ value: y, label: y }))} />
          <Select label="Khối" value={filters.grade} onChange={(v) => set("grade", v)} options={grades.map((g) => ({ value: g, label: `Khối ${g}` }))} />
          <Select label="Lớp" value={filters.classId} onChange={(v) => set("classId", v)} options={classOptions.map((c) => ({ value: c.id, label: `${c.name} · ${c.school_year}` }))} />
          <Select
            label="Giới tính"
            value={filters.sex}
            onChange={(v) => set("sex", v)}
            options={[{ value: "male", label: "Nam" }, { value: "female", label: "Nữ" }]}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Mỗi học sinh được đối chiếu theo kết quả đo gần nhất trong phạm vi đã chọn.
        </p>
      </div>

      {loading ? (
        <div className="fg-skeleton" style={{ height: 260, borderRadius: 22 }} />
      ) : rows.length === 0 ? (
        <div className="fg-card p-6 text-sm text-muted-foreground">
          Chưa có dữ liệu phù hợp với bộ lọc này. Hãy chọn phạm vi khác hoặc nhập kết quả kiểm tra trước.
        </div>
      ) : (
        <>
          <SchoolNormsSummary summary={summary} />
          <SchoolNormsAttention rows={rows} attention={summary.attention} />
        </>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-navy mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="fg-input w-full h-11 px-3 text-sm font-medium text-navy bg-white">
        <option value="">Tất cả</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}