// Mô hình CLB: môn, khối, lịch sinh hoạt và các phép tính trên lịch.
// Một CLB ở phía giao diện: { id, name, sport, levels, teacher_name, teacher_id, expected_size,
//   starts_on, ends_on, note, source, slots: [{ dow, start: "HH:MM", end: "HH:MM", place }] }

export const STAFF_ROLES = ["admin", "lead", "hr", "teacher"];
export const ROLE_LABELS = { admin: "Quản trị", lead: "Tổ trưởng Tổ Thể dục", hr: "Phòng Nhân sự", teacher: "Giáo viên" };
export const CLUB_MANAGERS = ["admin", "lead"];
export const REVIEWERS = ["admin", "hr"];

// Màu từng môn theo quy ước màu trong TKB CLB của trường
export const TONES = {
  cyan: { text: "text-cyan-700", soft: "bg-cyan-50", chip: "bg-cyan-100 text-cyan-800", cell: "bg-cyan-100 text-cyan-950 ring-cyan-300 hover:bg-cyan-200" },
  fuchsia: { text: "text-fuchsia-700", soft: "bg-fuchsia-50", chip: "bg-fuchsia-100 text-fuchsia-800", cell: "bg-fuchsia-100 text-fuchsia-950 ring-fuchsia-300 hover:bg-fuchsia-200" },
  green: { text: "text-green-700", soft: "bg-green-50", chip: "bg-green-100 text-green-800", cell: "bg-green-100 text-green-950 ring-green-300 hover:bg-green-200" },
  orange: { text: "text-orange-700", soft: "bg-orange-50", chip: "bg-orange-100 text-orange-800", cell: "bg-orange-100 text-orange-950 ring-orange-300 hover:bg-orange-200" },
  yellow: { text: "text-yellow-700", soft: "bg-yellow-50", chip: "bg-yellow-100 text-yellow-900", cell: "bg-yellow-100 text-yellow-950 ring-yellow-300 hover:bg-yellow-200" },
  blue: { text: "text-blue-700", soft: "bg-blue-50", chip: "bg-blue-100 text-blue-800", cell: "bg-blue-100 text-blue-950 ring-blue-300 hover:bg-blue-200" },
  slate: { text: "text-slate-700", soft: "bg-slate-100", chip: "bg-slate-200 text-slate-800", cell: "bg-slate-200 text-slate-900 ring-slate-300 hover:bg-slate-300" },
};

export const SPORTS = {
  football: { label: "Bóng đá", tone: "cyan" },
  volleyball: { label: "Bóng chuyền", tone: "fuchsia" },
  badminton: { label: "Cầu lông", tone: "green" },
  basketball: { label: "Bóng rổ", tone: "orange" },
  bjj: { label: "Võ BJJ", tone: "yellow" },
  dance: { label: "Nhảy hiện đại", tone: "blue" },
  other: { label: "Môn khác", tone: "slate" },
};
export const SPORT_ORDER = ["football", "volleyball", "badminton", "basketball", "bjj", "dance", "other"];
export const toneOf = (club) => TONES[SPORTS[club.sport]?.tone || "slate"];

export const LEVELS = [
  { key: "TH", label: "Tiểu học" },
  { key: "THCS", label: "THCS" },
  { key: "THPT", label: "THPT" },
];
export const levelLabel = (levels = []) => LEVELS.filter((l) => levels.includes(l.key)).map((l) => l.label).join(" · ");

export const DOW_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
export const DOW_FULL = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
export const DOW_WORD = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const PLACES = ["Sân bóng", "Lầu 5", "Sàn võ", "Phòng Dance"];
export const UNASSIGNED = "Chưa phân công GV";
export const REJECT_REASONS = [
  "Ảnh mờ, không nhận rõ học viên",
  "Không thấy hoạt động tập luyện",
  "Chụp ngoài khung giờ sinh hoạt",
  "Chụp ngoài khuôn viên trường",
  "Thiếu ảnh toàn cảnh buổi tập",
];

/* ------------------------------ ngày giờ ------------------------------ */
export const pad = (n) => String(n).padStart(2, "0");
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const fmtDate = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
export const fmtShortDate = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
export const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
export const fmtHm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const toMin = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};
export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
export const schoolYear = (d) => (d.getMonth() >= 7 ? `${d.getFullYear()}–${d.getFullYear() + 1}` : `${d.getFullYear() - 1}–${d.getFullYear()}`);
export const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
export const nextMonday = (now) => {
  const d = startOfDay(now);
  d.setDate(d.getDate() + (((8 - d.getDay()) % 7) || 7));
  return d;
};
export function durationText(ms) {
  const mins = Math.max(0, Math.round(ms / 60000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d} ngày ${h} giờ`;
  if (h > 0) return `${h} giờ ${m} phút`;
  return `${m} phút`;
}

/* ------------------------------ lịch sinh hoạt ------------------------------ */
export const teacherOf = (club, staffById) => (club.teacher_id && staffById?.[club.teacher_id]?.full_name) || club.teacher_name || UNASSIGNED;

export const isActiveOn = (club, date) => {
  const k = ymd(date);
  return (!club.starts_on || k >= club.starts_on) && (!club.ends_on || k <= club.ends_on);
};
export const slotFor = (club, date) => (isActiveOn(club, date) ? club.slots.find((s) => s.dow === date.getDay()) || null : null);

function atTime(date, hhmm) {
  const d = new Date(date);
  const m = toMin(hhmm);
  d.setHours(Math.floor(m / 60), m % 60, 0, 0);
  return d;
}
export const hasStarted = (date, slot, now) => atTime(date, slot.start) <= now;

// Các buổi theo lịch trong tháng đã bắt đầu tính tới `now`
export function scheduledInMonth(club, year, month, now) {
  const out = [];
  const last = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= last; day++) {
    const d = new Date(year, month, day);
    const slot = slotFor(club, d);
    if (slot && hasStarted(d, slot, now)) out.push({ date: ymd(d), d, slot });
  }
  return out;
}

export function nextSession(club, now) {
  for (let i = 0; i < 70; i++) {
    const d = startOfDay(now);
    d.setDate(d.getDate() + i);
    const slot = slotFor(club, d);
    if (!slot) continue;
    const start = atTime(d, slot.start);
    const end = atTime(d, slot.end);
    if (now < end) return { d, slot, start, end, live: now >= start };
  }
  return null;
}

export function groupSlots(slots) {
  const groups = [];
  for (const s of slots) {
    const g = groups.find((x) => x.start === s.start && x.end === s.end && x.place === s.place);
    if (g) g.days.push(s.dow);
    else groups.push({ ...s, days: [s.dow] });
  }
  return groups;
}

// Ảnh chụp có nằm trong khung giờ sinh hoạt (±15 phút) không
export function checkTime(club, at) {
  const t = new Date(at);
  const slot = slotFor(club, t);
  if (!slot) return { ok: false, label: "Ngoài lịch sinh hoạt" };
  const m = t.getHours() * 60 + t.getMinutes();
  if (m < toMin(slot.start) - 15 || m > toMin(slot.end) + 15) return { ok: false, label: "Ngoài khung giờ" };
  return { ok: true, label: "Đúng khung giờ" };
}

const overlapsTime = (a, b) => toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);
const overlapsRange = (aFrom, aTo, bFrom, bTo) => (aFrom || "0000") <= (bTo || "9999") && (bFrom || "0000") <= (aTo || "9999");

// Trùng sân hoặc trùng giáo viên với CLB đang có (chỉ cảnh báo, không chặn)
export function findConflicts(draft, clubs, ignoreId, staffById) {
  const out = [];
  const draftTeacher = draft.teacher_id ? staffById?.[draft.teacher_id]?.full_name || "" : draft.teacher_name || "";
  const guest = !draftTeacher || /thỉnh giảng/i.test(draftTeacher);
  for (const slot of draft.slots) {
    if (!slot.start || !slot.end || toMin(slot.end) <= toMin(slot.start)) continue;
    for (const c of clubs) {
      if (c.id === ignoreId || !overlapsRange(draft.starts_on, draft.ends_on, c.starts_on, c.ends_on)) continue;
      for (const s of c.slots) {
        if (s.dow !== Number(slot.dow) || !overlapsTime(s, slot)) continue;
        if (slot.place && norm(s.place) === norm(slot.place)) {
          out.push({ type: "place", text: `${DOW_FULL[s.dow]} ${slot.start}–${slot.end}: ${s.place} đang có ${c.name} (${s.start}–${s.end}). Kiểm tra còn sân trống.` });
        }
        const same = draft.teacher_id ? c.teacher_id === draft.teacher_id : norm(teacherOf(c, staffById)) === norm(draftTeacher);
        if (!guest && same) out.push({ type: "teacher", text: `${draftTeacher} đang phụ trách ${c.name} ${DOW_FULL[s.dow]} ${s.start}–${s.end}.` });
      }
    }
  }
  return out;
}

const PLACE_ORDER = PLACES;
// Hàng = (địa điểm, khung giờ); cột = thứ — giống bảng TKB của trường
export function buildTimetable(clubs) {
  const rows = [];
  for (const c of clubs) {
    for (const s of c.slots) {
      let row = rows.find((r) => r.place === s.place && r.start === s.start && r.end === s.end);
      if (!row) {
        row = { key: `${s.place}|${s.start}|${s.end}`, place: s.place, start: s.start, end: s.end, cells: {} };
        rows.push(row);
      }
      (row.cells[s.dow] = row.cells[s.dow] || []).push(c);
    }
  }
  const rank = (p) => (PLACE_ORDER.indexOf(p) === -1 ? 99 : PLACE_ORDER.indexOf(p));
  rows.sort((a, b) => rank(a.place) - rank(b.place) || a.place.localeCompare(b.place, "vi") || toMin(a.start) - toMin(b.start) || toMin(a.end) - toMin(b.end));
  rows.forEach((r, i) => {
    r.first = i === 0 || rows[i - 1].place !== r.place;
    r.span = rows.filter((x) => x.place === r.place).length;
  });
  return rows;
}
