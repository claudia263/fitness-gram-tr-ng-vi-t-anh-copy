// Tiêu chuẩn đánh giá, xếp loại thể lực học sinh của Bộ GD&ĐT — Quyết định 53/2008/QĐ-BGDĐT (Điều 6).
// Số liệu chép NGUYÊN VĂN, đối chiếu thuvienphapluat.vn, thuviennhadat.vn và KH thể lực TH Tân Điền 2024–2025
// (xem docs/qd53-norms.json). Không nội suy. null = chưa đối chiếu được (chạy 5 phút nam 18–20 tuổi).
import { ageInMonths } from "@/lib/fitnessNorms";

export const MOET_SOURCE = "Quyết định 53/2008/QĐ-BGDĐT của Bộ GD&ĐT";

// Thứ tự hiển thị: 2 bài bắt buộc, 2 bài trường chọn, 2 bài tự chọn khác
export const MOET_TESTS = [
  { key: "long_jump", field: "long_jump_cm", label: "Bật xa tại chỗ", unit: "cm", required: true, chosen: true, ability: "Sức mạnh chân" },
  { key: "run_5min", field: "run_5min_m", label: "Chạy tuỳ sức 5 phút", unit: "m", required: true, chosen: true, ability: "Sức bền" },
  { key: "situps", field: "situps_30s", label: "Nằm ngửa gập bụng", unit: "lần/30 giây", chosen: true, ability: "Sức mạnh cơ bụng" },
  { key: "sprint_30m", field: "sprint_30m_s", label: "Chạy 30m xuất phát cao", unit: "giây", lowerIsBetter: true, chosen: true, ability: "Tốc độ" },
  { key: "grip", field: "grip_strength_kg", label: "Lực bóp tay thuận", unit: "kg", ability: "Sức mạnh tay" },
  { key: "shuttle", field: "shuttle_4x10_s", label: "Chạy con thoi 4×10m", unit: "giây", lowerIsBetter: true, ability: "Khéo léo, nhanh nhẹn" },
];

// [tuổi, Tốt, Đạt] — mỗi mảng theo thứ tự: bóp tay, gập bụng, bật xa, chạy 30m, con thoi, chạy 5 phút
const COLS = ["grip", "situps", "long_jump", "sprint_30m", "shuttle", "run_5min"];
const BOYS = [
  [6, [11.4, 9, 110, 6.5, 13.3, 750], [9.2, 4, 100, 7.5, 14.3, 650]],
  [7, [13.3, 10, 134, 6.3, 13.2, 770], [10.9, 5, 116, 7.3, 14.2, 670]],
  [8, [15.1, 11, 142, 6.0, 13.1, 800], [12.4, 6, 127, 7.0, 14.1, 700]],
  [9, [17.0, 12, 153, 5.7, 13.0, 850], [14.2, 7, 137, 6.7, 14.0, 750]],
  [10, [18.8, 13, 163, 5.6, 12.9, 900], [15.9, 8, 148, 6.6, 13.9, 790]],
  [11, [21.2, 14, 170, 5.5, 12.7, 940], [17.4, 9, 152, 6.5, 13.2, 820]],
  [12, [24.8, 15, 181, 5.4, 12.5, 950], [19.9, 10, 163, 6.4, 13.1, 850]],
  [13, [30.0, 16, 194, 5.3, 12.3, 960], [23.6, 11, 172, 6.3, 13.0, 870]],
  [14, [34.9, 17, 204, 5.2, 12.1, 980], [28.2, 12, 183, 6.2, 12.9, 880]],
  [15, [40.9, 18, 210, 5.1, 12.0, 1020], [34.0, 13, 191, 6.2, 12.8, 910]],
  [16, [43.2, 19, 215, 5.0, 11.9, 1030], [36.9, 14, 195, 6.0, 12.7, 920]],
  [17, [46.2, 20, 218, 4.9, 11.85, 1040], [39.6, 15, 198, 5.9, 12.6, 930]],
  [18, [47.2, 21, 222, 4.8, 11.8, null], [40.7, 16, 205, 5.8, 12.5, null]],
  [19, [47.5, 22, 225, 4.7, 11.75, null], [41.4, 17, 207, 5.7, 12.4, null]],
  [20, [48.7, 23, 227, 4.6, 11.7, null], [42.0, 18, 209, 5.6, 12.3, null]],
];
const GIRLS = [
  [6, [10.4, 6, 100, 7.5, 13.5, 700], [8.3, 3, 95, 8.5, 14.5, 600]],
  [7, [12.2, 7, 124, 7.3, 13.4, 760], [9.9, 4, 108, 8.3, 14.4, 640]],
  [8, [13.8, 8, 133, 7.0, 13.3, 770], [11.3, 5, 118, 8.0, 14.3, 670]],
  [9, [15.5, 9, 142, 6.7, 13.2, 800], [12.8, 6, 127, 7.7, 14.2, 690]],
  [10, [17.6, 10, 152, 6.6, 13.1, 810], [14.7, 7, 136, 7.6, 14.1, 700]],
  [11, [20.6, 11, 155, 6.5, 13.0, 820], [16.9, 8, 140, 7.5, 14.0, 710]],
  [12, [23.2, 12, 161, 6.4, 12.8, 830], [19.3, 9, 144, 7.4, 13.8, 730]],
  [13, [25.8, 13, 162, 6.3, 12.7, 840], [21.2, 10, 145, 7.3, 13.7, 750]],
  [14, [28.1, 14, 163, 6.2, 12.6, 850], [23.5, 11, 146, 7.2, 13.6, 770]],
  [15, [28.5, 15, 164, 6.1, 12.4, 860], [24.5, 12, 147, 7.1, 13.4, 790]],
  [16, [29.0, 16, 165, 6.0, 12.3, 890], [26.0, 13, 148, 7.0, 13.3, 810]],
  [17, [30.3, 17, 166, 5.9, 12.2, 920], [26.3, 14, 149, 6.9, 13.2, 830]],
  [18, [31.5, 18, 168, 5.8, 12.1, 930], [26.5, 15, 151, 6.8, 13.1, 850]],
  [19, [31.6, 19, 169, 5.7, 12.0, 940], [26.7, 16, 153, 6.7, 13.0, 870]],
  [20, [31.8, 20, 170, 5.6, 11.9, 950], [26.9, 17, 155, 6.6, 12.9, 890]],
];

const toTable = (rows) =>
  Object.fromEntries(
    rows.map(([age, good, pass]) => [age, Object.fromEntries(COLS.map((k, i) => [k, { good: good[i], pass: pass[i] }]))])
  );
export const MOET_NORMS = { male: toTable(BOYS), female: toTable(GIRLS) };
export const MOET_AGES = BOYS.map(([age]) => age);

export const MOET_LEVELS = {
  tot: { key: "tot", label: "Tốt", tone: "green" },
  dat: { key: "dat", label: "Đạt", tone: "amber" },
  chua_dat: { key: "chua_dat", label: "Chưa đạt", tone: "red" },
};

// Tuổi tròn tại ngày kiểm tra; từ 21 tuổi dùng chỉ tiêu tuổi 20; dưới 6 tuổi không áp dụng
export function moetAge(birthDate, testDate) {
  const m = ageInMonths(birthDate, testDate);
  if (m == null) return null;
  const y = Math.floor(m / 12);
  if (y < 6) return null;
  return Math.min(y, 20);
}

// Ngưỡng của một bài: { good, pass } hoặc null
export function moetThreshold(sex, age, testKey) {
  const t = MOET_NORMS[sex === "female" ? "female" : "male"]?.[age]?.[testKey];
  return t && t.good != null && t.pass != null ? t : null;
}

// Tốt: vượt ngưỡng Tốt (> hoặc < với bài tính giờ); Đạt: từ ngưỡng Đạt trở lên (≥ hoặc ≤)
export function moetLevel(test, value, threshold) {
  if (value == null || value === "" || !threshold) return null;
  const v = Number(value);
  if (!Number.isFinite(v)) return null;
  if (test.lowerIsBetter) return v < threshold.good ? "tot" : v <= threshold.pass ? "dat" : "chua_dat";
  return v > threshold.good ? "tot" : v >= threshold.pass ? "dat" : "chua_dat";
}

// Đánh giá một lần kiểm tra. Xếp loại chung theo QĐ 53 (cần đủ 4 bài, có 2 bài bắt buộc):
//   Tốt: tối đa 1 chỉ tiêu ở mức Đạt, còn lại Tốt ("3 chỉ tiêu Tốt và 1 chỉ tiêu Đạt trở lên")
//   Đạt: tất cả từ mức Đạt trở lên · Chưa đạt: có chỉ tiêu dưới mức Đạt
export function evaluateMoet({ sex, birthDate, testDate, result }) {
  const age = moetAge(birthDate, testDate);
  const tests = MOET_TESTS.map((t) => {
    const value = result?.[t.field];
    const threshold = age != null ? moetThreshold(sex, age, t.key) : null;
    return { ...t, value: value ?? null, threshold, level: moetLevel(t, value, threshold) };
  });
  const measured = tests.filter((t) => t.level);
  const hasRequired = MOET_TESTS.filter((t) => t.required).every((r) => measured.some((m) => m.key === r.key));
  let overall = null;
  let missing = null;
  if (age == null) missing = "Chuẩn của Bộ áp dụng từ 6 tuổi";
  else if (!measured.length) missing = "Chưa có kết quả bài test của Bộ";
  else if (measured.length < 4 || !hasRequired) missing = "Cần đủ 4 bài, trong đó có Bật xa tại chỗ và Chạy tuỳ sức 5 phút";
  else if (measured.some((t) => t.level === "chua_dat")) overall = "chua_dat";
  else overall = measured.filter((t) => t.level !== "tot").length <= 1 ? "tot" : "dat";
  return { age, tests, measured: measured.length, overall, missing };
}

export const hasMoetData = (result) => MOET_TESTS.some((t) => result?.[t.field] != null);

// Hiển thị ngưỡng, vd "> 110" / "≥ 100" hoặc "< 6,50" / "≤ 7,50"
export function formatThreshold(test, value, kind) {
  if (value == null) return "—";
  const sign = test.lowerIsBetter ? (kind === "good" ? "<" : "≤") : kind === "good" ? ">" : "≥";
  const digits = test.lowerIsBetter ? 2 : test.key === "grip" ? 1 : 0;
  return `${sign} ${value.toLocaleString("vi-VN", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}
