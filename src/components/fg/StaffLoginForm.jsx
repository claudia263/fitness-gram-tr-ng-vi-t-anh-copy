import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ROLE_HOMES } from "@/lib/RoleContext";
import { ROLE_LABELS, STAFF_ROLES } from "@/lib/clubs/model";
import { Mail, Lock, LogIn, AlertCircle, ShieldCheck } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";

// Lối vào dành cho cán bộ nhà trường (quản trị, tổ trưởng, nhân sự, giáo viên):
// đăng nhập bằng tài khoản của app — không cần tra cứu tên học sinh.
export default function StaffLoginForm() {
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isStaff = isAuthenticated && STAFF_ROLES.includes(user?.role);

  const enterManagement = (role = user?.role) => {
    sessionStorage.setItem("fg_entered", "true");
    sessionStorage.removeItem("fg_student_ids");
    window.location.href = ROLE_HOMES[role] || "/admin";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    setError("");
    try {
      await base44.auth.loginViaEmailPassword(email.trim(), password);
      const me = await base44.auth.me();
      if (!STAFF_ROLES.includes(me?.role)) {
        setError("Tài khoản này chưa được cấp quyền cán bộ. Vui lòng liên hệ nhà trường để được cấp quyền.");
        setBusy(false);
        return;
      }
      enterManagement(me.role);
    } catch (err) {
      setError("Không đăng nhập được. Kiểm tra lại email và mật khẩu, hoặc dùng “Quên mật khẩu”.");
      setBusy(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", new URL("/admin", window.location.origin).href);
  };

  if (isStaff) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="fg-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-navy font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span className="truncate">{user?.full_name || user?.email}</span>
          </div>
          <p className="text-xs text-muted-foreground">Tài khoản có quyền {ROLE_LABELS[user.role]} của trường.</p>
          <button
            type="button"
            onClick={() => enterManagement()}
            className="fg-btn-primary w-full h-11 inline-flex items-center justify-center gap-2 text-sm"
          >
            <LogIn className="w-4 h-4" /> Vào trang làm việc
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="fg-card p-5 sm:p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@truongvietanh.com"
              autoComplete="email"
              className="fg-input w-full h-11 pl-11 pr-4 text-sm font-medium text-navy"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Mật khẩu</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="fg-input w-full h-11 pl-11 pr-4 text-sm font-medium text-navy"
              required
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-xs font-medium text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="fg-btn-primary w-full h-11 inline-flex items-center justify-center gap-2 text-sm"
        >
          {busy ? (
            <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" /> Đăng nhập
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleGoogle}
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-[14px] bg-white text-sm font-semibold"
          style={{ border: "1px solid rgba(38,39,93,0.15)", color: "#26275D" }}
        >
          <GoogleIcon className="w-4 h-4" /> Đăng nhập bằng Google
        </button>

        <div className="text-center">
          <Link to="/forgot-password" className="text-xs font-semibold text-muted-foreground hover:text-navy">
            Quên mật khẩu?
          </Link>
        </div>
      </form>

      <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.7)" }}>
        Dành cho giáo viên và quản trị viên của trường
      </p>
    </div>
  );
}