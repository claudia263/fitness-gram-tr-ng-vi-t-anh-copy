// Học sinh / phụ huynh đăng nhập bằng email học sinh @student.truongvietanh.com: Google hoặc link gửi qua email.
// Đăng nhập xong: tìm học sinh có đúng email đó (my_students) rồi vào xem kết quả.
import { useEffect, useState } from "react";
import { AlertCircle, Mail, MailCheck, Send } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { useAuth } from "@/lib/AuthContext";
import { track } from "@/lib/usage";
import { STUDENT_DOMAIN, enterAsStudents, isStudentEmail, loginStudentWithGoogle, myStudents, sendStudentLoginLink } from "@/lib/studentAuth";

export default function StudentLoginForm({ onEntered }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [linkSent, setLinkSent] = useState("");
  const [checking, setChecking] = useState(false);

  const signedInStudent = isAuthenticated && isStudentEmail(user?.email);

  // Đã đăng nhập bằng email học sinh (vừa quay lại từ Google / link) → vào xem kết quả
  useEffect(() => {
    if (!signedInStudent) return;
    let alive = true;
    setChecking(true);
    myStudents()
      .then((list) => {
        if (!alive) return;
        if (!list.length) {
          setError(`Email ${user.email} chưa có trong danh sách học sinh của trường. Vui lòng liên hệ nhà trường.`);
          return;
        }
        enterAsStudents(list);
        list.forEach((s) => track("dang_nhap_hoc_sinh", { studentId: s.id }));
        onEntered?.();
      })
      .catch(() => alive && setError("Không kiểm tra được tài khoản lúc này, vui lòng thử lại."))
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [signedInStudent, user?.email]);

  const google = async () => {
    setError("");
    try {
      await loginStudentWithGoogle();
    } catch (e) {
      setError("Chưa mở được đăng nhập Google. Vui lòng thử lại hoặc nhận link qua email.");
    }
  };

  const sendLink = async (e) => {
    e.preventDefault();
    const target = email.trim().toLowerCase();
    if (!isStudentEmail(target)) {
      setError(`Vui lòng dùng email học sinh có đuôi @${STUDENT_DOMAIN}.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await sendStudentLoginLink(target);
      setLinkSent(target);
    } catch (err) {
      setError(err.status === 429 ? "Vừa gửi link quá nhiều lần. Vui lòng đợi vài phút rồi thử lại." : "Chưa gửi được link đăng nhập. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <div className="w-full max-w-sm mx-auto fg-card p-6 text-center text-sm text-navy">
        <span className="inline-block w-5 h-5 mb-2 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
        <p>Đang mở kết quả của học sinh…</p>
      </div>
    );
  }

  // Đang đăng nhập bằng tài khoản không phải email học sinh (vd tài khoản cán bộ, Gmail cá nhân)
  if (isAuthenticated && !signedInStudent) {
    return (
      <div className="w-full max-w-sm mx-auto fg-card p-5 sm:p-6 space-y-3">
        <p className="text-sm text-navy">
          Bạn đang đăng nhập bằng <b>{user?.email}</b>. Để xem kết quả của học sinh, hãy đăng nhập bằng email học sinh <b>@{STUDENT_DOMAIN}</b>.
        </p>
        <button type="button" onClick={() => logout(false)} className="w-full h-11 rounded-[14px] bg-white text-sm font-semibold text-navy" style={{ border: "1px solid rgba(38,39,93,0.15)" }}>
          Đăng xuất để dùng email học sinh
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="fg-card p-5 sm:p-6 space-y-4">
        <div>
          <p className="text-sm font-bold text-navy">Đăng nhập bằng email học sinh</p>
          <p className="text-xs text-muted-foreground mt-1">Dùng tài khoản trường cấp cho con: ten@{STUDENT_DOMAIN}. Chỉ xem được kết quả của đúng học sinh đó.</p>
        </div>

        <button
          type="button"
          onClick={google}
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-[14px] bg-white text-sm font-semibold"
          style={{ border: "1px solid rgba(38,39,93,0.15)", color: "#26275D" }}
        >
          <GoogleIcon className="w-4 h-4" /> Đăng nhập bằng Google
        </button>

        <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span className="h-px flex-1 bg-[rgba(38,39,93,0.12)]" /> hoặc nhận link qua email <span className="h-px flex-1 bg-[rgba(38,39,93,0.12)]" />
        </div>

        {linkSent ? (
          <div className="space-y-1 text-sm text-navy" aria-live="polite">
            <p className="flex items-center gap-2 font-bold">
              <MailCheck className="w-5 h-5" /> Đã gửi link đăng nhập
            </p>
            <p>Mở hộp thư <b>{linkSent}</b> (xem cả Spam) và bấm link trong email.</p>
          </div>
        ) : (
          <form onSubmit={sendLink} className="space-y-3">
            <label htmlFor="student-email" className="sr-only">
              Email học sinh
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="student-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`ten@${STUDENT_DOMAIN}`}
                autoComplete="email"
                className="fg-input w-full h-11 pl-11 pr-4 text-sm font-medium text-navy"
              />
            </div>
            <button type="submit" disabled={busy || !email.trim()} className="fg-btn-primary w-full h-11 inline-flex items-center justify-center gap-2 text-sm disabled:opacity-60">
              {busy ? <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Gửi link đăng nhập</>}
            </button>
          </form>
        )}

        {error && (
          <div className="flex items-start gap-2 text-xs font-medium text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
