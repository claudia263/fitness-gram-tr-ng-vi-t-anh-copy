// Form Tổ trưởng nhập tay / sửa CLB và lịch sinh hoạt.
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Loader2, MapPin, Plus, Trash2, TriangleAlert, UserRound } from "lucide-react";
import { DOW_FULL, LEVELS, PLACES, ROLE_LABELS, SPORTS, SPORT_ORDER, WEEK_ORDER, findConflicts, nextMonday, norm, toMin, ymd } from "@/lib/clubs/model";

const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const inputCls = "fg-input h-10 w-full bg-white px-3 text-sm text-navy";

function fromClub(club, now) {
  if (!club) {
    return {
      name: "",
      sport: "football",
      levels: ["TH"],
      teacher_id: "",
      teacher_name: "",
      expected_size: 20,
      starts_on: ymd(nextMonday(now)),
      ends_on: "",
      note: "",
      slots: [{ dow: 1, start: "16:15", end: "17:30", place: "Sân bóng" }],
    };
  }
  return {
    name: club.name,
    sport: club.sport,
    levels: club.levels,
    teacher_id: club.teacher_id || "",
    teacher_name: club.teacher_name || "",
    expected_size: club.expected_size ?? "",
    starts_on: club.starts_on || "",
    ends_on: club.ends_on || "",
    note: club.note || "",
    slots: club.slots.map((s) => ({ dow: s.dow, start: s.start, end: s.end, place: s.place })),
  };
}

export default function ClubFormDialog({ open, club, clubs, staff, staffById, now, onClose, onSave }) {
  const [f, setF] = useState(() => fromClub(club, now));
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setSlot = (i, k, v) => setF((p) => ({ ...p, slots: p.slots.map((s, j) => (j === i ? { ...s, [k]: k === "dow" ? Number(v) : v } : s)) }));
  const addSlot = () =>
    setF((p) => {
      const used = new Set(p.slots.map((s) => s.dow));
      const last = p.slots[p.slots.length - 1] || { start: "16:15", end: "17:30", place: "Sân bóng" };
      return { ...p, slots: [...p.slots, { dow: WEEK_ORDER.find((d) => !used.has(d)) ?? 1, start: last.start, end: last.end, place: last.place }] };
    });
  const removeSlot = (i) => setF((p) => ({ ...p, slots: p.slots.filter((_, j) => j !== i) }));
  const toggleLevel = (k) => set("levels", f.levels.includes(k) ? f.levels.filter((x) => x !== k) : [...f.levels, k]);

  const errors = {};
  if (!f.name.trim()) errors.name = "Nhập tên CLB.";
  else if (clubs.some((c) => c.id !== club?.id && norm(c.name) === norm(f.name))) errors.name = "Đã có CLB trùng tên này.";
  if (!f.levels.length) errors.levels = "Chọn ít nhất một khối.";
  const size = f.expected_size === "" ? null : Number(f.expected_size);
  if (size !== null && (!Number.isFinite(size) || size < 1 || size > 200)) errors.size = "Sĩ số từ 1 đến 200.";
  if (f.ends_on && f.starts_on && f.ends_on < f.starts_on) errors.ends_on = "Ngày kết thúc phải sau ngày bắt đầu.";
  if (!f.slots.length) errors.slots = "Thêm ít nhất một buổi sinh hoạt.";
  const slotErrors = f.slots.map((s, i) => {
    if (!s.start || !s.end) return "Nhập đủ giờ bắt đầu và kết thúc.";
    if (toMin(s.end) <= toMin(s.start)) return "Giờ kết thúc phải sau giờ bắt đầu.";
    if (!s.place.trim()) return "Nhập địa điểm.";
    if (f.slots.findIndex((x) => x.dow === s.dow) !== i) return "Mỗi CLB chỉ có một buổi trong một ngày.";
    return null;
  });
  const hasErrors = Object.keys(errors).length > 0 || slotErrors.some(Boolean);
  const draft = { ...f, teacher_id: f.teacher_id || null, starts_on: f.starts_on || null, ends_on: f.ends_on || null };
  const conflicts = hasErrors ? [] : findConflicts(draft, clubs, club?.id, staffById);
  const teachers = staff.filter((p) => p.role !== "hr");

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) return;
    setSaving(true);
    setSaveError("");
    try {
      await onSave(
        {
          name: f.name.trim(),
          sport: f.sport,
          levels: f.levels,
          teacher_id: f.teacher_id || null,
          teacher_name: f.teacher_name.trim() || null,
          expected_size: size,
          starts_on: f.starts_on || null,
          ends_on: f.ends_on || null,
          note: f.note.trim() || null,
        },
        [...f.slots].sort((a, b) => WEEK_ORDER.indexOf(a.dow) - WEEK_ORDER.indexOf(b.dow))
      );
    } catch (err) {
      setSaveError(err?.message || "Không lưu được CLB.");
      setSaving(false);
    }
  };
  const err = (msg) => (touched && msg ? <p className="mt-1 text-xs font-medium text-rose-600">{msg}</p> : null);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-[22px] bg-white p-0 gap-0">
        <form onSubmit={submit} noValidate>
          <DialogHeader className="border-b px-5 py-4 text-left">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Tổ trưởng Tổ Thể dục</p>
            <DialogTitle className="text-xl font-extrabold text-navy">{club ? `Sửa CLB ${club.name}` : "Thêm CLB phát sinh"}</DialogTitle>
            <DialogDescription>CLB hiện trong thời khoá biểu từ ngày áp dụng. Giáo viên được gán tài khoản mới chụp được minh chứng.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 px-5 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="club-name" className={labelCls}>
                  Tên CLB
                </label>
                <input id="club-name" className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="VD: Cờ vua Tiểu học, Bóng bàn THCS" />
                {err(errors.name)}
              </div>
              <div>
                <label htmlFor="club-sport" className={labelCls}>
                  Môn
                </label>
                <select id="club-sport" className={inputCls} value={f.sport} onChange={(e) => set("sport", e.target.value)}>
                  {SPORT_ORDER.map((k) => (
                    <option key={k} value={k}>
                      {SPORTS[k].label}
                    </option>
                  ))}
                </select>
              </div>
              <fieldset>
                <legend className={labelCls}>Khối</legend>
                <div className="flex h-10 flex-wrap items-center gap-4">
                  {LEVELS.map((l) => (
                    <label key={l.key} htmlFor={`club-level-${l.key}`} className="inline-flex items-center gap-1.5 text-sm text-navy">
                      <input id={`club-level-${l.key}`} type="checkbox" checked={f.levels.includes(l.key)} onChange={() => toggleLevel(l.key)} className="h-4 w-4 accent-[#26275D]" />
                      {l.label}
                    </label>
                  ))}
                </div>
                {err(errors.levels)}
              </fieldset>
              <div>
                <label htmlFor="club-teacher-account" className={labelCls}>
                  Tài khoản giáo viên phụ trách
                </label>
                <select id="club-teacher-account" className={inputCls} value={f.teacher_id} onChange={(e) => set("teacher_id", e.target.value)}>
                  <option value="">Chưa gán tài khoản</option>
                  {teachers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.email} · {ROLE_LABELS[p.role]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="club-teacher-name" className={labelCls}>
                  Tên hiển thị trên lịch
                </label>
                <input id="club-teacher-name" className={inputCls} value={f.teacher_name} onChange={(e) => set("teacher_name", e.target.value)} placeholder="VD: Thầy Kiệt, GV thỉnh giảng" />
              </div>
              <div>
                <label htmlFor="club-size" className={labelCls}>
                  Sĩ số dự kiến
                </label>
                <input id="club-size" type="number" min="1" max="200" inputMode="numeric" className={inputCls} value={f.expected_size} onChange={(e) => set("expected_size", e.target.value)} />
                {err(errors.size)}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:col-span-1">
                <div>
                  <label htmlFor="club-from" className={labelCls}>
                    Áp dụng từ
                  </label>
                  <input id="club-from" type="date" className={inputCls} value={f.starts_on} onChange={(e) => set("starts_on", e.target.value)} />
                </div>
                <div>
                  <label htmlFor="club-to" className={labelCls}>
                    Đến ngày
                  </label>
                  <input id="club-to" type="date" className={inputCls} value={f.ends_on} onChange={(e) => set("ends_on", e.target.value)} />
                </div>
                <div className="col-span-2">{err(errors.ends_on)}</div>
              </div>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className={labelCls}>Lịch sinh hoạt hằng tuần</legend>
              {f.slots.map((s, i) => (
                <div key={i} className="rounded-2xl p-3" style={{ background: "#F7F8FC" }}>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-[110px_96px_96px_minmax(0,1fr)_40px]">
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor={`slot-${i}-dow`} className="sr-only">
                        Thứ
                      </label>
                      <select id={`slot-${i}-dow`} className={inputCls} value={s.dow} onChange={(e) => setSlot(i, "dow", e.target.value)}>
                        {WEEK_ORDER.map((d) => (
                          <option key={d} value={d}>
                            {DOW_FULL[d]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`slot-${i}-start`} className="sr-only">
                        Giờ bắt đầu
                      </label>
                      <input id={`slot-${i}-start`} type="time" step="300" className={inputCls} value={s.start} onChange={(e) => setSlot(i, "start", e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor={`slot-${i}-end`} className="sr-only">
                        Giờ kết thúc
                      </label>
                      <input id={`slot-${i}-end`} type="time" step="300" className={inputCls} value={s.end} onChange={(e) => setSlot(i, "end", e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor={`slot-${i}-place`} className="sr-only">
                        Địa điểm
                      </label>
                      <input id={`slot-${i}-place`} list="club-places" className={inputCls} value={s.place} onChange={(e) => setSlot(i, "place", e.target.value)} placeholder="Địa điểm" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSlot(i)}
                      disabled={f.slots.length === 1}
                      className="inline-flex h-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                      aria-label={`Xoá buổi ${DOW_FULL[s.dow]}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                  {err(slotErrors[i])}
                </div>
              ))}
              <datalist id="club-places">
                {PLACES.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              {err(errors.slots)}
              <button type="button" onClick={addSlot} disabled={f.slots.length >= 7} className="self-start inline-flex items-center gap-1.5 rounded-xl px-3 h-9 text-sm font-semibold text-navy ring-1 ring-[rgba(38,39,93,0.15)] hover:bg-navy-soft disabled:opacity-40">
                <Plus className="w-4 h-4" aria-hidden="true" /> Thêm buổi
              </button>
            </fieldset>

            <div>
              <label htmlFor="club-note" className={labelCls}>
                Ghi chú
              </label>
              <textarea id="club-note" rows={2} className="fg-input w-full bg-white px-3 py-2 text-sm text-navy" value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="Lý do mở, HLV, đơn giá…" />
            </div>

            {conflicts.length > 0 && (
              <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200">
                <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-amber-900">
                  <TriangleAlert className="w-4 h-4" aria-hidden="true" /> Trùng lịch với CLB đang có
                </p>
                <ul className="flex flex-col gap-1 text-sm text-amber-900">
                  {conflicts.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      {c.type === "teacher" ? <UserRound className="mt-0.5 w-3.5 h-3.5 shrink-0" aria-hidden="true" /> : <MapPin className="mt-0.5 w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                      {c.text}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-amber-800">Vẫn lưu được nếu đã sắp xếp được sân hoặc giáo viên.</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t px-5 py-4">
            {(touched && hasErrors) || saveError ? <p className="mr-auto text-sm font-medium text-rose-600">{saveError || "Còn thông tin chưa hợp lệ."}</p> : null}
            <button type="button" onClick={onClose} className="h-10 rounded-xl px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
              Huỷ
            </button>
            <button type="submit" disabled={saving} className="fg-btn-primary inline-flex h-10 items-center gap-1.5 px-4 text-sm disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Check className="w-4 h-4" aria-hidden="true" />}
              {conflicts.length > 0 ? "Lưu dù trùng lịch" : club ? "Lưu thay đổi" : "Thêm CLB"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
