import BrandLogo from "@/components/fg/BrandLogo";
import RunnerFigure from "@/components/fg/sport/RunnerFigure";
import { SCHOOL } from "@/lib/school";

// Khung đăng nhập kiểu thể thao (dựa trên thiết kế mới): dùng cho trang MGIS.
// Màu theo biến để đổi chủ đề trường chỉ bằng cách đổi biến.
const TOKENS = {
  "--brand": "#0E5A43",
  "--deep": "#08382A",
  "--accent": "#C8E04A",
  "--accent-ink": "#08382A",
  "--ink": "#173B31",
  "--muted": "#4C6158",
  "--input-border": "#C7D9CE",
  "--danger": "#B42318",
  "--focus-glow": "rgba(14,90,67,.18)",
  "--hero-lines": "rgba(200,224,74,.17)",
};

function TrackArt() {
  return (
    <svg className="fg-track pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1200 800" fill="none" aria-hidden="true">
      <circle cx="1035" cy="-145" r="340" stroke="var(--hero-lines)" strokeWidth="3" />
      <circle cx="1035" cy="-145" r="275" stroke="var(--hero-lines)" strokeWidth="2" />
      <circle cx="1035" cy="-145" r="205" stroke="var(--hero-lines)" strokeWidth="2" />
      <path d="M-240 910C240 560 850 620 1440 920" stroke="var(--hero-lines)" strokeWidth="3" />
      <path d="M-240 965C240 615 850 675 1440 975" stroke="var(--hero-lines)" strokeWidth="2" strokeDasharray="9 14" />
      <circle cx="1050" cy="680" r="9" fill="var(--accent)" opacity=".6" />
    </svg>
  );
}

// title / subtitle: tiêu đề và mô tả (trang cán bộ truyền chữ riêng); children: các biểu mẫu đăng nhập
// headerAction: nút ở góc trên bên phải (vd lối vào cho cán bộ), luôn thấy dù màn hình thấp
export default function LoginVisualSport({ title, subtitle, headerAction, children }) {
  return (
    <main style={TOKENS} className="fg-sport relative min-h-[100svh] overflow-x-hidden overflow-y-auto bg-[var(--deep)] text-white">
      <TrackArt />
      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[1240px] flex-col px-4 pb-4 pt-4 sm:px-7 sm:pt-7 lg:px-12 lg:pb-8 lg:pt-10">
        <header className="flex items-center justify-between gap-3">
          <BrandLogo size={48} variant="light" />
          {headerAction}
        </header>

        <div className="grid flex-1 items-center gap-5 py-6 lg:grid-cols-[1.06fr_.94fr] lg:gap-16 lg:py-10">
          <section aria-labelledby="fg-title" className="lg:pb-8">
            <h1 id="fg-title" className="max-w-[640px] text-[clamp(1.6rem,6.3vw,2.15rem)] font-extrabold leading-[1.22] tracking-[-.03em] sm:text-4xl lg:text-[clamp(2.7rem,3.8vw,3.4rem)] lg:leading-[1.15]">
              {title ?? (
                <>
                  Theo dõi hành trình <span className="text-[var(--accent)]">phát triển thể chất</span> của con
                </>
              )}
            </h1>
            <p className="fgs-desc mt-3 max-w-[520px] text-[13px] leading-[1.65] text-white/85 sm:mt-5 sm:text-base lg:text-[17px] lg:leading-8">
              {subtitle ?? "Mỗi chỉ số hôm nay là một bước tiến trên hành trình khỏe mạnh và trưởng thành của học sinh."}
            </p>
            <RunnerFigure src="/mgis-runner.gif" className="-ml-6 -mt-2 hidden h-[min(400px,42vh)] w-[min(400px,42vh)] lg:block xl:-mt-6 xl:h-[min(470px,46vh)] xl:w-[min(470px,46vh)] 2xl:h-[min(520px,48vh)] 2xl:w-[min(520px,48vh)]" />
          </section>

          <section aria-label="Đăng nhập" className="mx-auto w-full max-w-[500px] lg:ml-auto lg:mr-0">
            {children}
          </section>
        </div>

        <footer className="hidden items-center gap-4 border-t border-white/15 pt-5 text-[12px] text-white/80 lg:flex">
          <span className="h-[3px] w-11 rounded-full bg-[var(--accent)]" />
          <span>{SCHOOL.tagline}</span>
        </footer>
      </div>
    </main>
  );
}
