import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatPlankTime, compareWithPrevious, formatDiff } from "@/lib/fitness";
import { getPacerLevelInfo, pacerDistanceFromLaps } from "@/lib/pacerReference";

const TEST_META = {
  pacer: { name: "PACER", subtitle: "Sức bền tim phổi", unit: "level", key: "pacer_level", axisLabel: "level" },
  sit_and_reach: { name: "Sit & Reach", subtitle: "Độ linh hoạt", unit: "cm", key: "sit_and_reach_cm", axisLabel: "cm" },
  pushup: { name: "Push-up", subtitle: "Sức mạnh thân trên", unit: "lần", key: "pushup_count", axisLabel: "lần" },
  plank: { name: "Plank", subtitle: "Sức bền Core", unit: "", key: "plank_seconds", axisLabel: "giây", time: true },
};

export default function FitnessDetailModal({ testKey, rows, comment, onClose }) {
  const reduce = useReducedMotion();
  const meta = TEST_META[testKey];
  if (!meta) return null;

  const sorted = [...rows].filter((r) => r[meta.key] != null);
  const current = sorted.length ? sorted[sorted.length - 1] : null;
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const currentVal = current?.[meta.key];
  const prevVal = previous?.[meta.key];
  const trend = compareWithPrevious(currentVal, prevVal);

  const chartData = sorted.map((r) => ({
    date: formatDateShort(r.session?.test_date),
    value: r[meta.key],
  }));

  const displayVal = meta.time ? formatPlankTime(currentVal) : currentVal;
  const lapsNow = testKey === "pacer" && current?.pacer_laps != null ? current.pacer_laps : null;
  const lapsPrev = testKey === "pacer" && previous?.pacer_laps != null ? previous.pacer_laps : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: "rgba(38,39,93,0.45)" }}
        onClick={onClose}
      >
        <motion.div
          initial={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="fg-card w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-[22px] p-5 sm:p-7"
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-navy">{meta.name}</h3>
              <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-navy hover:bg-[#F4F5F8]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {current ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <StatBox label="Kết quả hiện tại" value={displayVal} unit={meta.unit} sub={lapsNow != null ? `${lapsNow} lượt` : null} highlight />
                <StatBox label="Kỳ trước" value={meta.time ? formatPlankTime(prevVal) : (prevVal ?? "--")} unit={meta.unit} sub={lapsPrev != null ? `${lapsPrev} lượt` : null} />
                <div className="col-span-2 sm:col-span-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Tiến bộ</div>
                  {trend && trend.dir !== "same" ? (
                    <div className="flex items-center gap-1.5 font-bold text-lg" style={{ color: trend.dir === "up" ? "#26275D" : "#C0392B" }}>
                      {trend.dir === "up" ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      <span>{formatDiff(trend.diff, meta.unit)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 font-bold text-lg text-muted-foreground">
                      <Minus className="w-5 h-5" /> Giữ nguyên
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Xu hướng: {trend?.dir === "up" ? "Đang tiến bộ" : trend?.dir === "down" ? "Cần cải thiện" : "Ổn định"}
                  </div>
                </div>
              </div>

              {testKey === "pacer" && current?.pacer_level && (() => {
                const info = getPacerLevelInfo(current.pacer_level);
                const laps = current.pacer_laps;
                if (!info) return null;
                return (
                  <div className="rounded-2xl p-4 mb-6" style={{ background: "#F7F8FC" }}>
                    <div className="text-sm font-bold text-navy mb-3">Chi tiết Level {info.level} — 15m PACER</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <PacerStat label="Số lượt (shuttles)" value={laps != null ? laps : "--"} />
                      <PacerStat label="Tốc độ" value={`${info.speed} km/h`} />
                      <PacerStat label="Thời gian/lượt" value={`${info.timePerShuttle} s`} />
                      <PacerStat label="Thời gian tích lũy" value={info.cumTime} />
                      <PacerStat label="Khoảng cách tích lũy" value={`${info.cumDist} m`} />
                      <PacerStat label="Khoảng cách ước tính" value={`${pacerDistanceFromLaps(laps)} m`} />
                      <PacerStat label="Lượt/level này" value={info.shuttles} />
                      <PacerStat label="Tổng thời gian level" value={`${info.levelTime} s`} />
                    </div>
                  </div>
                );
              })()}

              {chartData.length > 1 && (
                <div className="mb-6">
                  <div className="text-sm font-bold text-navy mb-3">Xu hướng theo thời gian</div>
                  <div style={{ width: "100%", height: 220 }}>
                    <ResponsiveContainer>
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -18, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(38,39,93,0.08)" />
                        <XAxis dataKey="date" tick={{ fill: "#6B6E8F", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#6B6E8F", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "#FFFFFF", border: "1px solid rgba(38,39,93,0.10)", borderRadius: 12, color: "#26275D", boxShadow: "0 8px 30px rgba(38,39,93,0.12)" }}
                          labelStyle={{ color: "#26275D", fontWeight: 600 }}
                          formatter={(v) => [meta.time ? formatPlankTime(v) : `${v} ${meta.unit}`, meta.name]}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#26275D"
                          strokeWidth={2.5}
                          dot={{ fill: "#F9DD0E", stroke: "#26275D", strokeWidth: 1.5, r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {comment && (comment.fitness_comment || comment.recommendation) && (
                <div className="rounded-2xl p-4" style={{ background: "#F7F8FC" }}>
                  <div className="text-sm font-bold text-navy mb-2">Nhận xét giáo viên</div>
                  {comment.fitness_comment && <p className="text-sm text-navy/80 leading-relaxed mb-2">{comment.fitness_comment}</p>}
                  {comment.recommendation && (
                    <p className="text-sm text-navy/80 leading-relaxed">
                      <span className="font-semibold">Khuyến nghị: </span>
                      {comment.recommendation}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">Chưa có dữ liệu cho bài test này.</div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatBox({ label, value, unit, sub, highlight }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: highlight ? "#FEF3B0" : "#F7F8FC" }}
    >
      <div className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-extrabold text-navy tabular-nums">{value ?? "--"}</span>
        {value != null && unit && <span className="text-xs font-semibold text-muted-foreground">{unit}</span>}
      </div>
      {sub && <div className="text-xs font-semibold text-navy/70 mt-1">{sub}</div>}
    </div>
  );
}

function PacerStat({ label, value }) {
  return (
    <div className="rounded-xl p-3 bg-white">
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-sm font-extrabold text-navy tabular-nums">{value ?? "--"}</div>
    </div>
  );
}

function formatDateShort(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return `${date.getDate()}/${date.getMonth() + 1}`;
}