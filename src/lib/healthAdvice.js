// Lời khuyên dinh dưỡng và bài tập chi tiết theo:
// - Tình trạng dinh dưỡng (WHO z-score)
// - Lứa tuổi (Tiểu học / THCS / THPT)
// - Giới tính
// - Kết quả thể lực từng bài kiểm tra

// Phân nhóm lứa tuổi
export function getAgeGroup(ageMonths) {
  if (!ageMonths && ageMonths !== 0) return "unknown";
  if (ageMonths < 132) return "primary"; // 6-10 tuổi (Tiểu học)
  if (ageMonths < 180) return "middle"; // 11-14 tuổi (THCS)
  return "high"; // 15-18+ tuổi (THPT)
}

export const AGE_LABELS = {
  primary: "Tiểu học (6-10 tuổi)",
  middle: "THCS (11-14 tuổi)",
  high: "THPT (15-18 tuổi)",
  unknown: "Đang cập nhật",
};

// ═══════════════════════════════════════════
// LỜI KHUYÊN DINH DƯỠNG — theo tình trạng + lứa tuổi
// ═══════════════════════════════════════════

export const NUTRITION_ADVICE = {
  "Gầy còm nặng": {
    color: "#E85D4A",
    bg: "rgba(232, 93, 74, 0.08)",
    label: "Gầy còm nặng",
    nutrition: {
      primary: [
        "Bổ sung 3 bữa chính + 3 bữa phụ/ngày: sáng thêm sữa + bánh mì, chiều thêm trứng + trái cây, tối trước ngủ 1 ly sữa ấm.",
        "Mỗi bữa chính cần có: 1 bát cơm/bún/phở + 1 phần thịt/cá/trứng (khoảng bàn tay bé) + 1 bát canh rau.",
        "Uống 3 ly sữa/ngày (sữa tươi full-cream, không tách béo) + 1 hộp sữa chua có đường.",
        "Thêm hạt dinh dưỡng: hạnh nhân, óc chó, hạt điều — 1 nắm nhỏ/ngày (khoảng 20g).",
        "Khám bác sĩ dinh dưỡng để loại trừ nguyên nhân bệnh lý (ký sinh trùng, rối loạn hấp thu) và xây dựng kế hoạch tăng cân.",
      ],
      middle: [
        "Tăng năng lượng: 3 bữa chính đầy đủ + 3 bữa phụ (sữa, trứng, sinh tố, bánh sandwich) — mục tiêu 2200-2500 kcal/ngày.",
        "Protein 1.5-1.8g/kg/ngày: mỗi bữa chính 2 phần đạm (thịt/cá/trứng/đậu) — ví dụ 2 quả trứng + 150g thịt nạc + 1 bát đậu.",
        "Uống 3-4 ly sữa/ngày + 1 hộp phô mai + 1 hộp sữa chua Hy Lạp để bổ sung calo và canxi.",
        "Thêm bữa phụ trước ngủ: sinh tố chuối + sữa + bơ đậu phộng, uống trước 8h tối.",
        "Hạn chế nước ngọt, trà sữa đường — chúng tạo cảm giác no nhưng rỗng dinh dưỡng.",
        "Khám bác sĩ dinh dưỡng để được xây dựng thực đơn cá nhân hóa và theo dõi tăng cân.",
      ],
      high: [
        "Mục tiêu 2500-3000 kcal/ngày: 3 bữa chính + 3 bữa phụ, mỗi bữa phụ 300-400 kcal (sinh tố, sandwich, sữa + hạt).",
        "Protein 1.8-2g/kg/ngày: 2 quả trứng sáng + 200g thịt/cá trưa + 200g thịt/cá tối + 1 bát đậu phụ.",
        "Chất béo lành mạnh: 1 muỗng bơ đậu phộng + 1 nắm hạt (hạnh nhân, óc chó) + dầu oliu khi nấu.",
        "Uống 3-4 ly sữa full-cream/ngày + 1 ly sữa + bơ đậu phộng trước ngủ.",
        "Tập luyện sức mạnh 3-4 buổi/tuần để tăng cơ, kết hợp ăn đủ protein sau tập (bữa ăn trong 30 phút sau tập).",
        "Khám bác sĩ dinh dưỡng để loại trừ nguyên nhân bệnh lý và xây dựng kế hoạch tăng cân an toàn.",
      ],
    },
  },
  "Gầy còm": {
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.08)",
    label: "Gầy còm",
    nutrition: {
      primary: [
        "Thêm 2 bữa phụ/ngày: sáng thêm 1 ly sữa + bánh mì, chiều thêm 1 quả trứng + trái cây.",
        "Mỗi bữa chính: 1 bát cơm + 1 phần thịt/cá/trứng + 1 bát canh rau — đảm bảo ăn hết phần.",
        "Uống 2-3 ly sữa/ngày + 1 hộp sữa chua để bổ sung calo, canxi, protein.",
        "Thêm hạt dinh dưỡng (hạnh nhân, óc chó) 1 nắm nhỏ/ngày để tăng calo lành mạnh.",
        "Hạn chế nước ngọt và snack công nghiệp — chúng làm no nhưng thiếu dinh dưỡng.",
      ],
      middle: [
        "Tăng năng lượng: thêm 2-3 bữa phụ/ngày (sữa, trứng, sinh tố, bánh mì) — mục tiêu 2000-2300 kcal/ngày.",
        "Protein 1.2-1.5g/kg/ngày: mỗi bữa chính 1.5 phần đạm (thịt/cá/trứng/đậu).",
        "Uống 2-3 ly sữa/ngày + 1 hộp sữa chua + thêm phô mai vào sandwich.",
        "Bữa phụ chiều: sinh tố chuối + sữa + 1 muỗng bơ đậu phộng — giàu calo và dinh dưỡng.",
        "Hạn chế trà sữa nhiều đường, nước ngọt, snack — ưu tiên thực phẩm giàu dinh dưỡng.",
      ],
      high: [
        "Mục tiêu 2300-2600 kcal/ngày: 3 bữa chính + 2-3 bữa phụ, ưu tiên thực phẩm giàu calo lành mạnh.",
        "Protein 1.5-1.8g/kg/ngày: 2 quả trứng sáng + 150-200g thịt/cá trưa + 150g thịt/tối + 1 bát đậu.",
        "Chất béo lành mạnh: 1 muỗng bơ đậu phộng/ngày + 1 nắm hạt + dầu oliu khi nấu.",
        "Bữa phụ trước tập: 1 quả chuối + 1 ly sữa; sau tập: sinh tố + 2 quả trứng.",
        "Hạn chế nước ngọt, trà sữa đường — ưu tiên sữa tươi, sinh tố trái cây tự làm.",
      ],
    },
  },
  "Bình thường": {
    color: "#16a34a",
    bg: "rgba(22, 163, 74, 0.08)",
    label: "Bình thường",
    nutrition: {
      primary: [
        "Duy trì 3 bữa chính cân bằng: ½ đĩa rau xanh + ¼ đĩa tinh bột (cơm, bún, phở) + ¼ đĩa đạm (thịt, cá, trứng, đậu).",
        "Uống 2 ly sữa/ngày + 1 hộp sữa chua để đủ canxi cho phát triển xương.",
        "Ăn 5 phần trái cây và rau/ngày: 1 quả táo, 1 quả chuối, 1 bát rau luộc, 1 bát canh rau, 1 phần salad.",
        "Uống 1.5 lít nước/ngày, hạn chế nước ngọt — ưu tiên nước lọc, nước trái cây tự vắt.",
        "Bữa sáng đầy đủ trước ngày kiểm tra thể lực: cơm/bún + trứng + sữa.",
      ],
      middle: [
        "Duy trì chế độ cân bằng: 50% tinh bột + 20% đạm + 30% rau xanh mỗi bữa chính.",
        "Protein 1-1.2g/kg/ngày: mỗi bữa chính 1 phần đạm (thịt/cá/trứng/đậu) cỡ bàn tay.",
        "Uống 2 ly sữa/ngày + 1 hộp sữa chua + ăn cá 2-3 lần/tuần để đủ omega-3 cho phát triển não.",
        "Ăn 5 phần trái cây và rau/ngày, ưu tiên rau xanh đậm (rau bina, súp lơ xanh) và trái cây ít ngọt.",
        "Hạn chế đường tinh luyện: nước ngọt tối đa 1 lon/tuần, trà sữa tối đa 1 ly/tuần.",
        "Bữa sáng đầy đủ trước ngày kiểm tra thể lực: cơm/bún + trứng + sữa + trái cây.",
      ],
      high: [
        "Duy trì chế độ cân bằng: 45% tinh bột + 25% đạm + 30% rau xanh + chất béo lành mạnh.",
        "Protein 1.2-1.5g/kg/ngày: 2 quả trứng sáng + 150g thịt/cá trưa + 150g thịt/tối + 1 bát đậu.",
        "Uống 2 ly sữa/ngày + ăn cá 3-4 lần/tuần để đủ omega-3, canxi, vitamin D.",
        "Chất béo lành mạnh: dầu oliu, bơ, hạt (hạnh nhân, óc chó) — 1 muỗng/ngày.",
        "Hạn chế đường tinh luyện, đồ chiên rán, fast food — tối đa 1-2 lần/tuần.",
        "Bữa trước tập: 1 quả chuối + 1 ly sữa (30 phút trước); sau tập: cơm + thịt + rau (trong 1 giờ).",
      ],
    },
  },
  "Thừa cân": {
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.08)",
    label: "Thừa cân",
    nutrition: {
      primary: [
        "Giảm đường: thay nước ngọt, trà sữa bằng nước lọc, nước trái cây pha loãng — tối đa 1 ly nước ngọt/tuần.",
        "Tăng rau xanh: ½ đĩa rau mỗi bữa, ưu tiên rau luộc, salad, canh rau — ăn rau trước cơm.",
        "Đạm nạc: ức gà, cá, đậu hũ, trứng luộc — hạn chế thịt mỡ, da gà, xúc xích.",
        "Hạn chế đồ chiên rán: ưu tiên luộc, hấp, nướng — thay khoai tây chiên bằng khoai lang luộc.",
        "Ăn chậm, nhai kỹ, uống 1 ly nước trước bữa ăn — giúp no nhanh hơn.",
      ],
      middle: [
        "Giảm năng lượng 300-500 kcal/ngày: cắt bỏ đồ ngọt, nước ngọt, trà sữa đường, snack công nghiệp.",
        "Tăng chất xơ: rau xanh + trái cây ít ngọt (ổi, bưởi, dưa leo) chiếm ½ đĩa mỗi bữa.",
        "Đạm nạc 1-1.2g/kg/ngày: ức gà, cá, đậu hũ, trứng — hạn chế thịt mỡ, xúc xích, thịt xông khói.",
        "Tinh bột giảm nhưng không bỏ: 1 bát cơm/bữa, thay bằng gạo lứt, khoai lang, bánh mì đen.",
        "Uống 1.5-2 lít nước lọc/ngày, uống 1 ly nước trước bữa ăn 15 phút.",
        "Không ăn khuya, không bỏ bữa sáng — bỏ bữa làm tăng cảm giác thèm ăn chiều.",
      ],
      high: [
        "Mục tiêu giảm 0.5kg/tuần: cắt giảm 500-700 kcal/ngày, ưu tiên thực phẩm ít calo, giàu chất xơ.",
        "Tinh bột: thay gạo trắng bằng gạo lứt, khoai lang, yến mạch — 1 bát/bữa, không ăn thêm cơm.",
        "Đạm nạc 1.2-1.5g/kg/ngày: ức gà, cá, đậu hũ, trứng luộc — 2 phần/bữa, hạn chế thịt mỡ.",
        "Chất béo: 1 muỗng dầu oliu/ngày + 1 nắm hạt, hạn chế bơ, phô mai, đồ chiên rán.",
        "Uống 2 lít nước lọc/ngày, uống 1 ly nước trước bữa ăn, không uống nước ngọt, trà sữa.",
        "Không ăn khuya, chia nhỏ bữa: 3 bữa chính + 1 bữa phụ (trái cây ít ngọt) để tránh đói.",
      ],
    },
  },
  "Béo phì": {
    color: "#E85D4A",
    bg: "rgba(232, 93, 74, 0.08)",
    label: "Béo phì",
    nutrition: {
      primary: [
        "Cần can thiệp dưới hướng dẫn bác sĩ hoặc chuyên gia dinh dưỡng — khám để được xây dựng thực đơn cá nhân hóa.",
        "Loại bỏ hoàn toàn: nước ngọt, trà sữa đường, kẹo, bánh ngọt, snack, đồ chiên rán, fast food.",
        "Tăng rau xanh: ½ đĩa rau luộc/salad mỗi bữa, ăn rau trước cơm để no nhanh.",
        "Đạm nạc: ức gà luộc, cá, đậu hũ, trứng luộc — hạn chế thịt mỡ, xúc xích, thịt xông khói.",
        "Tinh bột: ½ bát cơm/bữa, thay bằng gạo lứt, khoai lang — không ăn thêm cơm, không ăn bánh mì trắng.",
        "Uống 1.5-2 lít nước lọc/ngày, uống 1 ly nước trước bữa ăn 15 phút.",
      ],
      middle: [
        "Bắt buộc khám bác sĩ dinh dưỡng để được đánh giá toàn diện và xây dựng kế hoạch giảm cân an toàn.",
        "Mục tiêu giảm 0.5-1kg/tuần: cắt giảm 700-1000 kcal/ngày, ưu tiên thực phẩm ít calo, giàu chất xơ.",
        "Loại bỏ hoàn toàn đường tinh luyện, đồ chiên rán, fast food, nước ngọt, trà sữa, snack.",
        "Tinh bột: gạo lứt, khoai lang, yến mạch — ½ bát/bữa, không ăn thêm.",
        "Đạm nạc 1.2-1.5g/kg/ngày: ức gà, cá, đậu hũ, trứng luộc — 2 phần/bữa.",
        "Rau xanh: ½ đĩa mỗi bữa, ưu tiên rau luộc, salad, canh rau — ăn rau trước cơm.",
        "Uống 2 lít nước lọc/ngày, uống 1 ly nước trước bữa ăn, không ăn khuya.",
        "Khám định kỳ để theo dõi mỡ máu, đường huyết, gan nhiễm mỡ.",
      ],
      high: [
        "Bắt buộc khám bác sĩ dinh dưỡng + nội tiết để đánh giá toàn diện và xây dựng kế hoạch giảm cân an toàn.",
        "Mục tiêu giảm 0.5-1kg/tuần: cắt giảm 700-1000 kcal/ngày, ưu tiên thực phẩm ít calo, giàu chất xơ.",
        "Loại bỏ hoàn toàn đường tinh luyện, đồ chiên rán, fast food, nước ngọt, trà sữa, snack, rượu bia.",
        "Tinh bột: gạo lứt, khoai lang, yến mạch — ½ bát/bữa, không ăn thêm, không ăn bánh mì trắng.",
        "Đạm nạc 1.5g/kg/ngày: ức gà, cá, đậu hũ, trứng luộc — 2 phần/bữa, hạn chế thịt đỏ.",
        "Chất béo: 1 muỗng dầu oliu/ngày + 1 nắm hạt, loại bỏ bơ, phô mai, đồ chiên rán.",
        "Rau xanh: ½ đĩa mỗi bữa, ưu tiên rau luộc, salad — ăn rau trước cơm.",
        "Uống 2-2.5 lít nước lọc/ngày, uống 1 ly nước trước bữa ăn, không ăn khuya.",
        "Khám định kỳ: mỡ máu, đường huyết, gan nhiễm mỡ, huyết áp — 3-6 tháng/lần.",
      ],
    },
  },
  "Chờ dữ liệu tham chiếu WHO": {
    color: "#6B6E8F",
    bg: "rgba(107, 110, 143, 0.08)",
    label: "Chờ đánh giá",
    nutrition: {
      primary: [
        "Dữ liệu chiều cao/cân nặng chưa đủ để đánh giá. Vui lòng cập nhật sau đợt kiểm tra tiếp theo.",
        "Tạm thời duy trì chế độ ăn cân bằng: 3 bữa chính + 2 bữa phụ, đủ rau, trái cây, sữa.",
      ],
      middle: [
        "Dữ liệu chiều cao/cân nặng chưa đủ để đánh giá. Vui lòng cập nhật sau đợt kiểm tra tiếp theo.",
        "Tạm thời duy trì chế độ ăn cân bằng: 3 bữa chính + 2 bữa phụ, đủ rau, trái cây, sữa, đạm nạc.",
      ],
      high: [
        "Dữ liệu chiều cao/cân nặng chưa đủ để đánh giá. Vui lòng cập nhật sau đợt kiểm tra tiếp theo.",
        "Tạm thời duy trì chế độ ăn cân bằng: 3 bữa chính + 2 bữa phụ, đủ rau, trái cây, sữa, đạm nạc, chất béo lành mạnh.",
      ],
      unknown: [
        "Dữ liệu chiều cao/cân nặng chưa đủ để đánh giá. Vui lòng cập nhật sau đợt kiểm tra tiếp theo.",
      ],
    },
  },
};

// ═══════════════════════════════════════════
// LỜI KHUYÊN BÀI TẬP — theo bài kiểm tra + mức + lứa tuổi
// ═══════════════════════════════════════════

export const FITNESS_ADVICE = {
  pacer: {
    title: "Sức bền tim phổi (PACER)",
    low: {
      threshold: 4,
      tips: {
        primary: [
          "Chơi trò chơi vận động ngoài trời: trốn tìm, nhảy dây, đá cầu 30-45 phút/ngày.",
          "Tập chạy bộ nhẹ nhàng 10-15 phút, 3 buổi/tuần, tăng dần 2 phút mỗi tuần.",
          "Chơi thể thao đồng đội: bóng đá, bóng rổ, cầu lông — 3-4 buổi/tuần, 30 phút/buổi.",
          "Bài tập nhảy tại chỗ: nhảy jacking, nhảy squat — 3 hiệp × 10 lần, nghỉ 30 giây.",
        ],
        middle: [
          "Chạy bộ 15-20 phút, 3-4 buổi/tuần — bắt đầu chậm, tăng dần tốc độ.",
          "Tập chạy biến tốc (sprint 30 giây + đi bộ 60 giây) × 8 vòng — 2 buổi/tuần.",
          "Nhảy dây 3 hiệp × 1 phút, nghỉ 30 giây — 3 buổi/tuần để tăng sức bền tim phổi.",
          "Tham gia thể thao đồng đội: bóng đá, bóng rổ, cầu lông — 3-4 buổi/tuần, 45 phút/buổi.",
        ],
        high: [
          "Chạy bộ liên tục 20-30 phút, 4-5 buổi/tuần — duy trì nhịp tim 60-80% tối đa.",
          "Tập HIIT: sprint 20 giây + nghỉ 40 giây × 10 vòng — 2 buổi/tuần.",
          "Nhảy dây 5 hiệp × 2 phút, nghỉ 30 giây — 4 buổi/tuần.",
          "Tham gia giải chạy hoặc câu lạc bộ thể thao để có mục tiêu phấn đấu.",
        ],
      },
    },
    mid: {
      threshold: 8,
      tips: {
        primary: [
          "Duy trì chạy bộ 20-30 phút, 3-4 buổi/tuần để cải thiện mức PACER.",
          "Tập chạy biến tốc (chay nhanh 20 giây + đi bộ 40 giây) × 6 vòng.",
          "Chơi thể thao đồng đội 4-5 buổi/tuần, 45 phút/buổi để tăng sức bền tự nhiên.",
          "Theo dõi nhịp tim: duy trì vùng 60-80% nhịp tim tối đa khi tập.",
        ],
        middle: [
          "Duy trì chạy bộ 25-35 phút, 4-5 buổi/tuần — tăng dần tốc độ và khoảng cách.",
          "Tập chạy biến tốc (sprint 40 giây + đi bộ 60 giây) × 10 vòng — 2 buổi/tuần.",
          "Nhảy dây 4 hiệp × 1.5 phút, nghỉ 30 giây — 4 buổi/tuần.",
          "Tham gia thể thao đồng đội hoặc giải chạy trường để có động lực.",
        ],
        high: [
          "Chạy bộ liên tục 30-40 phút, 5 buổi/tuần — duy trì nhịp tim 65-85% tối đa.",
          "Tập HIIT: sprint 30 giây + nghỉ 30 giây × 12 vòng — 2-3 buổi/tuần.",
          "Nhảy dây 5 hiệp × 2 phút, nghỉ 30 giây — 5 buổi/tuần.",
          "Thử thách: chạy 2km dưới 12 phút, hoặc tham gia giải chạy 5km.",
        ],
      },
    },
    high: {
      tips: {
        primary: [
          "Duy trì mức PACER tốt — tiếp tục chạy bộ và thể thao đồng đội 4-5 buổi/tuần.",
          "Thử thách mới: chạy dài hơn (30-40 phút), nhảy dây nhiều hiệp hơn.",
          "Tham gia giải chạy trường hoặc câu lạc bộ thể thao để phát triển thêm.",
        ],
        middle: [
          "Duy trì mức PACER tốt — thử thách với bài tập cường độ cao hơn (HIIT).",
          "Tham gia giải chạy hoặc câu lạc bộ thể thao để có mục tiêu phấn đấu.",
          "Theo dõi nhịp tim và thời gian phục hồi để đánh giá tiến bộ.",
        ],
        high: [
          "Duy trì mức PACER xuất sắc — thử thách với bài tập cường độ cao (HIIT, Tabata).",
          "Tham gia giải chạy 5km, 10km hoặc câu lạc bộ điền kinh.",
          "Theo dõi VO2max, thời gian phục hồi nhịp tim để đánh giá thể lực chuyên sâu.",
        ],
      },
    },
  },
  sit_and_reach: {
    title: "Độ linh hoạt (Sit & Reach)",
    low: {
      threshold: 15,
      tips: {
        primary: [
          "Kéo giãn cơ đùi sau, lưng, bắp chân 10-15 phút mỗi sáng sau khi dậy.",
          "Tập các động tác: chạm tay vào chân, vươn người về phía trước, xoay người — giữ 15-20 giây/tư thế.",
          "Chơi trò chơi kéo giãn: 'kéo co', 'vươn người chạm đồ vật' để tăng hứng thú.",
          "Không bật nhảy khi kéo giãn — giữ tư thế tĩnh để tránh chấn thương.",
        ],
        middle: [
          "Kéo giãn cơ đùi sau, lưng, bắp chân, hông 15-20 phút/ngày, 5-7 buổi/tuần.",
          "Tập các động tác: chạm tay vào chân (đứng + ngồi), gập người về phía trước, xoay hông — giữ 20-30 giây/tư thế.",
          "Tập yoga nhẹ 15-20 phút/ngày: tư thế chó cúi, rắn hổ mang, tam giác.",
          "Kéo giãn sau mỗi buổi tập thể lực để tránh co cứng cơ.",
        ],
        high: [
          "Kéo giãn toàn thân 20-30 phút/ngày, 5-7 buổi/tuần — ưu tiên cơ đùi sau, hông, lưng.",
          "Tập yoga hoặc pilates 3-4 buổi/tuần, 30-45 phút/buổi.",
          "Kéo giãn PNF: giữ 30 giây, thả lỏng 10 giây, kéo sâu hơn 30 giây — 3 hiệp/mỗi động tác.",
          "Kéo giãn sau mỗi buổi tập, trước và sau khi chạy để tránh chấn thương.",
        ],
      },
    },
    mid: {
      threshold: 25,
      tips: {
        primary: [
          "Duy trì kéo giãn 10-15 phút/ngày, 4-5 buổi/tuần — sau buổi tập hoặc buổi sáng.",
          "Tập các động tác vặn xoắn, mở hông để tăng linh hoạt toàn thân.",
          "Chơi thể thao kết hợp kéo giãn: cầu lông, bơi lội, yoga — 3 buổi/tuần.",
        ],
        middle: [
          "Duy trì kéo giãn 15-20 phút, 5-7 buổi/tuần — kết hợp sau buổi tập chính.",
          "Tập các động tác vặn xoắn, mở hông, kéo giãn cơ đùi sau — giữ 25-30 giây/tư thế.",
          "Tập yoga 3-4 buổi/tuần, 20-30 phút/buổi để cải thiện độ linh hoạt toàn thân.",
        ],
        high: [
          "Duy trì kéo giãn 20-30 phút, 5-7 buổi/tuần — kết hợp yoga hoặc pilates.",
          "Tập các động tác nâng cao: xoạc, chia, vặn xoắn sâu — giữ 30-45 giây/tư thế.",
          "Kéo giãn PNF 2-3 buổi/tuần để tăng biên độ vận động tối đa.",
        ],
      },
    },
    high: {
      tips: {
        primary: [
          "Duy trì độ linh hoạt tốt — tiếp tục kéo giãn 10-15 phút/ngày, 4-5 buổi/tuần.",
          "Thử thách: tập yoga, nhảy hiện đại, thể dục nghệ thuật để phát triển thêm.",
        ],
        middle: [
          "Duy trì độ linh hoạt tốt — tiếp tục yoga hoặc pilates 3-4 buổi/tuần.",
          "Thử thách: các động tác nâng cao (xoạc, chia) dưới hướng dẫn chuyên gia.",
        ],
        high: [
          "Duy trì độ linh hoạt xuất sắc — tiếp tục yoga, pilates hoặc thể dục nghệ thuật.",
          "Thử thách: tham gia lớp yoga nâng cao, hoặc thể dục nhịp điệu để phát triển tối đa.",
        ],
      },
    },
  },
  pushup: {
    title: "Sức mạnh thân trên (Push-up)",
    low: {
      threshold: 8,
      tips: {
        primary: [
          "Bắt đầu với hít đất tường: đứng cách tường 50cm, hít 3 hiệp × 8-10 lần.",
          "Khi quen, chuyển sang hít đất gối chạm sàn: 3 hiệp × 5-8 lần, nghỉ 45 giây.",
          "Tập gập bụng và plank để tăng sức mạnh lõi, hỗ trợ hít đất.",
          "Chơi trò leo xà, trèo cầu trượt để tăng sức mạnh tay vai tự nhiên.",
        ],
        middle: [
          "Bắt đầu với hít đất gối chạm sàn: 3 hiệp × 8-12 lần, nghỉ 45 giây — 3 buổi/tuần.",
          "Khi quen, chuyển sang hít đất tiêu chuẩn: 3 hiệp × 5-8 lần, tăng dần.",
          "Tập plank 20-30 giây × 3 hiệp để tăng sức mạnh core, hỗ trợ hít đất.",
          "Tập hít xà (pull-up) hỗ trợ hoặc treo xà 15-30 giây để tăng sức mạnh tay vai.",
        ],
        high: [
          "Bắt đầu với hít đất tiêu chuẩn: 3 hiệp × 5-8 lần, nghỉ 60 giây — 3 buổi/tuần.",
          "Tăng dần: thêm 1-2 lần mỗi tuần cho đến 12-15 lần/hiệp.",
          "Tập plank 30-45 giây × 3 hiệp + hít xà hỗ trợ để tăng sức mạnh toàn thân trên.",
          "Kết hợp tập tạ: bench press nhẹ, shoulder press — 3 hiệp × 8-10 lần, 2 buổi/tuần.",
        ],
      },
    },
    mid: {
      threshold: 20,
      tips: {
        primary: [
          "Tăng số hiệp và lần: 3-4 hiệp × 10-12 lần, nghỉ 45 giây — 3 buổi/tuần.",
          "Tập hít đất rộng tay, hít đất hẹp tay để phát triển nhiều nhóm cơ.",
          "Kết hợp plank 30 giây × 3 hiệp và gập bụng 15 lần × 3 hiệp.",
          "Chơi leo xà, trèo cầu trượt, thể thao đồng đội để tăng sức mạnh tự nhiên.",
        ],
        middle: [
          "Tăng số hiệp và lần: 4 hiệp × 12-15 lần, nghỉ 60 giây — 3-4 buổi/tuần.",
          "Tập hít đất rộng tay, hít đất kim cương, hít đất nghiêng để phát triển nhiều nhóm cơ.",
          "Kết hợp hít xà (pull-up) 3 hiệp × 5-8 lần + plank 45 giây × 3 hiệp.",
          "Tập tạ nhẹ: bench press, shoulder press, biceps curl — 3 hiệp × 10-12 lần, 2 buổi/tuần.",
        ],
        high: [
          "Tăng số hiệp và lần: 4-5 hiệp × 15-20 lần, nghỉ 60 giây — 3-4 buổi/tuần.",
          "Tập biến thể: hít đất rộng tay, kim cương, nghiêng, nổ (clap push-up) — 3 hiệp × 8-12 lần/mỗi loại.",
          "Kết hợp tập tạ: bench press, shoulder press, dip — 4 hiệp × 8-12 lần, 2-3 buổi/tuần.",
          "Tập hít xà (pull-up) 4 hiệp × 8-12 lần để phát triển lưng và tay sau.",
        ],
      },
    },
    high: {
      tips: {
        primary: [
          "Duy trì sức mạnh tốt — thử thách: hít đổ một tay (khoan), hít đổ vỗ tay.",
          "Tiếp tục thể thao đồng đội và leo xà để phát triển toàn diện.",
        ],
        middle: [
          "Duy trì sức mạnh tốt — thử thách: hít đổ vỗ tay (clap push-up), hít đổ một tay.",
          "Kết hợp tập tạ: bench press, shoulder press, dip — 4 hiệp × 10-12 lần.",
        ],
        high: [
          "Duy trì sức mạnh xuất sắc — thử thách: hít đổ một tay, hít đổ vỗ tay, weighted push-up.",
          "Kết hợp tập tạ: bench press 1.2-1.5x bodyweight, shoulder press, dip — 4-5 hiệp × 8-12 lần.",
          "Theo dõi volume tập (số hiệp × số lần × khối lượng) để tối ưu tăng cơ.",
        ],
      },
    },
  },
  plank: {
    title: "Sức bền Core (Plank)",
    low: {
      threshold: 30,
      tips: {
        primary: [
          "Tập plank ngắn 15-20 giây, 3 hiệp, nghỉ 45 giây — 3-4 buổi/tuần.",
          "Kết hợp gập bụng 10 lần × 3 hiệp, nâng chân 10 lần × 3 hiệp.",
          "Tập bird-dog (chó chim): 10 lần mỗi bên × 3 hiệp để tăng sức mạnh core.",
          "Chơi trò 'kéo bụng', 'nhịp cầu' để tăng sức mạnh core tự nhiên.",
        ],
        middle: [
          "Tập plank 20-30 giây, 3 hiệp, nghỉ 45 giây — 3-4 buổi/tuần.",
          "Kết hợp gập bụng 15 lần × 3 hiệp, nâng chân 12 lần × 3 hiệp, bird-dog 12 lần/mỗi bên × 3 hiệp.",
          "Tập plank nghiêng (side plank) 15-20 giây mỗi bên × 3 hiệp.",
          "Tập dead bug (bọ chết): 10 lần mỗi bên × 3 hiệp để tăng core toàn diện.",
        ],
        high: [
          "Tập plank 30-45 giây, 3-4 hiệp, nghỉ 60 giây — 4 buổi/tuần.",
          "Kết hợp gập bụng 20 lần × 4 hiệp, nâng chân 15 lần × 4 hiệp, Russian twist 15 lần × 3 hiệp.",
          "Tập plank nghiêng (side plank) 25-30 giây mỗi bên × 3 hiệp.",
          "Tập hollow body hold 20-30 giây × 3 hiệp để tăng sức mạnh core chuyên sâu.",
        ],
      },
    },
    mid: {
      threshold: 60,
      tips: {
        primary: [
          "Tăng thời gian plank: thêm 5 giây mỗi tuần cho đến 45-60 giây — 3-4 buổi/tuần.",
          "Thử plank nâng tay/chân (plank reach) 10 lần mỗi bên × 3 hiệp.",
          "Kết hợp gập bụng 15 lần × 3 hiệp, plank nghiêng 20 giây mỗi bên × 3 hiệp.",
          "Chơi thể thao: bơi lội, cầu lông, bóng rổ — tăng core tự nhiên.",
        ],
        middle: [
          "Tăng thời gian plank: thêm 5-10 giây mỗi tuần cho đến 60-90 giây — 4 buổi/tuần.",
          "Thử plank nâng tay/chân (plank reach) 12 lần mỗi bên × 3 hiệp.",
          "Tập plank nghiêng (side plank) 30 giây mỗi bên × 3 hiệp + Russian twist 15 lần × 3 hiệp.",
          "Tập hollow body hold 30-40 giây × 3 hiệp + dead bug 12 lần mỗi bên × 3 hiệp.",
        ],
        high: [
          "Tăng thời gian plank: thêm 10 giây mỗi tuần cho đến 90-120 giây — 4-5 buổi/tuần.",
          "Thử plank nâng tay/chân (plank reach) 15 lần mỗi bên × 4 hiệp.",
          "Tập plank nghiêng (side plank) 40-45 giây mỗi bên × 3 hiệp + Russian twist 20 lần × 3 hiệp.",
          "Tập hollow body hold 45-60 giây × 3 hiệp + L-sit 15-20 giây × 3 hiệp.",
        ],
      },
    },
    high: {
      tips: {
        primary: [
          "Duy trì sức bền core tốt — thử thách: plank 60-90 giây, plank nghiêng 30 giây.",
          "Tiếp tục thể thao và bài tập core để phát triển toàn diện.",
        ],
        middle: [
          "Duy trì sức bền core tốt — thử thách: plank 90-120 giây, plank side 45 giây.",
          "Thử plank với tạ trên lưng, plank reach, hollow body hold 60 giây.",
        ],
        high: [
          "Duy trì sức bền core xuất sắc — thử thách: plank 120+ giây, plank side 60 giây, L-sit 30 giây.",
          "Thử plank với tạ, plank reach, hollow body hold 60+ giây, dragon flag.",
          "Kết hợp tập tạ core: cable woodchop, ab wheel rollout — 3 hiệp × 12-15 lần.",
        ],
      },
    },
  },
};

// ═══════════════════════════════════════════
// TÍNH MACRO CHÍNH XÁC — theo cân nặng, lứa tuổi, tình trạng
// ═══════════════════════════════════════════

// Nhu cầu năng lượng cơ bản theo lứa tuổi (kcal/ngày, tham chiếu WHO/FAO)
const BASE_CALORIES = {
  primary: 1700, // 6-10 tuổi
  middle: 2200, // 11-14 tuổi
  high: 2500, // 15-18 tuổi
  unknown: 2000,
};

// Hệ số điều chỉnh năng lượng theo tình trạng dinh dưỡng
const CALORIE_ADJUST = {
  "Gầy còm nặng": 400, // +400 kcal
  "Gầy còm": 250, // +250 kcal
  "Bình thường": 0,
  "Thừa cân": -400, // -400 kcal
  "Béo phì": -600, // -600 kcal
  "Chờ dữ liệu tham chiếu WHO": 0,
};

// Tỷ lệ protein (g/kg thể trọng/ngày) theo tình trạng
const PROTEIN_PER_KG = {
  "Gầy còm nặng": 1.8,
  "Gầy còm": 1.5,
  "Bình thường": 1.2,
  "Thừa cân": 1.2,
  "Béo phì": 1.2, // giữ cơ, giảm mỡ
  "Chờ dữ liệu tham chiếu WHO": 1.2,
};

// Tính macro chính xác cho học sinh dựa trên cân nặng, lứa tuổi, tình trạng
export function calculateMacros(weightKg, ageMonths, status) {
  const ageGroup = getAgeGroup(ageMonths);
  const weight = Number(weightKg);
  if (!weight || weight <= 0) return null;

  // 1. Năng lượng mục tiêu
  const baseCal = BASE_CALORIES[ageGroup] || BASE_CALORIES.unknown;
  const adjust = CALORIE_ADJUST[status] || 0;
  const targetCalories = Math.max(1200, baseCal + adjust);

  // 2. Protein (g) — theo g/kg thể trọng
  const proteinPerKg = PROTEIN_PER_KG[status] || 1.2;
  const proteinG = Math.round(weight * proteinPerKg);
  const proteinCal = proteinG * 4;

  // 3. Chất béo (g) — 25% tổng năng lượng
  const fatCal = Math.round(targetCalories * 0.25);
  const fatG = Math.round(fatCal / 9);

  // 4. Tinh bột (g) — phần còn lại
  const carbCal = targetCalories - proteinCal - fatCal;
  const carbG = Math.round(carbCal / 4);

  return {
    weight: Math.round(weight * 10) / 10,
    ageGroup,
    targetCalories,
    proteinG,
    carbG,
    fatG,
    proteinPerKg,
    proteinPct: Math.round((proteinCal / targetCalories) * 100),
    carbPct: Math.round((carbCal / targetCalories) * 100),
    fatPct: Math.round((fatCal / targetCalories) * 100),
  };
}

// ═══════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════

// Lấy lời khuyên dinh dưỡng theo tình trạng + lứa tuổi
export function getNutritionAdvice(status, ageMonths) {
  const plan = NUTRITION_ADVICE[status] || NUTRITION_ADVICE["Chờ dữ liệu tham chiếu WHO"];
  const ageGroup = getAgeGroup(ageMonths);
  const tips = plan.nutrition[ageGroup] || plan.nutrition["unknown"] || [];
  return { ...plan, nutrition: tips, ageGroup };
}

// Lấy lời khuyên thể lực cho một bài test dựa trên giá trị + lứa tuổi
export function getFitnessAdvice(testKey, value, ageMonths) {
  const advice = FITNESS_ADVICE[testKey];
  if (!advice || value == null) return null;
  const ageGroup = getAgeGroup(ageMonths);

  let level, tips;
  if (value < advice.low.threshold) {
    level = "low";
    tips = advice.low.tips[ageGroup] || advice.low.tips["middle"];
  } else if (value < advice.mid.threshold) {
    level = "mid";
    tips = advice.mid.tips[ageGroup] || advice.mid.tips["middle"];
  } else {
    level = "high";
    tips = advice.high.tips[ageGroup] || advice.high.tips["middle"];
  }
  return { level, tips };
}