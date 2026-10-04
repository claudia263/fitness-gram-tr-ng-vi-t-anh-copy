import { RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis } from "recharts";
import { enrichAnthro } from "@/lib/studentData";
import {
  formatPlankTime,
  calculateAgeMonths,
  nutritionalStatusFromZScore,
} from "@/lib/fitness";
import {
  getNutritionAdvice,
  getFitnessAdvice,
  calculateMacros,
  AGE_LABELS,
  getAgeGroup,
} from "@/lib/healthAdvice";

// Bố cục báo cáo A4 tĩnh — chia 2 trang, mỗi trang đúng tỉ lệ A4 (794 x 1123 @96dpi)
const TESTS = [
  { key: "pacer", label: "PACER", desc: "Sức bền tim phổi", field: "pacer_level", unit: "level" },
  { key: "sit_and_reach", label: "Sit & Reach", desc: "Độ linh hoạt", field: "sit_and_reach_cm", unit: "cm" },
  { key: "pushup", label: "Push-up", desc: "Sức mạnh thân trên", field: "pushup_count", unit: "lần" },
  { key: "plank", label: "Plank", desc: "Sức bền Core", field: "plank_seconds", unit: "" },
];

const REF_MAX = { pacer_level: 15, sit_and_reach_cm: 40, pushup_count: 30, plank_seconds: 180 };
const AXES = [
  { key: "pacer_level", label: "Sức bền tim phổi" },
  { key: "sit_and_reach_cm", label: "Linh hoạt" },
  { key: "pushup_count", label: "Sức mạnh thân trên" },
  { key: "plank_seconds", label: "Sức bền Core" },
];

const PAGE_STYLE = {
  width: 794,
  minHeight: 1123,
  background: "#F0F4F8",
  padding: 28,
  fontFamily: '"Be Vietnam Pro", sans-serif',
  color: "#26275D",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
};

export default function ExportReport({ student, data, page1Ref, page2Ref }) {
  const fitnessRows = data?.fitnessRows || [];
  const anthroRows = (data?.anthroRows || []).map((a) => enrichAnthro(a, student?.birth_date, student?.sex));
  const sessions = data?.sessions || [];
  const comments = data?.commentBySession || {};

  const latestFitness = fitnessRows.length ? fitnessRows[fitnessRows.length - 1] : null;
  const latestAnthro = anthroRows.length ? anthroRows[anthroRows.length - 1] : null;
  const latestSession = latestFitness?.session || latestAnthro?.session || (sessions[0] ? { ...sessions[0] } : null);
  const comment = latestSession ? comments[latestSession.id] : null;

  const ageMonths = latestAnthro?.age_months ?? calculateAgeMonths(student?.birth_date, latestSession?.test_date);
  const ageGroup = getAgeGroup(ageMonths);
  const status = latestAnthro?.nutritional_status || nutritionalStatusFromZScore(latestAnthro?.bmi_for_age_zscore);
  const nutrition = getNutritionAdvice(status, ageMonths);
  const macros = calculateMacros(latestAnthro?.weight_kg, ageMonths, status);

  const initials = (student?.full_name || "?").trim().split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase();

  return (
    <>
      {/* ===================== TRANG 1: KẾT QUẢ THỂ CHẤT ===================== */}
      <div ref={page1Ref} style={PAGE_STYLE}>
        <HeaderBand latestSession={latestSession} />

        {/* Student profile card */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 8px 30px rgba(38,39,93,0.07)", marginBottom: 16, display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#F9DD0E", color: "#26275D", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 24, flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#26275D" }}>{student?.full_name || "Học sinh"}</div>
            <div style={{ display: "flex", gap: 18, marginTop: 6, fontSize: 12, color: "#6B6E8F", flexWrap: "wrap" }}>
              <span>📅 Ngày sinh: {formatDate(student?.birth_date)}</span>
              <span>Giới tính: {student?.sex === "female" ? "Nữ" : "Nam"}</span>
              <span>Lớp: {student?.grade || "--"}</span>
              <span>Năm học: {student?.school_year || "--"}</span>
              <span>Cơ sở: {student?.campus || "--"}</span>
            </div>
          </div>
        </div>

        {latestSession && (
          <div style={{ background: "#FEF3B0", borderRadius: 12, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#26275D", marginBottom: 16 }}>
            Kỳ kiểm tra gần nhất: {latestSession.name} — {formatDate(latestSession.test_date)}
          </div>
        )}

        {/* Fitness Gram section */}
        <SectionTitle title="KẾT QUẢ FITNESS GRAM" subtitle="4 bài kiểm tra thể lực chính" />
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          {TESTS.map((t) => {
            const val = latestFitness?.[t.field];
            const display = t.field === "plank_seconds" ? (val != null ? formatPlankTime(val) : "--") : (val != null ? val : "--");
            return (
              <div key={t.key} style={{ flex: 1, background: "#fff", borderRadius: 16, padding: 14, boxShadow: "0 4px 16px rgba(38,39,93,0.06)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "#FEF3B0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                  <TestIcon k={t.key} />
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#6B6E8F", letterSpacing: 0.4 }}>KẾT QUẢ GẦN NHẤT</div>
                <div style={{ fontWeight: 800, fontSize: 15, marginTop: 2 }}>{t.label}</div>
                <div style={{ fontSize: 10, color: "#6B6E8F" }}>{t.desc}</div>
                <div style={{ marginTop: 8, fontWeight: 800, fontSize: 22, color: "#26275D" }}>
                  {display}{t.unit && val != null ? <span style={{ fontSize: 12, color: "#6B6E8F", marginLeft: 3 }}>{t.unit}</span> : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Growth + Radar */}
        <SectionTitle title="TĂNG TRƯỞNG & THỂ TRẠNG" subtitle="Chỉ số nhân trắc và tổng quan thể lực" />
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 3, background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 4px 16px rgba(38,39,93,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F9DD0E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#26275D" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 14l3-3 4 4 5-6"/></svg>
              </div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Chỉ số nhân trắc</div>
            </div>
            {latestAnthro ? (
              <>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}><Stat label="CHIỀU CAO" value={latestAnthro.height_cm != null ? `${latestAnthro.height_cm} cm` : "--"} /></div>
                  <div style={{ flex: 1 }}><Stat label="CÂN NẶNG" value={latestAnthro.weight_kg != null ? `${latestAnthro.weight_kg} kg` : "--"} /></div>
                  <div style={{ flex: 1 }}><Stat label="BMI" value={latestAnthro.bmi != null ? latestAnthro.bmi.toFixed(2) : "--"} /></div>
                </div>
                <div style={{ fontSize: 11, color: "#26275D" }}>
                  Tình trạng: <b style={{ color: nutrition?.color }}>{nutrition?.label || status}</b>
                </div>
                <div style={{ fontSize: 9, color: "#6B6E8F", marginTop: 4 }}>Đánh giá BMI-for-age dựa theo WHO Growth Reference 2007</div>
              </>
            ) : <Empty text="Chưa có dữ liệu thể trạng" />}
          </div>
          <div style={{ flex: 2, background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 4px 16px rgba(38,39,93,0.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>Tổng quan thể chất</div>
            <div style={{ fontSize: 10, color: "#6B6E8F", marginBottom: 6 }}>4 nhóm năng lực thể lực</div>
            <RadarBlock current={latestFitness} />
          </div>
        </div>

        <PageFooter pageNo={1} />
      </div>

      {/* ===================== TRANG 2: LỜI KHUYÊN & LỊCH SỬ ===================== */}
      <div ref={page2Ref} style={{ ...PAGE_STYLE, marginTop: 24 }}>
        <HeaderBand latestSession={latestSession} compact />

        {/* Health advice */}
        <SectionTitle title="LỜI KHUYÊN SỨC KHỎE & PHÁT TRIỂN" subtitle={`Dựa trên tham chiếu WHO — Lứa tuổi: ${AGE_LABELS[ageGroup]}`} />
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 4px 16px rgba(38,39,93,0.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>MỤC TIÊU MACRO/NGÀY {macros ? `— ${macros.targetCalories} kcal` : ""}</div>
            {macros ? (
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <Macro v={`${macros.targetCalories}`} u="kcal" />
                <Macro v={`${macros.proteinG}g`} u="Protein" />
                <Macro v={`${macros.carbG}g`} u="Tinh bột" />
                <Macro v={`${macros.fatG}g`} u="Chất béo" />
              </div>
            ) : <div style={{ fontSize: 11, color: "#6B6E8F", marginBottom: 10 }}>Chưa có dữ liệu để tính macro.</div>}
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10.5, lineHeight: 1.55, color: "#26275D" }}>
              {(nutrition?.nutrition || []).map((t, i) => <li key={i} style={{ marginBottom: 3 }}>{t}</li>)}
            </ul>
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 4px 16px rgba(38,39,93,0.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>BÀI TẬP PHÁT TRIỂN</div>
            {TESTS.map((t) => {
              const val = latestFitness?.[t.field];
              const adv = getFitnessAdvice(t.key, val, ageMonths);
              if (!adv) return null;
              return (
                <div key={t.key} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 11, color: "#26275D", textTransform: "uppercase" }}>{t.label} — {t.desc}</div>
                  <ul style={{ margin: "4px 0 0", paddingLeft: 16, fontSize: 10, lineHeight: 1.5, color: "#26275D" }}>
                    {(adv.tips || []).slice(0, 3).map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                </div>
              );
            })}
            {!latestFitness && <Empty text="Chưa có dữ liệu thể lực" />}
          </div>
        </div>

        {/* Teacher comment */}
        {comment && (comment.fitness_comment || comment.growth_comment || comment.recommendation) && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 4px 16px rgba(38,39,93,0.06)", marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>NHẬN XÉT TỪ GIÁO VIÊN</div>
            {comment.fitness_comment && <p style={{ fontSize: 11, margin: "0 0 4px", lineHeight: 1.5 }}>{comment.fitness_comment}</p>}
            {comment.growth_comment && <p style={{ fontSize: 11, margin: "0 0 4px", lineHeight: 1.5 }}>{comment.growth_comment}</p>}
            {comment.recommendation && <p style={{ fontSize: 11, margin: 0, lineHeight: 1.5 }}><b>Khuyến nghị: </b>{comment.recommendation}</p>}
          </div>
        )}

        {/* History */}
        <SectionTitle title="LỊCH SỬ CÁC ĐỢT KIỂM TRA" />
        <div style={{ background: "#fff", borderRadius: 16, padding: 14, boxShadow: "0 4px 16px rgba(38,39,93,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "#26275D", color: "#fff" }}>
                <Th>Đợt kiểm tra</Th><Th>Ngày</Th><Th>PACER</Th><Th>S&R</Th><Th>Push-up</Th><Th>Plank</Th>
              </tr>
            </thead>
            <tbody>
              {[...sessions].filter((s) => s.test_date).sort((a, b) => new Date(b.test_date) - new Date(a.test_date)).map((s, idx) => {
                const f = fitnessRows.find((r) => r.session_id === s.id);
                return (
                  <tr key={s.id} style={{ background: idx % 2 ? "#F7F8FC" : "#fff" }}>
                    <Td><b>{s.name || "Đợt kiểm tra"}</b></Td>
                    <Td>{formatDate(s.test_date)}</Td>
                    <Td>{f?.pacer_level ?? "--"} level</Td>
                    <Td>{f?.sit_and_reach_cm ?? "--"} cm</Td>
                    <Td>{f?.pushup_count ?? "--"}</Td>
                    <Td>{f?.plank_seconds != null ? formatPlankTime(f.plank_seconds) : "--"}</Td>
                  </tr>
                );
              })}
              {sessions.length === 0 && (
                <tr><Td colSpan={6} style={{ textAlign: "center", color: "#6B6E8F" }}>Chưa có đợt kiểm tra</Td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1 }} />
        <PageFooter pageNo={2} />
      </div>
    </>
  );
}

function HeaderBand({ latestSession, compact }) {
  return (
    <div style={{ background: "linear-gradient(135deg,#26275D,#3A3B7A)", borderRadius: 20, padding: compact ? "16px 22px" : "22px 26px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <div>
        <div style={{ color: "#F9DD0E", fontWeight: 800, fontSize: compact ? 17 : 20, letterSpacing: 0.5 }}>TRƯỜNG VIỆT ANH</div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: compact ? 11 : 13, marginTop: 2 }}>FITNESS GRAM — Báo cáo kết quả thể chất</div>
      </div>
      <div style={{ textAlign: "right", color: "rgba(255,255,255,0.75)", fontSize: 11 }}>
        <div>Ngày xuất: {formatDate(new Date())}</div>
        <div style={{ marginTop: 2 }}>{latestSession?.name || ""}</div>
      </div>
    </div>
  );
}

function PageFooter({ pageNo }) {
  return (
    <div style={{ marginTop: "auto", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#6B6E8F", fontSize: 9 }}>
      <span>Báo cáo được tạo bởi hệ thống Fitness Gram — Trường Việt Anh</span>
      <span>Trang {pageNo}/2</span>
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 10, marginTop: 4 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: "#26275D", letterSpacing: 0.3 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 10, color: "#6B6E8F" }}>{subtitle}</div>}
    </div>
  );
}
function Stat({ label, value }) {
  return (
    <div style={{ background: "#F4F5F8", borderRadius: 12, padding: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#6B6E8F", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 17, color: "#26275D", marginTop: 2 }}>{value}</div>
    </div>
  );
}
function Macro({ v, u }) {
  return (
    <div style={{ flex: 1, background: "#F4F5F8", borderRadius: 10, padding: 8, textAlign: "center" }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: "#26275D" }}>{v}</div>
      <div style={{ fontSize: 9, color: "#6B6E8F" }}>{u}</div>
    </div>
  );
}
function Th({ children }) {
  return <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, fontSize: 10 }}>{children}</th>;
}
function Td({ children, colSpan, style }) {
  return <td colSpan={colSpan} style={{ padding: "8px 10px", ...style }}>{children}</td>;
}
function Empty({ text }) {
  return <div style={{ fontSize: 11, color: "#6B6E8F", padding: "20px 0", textAlign: "center" }}>{text}</div>;
}
function TestIcon({ k }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "#26275D", strokeWidth: 2 };
  if (k === "pacer") return <svg {...common}><path d="M13 4v8l5 3"/><circle cx="12" cy="12" r="9"/></svg>;
  if (k === "sit_and_reach") return <svg {...common}><path d="M2 12h20"/><path d="M2 12l4-4M2 12l4 4"/></svg>;
  if (k === "pushup") return <svg {...common}><path d="M4 14h16"/><circle cx="12" cy="9" r="3"/></svg>;
  return <svg {...common}><rect x="4" y="9" width="16" height="6" rx="1"/></svg>;
}

function RadarBlock({ current }) {
  const hasData = AXES.some((a) => current?.[a.key] != null);
  const d = AXES.map((a) => {
    const v = current?.[a.key];
    return { subject: a.label, score: v != null ? Math.min(100, Math.round((v / REF_MAX[a.key]) * 100)) : 0 };
  });
  if (!hasData) return <Empty text="Chưa có dữ liệu thể lực" />;
  return (
    <div style={{ width: "100%", height: 220 }}>
      <RadarChartLazy data={d} />
    </div>
  );
}

function RadarChartLazy({ data }) {
  return (
    <RadarChart data={data} outerRadius="70%" width={300} height={220}>
      <PolarGrid stroke="rgba(38,39,93,0.10)" />
      <PolarAngleAxis dataKey="subject" tick={{ fill: "#26275D", fontSize: 10, fontWeight: 600 }} />
      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
      <Radar dataKey="score" stroke="#26275D" strokeWidth={2} fill="rgba(249,221,14,0.20)" dot={{ fill: "#F9DD0E", stroke: "#26275D", strokeWidth: 1.5, r: 4 }} />
    </RadarChart>
  );
}

function formatDate(d) {
  if (!d) return "--";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}