import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { calculateBMI, calculateAgeMonths, nutritionalStatusFromZScore, formatPlankTime } from "@/lib/fitness";
import { pacerLevelFromLaps, pacerLapsFromLevel, getPacerLevelInfo, pacerDistanceFromLaps } from "@/lib/pacerReference";
import PageTransition from "@/components/fg/PageTransition";
import BrandLogo from "@/components/fg/BrandLogo";
import { Save, Loader2, CheckCircle2, AlertCircle, ClipboardList, Users, Calendar, History, Download } from "lucide-react";

export default function TeacherDashboard() {
  const [tab, setTab] = useState("input");
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cls, sess] = await Promise.all([
          base44.entities.Class.list(null, 50),
          base44.entities.TestSession.list("-test_date", 50),
        ]);
        setClasses(cls);
        setSessions(sess);
        if (cls.length) setSelectedClass(cls[0].id);
        if (sess.length) setSelectedSession(sess[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    (async () => {
      const studs = await base44.entities.Student.filter({ class_id: selectedClass }, null, 100);
      setStudents(studs);
      setSelectedStudent(studs[0]?.id || "");
    })();
  }, [selectedClass]);

  const tabs = [
    { key: "input", label: "Nhập kết quả", icon: ClipboardList },
    { key: "students", label: "Học sinh", icon: Users },
    { key: "sessions", label: "Đợt kiểm tra", icon: Calendar },
    { key: "history", label: "Lịch sử", icon: History },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#26275D", color: "#F9DD0E" }}>
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">Teacher Dashboard</h1>
            <p className="text-sm text-muted-foreground">Nhập và quản lý kết quả kiểm tra thể chất</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors"
                style={{
                  background: tab === t.key ? "#26275D" : "#FFFFFF",
                  color: tab === t.key ? "#FFFFFF" : "#26275D",
                  border: tab === t.key ? "none" : "1px solid rgba(38,39,93,0.10)",
                }}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="fg-skeleton" style={{ height: 300, borderRadius: 22 }} />
        ) : tab === "input" ? (
          <InputForm
            classes={classes}
            students={students}
            sessions={sessions}
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            selectedStudent={selectedStudent}
            setSelectedStudent={setSelectedStudent}
            selectedSession={selectedSession}
            setSelectedSession={setSelectedSession}
          />
        ) : tab === "students" ? (
          <StudentsTab students={students} />
        ) : tab === "sessions" ? (
          <SessionsTab sessions={sessions} />
        ) : (
          <HistoryTab students={students} sessions={sessions} />
        )}
      </div>
    </PageTransition>
  );
}

function InputForm({ classes, students, sessions, selectedClass, setSelectedClass, selectedStudent, setSelectedStudent, selectedSession, setSelectedSession }) {
  const [form, setForm] = useState({
    pacer_laps: "",
    pacer_level: "",
    sit_and_reach_cm: "",
    pushup_count: "",
    plank_seconds: "",
    height_cm: "",
    weight_kg: "",
    fitness_comment: "",
    growth_comment: "",
    recommendation: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadedMsg, setLoadedMsg] = useState("");

  const student = students.find((s) => s.id === selectedStudent);

  const loadExisting = async () => {
    if (!selectedStudent || !selectedSession) return;
    setLoadingExisting(true);
    setLoadedMsg("");
    try {
      const [fit, anthro, cmt] = await Promise.all([
        base44.entities.FitnessResult.filter({ student_id: selectedStudent, session_id: selectedSession }, null, 1),
        base44.entities.AnthropometricResult.filter({ student_id: selectedStudent, session_id: selectedSession }, null, 1),
        base44.entities.TeacherComment.filter({ student_id: selectedStudent, session_id: selectedSession }, null, 1),
      ]);
      const f = fit[0] || {};
      const a = anthro[0] || {};
      const c = cmt[0] || {};
      const blank = { pacer_laps: "", pacer_level: "", sit_and_reach_cm: "", pushup_count: "", plank_seconds: "", height_cm: "", weight_kg: "", fitness_comment: "", growth_comment: "", recommendation: "" };
      setForm({
        pacer_laps: f.pacer_laps != null ? String(f.pacer_laps) : "",
        pacer_level: f.pacer_level != null ? String(f.pacer_level) : "",
        sit_and_reach_cm: f.sit_and_reach_cm != null ? String(f.sit_and_reach_cm) : "",
        pushup_count: f.pushup_count != null ? String(f.pushup_count) : "",
        plank_seconds: f.plank_seconds != null ? String(f.plank_seconds) : "",
        height_cm: a.height_cm != null ? String(a.height_cm) : "",
        weight_kg: a.weight_kg != null ? String(a.weight_kg) : "",
        fitness_comment: c.fitness_comment || "",
        growth_comment: c.growth_comment || "",
        recommendation: c.recommendation || "",
      });
      const hasData = fit[0] || anthro[0] || cmt[0];
      setLoadedMsg(hasData ? "Đã tải kết quả đã lưu — có thể chỉnh sửa và lưu lại." : "Chưa có dữ liệu cho đợt này — nhập mới rồi lưu.");
      setErrors({});
    } catch (err) {
      setErrors({ _save: err.message || "Lỗi khi tải dữ liệu" });
    } finally {
      setLoadingExisting(false);
    }
  };
  const bmi = form.height_cm && form.weight_kg ? calculateBMI(Number(form.weight_kg), Number(form.height_cm)) : null;
  const ageMonths = student && student.birth_date && sessions.find((s) => s.id === selectedSession)?.test_date
    ? calculateAgeMonths(student.birth_date, sessions.find((s) => s.id === selectedSession).test_date)
    : null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    const num = (v) => v === "" || (Number(v) >= 0 && !isNaN(Number(v)));
    if (!num(form.pacer_laps)) e.pacer_laps = "PACER không hợp lệ";
    if (!num(form.pushup_count)) e.pushup_count = "Push-up không hợp lệ";
    if (!num(form.sit_and_reach_cm)) e.sit_and_reach_cm = "Sit & Reach không hợp lệ";
    if (!num(form.plank_seconds)) e.plank_seconds = "Plank không hợp lệ";
    if (form.height_cm !== "" && (Number(form.height_cm) <= 0 || Number(form.height_cm) > 250)) e.height_cm = "Chiều cao 1–250 cm";
    if (form.weight_kg !== "" && (Number(form.weight_kg) <= 0 || Number(form.weight_kg) > 300)) e.weight_kg = "Cân nặng 1–300 kg";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!selectedStudent || !selectedSession) return;
    if (!validate()) return;
    setSaving(true);
    setSuccess(false);
    try {
      const toNum = (v) => (v === "" ? null : Number(v));
      // Upsert fitness result for this student+session
      const existing = await base44.entities.FitnessResult.filter({ student_id: selectedStudent, session_id: selectedSession }, null, 1);
      const fitnessData = {
        student_id: selectedStudent,
        session_id: selectedSession,
        pacer_laps: toNum(form.pacer_laps),
        pacer_level: toNum(form.pacer_level),
        sit_and_reach_cm: toNum(form.sit_and_reach_cm),
        pushup_count: toNum(form.pushup_count),
        plank_seconds: toNum(form.plank_seconds),
        teacher_id: "",
      };
      if (existing.length) {
        await base44.entities.FitnessResult.update(existing[0].id, fitnessData);
      } else {
        await base44.entities.FitnessResult.create(fitnessData);
      }

      // Anthropometric
      if (form.height_cm && form.weight_kg) {
        const existingAnthro = await base44.entities.AnthropometricResult.filter({ student_id: selectedStudent, session_id: selectedSession }, null, 1);
        const anthroData = {
          student_id: selectedStudent,
          session_id: selectedSession,
          height_cm: Number(form.height_cm),
          weight_kg: Number(form.weight_kg),
          bmi,
          age_months: ageMonths,
          bmi_for_age_zscore: null,
          nutritional_status: nutritionalStatusFromZScore(null),
        };
        if (existingAnthro.length) {
          await base44.entities.AnthropometricResult.update(existingAnthro[0].id, anthroData);
        } else {
          await base44.entities.AnthropometricResult.create(anthroData);
        }
      }

      // Comment
      if (form.fitness_comment || form.growth_comment || form.recommendation) {
        const existingComment = await base44.entities.TeacherComment.filter({ student_id: selectedStudent, session_id: selectedSession }, null, 1);
        const commentData = {
          student_id: selectedStudent,
          session_id: selectedSession,
          teacher_id: "",
          fitness_comment: form.fitness_comment,
          growth_comment: form.growth_comment,
          recommendation: form.recommendation,
        };
        if (existingComment.length) {
          await base44.entities.TeacherComment.update(existingComment[0].id, commentData);
        } else {
          await base44.entities.TeacherComment.create(commentData);
        }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      setErrors({ _save: err.message || "Lỗi khi lưu" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Selectors */}
      <div className="lg:col-span-1 space-y-4">
        <div className="fg-card p-5">
          <h3 className="font-bold text-navy mb-4">Chọn để nhập</h3>
          <Field label="Lớp học">
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="fg-input w-full h-11 px-3 text-sm font-medium text-navy bg-white">
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.school_year}</option>)}
            </select>
          </Field>
          <Field label="Học sinh">
            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="fg-input w-full h-11 px-3 text-sm font-medium text-navy bg-white">
              <option value="">-- Chọn học sinh --</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </Field>
          <Field label="Đợt kiểm tra">
            <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="fg-input w-full h-11 px-3 text-sm font-medium text-navy bg-white">
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name} · {formatDate(s.test_date)}</option>)}
            </select>
          </Field>
          {student && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(38,39,93,0.06)" }}>
              <div className="text-xs text-muted-foreground">Học sinh</div>
              <div className="font-bold text-navy">{student.full_name}</div>
              <div className="text-xs text-muted-foreground">Lớp {student.grade} · {student.sex === "female" ? "Nữ" : "Nam"}</div>
              {ageMonths != null && <div className="text-xs text-muted-foreground mt-1">Tuổi lúc kiểm tra: {Math.floor(ageMonths / 12)} tuổi {ageMonths % 12} tháng</div>}
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="lg:col-span-2">
        <div className="fg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <h3 className="font-bold text-navy">Nhập kết quả kiểm tra</h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">BMI tự tính từ chiều cao và cân nặng — không nhập trực tiếp.</p>
            </div>
            <button
              onClick={loadExisting}
              disabled={loadingExisting || !selectedStudent || !selectedSession}
              className="shrink-0 flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "#F4F5F8", color: "#26275D" }}
            >
              {loadingExisting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">Tải kết quả đã lưu</span>
              <span className="sm:hidden">Tải</span>
            </button>
          </div>

          {loadedMsg && (
            <div className="mb-4 mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold" style={{ background: "#F4F5F8", color: "#26275D" }}>
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {loadedMsg}
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "#FEF3B0", color: "#26275D" }}>
              <CheckCircle2 className="w-5 h-5" /> Đã lưu kết quả thành công.
            </div>
          )}
          {errors._save && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(232,93,74,0.10)", color: "#C0392B" }}>
              <AlertCircle className="w-5 h-5" /> {errors._save}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <NumField label="Lượt" value={form.pacer_laps} onChange={(v) => { set("pacer_laps", v); set("pacer_level", String(pacerLevelFromLaps(v))); }} error={errors.pacer_laps} hint={form.pacer_laps ? `≈ ${pacerDistanceFromLaps(form.pacer_laps)} m` : null} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-navy">Level</label>
              <input
                type="number"
                inputMode="decimal"
                value={form.pacer_level}
                onChange={(e) => { const v = e.target.value; set("pacer_level", v); set("pacer_laps", v ? String(pacerLapsFromLevel(v)) : ""); }}
                className="fg-input h-11 px-3 text-sm font-semibold text-navy tabular-nums"
              />
              {form.pacer_level && (() => { const info = getPacerLevelInfo(Math.floor(Number(form.pacer_level))); return info ? (
                <div className="text-[11px] text-muted-foreground leading-snug">
                  Level {info.level}: {info.shuttles} bật · {info.speed} km/h · {info.cumTime} · {info.cumDist} m
                </div>
              ) : null; })()}
            </div>
            <NumField label="Sit & Reach (cm)" value={form.sit_and_reach_cm} onChange={(v) => set("sit_and_reach_cm", v)} error={errors.sit_and_reach_cm} />
            <NumField label="Push-up (lần)" value={form.pushup_count} onChange={(v) => set("pushup_count", v)} error={errors.pushup_count} />
            <NumField label="Plank (giây)" value={form.plank_seconds} onChange={(v) => set("plank_seconds", v)} error={errors.plank_seconds} hint={form.plank_seconds ? `= ${formatPlankTime(Number(form.plank_seconds))}` : null} />
            <div />
            <NumField label="Chiều cao (cm)" value={form.height_cm} onChange={(v) => set("height_cm", v)} error={errors.height_cm} />
            <NumField label="Cân nặng (kg)" value={form.weight_kg} onChange={(v) => set("weight_kg", v)} error={errors.weight_kg} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-navy">BMI (tự tính)</label>
              <div className="h-11 px-3 rounded-xl flex items-center font-extrabold text-navy text-lg tabular-nums" style={{ background: "#FEF3B0" }}>
                {bmi != null ? bmi.toFixed(2) : "--"}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <TextField label="Nhận xét thể lực" value={form.fitness_comment} onChange={(v) => set("fitness_comment", v)} placeholder="VD: Học sinh có tiến bộ về sức bền..." />
            <TextField label="Nhận xét thể trạng" value={form.growth_comment} onChange={(v) => set("growth_comment", v)} placeholder="VD: Chiều cao phát triển ổn định..." />
            <TextField label="Khuyến nghị" value={form.recommendation} onChange={(v) => set("recommendation", v)} placeholder="VD: Tăng cường tập linh hoạt..." />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !selectedStudent || !selectedSession}
            className="fg-btn-primary w-full sm:w-auto sm:px-8 h-12 mt-6 flex items-center justify-center gap-2 disabled:opacity-60 disabled:translate-y-0"
          >
            {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...</> : <><Save className="w-5 h-5" /> Lưu kết quả</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentsTab({ students }) {
  return (
    <div className="fg-card p-5">
      <h3 className="font-bold text-navy mb-4">Danh sách học sinh ({students.length})</h3>
      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có học sinh trong lớp.</p>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ background: "#F7F8FC" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "#F9DD0E", color: "#26275D" }}>
                  {s.full_name?.slice(0, 1)}
                </div>
                <div>
                  <div className="font-semibold text-navy text-sm">{s.full_name}</div>
                  <div className="text-xs text-muted-foreground">{s.sex === "female" ? "Nữ" : "Nam"} · {formatDate(s.birth_date)}</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">Lớp {s.grade}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SessionsTab({ sessions }) {
  return (
    <div className="fg-card p-5">
      <h3 className="font-bold text-navy mb-4">Đợt kiểm tra ({sessions.length})</h3>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ background: "#F7F8FC" }}>
            <div>
              <div className="font-semibold text-navy text-sm">{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.semester} · {s.school_year}</div>
            </div>
            <span className="text-xs font-semibold text-navy">{formatDate(s.test_date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTab({ students, sessions }) {
  const [studentId, setStudentId] = useState(students[0]?.id || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    base44.entities.FitnessResult.filter({ student_id: studentId }, "-created_date", 50).then((r) => {
      setResults(r);
      setLoading(false);
    });
  }, [studentId]);

  return (
    <div className="fg-card p-5">
      <h3 className="font-bold text-navy mb-4">Lịch sử kết quả</h3>
      <Field label="Chọn học sinh">
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="fg-input w-full sm:w-72 h-11 px-3 text-sm font-medium text-navy bg-white">
          {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
      </Field>
      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="fg-skeleton" style={{ height: 80, borderRadius: 14 }} />
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có kết quả.</p>
        ) : (
          results.map((r) => {
            const sess = sessions.find((s) => s.id === r.session_id);
            return (
              <div key={r.id} className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ background: "#F7F8FC" }}>
                <div className="text-sm font-semibold text-navy">{sess?.name || "Đợt kiểm tra"}</div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span><b className="text-navy">{r.pacer_laps ?? "--"}</b> lượt</span>
                  <span><b className="text-navy">{r.pushup_count ?? "--"}</b> lần</span>
                  <span><b className="text-navy">{formatPlankTime(r.plank_seconds)}</b></span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-navy mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function NumField({ label, value, onChange, error, hint }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-navy">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`fg-input h-11 px-3 text-sm font-semibold text-navy tabular-nums ${error ? "border-[#C0392B]" : ""}`}
        style={error ? { borderColor: "#C0392B" } : {}}
      />
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="text-xs font-medium" style={{ color: "#C0392B" }}>{error}</span>}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-navy mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="fg-input w-full px-3 py-2.5 text-sm text-navy placeholder:text-muted-foreground/50 resize-none"
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