import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useRole } from "@/lib/RoleContext";
import BrandLogo from "@/components/fg/BrandLogo";
import { LogOut, Menu, X } from "lucide-react";
import { NAV_BY_ROLE, activeNav } from "@/components/fg/navItems";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const nav = NAV_BY_ROLE[role] || NAV_BY_ROLE.parent;
  const current = activeNav(nav, location.pathname);
  const isActive = (to) => current === to;

  const handleLogout = () => {
    sessionStorage.removeItem("fg_entered");
    sessionStorage.removeItem("fg_student_ids");
    logout(false);
    window.location.href = "/login";
  };

  const displayName = user?.full_name || user?.email || "Phụ huynh";

  return (
    <header
      className="sticky top-0 z-40 bg-white"
      style={{ borderBottom: "1px solid rgba(38,39,93,0.06)", boxShadow: "0 1px 12px rgba(38,39,93,0.04)" }}
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link to="/" className="shrink-0">
            <BrandLogo size={38} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="relative px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{ color: isActive(item.to) ? "#26275D" : "#6B6E8F" }}
              >
                {item.label}
                {isActive(item.to) && (
                  <span
                    className="absolute left-1/2 -translate-x-1/2 bottom-0.5 h-1 w-6 rounded-full"
                    style={{ background: "#F9DD0E" }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right: profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Profile */}
            <Link
              to="/profile"
              className="hidden sm:flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full transition-colors hover:bg-[#F4F5F8]"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: "#26275D", color: "#FFFFFF" }}
              >
                {(displayName || "?").slice(0, 1).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-navy max-w-[120px] truncate">{displayName}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full text-muted-foreground hover:text-navy hover:bg-[#F4F5F8]"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-navy"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 pt-2 border-t" style={{ borderColor: "rgba(38,39,93,0.06)" }}>
            <nav className="flex flex-col gap-1">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between"
                  style={{
                    background: isActive(item.to) ? "#FEF3B0" : "transparent",
                    color: isActive(item.to) ? "#26275D" : "#6B6E8F",
                  }}
                >
                  {item.label}
                  {isActive(item.to) && <span className="w-2 h-2 rounded-full" style={{ background: "#F9DD0E" }} />}
                </Link>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "#F4F5F8", color: "#26275D" }}
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}