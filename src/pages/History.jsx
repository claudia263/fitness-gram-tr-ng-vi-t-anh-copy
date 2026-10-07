import { useState, useMemo } from "react";
import { useStudent } from "@/lib/StudentContext";
import { useTrackView } from "@/lib/usage";
import { enrichAnthro } from "@/lib/studentData";
import { formatPlankTime, formatAge } from "@/lib/fitness";
import PageTransition from "@/components/fg/PageTransition";
import EmptyState from "@/components/fg/EmptyState";
import { Filter, Calendar } from "lucide-react";

export default function History() {
  const { activeStudent, loadingStudents, data, loading } = useStudent();
  useTrackView("xem_lich_su", { studentId: activeStudent?.id, enabled: !!activeStudent });
  const [semester, setSemester] = useState("all");
  const [schoolYear, setSchoolYear] = useState("all");

  const fitnessRows = data?.fitnessRows || [];
  const anthroRows = (data?.anthroRows || []).map((a) => enrichAnthro(a, activeStudent?.birth_date));
  const comments = data?.commentBySession || {};

  const schoolYears = useMemo(() => {
    const set = new Set();
    [...fitnessRows, ...anthroRows].forEach((r) => r.session?.school_year && set.add(r.session.school_year));
    return Array.from(set);
  }, [fitnessRows, anthroRows]);

  // Merge fitness + anthro by session
  const merged = useMemo(() => {
    const bySession = {};
    fitnessRows.forEach((f) => {
      bySession[f.session_id] = bySession[f.session_id] || { session: f.session, fitness: null, anthro: null };
      bySession[f.session_id].fitness = f;
    });
    anthroRows.forEach((a) => {
      bySession[a.session_id] = bySession[a.session_id] || { session: a.session, fitness: null, anthro: null };
      bySession[a.session_id].anthro = a;
    });
    return Object.values(bySession).sort((a, b) => new Date(b.session?.test_date) - new Date(a.session?.test_date));
  }, [fitnessRows, anthroRows]);

  const filtered = merged.filter((r) => {
    if (semester !== "all" && r.session?.semester !== semester) return false;
    if (schoolYear !== "all" && r.session?.school_year !== schoolYear) return false;
    return true;
  });

  if (loadingStudents || loading) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-[900px] px-4 sm:px-6 py-8 space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="fg-skeleton" style={{ height: 140, borderRadius: 22 }} />)}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy mb-1">Lịch sử kiểm tra</h1>
        <p className="text-sm text-muted-foreground mb-6">Hành trình thể chất của {activeStudent?.full_name || "học sinh"} qua các kỳ</p>

        {/* Filters */}
        <div className="fg-card p-4 mb-6">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-navy">
            <Filter className="w-4 h-4" /> Lọc theo kỳ
          </div>
          <div className="flex flex-wrap gap-3">
            <Select label="Học kỳ" value={semester} onChange={setSemester} options={[{ v: "all", l: "Tất cả" }, { v: "Học kỳ I", l: "Học kỳ I" }, { v: "Học kỳ II", l: "Học kỳ II" }]} />
            <Select label="Năm học" value={schoolYear} onChange={setSchoolYear} options={[{ v: "all", l: "Tất cả" }, ...schoolYears.map((y) => ({ v: y, l: y }))]} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="Chưa có lịch sử" description="Chưa có đợt kiểm tra nào phù hợp với bộ lọc." />
        ) : (
          <div className="relative">
            {/* timeline line */}
            <div className="absolute left-4 top-2 bottom-2 w-0.5" style={{ background: "rgba(38,39,93,0.10)" }} />
            <div className="space-y-4">
              {filtered.map((entry, idx) => (
                <div key={idx} className="relative pl-12">
                  <div
                    className="absolute left-2 top-5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "#F9DD0E", border: "3px solid #FFFFFF", boxShadow: "0 0 0 2px rgba(38,39,93,0.10)" }}
                  />
                  <div className="fg-card p-5">
                    <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
                      <div>
                        <h3 className="font-bold text-navy">{entry.session?.name || "Đợt kiểm tra"}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(entry.session?.test_date)} · {entry.session?.semester} · {entry.session?.school_year}
                        </div>
                      </div>
                    </div>

                    {entry.fitness && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <HistoryMetric label="PACER" value={entry.fitness.pacer_level} unit="level" />
                        <HistoryMetric label="Sit & Reach" value={entry.fitness.sit_and_reach_cm} unit="cm" />
                        <HistoryMetric label="Push-up" value={entry.fitness.pushup_count} unit="lần" />
                        <HistoryMetric label="Plank" value={formatPlankTime(entry.fitness.plank_seconds)} />
                      </div>
                    )}
                    {entry.anthro && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t" style={{ borderColor: "rgba(38,39,93,0.06)" }}>
                        <HistoryMetric label="Chiều cao" value={entry.anthro.height_cm} unit="cm" />
                        <HistoryMetric label="Cân nặng" value={entry.anthro.weight_kg} unit="kg" />
                        <HistoryMetric label="BMI" value={entry.anthro.bmi?.toFixed(2)} />
                        <HistoryMetric label="Tuổi" value={formatAge(entry.anthro.age_months)} small />
                      </div>
                    )}
                    {comments[entry.session?.id]?.fitness_comment && (
                      <div className="mt-4 pt-3 border-t text-sm text-navy/80 leading-relaxed" style={{ borderColor: "rgba(38,39,93,0.06)" }}>
                        <span className="font-semibold text-navy">Nhận xét: </span>{comments[entry.session.id].fitness_comment}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="fg-input h-10 px-3 text-sm font-medium text-navy bg-white"
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function HistoryMetric({ label, value, unit, small }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground uppercase mb-0.5">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`font-extrabold text-navy tabular-nums ${small ? "text-base" : "text-xl"}`}>{value ?? "--"}</span>
        {value != null && unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}