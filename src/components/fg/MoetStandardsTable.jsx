// Bảng thành tích quy định xếp loại thể lực của Bộ GD&ĐT (QĐ 53) — nam / nữ, 6–20 tuổi.
import { useState } from "react";
import { MOET_AGES, MOET_TESTS, formatThreshold, moetThreshold } from "@/lib/moetNorms";

const chip = (active) =>
  `inline-flex h-9 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${active ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-[rgba(38,39,93,0.12)] hover:bg-navy-soft"}`;

export default function MoetStandardsTable({ initialSex = "male", highlightAge = null, onlyChosen = false }) {
  const [sex, setSex] = useState(initialSex);
  const [all, setAll] = useState(!onlyChosen);
  const tests = all ? MOET_TESTS : MOET_TESTS.filter((t) => t.chosen);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5" role="group" aria-label="Giới tính">
          <button type="button" aria-pressed={sex === "male"} onClick={() => setSex("male")} className={chip(sex === "male")}>
            Nam
          </button>
          <button type="button" aria-pressed={sex === "female"} onClick={() => setSex("female")} className={chip(sex === "female")}>
            Nữ
          </button>
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm text-navy">
          <input type="checkbox" className="h-4 w-4 accent-[#26275D]" checked={all} onChange={(e) => setAll(e.target.checked)} />
          Hiện cả 6 bài (gồm 2 bài trường không chọn)
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-[rgba(38,39,93,0.08)]">
        <table className="w-full min-w-max text-sm">
          <caption className="sr-only">Tiêu chuẩn thể lực {sex === "male" ? "nam" : "nữ"} theo QĐ 53/2008/QĐ-BGDĐT</caption>
          <thead style={{ background: "#F7F8FC" }}>
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-semibold text-navy">
                Tuổi
              </th>
              <th scope="col" className="px-3 py-2 text-left font-semibold text-navy">
                Mức
              </th>
              {tests.map((t) => (
                <th key={t.key} scope="col" className="px-3 py-2 text-right font-semibold text-navy">
                  <span className="block whitespace-nowrap">
                    {t.label}
                    {t.required && <span className="text-rose-600"> ★</span>}
                  </span>
                  <span className="block text-[11px] font-normal text-muted-foreground">{t.unit}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOET_AGES.map((age) => {
              const hl = age === highlightAge;
              return ["good", "pass"].map((kind) => (
                <tr key={`${age}-${kind}`} className={`${kind === "good" ? "border-t border-[rgba(38,39,93,0.08)]" : ""} ${hl ? "bg-[#FEF3B0]" : ""}`}>
                  {kind === "good" && (
                    <th scope="rowgroup" rowSpan={2} className="px-3 py-1.5 text-left align-middle font-extrabold text-navy tabular-nums">
                      {age}
                      {hl && <span className="block text-[10px] font-semibold uppercase text-navy">tuổi của con</span>}
                    </th>
                  )}
                  <td className={`px-3 py-1.5 font-semibold ${kind === "good" ? "text-emerald-700" : "text-amber-700"}`}>{kind === "good" ? "Tốt" : "Đạt"}</td>
                  {tests.map((t) => (
                    <td key={t.key} className="px-3 py-1.5 text-right tabular-nums text-navy">
                      {formatThreshold(t, moetThreshold(sex, age, t.key)?.[kind] ?? null, kind)}
                    </td>
                  ))}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        <li>★ Bài bắt buộc. Trường Việt Anh đánh giá 4 bài: Bật xa tại chỗ, Chạy tuỳ sức 5 phút, Nằm ngửa gập bụng, Chạy 30m xuất phát cao.</li>
        <li>Thấp hơn mức Đạt là Chưa đạt. Tuổi tính tròn tại ngày kiểm tra; từ 21 tuổi dùng chỉ tiêu tuổi 20.</li>
        <li>
          Xếp loại chung: <b className="text-navy">Tốt</b> — 3 chỉ tiêu Tốt và 1 chỉ tiêu Đạt trở lên · <b className="text-navy">Đạt</b> — tất cả chỉ tiêu từ Đạt trở lên ·{" "}
          <b className="text-navy">Chưa đạt</b> — có 1 chỉ tiêu dưới mức Đạt.
        </li>
        <li>Nguồn: Quyết định 53/2008/QĐ-BGDĐT ngày 18/09/2008 của Bộ GD&ĐT. “—”: chưa có số liệu đối chiếu.</li>
      </ul>
    </div>
  );
}
