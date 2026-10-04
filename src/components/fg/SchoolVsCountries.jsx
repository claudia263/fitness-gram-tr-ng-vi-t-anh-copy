// So sánh trung vị bách phân vị PACER của trường với dữ liệu 50 quốc gia
// (Lang và cs., 2018, Br J Sports Med).
const COUNTRIES = [
  { name: "Tanzania", p: 97 },
  { name: "Nhật Bản", p: 84 },
  { name: "Pháp", p: 72 },
  { name: "Anh", p: 62 },
  { name: "Trung Quốc", p: 60 },
  { name: "Úc", p: 50 },
  { name: "Hồng Kông", p: 46 },
  { name: "Philippines", p: 42 },
  { name: "Hàn Quốc", p: 35 },
  { name: "Mỹ", p: 32 },
  { name: "Peru", p: 25 },
  { name: "Mexico", p: 17 },
];

// Bách phân vị của 50 quốc gia trong nghiên cứu (dùng để tính khoảng hạng của trường)
const WORLD_CENTILES = [
  97, 93, 92, 87, 84, 80, 77, 77, 75, 74, 72, 70, 70, 68, 68, 65, 65, 64, 63, 63,
  62, 62, 62, 61, 60, 58, 58, 57, 56, 54, 53, 53, 53, 52, 50, 47, 46, 46, 45, 44,
  42, 40, 40, 37, 37, 35, 32, 26, 25, 17,
];

export default function SchoolVsCountries({ pacer }) {
  const n = pacer.withData || 0;
  const school = pacer.median;

  if (n < 10 || school == null) {
    return (
      <div className="fg-card p-5">
        <h3 className="font-bold text-navy mb-2">Trường mình so với các nước</h3>
        <p className="text-sm text-muted-foreground">Cần ít nhất 10 học sinh 9–17 tuổi để so sánh.</p>
      </div>
    );
  }

  const nearest = COUNTRIES.reduce((best, c) => (Math.abs(c.p - school) < Math.abs(best.p - school) ? c : best), COUNTRIES[0]);
  const rank = 1 + WORLD_CENTILES.filter((c) => c > school).length;

  return (
    <div className="fg-card p-5">
      <h3 className="font-bold text-navy mb-3">Trường mình so với các nước</h3>

      <div className="rounded-xl px-3.5 py-3 text-sm font-semibold" style={{ background: "#F7F8FC", color: "#26275D" }}>
        Học sinh trung bình của trường đứng ở mức P{school} — tương đương {nearest.name} (khoảng hạng {rank}/50)
      </div>

      <div className="overflow-x-auto">
      <div className="relative h-36 mt-4 min-w-[620px]">
        {/* Trục P0–P100 */}
        <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: "#D1D5DB" }} />
        <span className="absolute left-0 text-[10px] font-semibold text-muted-foreground" style={{ top: "calc(50% + 10px)" }}>P0</span>
        <span className="absolute right-0 text-[10px] font-semibold text-muted-foreground" style={{ top: "calc(50% + 10px)" }}>P100</span>

        {/* Mốc của trường */}
        <div className="absolute inset-y-0 z-10 -translate-x-1/2" style={{ left: `${school}%` }}>
          <div className="w-0.5 h-full mx-auto" style={{ background: "rgba(38,39,93,0.25)" }} />
          <span
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full z-20"
            style={{ top: "50%", background: "#26275D", border: "2px solid #FFFFFF" }}
          />
          <span
            className="absolute left-1/2 -translate-x-1/2 top-0 z-30 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: "#F9DD0E", color: "#26275D" }}
          >
            Trường mình P{school}
          </span>
        </div>

        {/* Mốc các quốc gia, so le trên/dưới để không chồng nhãn */}
        {COUNTRIES.map((c, i) => {
          const above = i % 2 === 0;
          return (
            <div key={c.name} className="absolute z-20" style={{ left: `${c.p}%`, top: "50%" }}>
              <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: "#9CA3AF" }} />
              <span className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] leading-none text-muted-foreground ${above ? "bottom-2" : "top-2"}`}>
                {c.name}
              </span>
            </div>
          );
        })}
      </div>
      </div>

      <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(38,39,93,0.08)" }}>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Nguồn: Lang và cs. (2018), Br J Sports Med – so sánh 50 quốc gia, dữ liệu 1981–2014. Việt Nam không có trong nghiên cứu.
          Kết quả trường dựa trên {n} học sinh 9–17 tuổi; mẫu nhỏ nên chỉ mang tính tham khảo.
        </p>
      </div>
    </div>
  );
}