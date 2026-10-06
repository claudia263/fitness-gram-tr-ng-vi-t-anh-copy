// Thời khoá biểu tuần: hàng = địa điểm + khung giờ, cột = thứ (giống bảng TKB CLB của trường).
import { DOW_FULL, WEEK_ORDER, buildTimetable, fmtShortDate, isActiveOn, parseYmd, teacherOf, toMin, toneOf, ymd } from "@/lib/clubs/model";

export default function WeeklyTimetable({ clubs, staffById, now, onOpen }) {
  const today = ymd(now);
  const current = clubs.filter((c) => !c.ends_on || c.ends_on >= today);
  const rows = buildTimetable(current);
  const used = new Set(current.flatMap((c) => c.slots.map((s) => s.dow)));
  const cols = WEEK_ORDER.filter((d) => (d >= 1 && d <= 5) || used.has(d));
  const todayDow = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (!rows.length) return <p className="fg-card p-8 text-center text-sm text-muted-foreground">Không có CLB nào cho khối đã chọn.</p>;

  return (
    <div className="fg-card overflow-x-auto p-2 sm:p-3">
      <table className="w-full min-w-[960px] border-separate border-spacing-1 text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="w-28 px-2 py-2 text-left font-semibold">Địa điểm</th>
            <th className="w-28 px-2 py-2 text-left font-semibold">Khung giờ</th>
            {cols.map((d) => (
              <th key={d} className={`px-2 py-2 text-left font-semibold ${d === todayDow ? "text-navy" : ""}`}>
                {DOW_FULL[d]}
                {d === todayDow && <span className="ml-1 rounded-md bg-yellow px-1 py-0.5 text-[10px] text-navy">Hôm nay</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              {r.first && (
                <th rowSpan={r.span} scope="rowgroup" className="rounded-xl bg-navy px-3 text-left align-middle text-sm font-bold uppercase leading-tight text-white">
                  {r.place}
                </th>
              )}
              <td className="whitespace-nowrap rounded-xl px-3 py-2 align-middle font-mono text-[13px] font-semibold tabular-nums text-navy" style={{ background: "#F4F5F8" }}>
                {r.start}–{r.end}
              </td>
              {cols.map((d) => {
                const list = r.cells[d] || [];
                if (!list.length) return <td key={d} className="rounded-xl" style={{ background: d === todayDow ? "#FEF9D7" : "#F7F8FC" }} />;
                return (
                  <td key={d} className="p-0 align-top">
                    <div className="flex h-full flex-col gap-1">
                      {list.map((c) => {
                        const live = d === todayDow && nowMin >= toMin(r.start) && nowMin < toMin(r.end) && isActiveOn(c, now);
                        const upcoming = c.starts_on && c.starts_on > today;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => onOpen(c.id)}
                            className={`flex w-full flex-1 flex-col items-start gap-0.5 rounded-xl px-2.5 py-2 text-left ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy ${toneOf(c).cell}`}
                          >
                            <span className="text-[13px] font-semibold leading-tight">{c.name}</span>
                            <span className="text-xs opacity-80">{teacherOf(c, staffById)}</span>
                            {live && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" /> Đang diễn ra
                              </span>
                            )}
                            {c.source === "manual" && (
                              <span className="rounded-md bg-navy px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                                {upcoming ? `Mới · từ ${fmtShortDate(parseYmd(c.starts_on))}` : "Phát sinh"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
