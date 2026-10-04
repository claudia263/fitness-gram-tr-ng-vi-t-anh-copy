// Bảng tham chiếu 15 Meter PACER Test (FitnessGram) — dùng cho backend functions.
// Đồng bộ với src/lib/pacerReference.js (frontend).

export const PACER_15M_LEVELS = [
  { level: 1,  shuttles: 7,  cumShuttles: 7,   cumDist: 135 },
  { level: 2,  shuttles: 8,  cumShuttles: 15,  cumDist: 285 },
  { level: 3,  shuttles: 8,  cumShuttles: 23,  cumDist: 450 },
  { level: 4,  shuttles: 9,  cumShuttles: 32,  cumDist: 630 },
  { level: 5,  shuttles: 9,  cumShuttles: 41,  cumDist: 810 },
  { level: 6,  shuttles: 10, cumShuttles: 51,  cumDist: 1005 },
  { level: 7,  shuttles: 10, cumShuttles: 61,  cumDist: 1200 },
  { level: 8,  shuttles: 11, cumShuttles: 72,  cumDist: 1410 },
  { level: 9,  shuttles: 11, cumShuttles: 83,  cumDist: 1620 },
  { level: 10, shuttles: 11, cumShuttles: 94,  cumDist: 1845 },
  { level: 11, shuttles: 12, cumShuttles: 106, cumDist: 2070 },
  { level: 12, shuttles: 12, cumShuttles: 118, cumDist: 2310 },
  { level: 13, shuttles: 13, cumShuttles: 131, cumDist: 2565 },
  { level: 14, shuttles: 13, cumShuttles: 144, cumDist: 2820 },
  { level: 15, shuttles: 13, cumShuttles: 157, cumDist: 3090 },
  { level: 16, shuttles: 14, cumShuttles: 171, cumDist: 3360 },
  { level: 17, shuttles: 14, cumShuttles: 185, cumDist: 3645 },
  { level: 18, shuttles: 15, cumShuttles: 200, cumDist: 3930 },
  { level: 19, shuttles: 15, cumShuttles: 215, cumDist: 4230 },
  { level: 20, shuttles: 16, cumShuttles: 231, cumDist: 4530 },
  { level: 21, shuttles: 16, cumShuttles: 247, cumDist: 4845 },
];

// Quy đổi tổng số lượt (shuttles) → level PACER.
// Trả về level thập phân: 51 → 6, 52 → 6.1, 60 → 6.9, 61 → 7 (áp dụng mọi level).
export function pacerLevelFromLaps(laps: number | null | undefined): number {
  const n = Number(laps);
  if (!n || isNaN(n) || n <= 0) return 0;
  let level = 0;
  let base = 0;
  for (const l of PACER_15M_LEVELS) {
    if (n >= l.cumShuttles) { level = l.level; base = l.cumShuttles; }
    else break;
  }
  const extra = n - base;
  return level + extra / 10;
}