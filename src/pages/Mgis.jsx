import { useEffect, useState } from "react";
import { Info, Search } from "lucide-react";

// Trang Fitness Gram của Mê Kông Xanh (MGIS) tại /mgis.
// Hiện là TRANG VỎ: có thương hiệu riêng nhưng chưa nối dữ liệu, nên không gọi cơ sở dữ liệu nào
// và không lộ học sinh của trường khác. Khi có danh sách và kết quả của MGIS sẽ nối vào đây
// (dữ liệu tách theo trường, xem kế hoạch phân quyền theo trường).
// Màu và logo là tạm; thay bằng nhận diện chính thức của MGIS khi có.
const GREEN = "#0E5A43";
const GREEN_DEEP = "#08382A";
const LIME = "#C8E04A";

export default function Mgis() {
  const [name, setName] = useState("");
  const [notice, setNotice] = useState(false);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Fitness Gram – Mê Kông Xanh (MGIS)";
    // Trang chưa có dữ liệu: chưa cho công cụ tìm kiếm lập chỉ mục
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => {
      document.title = prevTitle;
      meta.remove();
    };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (name.trim().length >= 2) setNotice(true);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col px-6 py-8 sm:px-10 lg:px-16 lg:py-10"
      style={{ background: `radial-gradient(120% 90% at 15% 0%, #14785A 0%, ${GREEN} 55%, ${GREEN_DEEP} 100%)` }}
    >
      <header className="mx-auto flex w-full max-w-[1200px] items-center gap-3">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-extrabold"
          style={{ background: LIME, color: GREEN_DEEP }}
          aria-hidden="true"
        >
          M
        </span>
        <div className="leading-tight">
          <p className="text-lg font-extrabold tracking-tight text-white">FITNESS GRAM</p>
          <p className="text-xs font-semibold tracking-[0.14em] uppercase" style={{ color: "rgba(255,255,255,0.65)" }}>
            Mê Kông Xanh · MGIS
          </p>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1200px] flex-1 items-center gap-10 py-10 lg:grid-cols-2 lg:gap-16">
        <div className="text-center lg:text-left">
          <h1 className="font-extrabold leading-[1.15] text-white" style={{ fontSize: "clamp(1.75rem, 3.4vw, 2.9rem)" }}>
            Theo dõi hành trình phát triển thể chất của con
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed lg:mx-0" style={{ color: "rgba(255,255,255,0.8)" }}>
            Kết quả kiểm tra thể lực và thể trạng của học sinh Mê Kông Xanh, cập nhật sau mỗi đợt kiểm tra.
          </p>
        </div>

        <div className="flex w-full justify-center lg:justify-end">
          <form onSubmit={submit} className="fg-card w-full max-w-md space-y-5 p-6 sm:p-8" style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            <div>
              <h2 className="text-xl font-extrabold" style={{ color: GREEN_DEEP }}>Tra cứu kết quả của con</h2>
              <p className="mt-1 text-sm text-muted-foreground">Nhập đúng họ tên học sinh đang học tại trường.</p>
            </div>
            <div>
              <label htmlFor="mgis-name" className="fg-eyebrow mb-1.5 block">Họ tên học sinh</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  id="mgis-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNotice(false);
                  }}
                  placeholder="VD: Nguyễn Văn A"
                  className="fg-input h-12 w-full pl-11 pr-4 text-base font-medium"
                  style={{ color: GREEN_DEEP }}
                  autoComplete="off"
                />
              </div>
            </div>
            {notice && (
              <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm" style={{ background: "#EEF6D2", color: GREEN_DEEP }} role="status">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Dữ liệu học sinh Mê Kông Xanh đang được cập nhật. Quý phụ huynh vui lòng quay lại sau.</span>
              </div>
            )}
            <button
              type="submit"
              className="h-12 w-full rounded-xl text-base font-bold transition hover:brightness-95 active:scale-[0.985]"
              style={{ background: LIME, color: GREEN_DEEP }}
            >
              Tra cứu kết quả
            </button>
          </form>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-[1200px] text-center text-xs lg:text-left" style={{ color: "rgba(255,255,255,0.6)" }}>
        Fitness Gram · Trường Mê Kông Xanh
      </footer>
    </div>
  );
}
