// Trang "Chuẩn thể lực Bộ GD&ĐT": bảng thành tích quy định xếp loại theo QĐ 53/2008 (nam, nữ, 6–20 tuổi).
import { Award } from "lucide-react";
import PageTransition from "@/components/fg/PageTransition";
import { PageHeader } from "@/components/clubs/ClubUi";
import MoetStandardsTable from "@/components/fg/MoetStandardsTable";
import { useStudent } from "@/lib/StudentContext";
import { moetAge } from "@/lib/moetNorms";
import { useTrackView } from "@/lib/usage";

const TEST_ROWS = [
  ["Bật xa tại chỗ", "Bắt buộc", "Sức mạnh chân", "cm, lấy lần tốt nhất"],
  ["Chạy tuỳ sức 5 phút", "Bắt buộc", "Sức bền", "Quãng đường chạy được (m)"],
  ["Nằm ngửa gập bụng", "Trường chọn", "Sức mạnh cơ bụng", "Số lần trong 30 giây"],
  ["Chạy 30m xuất phát cao", "Trường chọn", "Tốc độ", "Giây"],
  ["Lực bóp tay thuận", "Không chọn", "Sức mạnh tay", "kg (cần lực kế)"],
  ["Chạy con thoi 4×10m", "Không chọn", "Khéo léo, nhanh nhẹn", "Giây"],
];

export default function MoetStandards() {
  const { activeStudent } = useStudent();
  const today = new Date().toISOString().slice(0, 10);
  const age = activeStudent ? moetAge(activeStudent.birth_date, today) : null;
  useTrackView("xem_chuan_bo_gd", { studentId: activeStudent?.id });

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader icon={Award} title="Chuẩn thể lực Bộ GD&ĐT" subtitle="Tiêu chuẩn đánh giá, xếp loại thể lực học sinh — Quyết định 53/2008/QĐ-BGDĐT" />

        <div className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <section className="fg-card p-5 sm:p-6" aria-labelledby="moet-tests">
            <h2 id="moet-tests" className="mb-3 font-bold text-navy">
              6 nội dung kiểm tra
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="pb-2 pr-3 font-semibold">Bài</th>
                    <th scope="col" className="pb-2 pr-3 font-semibold">Trường Việt Anh</th>
                    <th scope="col" className="pb-2 pr-3 font-semibold">Đánh giá</th>
                    <th scope="col" className="pb-2 font-semibold">Đơn vị</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {TEST_ROWS.map(([name, status, ability, unit]) => (
                    <tr key={name}>
                      <th scope="row" className="py-2 pr-3 text-left font-semibold text-navy">{name}</th>
                      <td className="py-2 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status === "Bắt buộc" ? "bg-rose-100 text-rose-800" : status === "Trường chọn" ? "bg-navy-soft text-navy" : "bg-slate-100 text-slate-600"}`}>{status}</span>
                      </td>
                      <td className="py-2 pr-3 text-navy">{ability}</td>
                      <td className="py-2 text-muted-foreground">{unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="fg-card p-5 sm:p-6 text-sm text-navy" aria-labelledby="moet-rule">
            <h2 id="moet-rule" className="mb-3 font-bold">
              Cách xếp loại
            </h2>
            <ul className="space-y-2">
              <li>Mỗi học sinh được đánh giá <b>4 trong 6 nội dung</b>, bắt buộc có Bật xa tại chỗ và Chạy tuỳ sức 5 phút.</li>
              <li>Từng nội dung xếp mức <b>Tốt</b>, <b>Đạt</b> hoặc <b>Chưa đạt</b> theo tuổi và giới tính (bảng bên dưới).</li>
              <li>
                <span className="font-semibold text-emerald-700">Tốt:</span> 3 chỉ tiêu Tốt và 1 chỉ tiêu Đạt trở lên.
              </li>
              <li>
                <span className="font-semibold text-amber-700">Đạt:</span> tất cả chỉ tiêu từ mức Đạt trở lên.
              </li>
              <li>
                <span className="font-semibold text-rose-700">Chưa đạt:</span> có 1 chỉ tiêu dưới mức Đạt.
              </li>
              <li className="text-xs text-muted-foreground">Áp dụng học sinh 6–20 tuổi; không áp dụng cho học sinh khuyết tật hoặc có bệnh không thể vận động cường độ cao.</li>
            </ul>
          </section>
        </div>

        <section className="fg-card p-5 sm:p-6" aria-labelledby="moet-table">
          <h2 id="moet-table" className="mb-1 font-bold text-navy">
            Bảng thành tích quy định xếp loại
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {activeStudent && age != null ? `Dòng tô vàng là tuổi hiện tại của ${activeStudent.full_name} (${age} tuổi).` : "Chọn Nam / Nữ để xem bảng tương ứng."}
          </p>
          <MoetStandardsTable key={activeStudent?.id || "all"} initialSex={activeStudent?.sex === "female" ? "female" : "male"} highlightAge={age} onlyChosen />
        </section>
      </div>
    </PageTransition>
  );
}
