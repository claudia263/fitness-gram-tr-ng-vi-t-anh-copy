import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useStudent } from "@/lib/StudentContext";
import { enrichAnthro } from "@/lib/studentData";
import { formatPlankTime } from "@/lib/fitness";
import PageTransition from "@/components/fg/PageTransition";
import StudentProfileCard from "@/components/fg/StudentProfileCard";
import FitnessCard from "@/components/fg/FitnessCard";
import RadarOverview from "@/components/fg/RadarOverview";
import GrowthCard from "@/components/fg/GrowthCard";
import EmptyState from "@/components/fg/EmptyState";
import SkeletonCard from "@/components/fg/SkeletonCard";
import FitnessDetailModal from "@/components/fg/FitnessDetailModal";
import NormsComparison from "@/components/fg/NormsComparison";
import { Link } from "react-router-dom";
import { ChevronRight, Calendar } from "lucide-react";

export default function ParentDashboard() {
  const { user, students, activeStudent, setActiveStudent, loadingStudents, data, loading } = useStudent();
  const [openTest, setOpenTest] = useState(null);
  const reduce = useReducedMotion();

  const fitnessRows = data?.fitnessRows || [];
  const anthroRows = data?.anthroRows || [];
  const comments = data?.commentBySession || {};

  const latestFitness = fitnessRows.length ? fitnessRows[fitnessRows.length - 1] : null;
  const latestAnthro = anthroRows.length ? enrichAnthro(anthroRows[anthroRows.length - 1], activeStudent?.birth_date) : null;
  const prevFitness = fitnessRows.length > 1 ? fitnessRows[fitnessRows.length - 2] : null;

  const latestSession = latestFitness?.session || latestAnthro?.session;
  const comment = latestSession ? comments[latestSession.id] : null;

  const greetingName = activeStudent?.full_name ? `PHỤ HUYNH CỦA ${activeStudent.full_name.toUpperCase()}` : "PHỤ HUYNH";

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Student selector if multiple */}
        {students.length > 1 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <span className="text-sm font-semibold text-navy self-center mr-1">Chọn học sinh:</span>
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveStudent(s)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                style={{
                  background: activeStudent?.id === s.id ? "#26275D" : "#FFFFFF",
                  color: activeStudent?.id === s.id ? "#FFFFFF" : "#26275D",
                  border: activeStudent?.id === s.id ? "none" : "1px solid rgba(38,39,93,0.10)",
                }}
              >
                {s.full_name}
              </button>
            ))}
          </div>
        )}

        {/* Greeting */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5"
        >
          <div className="text-sm text-muted-foreground">Xin chào,</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy leading-tight">{greetingName}</h1>
        </motion.div>

        {loadingStudents ? (
          <div className="mb-6"><div className="fg-skeleton" style={{ height: 110, borderRadius: 22 }} /></div>
        ) : activeStudent ? (
          <StudentProfileCard student={activeStudent} className="mb-6" />
        ) : null}

        {/* Latest session badge */}
        {latestSession && (
          <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Kỳ kiểm tra gần nhất: <span className="font-semibold text-navy">{latestSession.name}</span> — {formatDate(latestSession.test_date)}</span>
          </div>
        )}

        {/* Fitness cards */}
        <SectionTitle title="Kết quả Fitness Gram" subtitle="4 bài kiểm tra thể lực chính" />
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : latestFitness ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <FitnessCard testKey="pacer" current={latestFitness.pacer_laps} previous={prevFitness?.pacer_laps} delay={0.3} onOpen={() => setOpenTest("pacer")} />
            <FitnessCard testKey="sit_and_reach" current={latestFitness.sit_and_reach_cm} previous={prevFitness?.sit_and_reach_cm} delay={0.4} onOpen={() => setOpenTest("sit_and_reach")} />
            <FitnessCard testKey="pushup" current={latestFitness.pushup_count} previous={prevFitness?.pushup_count} delay={0.5} onOpen={() => setOpenTest("pushup")} />
            <FitnessCard testKey="plank" current={latestFitness.plank_seconds} previous={prevFitness?.plank_seconds} delay={0.6} onOpen={() => setOpenTest("plank")} />
          </div>
        ) : (
          <EmptyState className="mb-6" />
        )}

        {/* So sánh với chuẩn */}
        {!loading && (
          <NormsComparison student={activeStudent} fitness={latestFitness} anthro={latestAnthro} />
        )}

        {/* Growth + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          <div className="lg:col-span-3">
            {loading ? (
              <div className="fg-skeleton" style={{ height: 240, borderRadius: 22 }} />
            ) : latestAnthro ? (
              <GrowthCard anthro={latestAnthro} student={activeStudent} delay={0.7} />
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

        {/* Teacher comment */}
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

        {/* Recent history */}
        {fitnessRows.length > 0 && (
          <div className="fg-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy">Lịch sử gần đây</h3>
              <Link to="/history" className="text-sm font-semibold text-navy flex items-center gap-1 hover:underline">
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-2">
              {[...fitnessRows].reverse().slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "rgba(38,39,93,0.06)" }}>
                  <div>
                    <div className="text-sm font-semibold text-navy">{r.session?.name || "Đợt kiểm tra"}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(r.session?.test_date)}</div>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span><b className="text-navy">{r.pacer_laps ?? "--"}</b> lượt</span>
                    <span><b className="text-navy">{r.pushup_count ?? "--"}</b> lần</span>
                    <span><b className="text-navy">{formatPlankTime(r.plank_seconds)}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {openTest && (
        <FitnessDetailModal
          testKey={openTest}
          rows={fitnessRows}
          comment={latestSession ? comments[latestSession.id] : null}
          onClose={() => setOpenTest(null)}
        />
      )}
    </PageTransition>
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