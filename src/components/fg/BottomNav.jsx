import { Link, useLocation } from "react-router-dom";
import { useRole } from "@/lib/RoleContext";
import { NAV_BY_ROLE, activeNav } from "@/components/fg/navItems";

export default function BottomNav() {
  const location = useLocation();
  const { role } = useRole();
  const items = (NAV_BY_ROLE[role] || NAV_BY_ROLE.parent).slice(0, 5);
  const current = activeNav(items, location.pathname);

  return (
    <nav
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
                {item.short || item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
