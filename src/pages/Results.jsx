import { useState } from "react";
import { useStudent } from "@/lib/StudentContext";
import { enrichAnthro } from "@/lib/studentData";
import { formatPlankTime } from "@/lib/fitness";
import PageTransition from "@/components/fg/PageTransition";
import StudentProfileCard from "@/components/fg/StudentProfileCard";
import EmptyState from "@/components/fg/EmptyState";
import SkeletonCard from "@/components/fg/SkeletonCard";
import FitnessDetailModal from "@/components/fg/FitnessDetailModal";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

const TESTS = [
  { key: "pacer", name: "PACER", field: "pacer_level", unit: "level", subtitle: "Sức bền tim phổi" },
  { key: "sit_and_reach", name: "Sit & Reach", field: "sit_and_reach_cm", unit: "cm", subtitle: "Độ linh hoạt" },
  { key: "pushup", name: "Push-up", field: "pushup_count", unit: "lần", subtitle: "Sức mạnh thân trên" },
  { key: "plank", name: "Plank", field: "plank_seconds", unit: "giây", subtitle: "Sức bền Core", time: true },
];

export default function Results() {
  const { activeStudent, loadingStudents, data, loading } = useStudent();
  const [openTest, setOpenTest] = useState(null);

  const fitnessRows = data?.fitnessRows || [];
  const anthroRows = (data?.anthroRows || []).map((a) => enrichAnthro(a, activeStudent?.birth_date, activeStudent?.sex));

  if (loadingStudents || loading) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} height={260} />)}
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!activeStudent) {
    return <PageTransition><div className="mx-auto max-w-[1280px] px-4 py-8"><EmptyState /></div></PageTransition>;
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy mb-1">Kết quả Fitness Gram</h1>
        <p className="text-sm text-muted-foreground mb-6">Xu hướng từng bài kiểm tra theo từng học kỳ</p>

        <StudentProfileCard student={activeStudent} className="mb-6" />

        {fitnessRows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {TESTS.map((t) => {
              const rows = fitnessRows.filter((r) => r[t.field] != null);
              const chartData = rows.map((r) => ({ date: shortDate(r.session?.test_date), value: r[t.field] }));
              return (
                <div key={t.key} className="fg-card p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h3 className="font-bold text-navy">{t.name}</h3>
                      <p className="text-xs text-muted-foreground">{t.subtitle}</p>
                    </div>
                    <button onClick={() => setOpenTest(t.key)} className="text-xs font-semibold text-navy hover:underline">
                      Chi tiết
                    </button>
                  </div>
                  {rows.length > 0 && (
                    <div className="mb-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-navy">
                        {t.time ? formatPlankTime(rows[rows.length - 1][t.field]) : rows[rows.length - 1][t.field]}
                      </span>
                      <span className="text-sm font-semibold text-muted-foreground">{t.unit}</span>
                      {rows.length > 1 && (
                        <span className="ml-auto text-xs text-muted-foreground">{rows.length} kỳ kiểm tra</span>
                      )}
                    </div>
                  )}
                  <div style={{ width: "100%", height: 200 }}>
                    {chartData.length >= 1 ? (
                      <ResponsiveContainer>
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(38,39,93,0.08)" vertical={false} />
                          <XAxis dataKey="date" tick={{ fill: "#6B6E8F", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#6B6E8F", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            cursor={{ fill: "rgba(249,221,14,0.10)" }}
                            contentStyle={{ background: "#FFFFFF", border: "1px solid rgba(38,39,93,0.10)", borderRadius: 12, color: "#26275D" }}
                            formatter={(v) => [t.time ? formatPlankTime(v) : `${v} ${t.unit}`, t.name]}
                          />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={56}>
                            {chartData.map((_, i) => (
                              <Cell key={i} fill={i === chartData.length - 1 ? "#F9DD0E" : "#26275D"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu bài kiểm tra này</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Growth trends */}
        {anthroRows.length > 0 && (
          <div className="fg-card p-5 sm:p-6">
            <h3 className="font-bold text-navy mb-4">Xu hướng tăng trưởng</h3>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={anthroRows.map((a) => ({ date: shortDate(a.session?.test_date), "Chiều cao (cm)": a.height_cm, "Cân nặng (kg)": a.weight_kg, "BMI": a.bmi }))} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(38,39,93,0.08)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#6B6E8F", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6B6E8F", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(249,221,14,0.10)" }} contentStyle={{ background: "#FFFFFF", border: "1px solid rgba(38,39,93,0.10)", borderRadius: 12, color: "#26275D" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Chiều cao (cm)" fill="#26275D" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Cân nặng (kg)" fill="#3A3B7A" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="BMI" fill="#F9DD0E" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {openTest && (
        <FitnessDetailModal
          testKey={openTest}
          rows={fitnessRows}
          comment={data?.commentBySession && fitnessRows.length ? data.commentBySession[fitnessRows[fitnessRows.length - 1].session_id] : null}
          onClose={() => setOpenTest(null)}
        />
      )}
    </PageTransition>
  );
}

function shortDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return `${date.getDate()}/${date.getMonth() + 1}/${String(date.getFullYear()).slice(2)}`;
}