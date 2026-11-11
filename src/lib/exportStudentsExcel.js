// Xuất danh sách học sinh của một cơ sở ra Excel: mỗi lớp một sheet, 12 cột giống file nhập liệu
// (STT, Tên học sinh, Giới tính, Ngày sinh, Chiều Cao, Cân nặng, BMI, Phân loại tình trạng, Pacer, Sit and Reach, Push-up, Plank).
// File xuất ra nhập lại được bằng chức năng nhập Excel (importFitnessExcel).
import { pacerLevelFromLaps } from "./pacerReference.js";

export const EXPORT_HEADERS = [
  "STT",
  "Tên học sinh",
  "Giới tính",
  "Ngày sinh",
  "Chiều Cao (cm)",
  "Cân nặng(kg)",
  "BMI",
  "Phân loại tình trạng",
  "Pacer (LV-15m)",
  "Sit and Reach (cm)",
  "Push-up (rep)",
  "Plank (s)",
];

const COL_WIDTHS = [6, 30, 10, 13, 15, 14, 8, 22, 15, 19, 14, 10];

// "2015-01-21" → "21/01/2015" (giữ dạng chữ như file gốc)
const vnDate = (d) => {
  if (!d) return "";
  const [y, m, day] = String(d).slice(0, 10).split("-");
  return y && m && day ? `${day}/${m}/${y}` : "";
};

// Tổng lượt (hoặc level) → "level.lượt thêm" dạng chữ, vd 52 → "6.1", 51 → "6.0".
// Phải là chữ: số nguyên trần sẽ bị nhập lại hiểu thành tổng lượt.
export function pacerText(laps, level) {
  let lv = null;
  if (laps != null && Number(laps) > 0) lv = pacerLevelFromLaps(laps);
  else if (level != null && Number(level) > 0) lv = Number(level);
  if (lv == null) return "";
  const whole = Math.floor(lv + 1e-9);
  const extra = Math.round((lv - whole) * 10);
  return `${whole}.${extra}`;
}

const num = (v) => (v == null || v === "" ? "" : Number(v));

// Tên sheet Excel: tối đa 31 ký tự, không chứa \ / ? * [ ] :, không trùng nhau
function sheetName(raw, used) {
  const base = String(raw || "Chưa xếp lớp").replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31) || "Lớp";
  let name = base;
  for (let i = 2; used.has(name.toLowerCase()); i++) name = `${base.slice(0, 28)} ${i}`;
  used.add(name.toLowerCase());
  return name;
}

// data: { students, classes, fitness, anthro, session } — chỉ dữ liệu của MỘT cơ sở.
// session: lần đo gần nhất của cơ sở (để điền kết quả); null thì chỉ xuất danh sách.
// enrich(anthroRow, birthDate, sex): tính lại BMI / phân loại (studentData.enrichAnthro)
export function buildCampusWorkbook(XLSX, { students, classes, fitness, anthro, session }, enrich) {
  const fitBy = new Map();
  const anBy = new Map();
  if (session) {
    fitness.filter((r) => r.session_id === session.id).forEach((r) => fitBy.set(r.student_id, r));
    anthro.filter((r) => r.session_id === session.id).forEach((r) => anBy.set(r.student_id, r));
  }

  const classOf = new Map(classes.map((c) => [c.id, c]));
  const groups = new Map();
  for (const s of students) {
    const key = classOf.has(s.class_id) ? s.class_id : "none";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  const order = [...groups.keys()].sort((a, b) => {
    const ca = classOf.get(a);
    const cb = classOf.get(b);
    if (!ca || !cb) return ca ? -1 : cb ? 1 : 0;
    return (Number(ca.grade) || 0) - (Number(cb.grade) || 0) || String(ca.name).localeCompare(String(cb.name), "vi", { numeric: true });
  });

  const wb = XLSX.utils.book_new();
  const used = new Set();
  for (const key of order) {
    const list = groups.get(key).sort((a, b) => String(a.created_date).localeCompare(String(b.created_date)) || a.full_name.localeCompare(b.full_name, "vi"));
    const rows = list.map((s, i) => {
      const f = fitBy.get(s.id);
      const a0 = anBy.get(s.id);
      const a = a0 ? enrich(a0, s.birth_date, s.sex) : null;
      return [
        i + 1,
        s.full_name,
        s.sex === "female" ? "Nữ" : "Nam",
        vnDate(s.birth_date),
        num(a?.height_cm),
        num(a?.weight_kg),
        a?.bmi != null ? Math.round(a.bmi * 10) / 10 : "",
        a?.nutritional_status || "",
        f ? pacerText(f.pacer_laps, f.pacer_level) : "",
        num(f?.sit_and_reach_cm),
        num(f?.pushup_count),
        num(f?.plank_seconds),
      ];
    });
    const ws = XLSX.utils.aoa_to_sheet([EXPORT_HEADERS, ...rows]);
    ws["!cols"] = COL_WIDTHS.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, sheetName(classOf.get(key)?.name, used));
  }
  return wb;
}

// Lần đo mới nhất của một cơ sở (theo ngày bắt đầu)
export function latestSessionOf(sessions, campusMatches) {
  return sessions.filter((s) => campusMatches(s.campus)).sort((a, b) => String(b.test_date).localeCompare(String(a.test_date)))[0] || null;
}
