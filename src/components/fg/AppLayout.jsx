import { Outlet } from "react-router-dom";
import AppHeader from "@/components/fg/AppHeader";
import AppFooter from "@/components/fg/AppFooter";
import BottomNav from "@/components/fg/BottomNav";
import { useRole } from "@/lib/RoleContext";
import { NAV_BY_ROLE } from "@/components/fg/navItems";

export default function AppLayout() {
  const { role } = useRole();
  // Thanh dưới điện thoại chỉ hiện khi vai trò có từ 2 mục trở lên (xem BottomNav)
  const hasBottomNav = (NAV_BY_ROLE[role] || NAV_BY_ROLE.parent).length >= 2;
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#noi-dung" className="fg-skip">Bỏ qua tới nội dung</a>
      <AppHeader />
      <main id="noi-dung" tabIndex={-1} className={`flex-1 focus:outline-none ${hasBottomNav ? "pb-24 lg:pb-0" : "pb-8"}`}>
        <Outlet />
      </main>
      <AppFooter />
      <BottomNav />
    </div>
  );
}
