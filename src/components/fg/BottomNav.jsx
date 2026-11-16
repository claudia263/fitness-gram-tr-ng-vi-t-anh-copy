import { Link, useLocation } from "react-router-dom";
import { useRole } from "@/lib/RoleContext";
import { NAV_BY_ROLE, activeNav } from "@/components/fg/navItems";

export default function BottomNav() {
  const location = useLocation();
  const { role } = useRole();
  const items = (NAV_BY_ROLE[role] || NAV_BY_ROLE.parent).slice(0, 5);
  const current = activeNav(items, location.pathname);
  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Điều hướng chính"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white"
      style={{ borderTop: "1px solid rgba(38,39,93,0.08)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = current === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center justify-center gap-1 py-2.5 relative"
              style={{ minHeight: 56 }}
            >
              {active && (
                <span className="absolute top-0 h-1 w-8 rounded-full" style={{ background: "#F9DD0E" }} />
              )}
              <Icon className="w-5 h-5" aria-hidden="true" style={{ color: active ? "#26275D" : "#6B6E8F" }} strokeWidth={active ? 2.4 : 2} />
              <span
                className="text-xs font-semibold"
                style={{ color: active ? "#26275D" : "#6B6E8F" }}
              >
                {item.short || item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
