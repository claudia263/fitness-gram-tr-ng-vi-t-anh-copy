import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ChevronRight } from "lucide-react";

export default function StudentProfileCard({ student, className = "", onNameClick }) {
  const reduce = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1];
  const anim = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease } };

  const initials = (student?.full_name || "?")
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("");

  return (
    <motion.div {...anim} className={`fg-card p-5 sm:p-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-extrabold text-2xl shrink-0"
          style={{ background: "#F9DD0E", color: "#26275D" }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Học sinh</div>
          {onNameClick ? (
            <button
              onClick={onNameClick}
              className="group inline-flex items-center gap-1.5 text-left"
            >
              <h2 className="text-xl sm:text-2xl font-extrabold text-navy truncate group-hover:underline">{student?.full_name}</h2>
              <ChevronRight className="w-5 h-5 text-yellow-deep shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy truncate">{student?.full_name}</h2>
          )}
          {student?.birth_date && (
            <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              <span>Ngày sinh: <span className="font-semibold text-navy">{formatBirthDate(student.birth_date)}</span></span>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill label={`Lớp ${student?.grade || ""}`} />
            <Pill label={`Năm học ${student?.school_year || ""}`} />
            <Pill label={student?.campus || "Trường Việt Anh"} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Pill({ label }) {
  return (
    <span
      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ background: "#F4F5F8", color: "#26275D" }}
    >
      {label}
    </span>
  );
}

function formatBirthDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}