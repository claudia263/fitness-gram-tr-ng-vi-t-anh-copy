// Radar lục giác 6 bài test theo QĐ 53/2008 của một lần kiểm tra.
// Mỗi trục là mức đạt so với chuẩn "Tốt" của đúng tuổi và giới tính (100 = đúng chuẩn Tốt; chạy 30m, con thoi: càng nhanh càng cao).
// Hai đường chuẩn (Tốt, Đạt) vẽ bằng nét khác nhau để không phải phân biệt chỉ bằng màu.
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { MOET_LEVELS } from "@/lib/moetNorms";

const SHORT = { long_jump: "Bật xa", run_5min: "Chạy 5 phút", situps: "Gập bụng", sprint_30m: "Chạy 30m", grip: "Bóp tay", shuttle: "Con thoi" };
const MAX = 130;

const ratio = (t, value, ref) => {
  if (value == null || ref == null || ref === 0 || value === 0) return null;
  return Math.round((t.lowerIsBetter ? ref / value : value / ref) * 100);
};

export function moetRadarData(ev) {
  return ev.tests.map((t) => {
    const hasStd = t.threshold && t.threshold.good != null;
    const you = t.value != null && hasStd ? Math.min(MAX, ratio(t, t.value, t.threshold.good)) : 0;
    const pass = hasStd && t.threshold.pass != null ? Math.min(MAX, ratio(t, t.threshold.pass, t.threshold.good)) : null;
    return { key: t.key, subject: SHORT[t.key] || t.label, you, good: hasStd ? 100 : null, pass, value: t.value, unit: t.unit, level: t.level, label: t.label };
  });
}

function RadarTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-[rgba(38,39,93,0.12)]">
      <p className="font-bold text-navy">{d.label}</p>
      <p className="tabular-nums text-navy">
        {d.value != null ? `${Number(d.value).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} ${d.unit}` : "Chưa có kết quả"}
        {d.level ? ` · ${MOET_LEVELS[d.level]}` : ""}
      </p>
    </div>
  );
}

const Key = ({ dash, color, thick, children }) => (
  <span className="inline-flex items-center gap-1.5">
    <svg width="26" height="8" aria-hidden="true">
      <line x1="1" y1="4" x2="25" y2="4" stroke={color} strokeWidth={thick ? 3 : 2} strokeDasharray={dash} strokeLinecap="round" />
    </svg>
    {children}
  </span>
);

export default function MoetRadar({ ev }) {
  const data = moetRadarData(ev);
  const measured = data.filter((d) => d.value != null).length;
  const summary = data.map((d) => `${d.label}: ${d.value != null ? `${d.value} ${d.unit}` : "chưa có"}`).join("; ");
  return (
    <figure className="m-0 rounded-2xl p-3" style={{ background: "#F7F8FC" }}>
      <figcaption className="px-1 pb-1">
        <p className="text-sm font-bold text-navy">Radar 6 bài so với chuẩn</p>
        <p className="text-xs text-muted-foreground">Đường Tốt = 100 · càng ra ngoài càng tốt · {measured}/6 bài có kết quả</p>
      </figcaption>
      <div role="img" aria-label={`Biểu đồ lục giác 6 bài test theo chuẩn Bộ GD&ĐT. ${summary}`} style={{ width: "100%", height: 270 }}>
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius="70%" margin={{ top: 8, right: 22, bottom: 8, left: 22 }}>
            <PolarGrid gridType="polygon" stroke="rgba(38,39,93,0.12)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#26275D", fontSize: 11, fontWeight: 600 }} />
            <PolarRadiusAxis domain={[0, MAX]} tick={false} axisLine={false} />
            <Radar name="Chuẩn Tốt" dataKey="good" stroke="#15803d" strokeWidth={2} strokeDasharray="6 4" fill="none" isAnimationActive={false} />
            <Radar name="Chuẩn Đạt" dataKey="pass" stroke="#b45309" strokeWidth={2} strokeDasharray="2 4" fill="none" isAnimationActive={false} />
            <Radar name="Kết quả" dataKey="you" stroke="#26275D" strokeWidth={2.5} fill="#F9DD0E" fillOpacity={0.35} dot={{ r: 3.5, fill: "#26275D" }} />
            <Tooltip content={<RadarTip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-navy">
        <Key color="#26275D" thick>Kết quả</Key>
        <Key color="#15803d" dash="6 4">Chuẩn Tốt</Key>
        <Key color="#b45309" dash="2 4">Chuẩn Đạt</Key>
      </p>
    </figure>
  );
}
