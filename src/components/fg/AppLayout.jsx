import { Outlet } from "react-router-dom";
import AppHeader from "@/components/fg/AppHeader";
import AppFooter from "@/components/fg/AppFooter";
import BottomNav from "@/components/fg/BottomNav";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0F4F8" }}>
      <AppHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <Outlet />
      </main>
      <AppFooter />
      <BottomNav />
    </div>
  );
}