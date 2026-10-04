// Helper functions for Fitness Gram

// Format plank seconds → mm:ss (database stores seconds, UI formats)
export function formatPlankTime(seconds) {
  if (seconds == null || isNaN(seconds)) return "--:--";
  const s = Math.max(0, Math.floor(Number(seconds)));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// BMI = weight_kg / (height_m * height_m)
export function calculateBMI(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm) / 100;
  if (!w || !h || h <= 0) return null;
  return Math.round((w / (h * h)) * 100) / 100;
}

// Age in months between birth_date and test_date (ISO strings)
export function calculateAgeMonths(birthDate, testDate) {
  if (!birthDate || !testDate) return null;
  const b = new Date(birthDate);
  const t = new Date(testDate);
  if (isNaN(b.getTime()) || isNaN(t.getTime())) return null;
  let months = (t.getFullYear() - b.getFullYear()) * 12 + (t.getMonth() - b.getMonth());
  if (t.getDate() < b.getDate()) months -= 1;
  return Math.max(0, months);
}

// Human-readable age from months
export function formatAge(months) {
  if (months == null) return "--";
  const years = Math.floor(months / 12);
  const m = months % 12;
  return `${years} tuổi${m > 0 ? ` ${m} tháng` : ""}`;
}

// Nutritional status from WHO z-score (BMI-for-age)
export function nutritionalStatusFromZScore(z) {
  if (z == null || isNaN(z)) return "Chờ dữ liệu tham chiếu WHO";
  if (z < -3) return "Gầy còm nặng";
  if (z < -2) return "Gầy còm";
  if (z <= 1) return "Bình thường";
  if (z <= 2) return "Thừa cân";
  return "Béo phì";
}

// Trend comparison helper
export function compareWithPrevious(current, previous) {
  if (current == null || previous == null) return null;
  const diff = Number(current) - Number(previous);
  if (diff > 0) return { dir: "up", diff };
  if (diff < 0) return { dir: "down", diff };
  return { dir: "same", diff: 0 };
}

export function formatDiff(diff, unit = "") {
  if (diff == null) return "";
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff}${unit ? " " + unit : ""}`;
}