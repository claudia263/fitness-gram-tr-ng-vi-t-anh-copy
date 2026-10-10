import { useEffect, useState, useRef } from "react";
import { importFitnessExcel } from "@/lib/importFitnessExcel";
import { base44 } from "@/api/base44Client";
import PageTransition from "@/components/fg/PageTransition";
import AdminExplorer from "@/components/fg/AdminExplorer";
import { track, useTrackView } from "@/lib/usage";
import { Users, GraduationCap, School, ClipboardList, Plus, Loader2, CheckCircle2, UploadCloud, AlertCircle, FileSpreadsheet } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, sessions: 0, fitness: 0, anthro: 0 });
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  useTrackView("xem_quan_tri");
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [explorer, setExplorer] = useState(null); // null | "students" | "classes"

  const loadAll = async () => {
    const [st, te, cl, se, fi, an] = await Promise.all([
      base44.entities.Student.list(null, 2000),
      base44.entities.Teacher.list(null, 500),
      base44.entities.Class.list(null, 500),
      base44.entities.TestSession.list("-test_date", 500),
      base44.entities.FitnessResult.list(null, 1),
      base44.entities.AnthropometricResult.list(null, 1),
    ]);
    setStudents(st);
    setTeachers(te);
    setClasses(cl.sort((a, b) => (a.grade || "").localeCompare(b.grade || "") || (a.name || "").localeCompare(b.name || "")));
    setSessions(se);
    setStats({ students: st.length, teachers: te.length, classes: cl.length, sessions: se.length, fitness: fi.length, anthro: an.length });
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#26275D", color: "#F9DD0E" }}>
            <School className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">Admin</h1>
            <p className="text-sm text-muted-foreground">Tổng quan hệ thống Fitness Gram — Trường Việt Anh</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="fg-skeleton" style={{ height: 110, borderRadius: 22 }} />)}
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard icon={Users} label="Học sinh" value={stats.students} onClick={() => setExplorer("students")} clickable />
              <StatCard icon={GraduationCap} label="Giáo viên" value={stats.teachers} />
              <StatCard icon={School} label="Lớp học" value={stats.classes} onClick={() => setExplorer("classes")} clickable />
              <StatCard icon={ClipboardList} label="Đợt kiểm tra" value={stats.sessions} />
            </div>

            {/* Create session */}
            <div className="fg-card p-5 sm:p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-navy">Quản lý đợt kiểm tra</h3>
                <button
                  onClick={() => setShowSessionForm((s) => !s)}
                  className="fg-btn-secondary flex items-center gap-2 px-4 h-10 text-sm"
                >
                  <Plus className="w-4 h-4" /> Tạo đợt kiểm tra
                </button>
              </div>
              {showSessionForm && <SessionForm onCreated={() => { setShowSessionForm(false); loadAll(); }} />}
              <div className="space-y-2 mt-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ListCard title="Học sinh" icon={Users} items={students.map((s) => ({ id: s.id, primary: s.full_name, secondary: `Lớp ${s.grade} · ${s.sex === "female" ? "Nữ" : "Nam"}` }))} />
              <ListCard title="Giáo viên" icon={GraduationCap} items={teachers.map((t) => ({ id: t.id, primary: t.full_name, secondary: t.email }))} />
              <ListCard title="Lớp học" icon={School} items={classes.map((c) => ({ id: c.id, primary: c.name, secondary: `Khối ${c.grade} · ${c.school_year}${c.campus ? " · " + c.campus : ""}` }))} />
            </div>
          </>
        )}

        <AdminExplorer
          open={!!explorer}
          type={explorer}
          students={students}
          classes={classes}
          sessions={sessions}
          onClose={() => setExplorer(null)}
          onRefresh={loadAll}
        />
      </div>
    </PageTransition>
  );
}

function SessionForm({ onCreated }) {
  const [form, setForm] = useState({ name: "", test_date: "", semester: "Học kỳ I", school_year: "2026–2027", campus: "", notes: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const canCreate = form.name && form.test_date;

  const runImport = async () => {
    if (!canCreate || !file) return;
    setBusy(true);
    setError("");
    setDone(null);
    try {
      const res = await importFitnessExcel(file, {
        campus: form.campus || "CS GVP",
        school_year: form.school_year,
        session_name: form.name,
        test_date: form.test_date,
        semester: form.semester,
        notes: form.notes || "Import tự động từ file Excel",
      }, base44.entities);
      setDone(res);
      track("nhap_excel_the_luc", { soLan: Math.max(1, (res?.fitness || 0) + (res?.anthropometric || 0)), chiTiet: { dot: form.name, hoc_sinh: res?.students } });
      setTimeout(() => onCreated(), 1200);
    } catch (err) {
      setError(err?.message || "Không thể nhập dữ liệu.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
      setFile(null);
    }
  };

  const createOnly = async () => {
    if (!canCreate) return;
    setBusy(true);
    setError("");
    try {
      await base44.entities.TestSession.create({
        name: form.name,
        test_date: form.test_date,
        semester: form.semester,
        school_year: form.school_year,
        notes: form.notes,
      });
      setDone({ createOnly: true });
      setTimeout(() => onCreated(), 900);
    } catch (err) {
      setError(err?.message || "Không thể tạo đợt kiểm tra.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: "#F7F8FC" }}>
      {done ? (
        <div className="flex items-start gap-2.5 py-2">
          <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#16a34a" }} />
          <div className="text-sm">
            <div className="font-semibold text-navy">{done.createOnly ? "Đã tạo đợt kiểm tra mới." : "Nhập dữ liệu thành công"}</div>
            {!done.createOnly && (
              <div className="text-muted-foreground mt-0.5">
                {done.students} học sinh · {done.fitness} kết quả thể lực · {done.anthropometric} thể trạng
                {done.skipped > 0 ? ` · ${done.skipped} dòng trống đã bỏ qua` : ""}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Tên đợt kiểm tra" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="VD: Đợt kiểm tra HKI 2026-2027" />
            <Input label="Ngày kiểm tra" type="date" value={form.test_date} onChange={(v) => setForm({ ...form, test_date: v })} />
            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Học kỳ</label>
              <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="fg-input w-full h-11 px-3 text-sm font-medium text-navy bg-white">
                <option>Học kỳ I</option>
                <option>Học kỳ II</option>
              </select>
            </div>
            <Input label="Năm học" value={form.school_year} onChange={(v) => setForm({ ...form, school_year: v })} />
            <Input label="Cơ sở" value={form.campus} onChange={(v) => setForm({ ...form, campus: v })} placeholder="VD: CS GVP" />
            <div className="sm:col-span-2">
              <Input label="Ghi chú" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Ghi chú (tùy chọn)" />
            </div>
          </div>

          {/* Excel import */}
          <div className="mt-4 rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px dashed rgba(38,39,93,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="w-4 h-4 text-navy" />
              <span className="text-sm font-semibold text-navy">File dữ liệu Excel</span>
              <span className="text-xs text-muted-foreground">(mỗi sheet là một lớp)</span>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="fg-btn-secondary w-full flex items-center justify-center gap-2 px-4 h-11 text-sm disabled:opacity-60"
            >
              <UploadCloud className="w-4 h-4" /> {file ? file.name : "Chọn file Excel (.xlsx)"}
            </button>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Cột FitnessGram: Tên học sinh, Giới tính, Ngày sinh, Chiều Cao, Cân nặng, Pacer, Sit and Reach, Push-up, Plank. Cột Bộ GD&ĐT (nếu có): Bật xa tại chỗ, Chạy tùy sức 5 phút, Nằm ngửa gập bụng, Chạy 30m (thêm Lực bóp tay, Chạy con thoi 4x10m nếu đo).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              onClick={runImport}
              disabled={busy || !canCreate || !file}
              className="fg-btn-primary flex-1 h-11 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</> : <><UploadCloud className="w-4 h-4" /> Tạo đợt & Nhập dữ liệu</>}
            </button>
            <button
              onClick={createOnly}
              disabled={busy || !canCreate}
              className="fg-btn-secondary px-5 h-11 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Chỉ tạo đợt
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-xl p-3 flex items-start gap-2.5" style={{ background: "rgba(232, 93, 74, 0.08)" }}>
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#E85D4A" }} />
              <div className="text-sm">
                <div className="font-semibold text-navy">Lỗi</div>
                <div className="text-muted-foreground mt-0.5">{error}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-navy mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="fg-input w-full h-11 px-3 text-sm font-medium text-navy" />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, onClick, clickable }) {
  const Comp = clickable ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`fg-card p-5 text-left w-full ${clickable ? "fg-card-hover cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#F9DD0E", color: "#26275D" }}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-3xl font-extrabold text-navy tabular-nums">{value}</div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</div>
    </Comp>
  );
}

function ListCard({ title, icon: Icon, items }) {
  return (
    <div className="fg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-navy" />
        <h3 className="font-bold text-navy">{title} ({items.length})</h3>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className="py-2.5 px-3 rounded-xl" style={{ background: "#F7F8FC" }}>
              <div className="text-sm font-semibold text-navy">{it.primary}</div>
              <div className="text-xs text-muted-foreground">{it.secondary}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return "--";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}