import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import LoginVisual from "@/components/fg/LoginVisual";
import LoginForm from "@/components/fg/LoginForm";
import StaffLoginForm from "@/components/fg/StaffLoginForm";
import StudentLoginForm from "@/components/fg/StudentLoginForm";
import { STUDENT_FLAG, fetchPublicSettings, isStudentEmail } from "@/lib/studentAuth";
import { useAuth } from "@/lib/AuthContext";
import { USAGE_NOTICE, track } from "@/lib/usage";

export const STAFF_LOGIN_PATH = "/dang-nhap-can-bo";

// staff = false: trang phụ huynh / học sinh (/login); staff = true: trang riêng của cán bộ nhà trường
export default function Login({ staff = false }) {
  const reduce = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mode = staff ? "staff" : "parent";
  // Đăng nhập email học sinh: bắt buộc khi admin bật (student_login), hoặc phụ huynh tự chọn
  const { user } = useAuth();
  const returningStudent = !!(new URLSearchParams(window.location.search).get("hoc-sinh") || sessionStorage.getItem(STUDENT_FLAG) || isStudentEmail(user?.email));
  const [settings, setSettings] = useState(null);
  const [useEmail, setUseEmail] = useState(returningStudent);
  useEffect(() => {
    fetchPublicSettings().then(setSettings);
  }, []);
  const studentLogin = settings?.student_login || useEmail;
  // Quay lại từ đăng nhập Google / link email của cán bộ (/login?staff=1) → chuyển sang trang cán bộ
  if (!staff && (new URLSearchParams(location.search).get("staff") || sessionStorage.getItem("fg_google_login"))) {
    return <Navigate to={{ pathname: STAFF_LOGIN_PATH, search: location.search, hash: location.hash }} replace />;
  }

  const enterResults = () => {
    setLeaving(true);
    setTimeout(() => navigate("/"), 300);
  };

  const handleSubmit = async (name) => {
    setBusy(true);
    setError("");
    try {
      const matched = await base44.rpc("lookup_students", { p_name: name });
      if (matched.length === 0) {
        setError("Không tìm thấy học sinh với tên này trong danh sách trường. Vui lòng kiểm tra lại họ tên.");
        setBusy(false);
        return;
      }
      sessionStorage.setItem("fg_entered", "true");
      sessionStorage.setItem("fg_student_ids", JSON.stringify(matched.map((s) => s.id)));
      matched.forEach((s) => track("tra_cuu_ket_qua", { studentId: s.id }));
      window.dispatchEvent(new Event("fg_students_changed"));
      setLeaving(true);
      setTimeout(() => navigate("/"), 300);
    } catch (e) {
      setError("Không thể tra cứu lúc này, vui lòng thử lại.");
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={leaving ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: reduce ? 0.2 : 0.5 }}
        className="absolute inset-0"
      >
        <LoginVisual
          formOpen
          title={staff ? <>Cổng làm việc<br />dành cho cán bộ nhà trường</> : undefined}
          subtitle={staff ? "Đăng nhập bằng tài khoản của nhà trường để quản lý dữ liệu thể chất và câu lạc bộ." : undefined}
        >
          <div className="w-full max-w-sm mx-auto">
            {mode === "parent" ? (
              !settings && !returningStudent ? (
                <div className="fg-card h-40 w-full max-w-sm mx-auto fg-skeleton" />
              ) : studentLogin ? (
                <>
                  <StudentLoginForm onEntered={enterResults} />
                  {!settings?.student_login && (
                    <button type="button" onClick={() => setUseEmail(false)} className="mt-3 block w-full text-center text-xs font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
                      ← Tra cứu bằng họ tên học sinh
                    </button>
                  )}
                </>
              ) : (
                <>
                  <LoginForm onSubmit={handleSubmit} busy={busy} error={error} />
                  <button type="button" onClick={() => setUseEmail(true)} className="mt-3 block w-full text-center text-xs font-semibold underline-offset-2 hover:underline" style={{ color: "rgba(255,255,255,0.85)" }}>
                    Có email học sinh @student.truongvietanh.com? Đăng nhập bằng email
                  </button>
                </>
              )
            ) : (
              <StaffLoginForm />
            )}
            <p className="mt-4 text-center text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.6)" }}>
              {USAGE_NOTICE}
            </p>
            {staff ? (
              <Link to="/login" className="mt-3 block text-center text-xs font-semibold hover:underline" style={{ color: "rgba(255,255,255,0.8)" }}>
                ← Về trang phụ huynh / học sinh
              </Link>
            ) : (
              <Link to={STAFF_LOGIN_PATH} className="mt-5 block text-center text-[11px] hover:underline" style={{ color: "rgba(255,255,255,0.45)" }}>
                Dành cho cán bộ nhà trường
              </Link>
            )}
          </div>
        </LoginVisual>
      </motion.div>
    </div>
  );
}