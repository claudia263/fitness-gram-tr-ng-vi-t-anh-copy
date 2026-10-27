import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { importFitnessExcel } from "@/lib/importFitnessExcel";
import { base44 } from "@/api/base44Client";
import PageTransition from "@/components/fg/PageTransition";
import AdminExplorer from "@/components/fg/AdminExplorer";
import StudentEmailPanel from "@/components/fg/StudentEmailPanel";
import { track, useTrackView } from "@/lib/usage";
import { campusLabel, campusesOf, sessionDateRange } from "@/lib/campus";
import { Users, School, ClipboardList, Plus, Loader2, CheckCircle2, UploadCloud, AlertCircle, FileSpreadsheet, ClipboardCheck, Pencil } from "lucide-react";

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [measured, setMeasured] = useState({}); // session_id → Set(student_id) đã có kết quả
  const [loading, setLoading] = useState(true);
  useTrackView("xem_quan_tri");
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [explorer, setExplorer] = useState(null); // null | "students" | "classes"

  const loadAll = async () => {
    const [st, cl, se, fi, an] = await Promise.all([
      base44.entities.Student.list(null, 20000),
      base44.entities.Class.list(null, 2000),
      base44.entities.TestSession.list("-test_date", 500),
      base44.entities.FitnessResult.list(null, 50000),
      base44.entities.AnthropometricResult.list(null, 50000),
    ]);
    const m = {};
    [...fi, ...an].forEach((r) => (m[r.session_id] = m[r.session_id] || new Set()).add(r.student_id));
    setStudents(st);
    setClasses(cl.sort((a, b) => campusLabel(a.campus).localeCompare(campusLabel(b.campus), "vi") || (Number(a.grade) || 0) - (Number(b.grade) || 0) || (a.name || "").localeCompare(b.name || "")));
    setSessions(se);
    setMeasured(m);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const campuses = useMemo(() => campusesOf(students, classes, sessions), [students, classes, sessions]);
  const latestYear = useMemo(() => [...new Set(sessions.map((s) => s.school_year))].sort().pop() || null, [sessions]);

  // Gom đợt: (năm học, đợt số) → các lần đo của từng cơ sở
  const rounds = useMemo(() => {
    const map = new Map();
    for (const s of sessions) {
      const key = `${s.school_year}|${s.round_no ?? "?"}`;
      if (!map.has(key)) map.set(key, { key, school_year: s.school_year, round_no: s.round_no, semester: s.semester, sessions: [] });
      map.get(key).sessions.push(s);
    }
    return [...map.values()].sort((a, b) => (b.school_year || "").localeCompare(a.school_year || "") || (b.round_no ?? 0) - (a.round_no ?? 0));
  }, [sessions]);
  const yearRounds = rounds.filter((r) => r.school_year === latestYear);
  const latestRound = yearRounds[0] || null;

  const byCampus = (list) => campuses.map((c) => ({ label: campusLabel(c), value: list.filter((x) => x.campus === c).length }));
  const measuredInRound = (round, campus) =>
    round ? round.sessions.filter((s) => !campus || s.campus === campus).reduce((n, s) => n + (measured[s.id]?.size || 0), 0) : 0;

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#26275D", color: "#F9DD0E" }}>
            <School className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">Admin</h1>
            <p className="text-sm text-muted-foreground">
              Tổng quan hệ thống Fitness Gram — Trường Việt Anh · {campuses.length} cơ sở{latestYear ? ` · Năm học ${latestYear}` : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="fg-skeleton" style={{ height: 150, borderRadius: 22 }} />)}
          </div>
        ) : (
          <>
            {/* Tổng toàn hệ thống, chia theo cơ sở */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard icon={Users} label="Học sinh toàn hệ thống" value={students.length} lines={byCampus(students)} onClick={() => setExplorer("students")} clickable />
              <StatCard icon={School} label="Lớp học" value={classes.length} lines={byCampus(classes)} onClick={() => setExplorer("classes")} clickable />
              <StatCard
                icon={ClipboardList}
                label={`Đợt kiểm tra${latestYear ? ` · ${latestYear}` : ""}`}
                value={`${yearRounds.length} đợt`}
                lines={campuses.map((c) => {
                  const s = latestRound?.sessions.find((x) => x.campus === c);
                  return { label: campusLabel(c), value: s ? `Đợt ${latestRound.round_no ?? "?"} · ${sessionDateRange(s)}` : "Chưa đo" };
                })}
              />
              <StatCard
                icon={ClipboardCheck}
                label={latestRound ? `Đã có kết quả · Đợt ${latestRound.round_no ?? "?"}` : "Đã có kết quả"}
                value={`${measuredInRound(latestRound)}/${students.length}`}
                lines={campuses.map((c) => ({ label: campusLabel(c), value: `${measuredInRound(latestRound, c)}/${students.filter((x) => x.campus === c).length}` }))}
              />
            </div>

            <StudentEmailPanel students={students} classes={classes} onSaved={loadAll} />

            {/* Đợt kiểm tra: mỗi đợt chung của năm học, chia theo cơ sở */}
            <div className="fg-card p-5 sm:p-6 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-navy">Quản lý đợt kiểm tra</h3>
                  <p className="text-xs text-muted-foreground">Mỗi đợt đo chung của năm học, chia theo từng cơ sở</p>
                </div>
                <button onClick={() => setShowSessionForm((s) => !s)} className="fg-btn-secondary flex items-center gap-2 px-4 h-10 text-sm">
                  <Plus className="w-4 h-4" /> Tạo đợt / nhập dữ liệu cơ sở
                </button>
              </div>
              {showSessionForm && <SessionForm campuses={campuses} sessions={sessions} latestYear={latestYear} onCreated={() => { setShowSessionForm(false); loadAll(); }} />}
              {rounds.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có đợt kiểm tra nào.</p>
              ) : (
                <div className="space-y-4">
                  {rounds.map((r) => {
                    const done = campuses.filter((c) => r.sessions.some((s) => s.campus === c));
                    return (
                      <div key={r.key} className="rounded-2xl p-4" style={{ background: "#F7F8FC" }}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                          <div className="font-bold text-navy">
                            {r.round_no ? `Đợt ${r.round_no}` : "Chưa xếp đợt"} <span className="font-medium text-muted-foreground text-sm">· {r.semester} · Năm học {r.school_year}</span>
                          </div>
                          <span className="text-xs font-semibold text-navy">{done.length}/{campuses.length} cơ sở đã đo</span>
                        </div>
                        <div className="space-y-2">
                          {r.sessions.map((s) => (
                            <div key={s.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl bg-white px-4 py-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-navy text-sm">{campusLabel(s.campus)}</div>
                                <div className="text-xs text-muted-foreground truncate">{s.name}</div>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-semibold text-navy tabular-nums">{sessionDateRange(s)}</span>
                                <span className="text-xs text-muted-foreground tabular-nums">{measured[s.id]?.size || 0} học sinh có kết quả</span>
                                <Link to="/admin/du-lieu?bang=test_sessions" title="Sửa đợt (ngày, cơ sở, đợt số)" aria-label={`Sửa đợt ${s.name}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-navy-soft hover:text-navy">
                                  <Pencil className="w-4 h-4" />
                                </Link>
                              </div>
                            </div>
                          ))}
                          {campuses.filter((c) => !done.includes(c)).map((c) => (
                            <div key={c} className="rounded-xl px-4 py-2.5 text-sm text-muted-foreground" style={{ border: "1px dashed rgba(38,39,93,0.18)" }}>
                              {campusLabel(c)} — chưa đo đợt này
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ListCard title="Học sinh" icon={Users} items={students.map((s) => ({ id: s.id, primary: s.full_name, secondary: `${campusLabel(s.campus)} · Lớp ${s.grade} · ${s.sex === "female" ? "Nữ" : "Nam"}` }))} />
              <ListCard title="Lớp học" icon={School} items={classes.map((c) => ({ id: c.id, primary: c.name, secondary: `${campusLabel(c.campus)} · Khối ${c.grade} · ${c.school_year}` }))} />
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

// Đợt số gợi ý: đợt mới nhất của năm học mà cơ sở này chưa đo, nếu không có thì đợt kế tiếp
function suggestRound(sessions, year, campus) {
  const inYear = sessions.filter((s) => s.school_year === year && s.round_no);
  const max = Math.max(0, ...inYear.map((s) => s.round_no));
  if (!max) return 1;
  return inYear.some((s) => s.round_no === max && s.campus === campus) ? max + 1 : max;
}

function SessionForm({ campuses, sessions, latestYear, onCreated }) {
  const year0 = latestYear || "2026–2027";
  const [form, setForm] = useState(() => ({ name: "", test_date: "", end_date: "", semester: "Học kỳ I", school_year: year0, campus: campuses[0] || "", round_no: String(suggestRound(sessions, year0, campuses[0] || "")), notes: "" }));
  const [customCampus, setCustomCampus] = useState(campuses.length === 0);
  const setCampus = (campus) => setForm((f) => ({ ...f, campus, round_no: String(suggestRound(sessions, f.school_year, campus)) }));
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const canCreate = form.name && form.test_date && form.campus.trim() && (!form.end_date || form.end_date >= form.test_date);
  const sessionMeta = { campus: form.campus.trim(), round_no: form.round_no ? Number(form.round_no) : null, end_date: form.end_date || null };

  const runImport = async () => {
    if (!canCreate || !file) return;
    setBusy(true);
    setError("");
    setDone(null);
    try {
      const res = await importFitnessExcel(file, {
        ...sessionMeta,
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
        ...sessionMeta,
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
            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Cơ sở</label>
              {customCampus ? (
                <input value={form.campus} onChange={(e) => setCampus(e.target.value)} placeholder="VD: CS BT" className="fg-input w-full h-11 px-3 text-sm font-medium text-navy" />
              ) : (
                <select value={form.campus} onChange={(e) => (e.target.value === "__new__" ? (setCustomCampus(true), setCampus("")) : setCampus(e.target.value))} className="fg-input w-full h-11 px-3 text-sm font-medium text-navy bg-white">
                  {campuses.map((c) => (
                    <option key={c} value={c}>{campusLabel(c)} ({c})</option>
                  ))}
                  <option value="__new__">+ Cơ sở khác…</option>
                </select>
              )}
            </div>
            <Input label="Đợt số (chung cho các cơ sở)" type="number" value={form.round_no} onChange={(v) => setForm({ ...form, round_no: v })} placeholder="1" />
            <Input label="Tên đợt kiểm tra" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="VD: Kiểm tra Fitness Đợt 1 – CS Gò Vấp" />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Từ ngày" type="date" value={form.test_date} onChange={(v) => setForm({ ...form, test_date: v })} />
              <Input label="Đến ngày" type="date" value={form.end_date} onChange={(v) => setForm({ ...form, end_date: v })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5">Học kỳ</label>
              <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="fg-input w-full h-11 px-3 text-sm font-medium text-navy bg-white">
                <option>Học kỳ I</option>
                <option>Học kỳ II</option>
              </select>
            </div>
            <Input label="Năm học" value={form.school_year} onChange={(v) => setForm({ ...form, school_year: v })} />
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

function StatCard({ icon: Icon, label, value, lines = [], onClick, clickable }) {
  const Comp = clickable ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`fg-card p-5 text-left w-full ${clickable ? "fg-card-hover cursor-pointer" : ""}`}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#F9DD0E", color: "#26275D" }}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-3xl font-extrabold text-navy tabular-nums">{value}</div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</div>
      {lines.length > 0 && (
        <div className="mt-3 space-y-1 border-t pt-2.5" style={{ borderColor: "rgba(38,39,93,0.08)" }}>
          {lines.map((l) => (
            <div key={l.label} className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-muted-foreground truncate">{l.label}</span>
              <span className="font-bold text-navy tabular-nums whitespace-nowrap">{l.value}</span>
            </div>
          ))}
        </div>
      )}
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