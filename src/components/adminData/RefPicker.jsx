// Ô chọn bản ghi ở bảng khác (học sinh, lớp, đợt kiểm tra, CLB...) bằng cách gõ tên.
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, X } from "lucide-react";
import { searchRef } from "@/lib/adminData/api";

export default function RefPicker({ id, refKey, value, label, onChange, placeholder = "Gõ để tìm…", disabled, className = "" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      searchRef(refKey, q)
        .then((rows) => alive && (setItems(rows), setError(null)))
        .catch((e) => alive && setError(e.message))
        .finally(() => alive && setLoading(false));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [open, q, refKey]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={box} className={`relative ${className}`}>
      <div className="flex">
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="fg-input flex h-10 w-full min-w-0 items-center justify-between gap-2 bg-white px-3 text-left text-sm text-navy disabled:bg-slate-50 disabled:text-muted-foreground"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={`truncate ${value ? "" : "text-muted-foreground"}`}>{value ? label || value : placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
        {value && !disabled && (
          <button type="button" onClick={() => onChange(null, "")} aria-label="Bỏ chọn" className="ml-1 rounded-lg px-2 text-muted-foreground hover:bg-slate-100 hover:text-navy">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl bg-white p-2 shadow-lg ring-1 ring-[rgba(38,39,93,0.12)]">
          <input autoFocus className="fg-input mb-2 h-9 w-full bg-white px-3 text-sm text-navy" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên…" aria-label="Tìm" />
          <ul role="listbox" className="max-h-60 overflow-y-auto">
            {loading && (
              <li className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang tìm…
              </li>
            )}
            {!loading && error && <li className="px-2 py-2 text-sm text-rose-700">{error}</li>}
            {!loading && !error && items.length === 0 && <li className="px-2 py-2 text-sm text-muted-foreground">Không có kết quả.</li>}
            {!loading &&
              items.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={it.id === String(value)}
                    onClick={() => {
                      onChange(it.id, it.label);
                      setOpen(false);
                    }}
                    className={`w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-navy-soft ${it.id === String(value) ? "font-semibold text-navy" : "text-navy"}`}
                  >
                    {it.label}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
