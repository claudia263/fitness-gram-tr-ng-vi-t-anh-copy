import PacerWorldDistribution from "@/components/fg/PacerWorldDistribution";
import SchoolVsCountries from "@/components/fg/SchoolVsCountries";

export default function SchoolNormsSummary({ summary }) {
  const { total, hfz, pacer, bmi } = summary;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Học sinh có dữ liệu" value={total} />
        <Stat label="Có bách phân vị PACER" value={pacer.withData} />
        <Stat label="Trung vị bách phân vị PACER" value={pacer.median != null ? `P${pacer.median}` : "--"} />
        <Stat label="BMI cần theo dõi" value={(bmi.counts["Thừa cân"] || 0) + (bmi.counts["Béo phì"] || 0) + (bmi.counts["Gầy còm"] || 0) + (bmi.counts["Gầy còm nặng"] || 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="fg-card p-5">
          <h3 className="font-bold text-navy mb-1">Tỉ lệ đạt vùng sức khỏe (HFZ)</h3>
          <p className="text-xs text-muted-foreground mb-4">Theo chuẩn FitnessGram cho từng bài kiểm tra</p>
          <div className="space-y-3">
            {hfz.map((t) => (
              <div key={t.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold text-navy">{t.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t.pct != null ? `${t.pct}% · ${t.inZone}/${t.measured}` : "Chưa có dữ liệu"}
                  </span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F4F5F8" }}>
                  <div className="h-full rounded-full" style={{ width: `${t.pct || 0}%`, background: "#16A34A" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <PacerWorldDistribution pacer={pacer} />
      </div>

      <SchoolVsCountries pacer={pacer} />

      <div className="fg-card p-5">
        <h3 className="font-bold text-navy mb-1">Phân bố tình trạng dinh dưỡng (BMI theo WHO)</h3>
        <p className="text-xs text-muted-foreground mb-4">{bmi.total} học sinh có dữ liệu chiều cao và cân nặng</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(bmi.counts).map(([label, count]) => (
            <div key={label} className="rounded-xl p-3" style={{ background: "#F7F8FC" }}>
              <div className="text-xl font-extrabold text-navy tabular-nums">{count}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-[11px] text-muted-foreground tabular-nums">{bmi.total ? Math.round((count / bmi.total) * 100) : 0}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="fg-card p-4">
      <div className="text-2xl font-extrabold text-navy tabular-nums">{value}</div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}