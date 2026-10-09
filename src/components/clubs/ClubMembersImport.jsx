// Thêm cả danh sách học viên CLB: dán từ Excel / Zalo hoặc tải file Excel, tự dò từng em trong dữ liệu học sinh,
// xem trước kết quả rồi mới lưu.
import { useMemo, useState } from "react";
import { FileSpreadsheet, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { addMembers, searchStudents } from "@/lib/clubs/api";
import { levelOfGrade, norm } from "@/lib/clubs/model";

const MAX_ROWS = 200;
const btnCls = "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold disabled:opacity-50";
const HEADER = /^(stt|h[oọ]\s*(v[aà]\s*)?t[eê]n|t[eê]n(\s*h[oọ]c\s*sinh)?|l[oớ]p|ghi\s*ch[uú])$/i;
const CLASS = /^\d{1,2}[a-z0-9]{0,5}$/i; // 6A1, 1OIC, 10C2
const MANUAL = "__manual__";

// Mỗi dòng (mảng ô) → { name, cls }. Bỏ STT, dòng tiêu đề, ô trống.
function toEntries(rows) {
  const out = [];
  const seen = new Set();
  for (const raw of rows) {
    const cells = raw.map((c) => String(c ?? "").trim()).filter(Boolean);
    if (!cells.length || cells.every((c) => HEADER.test(c))) continue;
    const rest = /^\d+[.)]?$/.test(cells[0]) ? cells.slice(1) : cells;
    const cell = rest.find((c) => /\p{L}/u.test(c) && !CLASS.test(c));
    const name = cell?.replace(/^\d+\s*[.)-]?\s+/, ""); // "2. Trần Bảo Ngọc"
    if (!name || norm(name).length < 2) continue;
    const cls = rest.find((c) => c !== cell && CLASS.test(c)) || "";
    const key = `${norm(name)}|${norm(cls)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name: name.replace(/\s+/g, " "), cls });
  }
  return out;
}

const parseText = (text) => toEntries(text.split(/\r?\n/).map((line) => line.split(/\t|;|,|\s{2,}/)));

async function parseFile(file) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return toEntries(XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false }));
}

// Dò một em: khớp đúng họ tên (không dấu), ưu tiên đúng lớp, rồi năm học mới nhất
async function matchOne(entry) {
  const rows = (await searchStudents(entry.name)).filter((s) => norm(s.full_name) === norm(entry.name));
  const byClass = entry.cls ? rows.filter((s) => norm(s.class_name) === norm(entry.cls)) : [];
  let candidates = byClass.length ? byClass : rows;
  if (candidates.length > 1) {
    const latest = candidates[0].school_year; // RPC trả về năm học mới nhất trước
    candidates = candidates.filter((s) => s.school_year === latest);
  }
  return { ...entry, candidates, choice: candidates.length === 1 ? candidates[0].id : candidates.length ? "" : MANUAL, include: true };
}

async function matchAll(entries, onProgress) {
  const out = [];
  for (let i = 0; i < entries.length; i += 6) {
    out.push(...(await Promise.all(entries.slice(i, i + 6).map(matchOne))));
    onProgress(out.length);
  }
  return out;
}

export default function ClubMembersImport({ club, members, onAdded }) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState(null); // kết quả dò
  const [progress, setProgress] = useState(null); // { done, total }
  const [saving, setSaving] = useState(false);
  const takenIds = useMemo(() => new Set(members.map((m) => m.student_id).filter(Boolean)), [members]);
  const takenNames = useMemo(() => new Set(members.filter((m) => !m.student_id).map((m) => norm(m.full_name))), [members]);

  const run = async (entries) => {
    if (!entries.length) {
      toast({ title: "Không đọc được tên học sinh nào", description: "Mỗi dòng một em: họ tên, có thể kèm lớp (vd: Nguyễn Minh An	6A1).", variant: "destructive" });
      return;
    }
    const list = entries.slice(0, MAX_ROWS);
    if (entries.length > MAX_ROWS) toast({ title: `Chỉ lấy ${MAX_ROWS} em đầu tiên`, description: "Thêm phần còn lại ở lượt sau." });
    setProgress({ done: 0, total: list.length });
    try {
      setRows(await matchAll(list, (done) => setProgress({ done, total: list.length })));
    } catch (err) {
      toast({ title: "Không dò được danh sách", description: err.message, variant: "destructive" });
    } finally {
      setProgress(null);
    }
  };

  const statusOf = (r) => {
    if (r.choice === MANUAL) return takenNames.has(norm(r.name)) ? "exists" : "manual";
    if (!r.choice) return "ambiguous";
    return takenIds.has(r.choice) ? "exists" : "linked";
  };
  const ready = (rows || []).filter((r) => r.include && ["linked", "manual"].includes(statusOf(r)));
  const counts = (rows || []).reduce((acc, r) => ((acc[statusOf(r)] = (acc[statusOf(r)] || 0) + 1), acc), {});

  const setRow = (i, patch) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const save = async () => {
    setSaving(true);
    try {
      const seenIds = new Set();
      const payload = [];
      for (const r of ready) {
        if (r.choice === MANUAL) {
          payload.push({ full_name: r.name, class_name: r.cls || null, grade: (r.cls.match(/^\d+/) || [null])[0] });
        } else if (!seenIds.has(r.choice)) {
          seenIds.add(r.choice);
          const s = r.candidates.find((c) => c.id === r.choice);
          payload.push({ student_id: s.id, full_name: s.full_name, class_name: s.class_name, grade: s.grade });
        }
      }
      await addMembers(club.id, payload);
      await onAdded();
      toast({ title: `Đã thêm ${payload.length} học viên vào CLB` });
      setRows(null);
      setText("");
    } catch (err) {
      toast({ title: "Không thêm được danh sách", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (progress) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-navy" aria-live="polite">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang dò trong dữ liệu học sinh… {progress.done}/{progress.total}
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="flex flex-col gap-3">
        <label htmlFor="bulk-text" className="text-sm text-muted-foreground">
          Dán danh sách, <b className="text-navy">mỗi dòng một em</b>: họ tên, có thể kèm lớp. Copy thẳng từ Excel hoặc tin nhắn Zalo đều được.
        </label>
        <textarea
          id="bulk-text"
          rows={7}
          className="fg-input w-full bg-white px-3 py-2 text-sm text-navy"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Nguyễn Minh An\t6A1\nTrần Bảo Ngọc\t6A1\nLê Gia Huy"}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={!text.trim()} onClick={() => run(parseText(text))} className={`${btnCls} bg-navy text-white hover:bg-navy/90`}>
            Kiểm tra danh sách
          </button>
          <label className={`${btnCls} cursor-pointer bg-white text-navy ring-1 ring-[rgba(38,39,93,0.12)] hover:bg-navy-soft`}>
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" /> Tải file Excel
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  await run(await parseFile(file));
                } catch (err) {
                  toast({ title: "Không đọc được file", description: err.message, variant: "destructive" });
                }
              }}
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">File Excel: lấy trang đầu tiên, cột họ tên và cột lớp (nếu có). Tối đa {MAX_ROWS} em mỗi lượt.</p>
      </div>
    );
  }

  const STATUS = {
    linked: { label: "Khớp dữ liệu trường", cls: "bg-emerald-50 text-emerald-700" },
    manual: { label: "Nhập tay (chưa có trong hệ thống)", cls: "bg-slate-100 text-slate-700" },
    ambiguous: { label: "Trùng tên — chọn đúng em", cls: "bg-amber-50 text-amber-800" },
    exists: { label: "Đã có trong CLB", cls: "bg-slate-100 text-muted-foreground" },
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-navy" aria-live="polite">
        Đọc được <b>{rows.length}</b> em: {counts.linked || 0} khớp dữ liệu trường, {counts.manual || 0} nhập tay
        {counts.ambiguous ? `, ${counts.ambiguous} trùng tên cần chọn` : ""}
        {counts.exists ? `, ${counts.exists} đã có trong CLB` : ""}.
      </p>
      <ul className="max-h-[420px] divide-y overflow-y-auto rounded-xl ring-1 ring-[rgba(38,39,93,0.08)]">
        {rows.map((r, i) => {
          const st = statusOf(r);
          const picked = r.candidates.find((c) => c.id === r.choice);
          const lv = levelOfGrade(picked?.grade ?? (r.cls.match(/^\d+/) || [null])[0]);
          const warn = lv && club.levels.length && !club.levels.includes(lv);
          return (
            <li key={`${r.name}|${r.cls}`} className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 ${st === "exists" || !r.include ? "opacity-60" : ""}`}>
              <input
                type="checkbox"
                aria-label={`Thêm ${r.name}`}
                checked={r.include && st !== "exists"}
                disabled={st === "exists"}
                onChange={(e) => setRow(i, { include: e.target.checked })}
                className="h-4 w-4 accent-[#26275D]"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy">
                  {r.name} {r.cls && <span className="font-normal text-muted-foreground">· {r.cls}</span>}
                </p>
                <p className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className={`rounded px-1.5 font-medium ${STATUS[st].cls}`}>{STATUS[st].label}</span>
                  {picked && st !== "ambiguous" && <span className="text-muted-foreground">{[picked.class_name && `Lớp ${picked.class_name}`, picked.school_year].filter(Boolean).join(" · ")}</span>}
                  {warn && (
                    <span className="inline-flex items-center gap-0.5 font-medium text-amber-700">
                      <TriangleAlert className="h-3 w-3" aria-hidden="true" /> Ngoài khối CLB
                    </span>
                  )}
                </p>
              </div>
              {r.candidates.length > 0 && st !== "exists" && (
                <select
                  aria-label={`Chọn học sinh cho ${r.name}`}
                  className="fg-input h-8 max-w-[220px] bg-white px-2 text-xs text-navy"
                  value={r.choice}
                  onChange={(e) => setRow(i, { choice: e.target.value })}
                >
                  {!r.choice && <option value="">— Chọn em nào —</option>}
                  {r.candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {[c.class_name && `Lớp ${c.class_name}`, c.birth_date && `SN ${String(c.birth_date).slice(0, 4)}`, c.school_year].filter(Boolean).join(" · ")}
                    </option>
                  ))}
                  <option value={MANUAL}>Nhập tay (không phải các em trên)</option>
                </select>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!ready.length || saving} onClick={save} className={`${btnCls} bg-navy text-white hover:bg-navy/90`}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Thêm {ready.length} em vào CLB
        </button>
        <button type="button" onClick={() => setRows(null)} disabled={saving} className={`${btnCls} text-navy hover:bg-navy-soft`}>
          Quay lại sửa danh sách
        </button>
      </div>
    </div>
  );
}
