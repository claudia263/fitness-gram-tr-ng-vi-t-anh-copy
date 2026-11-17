import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { campusLabel } from "@/lib/campus";
import { useRole } from "@/lib/RoleContext";

// Thanh chọn cơ sở ở đầu các trang cán bộ: chọn cơ sở nào thì cả trang chỉ hiện cơ sở đó.
// Chủ hệ thống (admin) có thêm lối sang trang riêng của Mê Kông Xanh (dữ liệu hai trường không trộn).
export default function CampusTabs({ campuses, value, onChange }) {
  const { role } = useRole();
  if (!campuses.length) return null;
  const base = "inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold transition";
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Chọn cơ sở">
      <span className="fg-eyebrow mr-1">Cơ sở</span>
      <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-white p-1 ring-1 ring-[rgba(38,39,93,0.08)]">
        {campuses.map((c) => {
          const active = c === value;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(c)}
              className={`${base} ${active ? "bg-navy text-white" : "text-navy hover:bg-navy-soft"}`}
            >
              {campusLabel(c).replace(/^Cơ sở /, "")}
            </button>
          );
        })}
      </div>
      {role === "admin" && (
        <Link to="/mgis" className={`${base} ml-auto text-navy ring-1 ring-[rgba(38,39,93,0.15)] hover:bg-navy-soft`}>
          Mê Kông Xanh (MGIS) <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
