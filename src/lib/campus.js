// Cơ sở của trường: mã lưu trong dữ liệu (students.campus, classes.campus, test_sessions.campus) → tên hiển thị.
import { norm } from "@/lib/clubs/model";

const NAMES = {
  gvp: "Gò Vấp",
  "go vap": "Gò Vấp",
  bt: "Bình Tân",
  "binh tan": "Bình Tân",
  pn: "Phú Nhuận",
  "phu nhuan": "Phú Nhuận",
};

// "CS GVP" → "Cơ sở Gò Vấp"; mã lạ giữ nguyên
export function campusLabel(code) {
  if (!code) return "Chưa rõ cơ sở";
  const key = norm(code).replace(/^(cs|co so)\s*/, "").trim();
  return NAMES[key] ? `Cơ sở ${NAMES[key]}` : code;
}

// Các cơ sở có trong dữ liệu, sắp theo tên hiển thị
export function campusesOf(...lists) {
  const set = new Set();
  lists.flat().forEach((r) => r?.campus && set.add(r.campus));
  return [...set].sort((a, b) => campusLabel(a).localeCompare(campusLabel(b), "vi"));
}

// "17/08 – 24/08/2026" hoặc "17/08/2026"
export function sessionDateRange(s) {
  const fmt = (d, withYear = true) => {
    if (!d) return "";
    const [y, m, day] = String(d).slice(0, 10).split("-");
    return withYear ? `${day}/${m}/${y}` : `${day}/${m}`;
  };
  if (!s?.test_date) return "--";
  if (!s.end_date || s.end_date === s.test_date) return fmt(s.test_date);
  const sameYear = String(s.end_date).slice(0, 4) === String(s.test_date).slice(0, 4);
  return `${fmt(s.test_date, !sameYear)} – ${fmt(s.end_date)}`;
}
