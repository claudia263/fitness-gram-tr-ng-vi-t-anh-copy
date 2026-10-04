// Bảng tham chiếu 15 Meter PACER Test (FitnessGram)
// Nguồn: 15 Meter PACER Test Details — 21 levels
// Mỗi level: số lượt (shuttles), tốc độ, thời gian/lượt, tổng thời gian level,
// thời gian tích lũy, khoảng cách/level, khoảng cách tích lũy.

export const PACER_15M_LEVELS = [
  { level: 1,  shuttles: 7,  speed: 8.0,  timePerShuttle: 6.75, levelTime: 60.8, cumTime: "1:01",  dist: 135, cumDist: 135,   cumShuttles: 7 },
  { level: 2,  shuttles: 8,  speed: 9.0,  timePerShuttle: 6.00, levelTime: 60.0, cumTime: "2:01",  dist: 150, cumDist: 285,   cumShuttles: 15 },
  { level: 3,  shuttles: 8,  speed: 9.5,  timePerShuttle: 5.68, levelTime: 62.5, cumTime: "3:03",  dist: 165, cumDist: 450,   cumShuttles: 23 },
  { level: 4,  shuttles: 9,  speed: 10.0, timePerShuttle: 5.40, levelTime: 64.8, cumTime: "4:08",  dist: 180, cumDist: 630,   cumShuttles: 32 },
  { level: 5,  shuttles: 9,  speed: 10.5, timePerShuttle: 5.14, levelTime: 61.7, cumTime: "5:10",  dist: 180, cumDist: 810,   cumShuttles: 41 },
  { level: 6,  shuttles: 10, speed: 11.0, timePerShuttle: 4.91, levelTime: 63.8, cumTime: "6:14",  dist: 195, cumDist: 1005,  cumShuttles: 51 },
  { level: 7,  shuttles: 10, speed: 11.5, timePerShuttle: 4.70, levelTime: 61.0, cumTime: "7:15",  dist: 195, cumDist: 1200,  cumShuttles: 61 },
  { level: 8,  shuttles: 11, speed: 12.0, timePerShuttle: 4.50, levelTime: 63.0, cumTime: "8:18",  dist: 210, cumDist: 1410,  cumShuttles: 72 },
  { level: 9,  shuttles: 11, speed: 12.5, timePerShuttle: 4.32, levelTime: 60.5, cumTime: "9:18",  dist: 210, cumDist: 1620,  cumShuttles: 83 },
  { level: 10, shuttles: 11, speed: 13.0, timePerShuttle: 4.15, levelTime: 62.3, cumTime: "10:20", dist: 225, cumDist: 1845,  cumShuttles: 94 },
  { level: 11, shuttles: 12, speed: 13.5, timePerShuttle: 4.00, levelTime: 60.0, cumTime: "11:20", dist: 225, cumDist: 2070,  cumShuttles: 106 },
  { level: 12, shuttles: 12, speed: 14.0, timePerShuttle: 3.86, levelTime: 61.7, cumTime: "12:22", dist: 240, cumDist: 2310,  cumShuttles: 118 },
  { level: 13, shuttles: 13, speed: 14.5, timePerShuttle: 3.72, levelTime: 63.3, cumTime: "13:25", dist: 255, cumDist: 2565,  cumShuttles: 131 },
  { level: 14, shuttles: 13, speed: 15.0, timePerShuttle: 3.60, levelTime: 61.2, cumTime: "14:27", dist: 255, cumDist: 2820,  cumShuttles: 144 },
  { level: 15, shuttles: 13, speed: 15.5, timePerShuttle: 3.48, levelTime: 62.7, cumTime: "15:29", dist: 270, cumDist: 3090,  cumShuttles: 157 },
  { level: 16, shuttles: 14, speed: 16.0, timePerShuttle: 3.38, levelTime: 60.8, cumTime: "16:30", dist: 270, cumDist: 3360,  cumShuttles: 171 },
  { level: 17, shuttles: 14, speed: 16.5, timePerShuttle: 3.27, levelTime: 62.2, cumTime: "17:32", dist: 285, cumDist: 3645,  cumShuttles: 185 },
  { level: 18, shuttles: 15, speed: 17.0, timePerShuttle: 3.18, levelTime: 60.4, cumTime: "18:33", dist: 285, cumDist: 3930,  cumShuttles: 200 },
  { level: 19, shuttles: 15, speed: 17.5, timePerShuttle: 3.09, levelTime: 61.7, cumTime: "19:34", dist: 300, cumDist: 4230,  cumShuttles: 215 },
  { level: 20, shuttles: 16, speed: 18.0, timePerShuttle: 3.00, levelTime: 60.0, cumTime: "20:34", dist: 300, cumDist: 4530,  cumShuttles: 231 },
  { level: 21, shuttles: 16, speed: 18.5, timePerShuttle: 2.92, levelTime: 61.3, cumTime: "21:36", dist: 315, cumDist: 4845,  cumShuttles: 247 },
];

// Quy đổi tổng số lượt (shuttles) → level PACER.
// Trả về level thập phân: 51 → 6, 52 → 6.1, 60 → 6.9, 61 → 7 (áp dụng mọi level).
export function pacerLevelFromLaps(laps) {
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

// Lấy thông tin chi tiết của một level
export function getPacerLevelInfo(level) {
  return PACER_15M_LEVELS.find((l) => l.level === Number(level)) || null;
}

// Quy đổi ngược: level → tổng số lượt (shuttles).
// - Level nguyên (vd 6) = hoàn thành hết level 6 = cumShuttles(6) = 51.
// - Level thập phân (vd 6.1) = đã xong level 6 + thêm 1 bật sang level 7
//   = cumShuttles(6) + 1 = 52.  6.9 = 60.  7 = 61.
export function pacerLapsFromLevel(level) {
  const s = String(level ?? "").trim();
  if (!s) return 0;
  const n = Number(s);
  if (!n || isNaN(n) || n <= 0) return 0;
  const lvl = Math.floor(n);
  const extra = Math.round((n - lvl) * 10);
  const info = getPacerLevelInfo(lvl);
  const base = info ? info.cumShuttles : 0;
  return base + extra;
}

// Tính khoảng cách tích lũy (m) tương ứng với tổng số lượt
export function pacerDistanceFromLaps(laps) {
  const n = Number(laps);
  if (!n || isNaN(n) || n <= 0) return 0;
  let dist = 0;
  for (const l of PACER_15M_LEVELS) {
    if (n >= l.cumShuttles) {
      dist = l.cumDist;
    } else {
      // phần lượt trong level hiện tại
      const prev = PACER_15M_LEVELS[l.level - 2];
      const prevCum = prev ? prev.cumShuttles : 0;
      const prevDist = prev ? prev.cumDist : 0;
      const lapsInLevel = n - prevCum;
      dist = prevDist + lapsInLevel * 15;
      break;
    }
  }
  return dist;
}