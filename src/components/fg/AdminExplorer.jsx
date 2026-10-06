import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, ChevronLeft, Users, School, Loader2, Activity, Trash2, Pencil, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { formatPlankTime } from "@/lib/fitness";
import { pacerLevelFromLaps, pacerLapsFromLevel, getPacerLevelInfo } from "@/lib/pacerReference";

export default function AdminExplorer({ open, type, students, classes, sessions, onClose, onRefresh }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(38,39,93,0.45)" }} onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <ExplorerContent type={type} students={students} classes={classes} sessions={sessions} onClose={onClose} onRefresh={onRefresh} />
      </div>
    </div>
  );
}

function ExplorerContent({ type, students, classes, sessions, onClose, onRefresh }) {
  // view: "list" (classes or students) | "classStudents" | "studentResults" | "editResults"
  const [view, setView] = useState(type === "classes" ? "classes" : "students");
  const [activeClass, setActiveClass] = useState(null);
  const [activeStudent, setActiveStudent] = useState(null);

  const headerTitle = () => {
    if (view === "editResults") return `Nhập kết quả · ${activeStudent?.full_name || ""}`;
    if (activeStudent) return activeStudent.full_name;
    if (view === "classStudents") return `${activeClass?.name || ""} · Khối ${activeClass?.grade || ""}`;
    if (view === "classes") return "Danh sách lớp học";
    return "Danh sách học sinh";
  };

  const back = () => {
    if (view === "editResults") {
      setView(activeClass ? "classStudents" : "students");
      return;
    }
    if (activeStudent) {
      setActiveStudent(null);
    } else if (view === "classStudents") {
      setView("classes");
      setActiveClass(null);
    } else {
      onClose();
    }
  };

  const handleDeleted = () => {
    onRefresh?.();
    if (activeClass) {
      // stay in class list
    } else {
      setView("students");
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: "rgba(38,39,93,0.08)" }}>
        <button onClick={back} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F4F5F8] transition-colors">
          {activeStudent || view === "classStudents" || view === "editResults" ? <ChevronLeft className="w-5 h-5 text-navy" /> : <X className="w-5 h-5 text-navy" />}
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {view === "classes" && !activeStudent && <School className="w-5 h-5 text-navy shrink-0" />}
          {view === "students" && !activeStudent && <Users className="w-5 h-5 text-navy shrink-0" />}
          {activeStudent && <Activity className="w-5 h-5 text-navy shrink-0" />}
          <h3 className="font-bold text-navy truncate">{headerTitle()}</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {view === "editResults" && activeStudent ? (
          <StudentResultForm student={activeStudent} sessions={sessions} onDone={() => { onRefresh?.(); }} />
        ) : activeStudent ? (
          <StudentResults studentId={activeStudent.id} />
        ) : view === "classes" ? (
          <ClassList classes={classes} students={students} onOpenClass={(c) => { setActiveClass(c); setView("classStudents"); }} />
        ) : view === "classStudents" ? (
          <StudentList
            students={students.filter((s) => s.class_id === activeClass?.id)}
            onOpenStudent={setActiveStudent}
            onEditResults={(s) => { setActiveStudent(s); setView("editResults"); }}
            onDeleted={handleDeleted}
          />
        ) : (
          <StudentList
            students={students}
            onOpenStudent={setActiveStudent}
            onEditResults={(s) => { setActiveStudent(s); setView("editResults"); }}
            onDeleted={handleDeleted}
          />
        )}
      </div>
    </>
  );
}

function ClassList({ classes, students, onOpenClass }) {
  if (classes.length === 0) return <Empty text="Chưa có lớp học." />;
  const sorted = [...classes].sort(
    (a, b) => (a.grade || "").localeCompare(b.grade || "", undefined, { numeric: true }) || (a.name || "").localeCompare(b.name || "", undefined, { numeric: true })
  );
  return (
    <div className="space-y-2">
      {sorted.map((c) => {
        const count = students.filter((s) => s.class_id === c.id).length;
        return (
          <button
            key={c.id}
            onClick={() => onOpenClass(c)}
            className="w-full flex items-center justify-between py-3.5 px-4 rounded-2xl text-left transition-colors hover:bg-[#F7F8FC]"
            style={{ background: "#F7F8FC" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ background: "#F9DD0E", color: "#26275D" }}>
                {c.name?.slice(0, 2) || "--"}
              </div>
              <div>
                <div className="font-semibold text-navy text-sm">{c.name}</div>
                <div className="text-xs text-muted-foreground">Khối {c.grade} · {c.school_year}{c.campus ? " · " + c.campus : ""}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-navy px-2.5 py-1 rounded-lg" style={{ background: "#FEF3B0" }}>{count} HS</span>
              <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function StudentList({ students, onOpenStudent, onEditResults, onDeleted }) {
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const doDelete = async (s) => {
    setDeletingId(s.id);
    try {
      const [fit, anthro] = await Promise.all([
        base44.entities.FitnessResult.filter({ student_id: s.id }, null, 500),
        base44.entities.AnthropometricResult.filter({ student_id: s.id }, null, 500),
      ]);
      if (fit.length) await base44.entities.FitnessResult.deleteMany({ student_id: s.id });
      if (anthro.length) await base44.entities.AnthropometricResult.deleteMany({ student_id: s.id });
      await base44.entities.Student.delete(s.id);
      setConfirmId(null);
      onDeleted?.();
    } catch (e) {
      alert("Không thể xóa học sinh: " + (e?.message || "lỗi"));
    } finally {
      setDeletingId(null);
    }
  };

  if (students.length === 0) return <Empty text="Chưa có học sinh." />;
  return (
    <div className="space-y-2">
      {students.map((s) => (
        <div
          key={s.id}
          className="w-full flex items-center justify-between py-3 px-3 rounded-2xl"
          style={{ background: "#F7F8FC" }}
        >
          <button onClick={() => onOpenStudent(s)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: "#F9DD0E", color: "#26275D" }}>
              {s.full_name?.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-navy text-sm truncate">{s.full_name}</div>
              <div className="text-xs text-muted-foreground">{s.sex === "female" ? "Nữ" : "Nam"} · {formatDate(s.birth_date)}</div>
            </div>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEditResults(s)}
              title="Nhập kết quả"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[#FEF3B0]"
            >
              <Pencil className="w-4 h-4 text-navy" />
            </button>
            {confirmId === s.id ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => doDelete(s)}
                  disabled={deletingId === s.id}
                  title="Xác nhận xóa"
                  className="h-9 px-2.5 rounded-xl flex items-center justify-center text-xs font-bold text-white transition-colors"
                  style={{ background: "#E85D4A" }}
                >
                  {deletingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xóa"}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  title="Hủy"
                  className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F4F5F8]"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmId(s.id)}
                title="Xóa học sinh"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[rgba(232,93,74,0.12)]"
              >
                <Trash2 className="w-4 h-4" style={{ color: "#E85D4A" }} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentResults({ studentId }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [fit, anthro, sessions] = await Promise.all([
          base44.entities.FitnessResult.filter({ student_id: studentId }, null, 200),
          base44.entities.AnthropometricResult.filter({ student_id: studentId }, null, 200),
          base44.entities.TestSession.list("-test_date", 200),
        ]);
        const sessMap = Object.fromEntries(sessions.map((s) => [s.id, s]));
        const merged = sessions.map((s) => {
          const f = fit.find((r) => r.session_id === s.id) || {};
          const a = anthro.find((r) => r.session_id === s.id) || {};
          return {
            id: s.id,
            name: s.name,
            date: s.test_date,
            pacer_laps: f.pacer_laps,
            pacer_level: f.pacer_level,
            sit_and_reach_cm: f.sit_and_reach_cm,
            pushup_count: f.pushup_count,
            plank_seconds: f.plank_seconds,
            height_cm: a.height_cm,
            weight_kg: a.weight_kg,
            bmi: a.bmi,
          };
        }).filter((r) => r.pacer_laps != null || r.pushup_count != null || r.sit_and_reach_cm != null || r.plank_seconds != null || r.height_cm != null);
        setRows(merged);
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-navy" />
      </div>
    );
  }
  if (rows.length === 0) return <Empty text="Học sinh chưa có kết quả kiểm tra nào." />;

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="rounded-2xl p-4" style={{ background: "#F7F8FC" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-navy text-sm">{r.name}</div>
            <span className="text-xs font-semibold text-muted-foreground">{formatDate(r.date)}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Metric label="Lượt" value={r.pacer_laps} />
            <Metric label="Level" value={r.pacer_level} />
            <Metric label="Sit & Reach (cm)" value={r.sit_and_reach_cm} />
            <Metric label="Push-up (lần)" value={r.pushup_count} />
            <Metric label="Plank" value={r.plank_seconds != null ? formatPlankTime(r.plank_seconds) : null} />
            <Metric label="BMI" value={r.bmi != null ? Number(r.bmi).toFixed(2) : null} />
            <Metric label="Chiều cao (cm)" value={r.height_cm} />
            <Metric label="Cân nặng (kg)" value={r.weight_kg} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl px-3 py-2 bg-white">
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-sm font-extrabold text-navy tabular-nums">{value != null ? value : "--"}</div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: "#F4F5F8" }}>
        <Activity className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function StudentResultForm({ student, sessions, onDone }) {
  const [sessionId, setSessionId] = useState(sessions?.[0]?.id || "");
  const [form, setForm] = useState({
    pacer_laps: "",
    pacer_level: "",
    sit_and_reach_cm: "",
    pushup_count: "",
    plank_seconds: "",
    height_cm: "",
    weight_kg: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const num = (v) => (v === "" || v == null ? undefined : Number(v));

  const loadExisting = async (sid) => {
    if (!sid) return;
    try {
      const [fit, anthro] = await Promise.all([
        base44.entities.FitnessResult.filter({ student_id: student.id, session_id: sid }, null, 1),
        base44.entities.AnthropometricResult.filter({ student_id: student.id, session_id: sid }, null, 1),
      ]);
      const f = fit[0] || {};
      const a = anthro[0] || {};
      setForm({
        pacer_laps: f.pacer_laps ?? "",
        pacer_level: f.pacer_level ?? "",
        sit_and_reach_cm: f.sit_and_reach_cm ?? "",
        pushup_count: f.pushup_count ?? "",
        plank_seconds: f.plank_seconds ?? "",
        height_cm: a.height_cm ?? "",
        weight_kg: a.weight_kg ?? "",
      });
    } catch (e) {
      /* ignore */
    }
  };

  useEffect(() => {
    if (sessionId) loadExisting(sessionId);
  }, [sessionId]);

  const save = async () => {
    if (!sessionId) {
      setError("Vui lòng chọn đợt kiểm tra.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const h = num(form.height_cm);
      const w = num(form.weight_kg);
      const bmi = h && w ? Number((w / Math.pow(h / 100, 2)).toFixed(2)) : undefined;

      // Fitness
      const existingFit = await base44.entities.FitnessResult.filter({ student_id: student.id, session_id: sessionId }, null, 1);
      const fitData = {
        pacer_laps: num(form.pacer_laps),
        pacer_level: num(form.pacer_level),
        sit_and_reach_cm: num(form.sit_and_reach_cm),
        pushup_count: num(form.pushup_count),
        plank_seconds: num(form.plank_seconds),
      };
      if (existingFit.length) {
        await base44.entities.FitnessResult.update(existingFit[0].id, fitData);
      } else {
        await base44.entities.FitnessResult.create({ student_id: student.id, session_id: sessionId, ...fitData });
      }

      // Anthropometric
      if (h && w) {
        const existingAn = await base44.entities.AnthropometricResult.filter({ student_id: student.id, session_id: sessionId }, null, 1);
        const anData = { height_cm: h, weight_kg: w, bmi };
        if (existingAn.length) {
          await base44.entities.AnthropometricResult.update(existingAn[0].id, anData);
        } else {
          await base44.entities.AnthropometricResult.create({ student_id: student.id, session_id: sessionId, ...anData });
        }
      }

      setDone(true);
      onDone?.();
      setTimeout(() => setDone(false), 1500);
    } catch (e) {
      setError(e?.message || "Không thể lưu kết quả.");
    } finally {
      setBusy(false);
    }
  };

  if (sessions?.length === 0) {
    return (
      <div className="rounded-2xl p-5 text-center" style={{ background: "#F7F8FC" }}>
        <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "#E85D4A" }} />
        <p className="text-sm font-semibold text-navy mb-1">Chưa có đợt kiểm tra nào</p>
        <p className="text-xs text-muted-foreground">Vui lòng tạo đợt kiểm tra trước khi nhập kết quả.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-navy mb-1.5">Đợt kiểm tra</label>
        <select
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="fg-input w-full h-11 px-3 text-sm font-medium text-navy bg-white"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>{s.name} · {formatDate(s.test_date)}</option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl p-4" style={{ background: "#F7F8FC" }}>
        <div className="text-xs font-bold text-navy uppercase tracking-wide mb-3">Thể lực</div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Lượt" value={form.pacer_laps} onChange={(v) => setForm({ ...form, pacer_laps: v, pacer_level: String(pacerLevelFromLaps(v)) })} />
          <NumInput label="Level" value={form.pacer_level} onChange={(v) => setForm({ ...form, pacer_level: v, pacer_laps: String(pacerLapsFromLevel(v)) })} />
          {form.pacer_level && (() => { const info = getPacerLevelInfo(Math.floor(Number(form.pacer_level))); return info ? (
            <div className="col-span-2 text-[11px] text-muted-foreground leading-snug">Level {info.level}: {info.shuttles} bật · {info.speed} km/h · {info.cumDist} m tích lũy</div>
          ) : null; })()}
          <NumInput label="Sit & Reach (cm)" value={form.sit_and_reach_cm} onChange={(v) => setForm({ ...form, sit_and_reach_cm: v })} />
          <NumInput label="Push-up (lần)" value={form.pushup_count} onChange={(v) => setForm({ ...form, pushup_count: v })} />
          <NumInput label="Plank (giây)" value={form.plank_seconds} onChange={(v) => setForm({ ...form, plank_seconds: v })} />
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: "#F7F8FC" }}>
        <div className="text-xs font-bold text-navy uppercase tracking-wide mb-3">Thể trạng</div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Chiều cao (cm)" value={form.height_cm} onChange={(v) => setForm({ ...form, height_cm: v })} />
          <NumInput label="Cân nặng (kg)" value={form.weight_kg} onChange={(v) => setForm({ ...form, weight_kg: v })} />
        </div>
        {form.height_cm && form.weight_kg && (
          <div className="mt-3 text-xs text-muted-foreground">
            BMI tự tính: <span className="font-bold text-navy">{((Number(form.weight_kg) / Math.pow(Number(form.height_cm) / 100, 2)) || 0).toFixed(2)}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: "rgba(232,93,74,0.08)" }}>
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#E85D4A" }} />
          <div className="text-sm text-navy">{error}</div>
        </div>
      )}

      <button
        onClick={save}
        disabled={busy}
        className="fg-btn-primary w-full h-11 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {done ? <><CheckCircle2 className="w-4 h-4" /> Đã lưu</> : busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : <><Plus className="w-4 h-4" /> Lưu kết quả</>}
      </button>
    </div>
  );
}

function NumInput({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-navy mb-1.5">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="fg-input w-full h-10 px-3 text-sm font-medium text-navy bg-white"
      />
    </div>
  );
}

function formatDate(d) {
  if (!d) return "--";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}