import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PolarRadiusAxis } from "recharts";

// Normalize each test to a 0-100 scale for the radar (different units can't share an axis)
const REF_MAX = {
  pacer_level: 15,
  sit_and_reach_cm: 40,
  pushup_count: 30,
  plank_seconds: 180,
};

const AXES = [
  { key: "pacer_level", label: "Sức bền tim phổi" },
  { key: "sit_and_reach_cm", label: "Linh hoạt" },
  { key: "pushup_count", label: "Sức mạnh thân trên" },
  { key: "plank_seconds", label: "Sức bền Core" },
];

export default function RadarOverview({ current, className = "" }) {
  const data = AXES.map((a) => {
    const val = current?.[a.key];
    const max = REF_MAX[a.key];
    const score = val != null ? Math.min(100, Math.round((val / max) * 100)) : 0;
    return { subject: a.label, score };
  });

  const hasData = AXES.some((a) => current?.[a.key] != null);

  return (
    <div className={`fg-card p-5 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-navy text-base sm:text-lg">Tổng quan thể chất</h3>
          <p className="text-xs text-muted-foreground">4 nhóm năng lực thể lực</p>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#F4F5F8" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#26275D" strokeWidth="2">
            <path d="M12 2v6M12 16v6M2 12h6M16 12h6" strokeLinecap="round" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>
      </div>
      {hasData ? (
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid stroke="rgba(38,39,93,0.10)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#26275D", fontSize: 11, fontWeight: 600 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="score"
                stroke="#26275D"
                strokeWidth={2}
                fill="rgba(249,221,14,0.20)"
                dot={{ fill: "#F9DD0E", stroke: "#26275D", strokeWidth: 1.5, r: 4 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
          Chưa có dữ liệu thể lực
        </div>
      )}
    </div>
  );
}