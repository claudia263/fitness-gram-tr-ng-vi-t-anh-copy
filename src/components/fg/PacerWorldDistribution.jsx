// Phân bố bách phân vị PACER của trường so với chuẩn thế giới (FitnessGram / chuẩn quốc tế).
// Mỗi nhóm: % học sinh của trường (thang 0–100%) + thanh tham chiếu tỉ lệ thế giới.
const BAND_META = [
  { key: "<20", label: "Nhóm thấp", sub: "thua 80% bạn cùng tuổi thế giới", world: 20, color: "#DC2626" },
  { key: "20-50", label: "Dưới trung bình", sub: "thua 50–80%", world: 30, color: "#F59E0B" },
  { key: "50-80", label: "Trên trung bình", sub: "hơn 50–80%", world: 30, color: "#86EFAC" },
  { key: ">80", label: "Nhóm cao", sub: "hơn 80% bạn cùng tuổi thế giới", world: 20, color: "#16A34A" },
];

export default function PacerWorldDistribution({ pacer }) {
  const withData = pacer.withData || 0;
  const lowCount = pacer.bands["<20"] || 0;
  const lowPct = withData ? Math.round((lowCount / withData) * 100) : 0;
  const betterThanWorld = lowPct <= 20;

  const headline = !withData
    ? "Chưa có học sinh nào có đủ dữ liệu PACER để so sánh với chuẩn thế giới"
    : betterThanWorld
      ? "Phân bố tương đương hoặc tốt hơn thế giới"
      : `${lowPct}% học sinh nằm trong nhóm thấp (thế giới chỉ 20%)`;

  return (
    <div className="fg-card p-5">
      <h3 className="font-bold text-navy mb-3">PACER so với học sinh cùng tuổi trên thế giới</h3>

      <div
        className="rounded-xl px-3.5 py-3 mb-4 text-sm font-semibold"
        style={
          withData && betterThanWorld
            ? { background: "#F0FDF4", color: "#15803D" }
            : { background: "#FEF2F2", color: "#B91C1C" }
        }
      >
        {headline}
      </div>

      <div className="space-y-3.5">
        {BAND_META.map((b) => {
          const count = pacer.bands[b.key] || 0;
          const pct = withData ? Math.round((count / withData) * 100) : 0;
          return (
            <div key={b.key}>
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-navy">{b.label}</span>
                  <span className="text-[11px] text-muted-foreground ml-2">{b.sub}</span>
                </div>
                <div className="shrink-0 flex items-baseline gap-1">
                  <span className="text-sm font-bold text-navy tabular-nums">{pct}%</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">· {count} em</span>
                </div>
              </div>

              <div className="h-3 rounded-full overflow-hidden" style={{ background: "#F4F5F8" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: b.color }} />
              </div>

              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 rounded-full overflow-hidden flex-1" style={{ background: "#F4F5F8" }}>
                  <div className="h-full rounded-full" style={{ width: `${b.world}%`, background: "#D1D5DB" }} />
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">Thế giới {b.world}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t flex flex-wrap items-start justify-between gap-2" style={{ borderColor: "rgba(38,39,93,0.08)" }}>
        <p className="text-[11px] text-muted-foreground max-w-[62%] leading-relaxed">
          Dựa trên {withData} học sinh 9–17 tuổi có kết quả PACER. Học sinh dưới 9 tuổi chưa có chuẩn thế giới.
        </p>
        <div className="text-xs font-bold text-navy text-right">
          Bách phân vị trung vị của trường:{" "}
          <span className="tabular-nums">{pacer.median != null ? `P${pacer.median}` : "--"}</span>
        </div>
      </div>
    </div>
  );
}