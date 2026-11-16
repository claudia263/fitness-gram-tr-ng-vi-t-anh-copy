import { useState } from "react";
import { LogIn, AlertCircle, Search } from "lucide-react";

// Form đăng nhập đơn giản (sessionStorage): phụ huynh/học sinh nhập đúng họ tên học sinh
// có trong danh sách mới xem được kết quả. Không xem được học sinh khác.
export default function LoginForm({ onSubmit, busy, error }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="fg-card p-6 sm:p-8 space-y-5" style={{ boxShadow: "0 24px 60px rgba(10,11,40,0.35)" }}>
        <div>
          <h2 className="text-xl font-extrabold text-navy">Tra cứu kết quả của con</h2>
          <p className="text-sm text-muted-foreground mt-1">Nhập đúng họ tên học sinh đang học tại trường.</p>
        </div>
        <div>
          <label htmlFor="fg-student-name" className="fg-eyebrow mb-1.5 block">Họ tên học sinh</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="fg-student-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="fg-input w-full h-12 pl-11 pr-4 text-base font-medium text-navy"
              autoFocus
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
          className="fg-btn-primary w-full h-12 inline-flex items-center justify-center gap-2 text-base"
        >
          {busy ? (
            <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" /> Tra cứu kết quả
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.7)" }}>
        Chỉ xem được kết quả của học sinh mang tên bạn nhập
      </p>
    </div>
  );
}