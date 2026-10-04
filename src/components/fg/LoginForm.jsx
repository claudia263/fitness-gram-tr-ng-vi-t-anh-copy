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
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="fg-card p-5 sm:p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Họ tên học sinh</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="fg-input w-full h-11 pl-11 pr-4 text-sm font-medium text-navy"
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">Nhập đúng họ tên của con đang học tại trường để tra cứu kết quả.</p>
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
              <LogIn className="w-4 h-4" /> Tra cứu kết quả
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-3">
        Chỉ xem được kết quả của học sinh mang tên bạn nhập
      </p>
    </div>
  );
}