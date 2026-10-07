import { Navigate, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useStudent } from "@/lib/StudentContext";
import { useTrackView } from "@/lib/usage";
import { ROLE_HOMES, useRole } from "@/lib/RoleContext";
import PageTransition from "@/components/fg/PageTransition";
import BrandLogo from "@/components/fg/BrandLogo";
import StudentResultsView from "@/components/fg/StudentResultsView";
import EmptyState from "@/components/fg/EmptyState";
import { ChevronRight } from "lucide-react";

// Trang tra cứu: chỉ hiển thị học sinh mà phụ huynh/học sinh đã nhập tên ở trang đăng nhập.
// Không cho phép duyệt hay tìm học sinh khác.
export default function LookupHome() {
  const reduce = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1];
  const { students, activeStudent, setActiveStudent, loadingStudents } = useStudent();
  const { role } = useRole();
  const navigate = useNavigate();
  useTrackView("xem_tong_quan", { studentId: activeStudent?.id, enabled: role === "parent" && !!activeStudent });

  // Cán bộ nhà trường không dùng trang tra cứu của phụ huynh → vào thẳng trang của vai trò mình
  if (role !== "parent") {
    return <Navigate to={ROLE_HOMES[role]} replace />;
  }

  if (loadingStudents) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => <div key={i} className="fg-skeleton" style={{ height: 120, borderRadius: 22 }} />)}
          </div>
        </div>
      </PageTransition>
    );
  }

  if (students.length === 0) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <EmptyState
            title="Chưa có học sinh liên kết"
            description="Vui lòng đăng nhập lại và nhập đúng họ tên học sinh đang học tại trường."
          />
        </div>
      </PageTransition>
    );
  }

  // Chỉ 1 học sinh: hiện kết quả luôn
  if (students.length === 1) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <StudentResultsView student={students[0]} onNameClick={() => navigate("/results")} />
        </div>
      </PageTransition>
    );
  }

  // Nhiều học sinh trùng tên: chọn trong số đó (không duyệt học sinh khác)
  return (
    <PageTransition>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="fg-card p-6 sm:p-8 mb-6"
          style={{ background: "linear-gradient(135deg, #26275D 0%, #3A3B7A 100%)" }}
        >
          <div className="flex flex-col items-center text-center">
            <BrandLogo size={44} variant="light" />
            <h1 className="text-white font-extrabold mt-4 text-2xl sm:text-3xl">Chọn học sinh</h1>
            <p className="text-sm sm:text-base mt-1.5" style={{ color: "rgba(255,255,255,0.72)" }}>
              Có nhiều học sinh trùng tên — hãy chọn đúng con của bạn
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s, i) => (
            <motion.button
              key={s.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: Math.min(i * 0.04, 0.3) }}
              onClick={() => setActiveStudent(s)}
              className="fg-card fg-card-hover p-5 text-left flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shrink-0" style={{ background: "#26275D", color: "#FFFFFF" }}>
                {(s.full_name || "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-navy truncate">{s.full_name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Lớp {s.grade || "--"} · {s.sex === "female" ? "Nữ" : "Nam"} · {s.campus || "--"}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </motion.button>
          ))}
        </div>

        {activeStudent && (
          <div className="mt-6">
            <StudentResultsView student={activeStudent} onNameClick={() => navigate("/results")} />
          </div>
        )}
      </div>
    </PageTransition>
  );
}