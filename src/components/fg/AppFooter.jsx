import BrandLogo from "@/components/fg/BrandLogo";

export default function AppFooter() {
  return (
    <footer className="mt-12" style={{ background: "#26275D" }}>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="opacity-95">
              <BrandLogo size={40} variant="light" />
            </div>
            <p className="mt-3 text-sm max-w-md" style={{ color: "rgba(255,255,255,0.7)" }}>
              Hệ thống quản lý kết quả kiểm tra thể chất học sinh — Trường Việt Anh.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1 w-10 rounded-full" style={{ background: "#F9DD0E" }} />
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
              Hành trình khỏe mạnh – Tương lai vững vàng
            </span>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between gap-3 text-xs" style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}>
          <span>© 2026 Fitness Gram – Trường Việt Anh. Dữ liệu demo.</span>
          <span>Phát triển trên nền tảng giáo dục thể chất học đường.</span>
        </div>
      </div>
    </footer>
  );
}