import { useStudent } from "@/lib/StudentContext";
import { useAuth } from "@/lib/AuthContext";
import { formatAge } from "@/lib/fitness";
import PageTransition from "@/components/fg/PageTransition";
import StudentProfileCard from "@/components/fg/StudentProfileCard";
import EmptyState from "@/components/fg/EmptyState";

export default function Profile() {
  const { user } = useAuth();
  const { activeStudent, loadingStudents, students, setActiveStudent } = useStudent();

  if (loadingStudents) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-[800px] px-4 py-8">
          <div className="fg-skeleton" style={{ height: 120, borderRadius: 22 }} />
        </div>
      </PageTransition>
    );
  }

  if (!activeStudent) {
    return <PageTransition><div className="mx-auto max-w-[800px] px-4 py-8"><EmptyState /></div></PageTransition>;
  }

  const sexLabel = activeStudent.sex === "male" ? "Nam" : activeStudent.sex === "female" ? "Nữ" : "--";

  return (
    <PageTransition>
      <div className="mx-auto max-w-[800px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy mb-6">Hồ sơ</h1>

        {students.length > 1 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveStudent(s)}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  background: activeStudent.id === s.id ? "#26275D" : "#FFFFFF",
                  color: activeStudent.id === s.id ? "#FFFFFF" : "#26275D",
                  border: activeStudent.id === s.id ? "none" : "1px solid rgba(38,39,93,0.10)",
                }}
              >
                {s.full_name}
              </button>
            ))}
          </div>
        )}

        <StudentProfileCard student={activeStudent} className="mb-5" />

        <div className="fg-card p-5 sm:p-6 mb-5">
          <h3 className="font-bold text-navy mb-4">Thông tin học sinh</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <InfoRow label="Họ tên" value={activeStudent.full_name} />
            <InfoRow label="Mã học sinh" value={activeStudent.student_code || "--"} />
            <InfoRow label="Ngày sinh" value={formatDate(activeStudent.birth_date)} />
            <InfoRow label="Giới tính" value={sexLabel} />
            <InfoRow label="Khối/Lớp" value={`${activeStudent.grade || "--"}`} />
            <InfoRow label="Năm học" value={activeStudent.school_year || "--"} />
            <InfoRow label="Cơ sở" value={activeStudent.campus || "Trường Việt Anh"} />
          </div>
        </div>

        <div className="fg-card p-5 sm:p-6">
          <h3 className="font-bold text-navy mb-4">Thông tin phụ huynh</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <InfoRow label="Họ tên" value={user?.full_name || ""} />
            <InfoRow label="Email" value={user?.email || ""} />
            <InfoRow label="Số điện thoại" value={user?.phone || ""} />
            <InfoRow label="Mối quan hệ" value={user?.relationship || ""} />
          </div>
          <div className="mt-5 pt-5 border-t text-xs text-muted-foreground leading-relaxed" style={{ borderColor: "rgba(38,39,93,0.06)" }}>
            Dữ liệu hồ sơ được bảo mật. Phụ huynh chỉ xem được thông tin của học sinh liên kết với tài khoản.
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
      <div className="text-sm font-semibold text-navy">{value}</div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return "--";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}