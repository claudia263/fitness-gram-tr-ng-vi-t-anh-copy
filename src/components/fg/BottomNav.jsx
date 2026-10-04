import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, BarChart3, History, UserCircle } from "lucide-react";

const ITEMS = [
  { label: "Tổng quan", to: "/", icon: LayoutGrid },
  { label: "Kết quả", to: "/results", icon: BarChart3 },
  { label: "Lịch sử", to: "/history", icon: History },
  { label: "Hồ sơ", to: "/profile", icon: UserCircle },
];

export default function BottomNav() {
  const location = useLocation();
  const isActive = (to) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white"
      style={{ borderTop: "1px solid rgba(38,39,93,0.08)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const active = isActive(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center gap-1 py-2.5 relative"
              style={{ minHeight: 56 }}
            >
              {active && (
                <span className="absolute top-0 h-1 w-8 rounded-full" style={{ background: "#F9DD0E" }} />
              )}
              <Icon className="w-5 h-5" style={{ color: active ? "#26275D" : "#9CA3B5" }} strokeWidth={active ? 2.4 : 2} />
              <span
                className="text-[11px] font-semibold"
                style={{ color: active ? "#26275D" : "#9CA3B5" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}