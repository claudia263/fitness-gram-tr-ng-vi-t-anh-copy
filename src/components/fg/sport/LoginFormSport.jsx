import { useId, useState } from "react";

const DEFAULT_NOT_FOUND = "Không tìm thấy học sinh với tên này trong danh sách trường. Vui lòng kiểm tra lại họ tên.";

function SearchIcon({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="fg-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity=".25" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Thẻ tra cứu kiểu thể thao. Cùng giao diện với LoginForm cũ: onSubmit(họ tên), busy, error (chữ hoặc true).
// Dùng biến màu của LoginVisualSport (--brand, --accent, --ink...).
export default function LoginFormSport({ onSubmit, busy = false, error = null }) {
  const [name, setName] = useState("");
  const fieldId = useId();
  const hintId = useId();
  const errorId = useId();
  const normalizedName = name.trim().replace(/\s+/g, " ");
  const errorMessage = typeof error === "string" ? error : error ? DEFAULT_NOT_FOUND : "";

  const submit = (e) => {
    e.preventDefault();
    if (busy || !normalizedName) return;
    onSubmit(normalizedName);
  };

  return (
    <div className="overflow-hidden rounded-[22px] bg-white p-5 text-[var(--ink)] shadow-[0_22px_70px_rgba(0,0,0,.28)] sm:p-8 lg:p-9">
      <div className="mb-4 h-1 w-12 rounded-full bg-[var(--accent)]" aria-hidden="true" />
      <h2 className="text-[21px] font-extrabold leading-[1.3] tracking-[-.03em] text-[var(--brand)] sm:text-[25px]">Tra cứu kết quả của con</h2>
      <p className="mb-5 mt-2 text-[13px] leading-6 text-[var(--muted)] sm:text-[14px]">Nhập đúng họ tên học sinh đang học tại trường.</p>

      <form onSubmit={submit} aria-busy={busy} className="space-y-3.5 sm:space-y-4">
        <div>
          <label htmlFor={fieldId} className="mb-2 block text-[13px] font-bold text-[var(--ink)]">
            Họ tên học sinh <span aria-hidden="true" className="text-[var(--danger)]">*</span>
          </label>
          <div className="relative">
            <input
              id={fieldId}
              name="studentName"
              type="text"
              autoFocus
              autoComplete="off"
              enterKeyHint="search"
              autoCapitalize="words"
              required
              maxLength={120}
              disabled={busy}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={`${hintId}${errorMessage ? ` ${errorId}` : ""}`}
              placeholder="VD: Nguyễn Văn A"
              className={`h-14 w-full rounded-[14px] border-2 bg-white px-4 pr-12 text-base font-medium text-[var(--ink)] outline-none placeholder:text-[#697386] focus-visible:border-[var(--brand)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-glow)] disabled:cursor-wait disabled:opacity-70 ${errorMessage ? "border-[var(--danger)]" : "border-[var(--input-border)]"}`}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true">
              <SearchIcon />
            </span>
          </div>
          <p id={hintId} className="mt-2 text-[12px] leading-5 text-[var(--muted)]">
            Nhập đầy đủ họ và tên có dấu theo danh sách trường.
          </p>
          {errorMessage && (
            <p id={errorId} role="alert" className="mt-3 rounded-xl border border-[#E8A19A] bg-[#FFF4F2] px-3 py-3 text-[13px] leading-5 text-[#961E16]">
              <span className="mr-1 font-black" aria-hidden="true">!</span> {errorMessage}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={busy || !normalizedName}
          className="flex min-h-14 w-full items-center justify-center gap-2.5 rounded-[14px] bg-[var(--accent)] px-4 py-3 text-base font-extrabold text-[var(--accent-ink)] shadow-[0_4px_0_rgba(0,0,0,0.12)] transition-[transform,box-shadow,filter] duration-150 enabled:hover:brightness-95 enabled:active:translate-y-[2px] enabled:active:shadow-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <>
              <Spinner />
              <span>Đang tra cứu...</span>
            </>
          ) : (
            <>
              <SearchIcon />
              <span>Tra cứu kết quả</span>
            </>
          )}
        </button>
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {busy ? "Đang tra cứu kết quả học sinh." : ""}
        </span>
      </form>

      <div className="mt-5 border-t border-[var(--input-border)] pt-4 text-[12px] leading-5 text-[var(--muted)]">Chỉ xem được kết quả của học sinh mang tên bạn nhập.</div>
    </div>
  );
}
