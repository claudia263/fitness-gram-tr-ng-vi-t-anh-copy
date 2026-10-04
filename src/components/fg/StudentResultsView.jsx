import { useState } from "react";
import { useStudentBundle } from "@/lib/studentData";
import { enrichAnthro } from "@/lib/studentData";
import { formatPlankTime } from "@/lib/fitness";
import StudentProfileCard from "@/components/fg/StudentProfileCard";
import FitnessCard from "@/components/fg/FitnessCard";
import RadarOverview from "@/components/fg/RadarOverview";
import GrowthCard from "@/components/fg/GrowthCard";
import EmptyState from "@/components/fg/EmptyState";
import SkeletonCard from "@/components/fg/SkeletonCard";
import FitnessDetailModal from "@/components/fg/FitnessDetailModal";
import HealthAdvice from "@/components/fg/HealthAdvice";
import ExportResultsButton from "@/components/fg/ExportResultsButton";
import { Calendar } from "lucide-react";

// Hiển thị toàn bộ kết quả thể chất của một học sinh (fitness + growth + nhận xét + lịch sử)
export default function StudentResultsView({ student, onNameClick }) {
  const { data, loading } = useStudentBundle(student?.id);
  const [openTest, setOpenTest] = useState(null);

  const fitnessRows = data?.fitnessRows || [];
  const anthroRows = data?.anthroRows || [];
  const comments = data?.commentBySession || {};
  const allSessions = data?.sessions || [];

  // Map fitness results by session_id for quick lookup
  const fitnessBySession = {};
  fitnessRows.forEach((r) => { fitnessBySession[r.session_id] = r; });

  // All test sessions sorted by test_date descending (newest first)
  const historySessions = [...allSessions]
    .filter((s) => s.test_date)
    .sort((a, b) => new Date(b.test_date) - new Date(a.test_date));

  const latestFitness = fitnessRows.length ? fitnessRows[fitnessRows.length - 1] : null;
  const latestAnthro = anthroRows.length ? enrichAnthro(anthroRows[anthroRows.length - 1], student?.birth_date, student?.sex) : null;
  const prevFitness = fitnessRows.length > 1 ? fitnessRows[fitnessRows.length - 2] : null;

  const latestSession = latestFitness?.session || latestAnthro?.session;
  const comment = latestSession ? comments[latestSession.id] : null;

  const hasFitnessData = latestFitness && (
    latestFitness.pacer_laps != null || latestFitness.pacer_level != null ||
    latestFitness.sit_and_reach_cm != null || latestFitness.pushup_count != null ||
    latestFitness.plank_seconds != null
  );
  const hasAnyData = hasFitnessData || latestAnthro != null;

  return (
    <div className="mt-6">
      <div className="flex justify-end mb-3">
        <ExportResultsButton student={student} data={data} />
      </div>
      <StudentProfileCard student={student} className="mb-6" onNameClick={onNameClick} />

      {latestSession && (
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Kỳ kiểm tra gần nhất: <span className="font-semibold text-navy">{latestSession.name}</span> — {formatDate(latestSession.test_date)}</span>
        </div>
      )}

      {!loading && !hasAnyData ? (
        <div className="fg-card p-8 sm:p-10 text-center mb-6">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "#FEF3B0", color: "#26275D" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
          </div>
          <h3 className="font-bold text-navy text-lg mb-1.5">Chưa cập nhật dữ liệu</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Học sinh chưa có kết quả kiểm tra thể chất. Vui lòng quay lại sau khi nhà trường hoàn thành đợt kiểm tra tiếp theo.
          </p>
        </div>
      ) : (
        <>
          <SectionTitle title="Kết quả Fitness Gram" subtitle="4 bài kiểm tra thể lực chính" />
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : hasFitnessData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <FitnessCard testKey="pacer" current={latestFitness.pacer_level} previous={prevFitness?.pacer_level} delay={0.3} onOpen={() => setOpenTest("pacer")} />
              <FitnessCard testKey="sit_and_reach" current={latestFitness.sit_and_reach_cm} previous={prevFitness?.sit_and_reach_cm} delay={0.4} onOpen={() => setOpenTest("sit_and_reach")} />
              <FitnessCard testKey="pushup" current={latestFitness.pushup_count} previous={prevFitness?.pushup_count} delay={0.5} onOpen={() => setOpenTest("pushup")} />
              <FitnessCard testKey="plank" current={latestFitness.plank_seconds} previous={prevFitness?.plank_seconds} delay={0.6} onOpen={() => setOpenTest("plank")} />
            </div>
          ) : (
            <EmptyState className="mb-6" />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
            <div className="lg:col-span-3">
              {loading ? (
                <div className="fg-skeleton" style={{ height: 240, borderRadius: 22 }} />
              ) : latestAnthro ? (
                <GrowthCard anthro={latestAnthro} student={student} delay={0.7} />
              ) : (
                <EmptyState title="Chưa có dữ liệu thể trạng" description="Chiều cao, cân nặng và BMI sẽ cập nhật sau đợt kiểm tra." />
              )}
            </div>
            <div className="lg:col-span-2">
              {loading ? (
                <div className="fg-skeleton" style={{ height: 240, borderRadius: 22 }} />
              ) : (
                <RadarOverview current={latestFitness} />
              )}
            </div>
          </div>
        </>
      )}

      {!loading && (latestAnthro || latestFitness) && (
        <HealthAdvice anthro={latestAnthro} fitness={latestFitness} sex={student?.sex} />
      )}

      {comment && (comment.fitness_comment || comment.growth_comment || comment.recommendation) && (
        <div className="fg-card p-5 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F9DD0E", color: "#26275D" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <h3 className="font-bold text-navy">Nhận xét từ giáo viên</h3>
          </div>
          {comment.fitness_comment && <p className="text-sm text-navy/80 leading-relaxed mb-2">{comment.fitness_comment}</p>}
          {comment.growth_comment && <p className="text-sm text-navy/80 leading-relaxed mb-2">{comment.growth_comment}</p>}
          {comment.recommendation && <p className="text-sm text-navy/80 leading-relaxed"><span className="font-semibold">Khuyến nghị: </span>{comment.recommendation}</p>}
        </div>
      )}

      {historySessions.length > 0 && (
        <div className="fg-card p-5 sm:p-6">
          <h3 className="font-bold text-navy mb-4">Lịch sử các đợt kiểm tra</h3>
          <div className="space-y-2">
            {historySessions.map((s) => {
              const r = fitnessBySession[s.id];
              return (
                <div key={s.id} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "rgba(38,39,93,0.06)" }}>
                  <div>
                    <div className="text-sm font-semibold text-navy">{s.name || "Đợt kiểm tra"}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(s.test_date)}</div>
                  </div>
                  {r ? (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 justify-end text-xs text-muted-foreground">
                      <span><b className="text-navy">{r.pacer_level ?? "--"}</b> PACER</span>
                      <span><b className="text-navy">{r.sit_and_reach_cm ?? "--"}</b> cm</span>
                      <span><b className="text-navy">{r.pushup_count ?? "--"}</b> Push-up</span>
                      <span><b className="text-navy">{formatPlankTime(r.plank_seconds)}</b> Plank</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Chưa có dữ liệu</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {openTest && (
        <FitnessDetailModal
          testKey={openTest}
          rows={fitnessRows}
          comment={latestSession ? comments[latestSession.id] : null}
          onClose={() => setOpenTest(null)}
        />
      )}
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg sm:text-xl font-extrabold text-navy uppercase tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}