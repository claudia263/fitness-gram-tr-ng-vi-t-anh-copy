// Trang Quản trị: email học sinh @student.truongvietanh.com — nhập danh sách, ghép vào học sinh, bật / tắt bắt buộc đăng nhập email.
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, FileSpreadsheet, Loader2, Lock, MailCheck } from "lucide-react";
import { supabase } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import { norm } from "@/lib/clubs/model";
import { campusLabel, campusesOf } from "@/lib/campus";
import { STUDENT_DOMAIN, isStudentEmail } from "@/lib/studentAuth";
import { track } from "@/lib/usage";

const CLASS = /^\d{1,2}[a-z][a-z0-9]{0,4}$/i; // 6A2, 1OIC, 10C2 (không nhầm với ngày sinh dạng số)

// Email học sinh: bỏ khoảng trắng / xuống dòng thừa, sửa lỗi thiếu dấu chấm "@studenttruongvietanh.com"
const cleanEmail = (e) => e.replace(/\s+/g, "").toLowerCase().replace(/@studenttruongvietanh\.com$/, `@${STUDENT_DOMAIN}`);

// Mỗi dòng (mảng ô) → { email, name, cls }. sheetClass: tên sheet là tên lớp (vd "6A2").
// Bỏ email cán bộ (@truongvietanh.com) ở các sheet phân công chủ nhiệm.
function toRows(rows, sheetClass = "") {
  const out = [];
  for (const raw of rows) {
    const cells = raw.map((c) => String(c ?? "").trim()).filter(Boolean);
    const found = cells.find((c) => c.includes("@"));
    if (!found) continue;
    const email = cleanEmail(found);
    if (email.endsWith("@truongvietanh.com")) continue;
    const rest = cells.filter((c) => !c.includes("@") && !/^\d+[.)]?$/.test(c));
    const cls = rest.find((c) => CLASS.test(c)) || sheetClass;
    const name = rest.find((c) => c !== cls && /\p{L}/u.test(c) && !CLASS.test(c)) || "";
    out.push({ email, name, cls });
  }
  return out;
}

async function readFile(file) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  // Lớp lấy từ tên sheet: "6A2" hoặc chữ cuối "EMAIL CỦA HS 3OIC"
  const sheetClass = (n) => n.trim().split(/\s+/).reverse().find((w) => CLASS.test(w)) || "";
  return wb.SheetNames.flatMap((n) => toRows(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: "", raw: false }), sheetClass(n)));
}

export default function StudentEmailPanel({ students, classes, onSaved }) {
  const [required, setRequired] = useState(null);
  const [text, setText] = useState("");
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const classById = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])), [classes]);
  const withEmail = students.filter((s) => s.email).length;
  const campuses = campusesOf(students);

  useEffect(() => {
    supabase.from("app_settings").select("value").eq("key", "student_login").maybeSingle().then(({ data }) => setRequired(data ? data.value === true : null));
  }, []);

  // Ghép email vào học sinh: đúng họ tên (không dấu), ưu tiên đúng lớp
  const matched = useMemo(() => {
    if (!rows) return null;
    // Khoá họ tên không dấu; khoá phụ không phụ thuộc thứ tự chữ ("LEAH NGUYỄN" = "Nguyễn Leah")
    const words = (n) => norm(n).split(/\s+/).sort().join(" ");
    const byName = new Map();
    const byWords = new Map();
    students.forEach((s) => {
      byName.set(norm(s.full_name), [...(byName.get(norm(s.full_name)) || []), s]);
      byWords.set(words(s.full_name), [...(byWords.get(words(s.full_name)) || []), s]);
    });
    const emailOwner = Object.fromEntries(students.filter((s) => s.email).map((s) => [s.email, s]));
    return rows.map((r) => {
      if (!isStudentEmail(r.email)) return { ...r, status: "bad_email" };
      let cands = byName.get(norm(r.name)) || byWords.get(words(r.name)) || [];
      // Ưu tiên đúng lớp; không có lớp trùng thì dùng tên (học sinh có thể đã chuyển lớp)
      if (r.cls) {
        const sameClass = cands.filter((s) => norm(classById[s.class_id]?.name) === norm(r.cls));
        if (sameClass.length || cands.length > 1) cands = sameClass;
      }
      if (cands.length !== 1) return { ...r, status: cands.length ? "ambiguous" : "not_found" };
      const s = cands[0];
      const owner = emailOwner[r.email];
      if (owner && owner.id !== s.id) return { ...r, student: s, status: "email_taken" };
      return { ...r, student: s, status: s.email === r.email ? "same" : "ok" };
    });
  }, [rows, students, classById]);
  const toSave = (matched || []).filter((m) => m.status === "ok");
  const count = (st) => (matched || []).filter((m) => m.status === st).length;

  const load = async (getRows) => {
    try {
      const r = await getRows();
      if (!r.length) toast({ title: "Không đọc được email nào", description: `Mỗi dòng cần có họ tên và email @${STUDENT_DOMAIN}, có thể kèm lớp.`, variant: "destructive" });
      setRows(r);
    } catch (e) {
      toast({ title: "Không đọc được file", description: e.message, variant: "destructive" });
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      for (let i = 0; i < toSave.length; i += 20) {
        const results = await Promise.all(toSave.slice(i, i + 20).map((m) => supabase.from("students").update({ email: m.email }).eq("id", m.student.id)));
        const err = results.find((r) => r.error)?.error;
        if (err) throw err;
      }
      track("nhap_email_hoc_sinh", { soLan: toSave.length });
      toast({ title: `Đã lưu email cho ${toSave.length} học sinh` });
      setRows(null);
      setText("");
      await onSaved();
    } catch (e) {
      toast({ title: "Lưu chưa xong", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const toggle = async () => {
    const next = !required;
    const missing = students.length - withEmail;
    if (next && missing > 0 && !window.confirm(`Còn ${missing} học sinh chưa có email — các em này sẽ KHÔNG xem được kết quả cho tới khi có email. Vẫn bật?`)) return;
    const { error } = await supabase.from("app_settings").upsert({ key: "student_login", value: next });
    if (error) return toast({ title: "Không đổi được", description: error.message, variant: "destructive" });
    setRequired(next);
    toast({ title: next ? "Đã bật: phụ huynh / học sinh phải đăng nhập email học sinh" : "Đã tắt: phụ huynh tra cứu bằng họ tên như cũ" });
  };

  return (
    <div className="fg-card p-5 sm:p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-navy flex items-center gap-2">
            <MailCheck className="w-4 h-4" /> Email học sinh & đăng nhập của phụ huynh
          </h3>
          <p className="text-xs text-muted-foreground">
            {withEmail}/{students.length} học sinh đã có email @{STUDENT_DOMAIN}
            {campuses.map((c) => ` · ${campusLabel(c)}: ${students.filter((s) => s.campus === c && s.email).length}/${students.filter((s) => s.campus === c).length}`).join("")}
          </p>
        </div>
        {required === null ? (
          <span className="text-xs text-muted-foreground">Chưa chạy migration 0009</span>
        ) : (
          <button type="button" role="switch" aria-checked={required} onClick={toggle} className="flex items-center gap-2 text-sm font-semibold text-navy">
            <Lock className="w-4 h-4" /> Bắt buộc đăng nhập email học sinh
            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${required ? "bg-emerald-600" : "bg-slate-300"}`}>
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${required ? "translate-x-5" : "translate-x-0.5"}`} />
            </span>
          </button>
        )}
      </div>

      {!matched ? (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Dán danh sách email học sinh"
            placeholder={`Dán danh sách (mỗi dòng: Họ tên, Lớp, Email) — VD:\nNguyễn Minh An\t6A2\tan.nguyen@${STUDENT_DOMAIN}`}
            className="fg-input w-full bg-white px-3 py-2 text-sm text-navy"
          />
          <div className="flex flex-row gap-2 lg:flex-col">
            <button type="button" disabled={!text.trim()} onClick={() => load(async () => toRows(text.split(/\r?\n/).map((l) => l.split(/\t|;|,/))))} className="fg-btn-secondary h-10 px-4 text-sm disabled:opacity-50">
              Kiểm tra danh sách
            </button>
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-navy ring-1 ring-[rgba(38,39,93,0.12)] hover:bg-navy-soft">
              <FileSpreadsheet className="w-4 h-4" /> Tải file Excel
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) load(() => readFile(f));
                }}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-navy">
            Đọc được <b>{matched.length}</b> dòng: <b className="text-emerald-700">{count("ok")} ghép được</b>
            {count("same") ? `, ${count("same")} đã có sẵn` : ""}
            {count("ambiguous") ? `, ${count("ambiguous")} trùng tên (cần thêm lớp)` : ""}
            {count("not_found") ? `, ${count("not_found")} không tìm thấy học sinh` : ""}
            {count("email_taken") ? `, ${count("email_taken")} email đã gán cho em khác` : ""}
            {count("bad_email") ? `, ${count("bad_email")} không phải email @${STUDENT_DOMAIN}` : ""}.
          </p>
          {matched.some((m) => !["ok", "same"].includes(m.status)) && (
            <details className="rounded-xl p-3 text-xs" style={{ background: "#F7F8FC" }}>
              <summary className="cursor-pointer font-semibold text-navy">
                <AlertCircle className="inline w-3.5 h-3.5 mr-1" /> Xem các dòng chưa ghép được
              </summary>
              <ul className="mt-2 max-h-48 overflow-y-auto space-y-0.5">
                {matched.filter((m) => !["ok", "same"].includes(m.status)).map((m, i) => (
                  <li key={i} className="text-navy">
                    {m.name || "(không có tên)"} {m.cls && `· ${m.cls}`} · {m.email} —{" "}
                    <span className="text-rose-700">
                      {{ ambiguous: "trùng tên, thêm lớp", not_found: "không tìm thấy học sinh", email_taken: "email đang gán cho em khác", bad_email: "sai đuôi email" }[m.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!toSave.length || busy} onClick={save} className="fg-btn-primary inline-flex h-10 items-center gap-2 px-5 text-sm disabled:opacity-60">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Lưu email cho {toSave.length} học sinh
            </button>
            <button type="button" disabled={busy} onClick={() => setRows(null)} className="h-10 rounded-xl px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
              Quay lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
