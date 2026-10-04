// Tổng hợp so sánh chuẩn toàn trường: ghép học sinh với kết quả mới nhất rồi đánh giá theo chuẩn.
import { evaluate, resolvePacerType, WORLD_BANDS } from "@/lib/fitnessNorms";

export const SCHOOL_TESTS = [
  { key: "bmi", name: "BMI (thể trạng)" },
  { key: "pacer", name: "PACER (sức bền)" },
  { key: "pushup", name: "Push-up (sức mạnh)" },
  { key: "sitReach", name: "Sit & Reach (độ dẻo)" },
];

export const BMI_STATUS_LABELS = ["Bình thường", "Thừa cân", "Béo phì", "Gầy còm", "Gầy còm nặng"];

const dateOf = (row, sessionMap) => {
  const s = sessionMap.get(row.session_id);
  return (s && s.test_date) || row.created_date || "";
};

const pickLatest = (rows, sessionMap) =>
  rows.reduce((best, r) => (!best || dateOf(r, sessionMap) > dateOf(best, sessionMap) ? r : best), null);

// Mỗi học sinh → kết quả mới nhất trong phạm vi năm học đã chọn kèm phần đánh giá theo chuẩn.
export function buildSchoolRows({ students, fitness, anthro, sessions, schoolYear }) {
  const sessionMap = new Map((sessions || []).map((s) => [s.id, s]));
  const inYear = (row) => {
    const s = sessionMap.get(row.session_id);
    if (!s) return false;
    return !schoolYear || s.school_year === schoolYear;
  };
  return (students || [])
    .map((student) => {
      const f = pickLatest((fitness || []).filter((r) => r.student_id === student.id && inYear(r)), sessionMap);
      const a = pickLatest((anthro || []).filter((r) => r.student_id === student.id && inYear(r)), sessionMap);
      if (!f && !a) return null;
      const session = (f && sessionMap.get(f.session_id)) || (a && sessionMap.get(a.session_id)) || null;
      const evaluation = evaluate({
        sex: student.sex,
        birthDate: student.birth_date,
        testDate: session ? session.test_date : null,
        heightCm: a ? a.height_cm : null,
        weightKg: a ? a.weight_kg : null,
        pacerLaps: f ? f.pacer_laps : null,
        pacerType: resolvePacerType(f ? f.pacer_type : null, student.grade),
        pushups: f ? f.pushup_count : null,
        plankSec: f ? f.plank_seconds : null,
        sitReachCm: f ? f.sit_and_reach_cm : null,
      });
      return { student, fitness: f, anthro: a, session, evaluation };
    })
    .filter(Boolean);
}

const flagOf = (result) => (result && result.status === "risk" ? 2 : result && result.status === "improve" ? 1 : 0);

export function summarizeSchool(rows) {
  const hfz = SCHOOL_TESTS.map((t) => {
    const measured = rows.filter((r) => r.evaluation[t.key]);
    const inZone = measured.filter((r) => r.evaluation[t.key].status === "healthy").length;
    return {
      ...t,
      measured: measured.length,
      inZone,
      pct: measured.length ? Math.round((inZone / measured.length) * 100) : null,
    };
  });

  const percentiles = rows
    .map((r) => (r.evaluation.pacer ? r.evaluation.pacer.percentile : null))
    .filter((v) => v != null)
    .sort((a, b) => a - b);
  const medianPercentile = percentiles.length
    ? percentiles.length % 2
      ? percentiles[(percentiles.length - 1) / 2]
      : Math.round((percentiles[percentiles.length / 2 - 1] + percentiles[percentiles.length / 2]) / 2)
    : null;
  const bands = {};
  WORLD_BANDS.forEach((b) => (bands[b] = 0));
  rows.forEach((r) => {
    const b = r.evaluation.pacer ? r.evaluation.pacer.band : null;
    if (b) bands[b] += 1;
  });

  const bmiCounts = {};
  BMI_STATUS_LABELS.forEach((l) => (bmiCounts[l] = 0));
  rows.forEach((r) => {
    if (!r.evaluation.bmi) return;
    const label = r.evaluation.bmi.nutritionLabel;
    bmiCounts[label] = (bmiCounts[label] || 0) + 1;
  });
  const bmiTotal = BMI_STATUS_LABELS.reduce((sum, l) => sum + bmiCounts[l], 0);

  const attention = rows
    .map((r) => {
      const flags = SCHOOL_TESTS.map((t) => ({ key: t.key, name: t.name, level: flagOf(r.evaluation[t.key]) })).filter((f) => f.level > 0);
      const risk = flags.filter((f) => f.level === 2).length;
      const improve = flags.length - risk;
      return { ...r, flags, risk, improve };
    })
    .filter((r) => r.flags.length > 0)
    .sort((a, b) => b.risk - a.risk || b.improve - a.improve || (a.student.full_name || "").localeCompare(b.student.full_name || ""));

  return {
    total: rows.length,
    hfz,
    pacer: { withData: percentiles.length, median: medianPercentile, bands },
    bmi: { counts: bmiCounts, total: bmiTotal },
    attention,
  };
}

const csvCell = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildNormsCsv(rows) {
  const header = [
    "Họ tên", "Mã học sinh", "Lớp", "Giới tính", "Ngày sinh", "Đợt kiểm tra", "Ngày kiểm tra",
    "PACER (lượt)", "Loại PACER", "PACER 20m quy đổi", "Bách phân vị thế giới", "PACER – xếp loại",
    "Chiều cao (cm)", "Cân nặng (kg)", "BMI", "Z-score BMI", "Tình trạng dinh dưỡng", "BMI – xếp loại",
    "Push-up (lần)", "Push-up – xếp loại", "Sit & Reach (cm)", "Sit & Reach (inch)", "Sit & Reach – xếp loại",
    "Plank (giây)", "Plank – xếp loại",
  ];
  const lines = rows.map((r) => {
    const e = r.evaluation;
    return [
      r.student.full_name, r.student.student_code, r.student.grade, r.student.sex === "female" ? "Nữ" : "Nam",
      r.student.birth_date, r.session ? r.session.name : "", r.session ? r.session.test_date : "",
      e.pacer ? e.pacer.laps : "", e.pacer ? e.pacer.pacerType : "", e.pacer ? e.pacer.laps20 : "",
      e.pacer ? e.pacer.percentile : "", e.pacer ? e.pacer.statusLabel : "",
      r.anthro ? r.anthro.height_cm : "", r.anthro ? r.anthro.weight_kg : "",
      e.bmi ? e.bmi.value : "", e.bmi && e.bmi.z != null ? Math.round(e.bmi.z * 100) / 100 : "",
      e.bmi ? e.bmi.nutritionLabel : "", e.bmi ? e.bmi.statusLabel : "",
      e.pushup ? e.pushup.value : "", e.pushup ? e.pushup.statusLabel : "",
      e.sitReach ? e.sitReach.valueCm : "", e.sitReach ? e.sitReach.valueInch : "", e.sitReach ? e.sitReach.statusLabel : "",
      e.plank ? e.plank.value : "", e.plank ? e.plank.statusLabel : "",
    ].map(csvCell).join(",");
  });
  return [header.map(csvCell).join(","), ...lines].join("\n");
}

export function downloadNormsCsv(filename, csv) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}