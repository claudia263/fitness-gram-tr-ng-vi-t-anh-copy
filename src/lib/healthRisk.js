// "Nếu không thay đổi…": nguy cơ sức khỏe khi một chỉ số chưa đạt, theo cấp học, kèm việc làm được ngay.
// Nguyên tắc: nói "nguy cơ", không nói "sẽ bị"; mức chắc chắn của câu chữ theo đúng sức mạnh bằng chứng;
// không nói về ngoại hình. Chỉ hiện khi chỉ số chưa đạt.
//
// Nguồn:
//  [WHO-PA]   WHO Guidelines on physical activity and sedentary behaviour, 2020 (5–17 tuổi)
//  [WHO-OB]   WHO Fact sheet "Obesity and overweight" (cập nhật 12/2025)
//  [ORTEGA]   Ortega FB và cs. Physical fitness in childhood and adolescence: a powerful marker of health. Int J Obes 2008
//  [SMITH]    Smith JJ và cs. The health benefits of muscular fitness for children and adolescents. Sports Med 2014
//  [SIMMONDS] Simmonds M và cs. Predicting adult obesity from childhood obesity. Obes Rev 2016
//  [NAM]      National Academies (IOM). Fitness Measures and Health Outcomes in Youth, 2012
//  [FG]       Cooper Institute — FitnessGram: Healthy Fitness Zone / Needs Improvement – Health Risk

export const RISK_SOURCES = [
  { key: "WHO-PA", label: "WHO – Khuyến nghị vận động cho trẻ 5–17 tuổi (2020)", url: "https://www.who.int/publications/i/item/9789240015128" },
  { key: "WHO-OB", label: "WHO – Thừa cân và béo phì (2025)", url: "https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight" },
  { key: "ORTEGA", label: "Ortega và cs., Int J Obes 2008", url: "https://pubmed.ncbi.nlm.nih.gov/18043605/" },
  { key: "SMITH", label: "Smith và cs., Sports Med 2014", url: "https://doi.org/10.1007/s40279-014-0196-4" },
  { key: "SIMMONDS", label: "Simmonds và cs., Obes Rev 2016", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4781104" },
  { key: "FG", label: "Cooper Institute – FitnessGram", url: "https://www.cooperinstitute.org/youth/fitnessgram" },
  { key: "NAM", label: "National Academies, Fitness Measures and Health Outcomes in Youth (2012)", url: "https://www.nationalacademies.org/read/13483/chapter/9" },
];

export const EVIDENCE_LABELS = {
  strong: "Bằng chứng mạnh",
  moderate: "Bằng chứng vừa",
  limited: "Bằng chứng còn hạn chế — chỉ số để theo dõi",
};

// Cấp học theo tuổi tròn: Tiểu học < 11, THCS 11–14, THPT ≥ 15
export function riskAgeGroup(ageYears) {
  if (ageYears == null) return "middle";
  if (ageYears < 11) return "primary";
  if (ageYears < 15) return "middle";
  return "high";
}

const RISKS = {
  // Sức bền tim phổi: PACER (FitnessGram), Chạy tuỳ sức 5 phút (Bộ GD&ĐT)
  endurance: {
    evidence: "strong",
    sources: ["ORTEGA", "FG", "WHO-PA"],
    text: {
      primary: "con dễ mệt khi chạy nhảy, vui chơi; có nguy cơ tích mỡ bụng và xuất hiện sớm các yếu tố nguy cơ tim mạch – chuyển hoá (huyết áp, mỡ máu, đường huyết).",
      middle: "ở tuổi dậy thì, con có nguy cơ cao hơn về tích mỡ bụng, tăng huyết áp, rối loạn mỡ máu và đường huyết; dễ mệt mỏi, khó tập trung khi học và kém tự tin.",
      high: "con có nguy cơ cao hơn về tăng huyết áp, tiểu đường type 2 và bệnh tim mạch khi trưởng thành; thói quen ít vận động ở tuổi này thường theo con sang tuổi trưởng thành.",
    },
    action: "Trung bình 60 phút vận động vừa – mạnh mỗi ngày (chạy, đạp xe, bơi, đá bóng…), trong đó ít nhất 3 buổi/tuần vận động mạnh đến thở dốc. Sức bền thường cải thiện rõ sau 8–12 tuần.",
  },
  // Sức mạnh cơ: Push-up, Bật xa, Gập bụng, Lực bóp tay
  muscle: {
    evidence: "strong",
    sources: ["SMITH", "ORTEGA", "WHO-PA"],
    text: {
      primary: "con có nguy cơ cao hơn về tích mỡ và các yếu tố nguy cơ tim mạch – chuyển hoá; xương phát triển kém chắc khỏe hơn và con dễ thiếu tự tin khi vận động cùng bạn bè.",
      middle: "con có nguy cơ cao hơn về tích mỡ, các yếu tố nguy cơ tim mạch – chuyển hoá và xương kém chắc khỏe — đúng giai đoạn cơ thể tích luỹ khối xương nhiều nhất.",
      high: "con có nguy cơ cao hơn về tích mỡ và các yếu tố nguy cơ tim mạch – chuyển hoá; khối xương đỉnh (đạt vào cuối tuổi thiếu niên) thấp hơn, tăng nguy cơ loãng xương về sau.",
    },
    action: "Bài tập sức mạnh ít nhất 3 buổi/tuần: chống đẩy, bật nhảy, nhảy dây, leo trèo, kéo xà, chơi bóng rổ / cầu lông. Bắt đầu nhẹ, tăng dần số lần mỗi tuần.",
  },
  // Tốc độ, khéo léo: Chạy 30m, Chạy con thoi 4x10m
  speed: {
    evidence: "moderate",
    sources: ["ORTEGA", "WHO-PA"],
    text: {
      primary: "con có thể chậm hơn các bạn trong các trò chơi vận động, ít được rèn khả năng phối hợp — kỹ năng giúp xương chắc khỏe và tự tin khi vận động.",
      middle: "con có thể kém nhanh nhẹn, phối hợp động tác chưa tốt; tốc độ – khéo léo thấp liên quan tới xương kém chắc khỏe hơn ở tuổi thiếu niên.",
      high: "con có thể kém nhanh nhẹn, phối hợp động tác chưa tốt; tốc độ – khéo léo thấp liên quan tới xương kém chắc khỏe hơn.",
    },
    action: "Chơi các môn đổi hướng nhanh (bóng đá, bóng rổ, cầu lông), chạy tăng tốc ngắn 10–30m, nhảy dây — 2–3 buổi/tuần.",
  },
  // Độ dẻo: Sit-and-Reach
  flexibility: {
    evidence: "limited",
    sources: ["NAM", "FG"],
    text: {
      primary: "cơ đùi sau và lưng của con có thể kém linh hoạt, khó làm các động tác cúi, duỗi. Mối liên hệ giữa độ dẻo và đau lưng ở trẻ em chưa được chứng minh rõ, nên đây là chỉ số để theo dõi, không phải dấu hiệu bệnh.",
      middle: "cơ đùi sau và lưng của con có thể kém linh hoạt, dễ căng cơ khi vận động mạnh. Mối liên hệ giữa độ dẻo và đau lưng ở tuổi học sinh chưa được chứng minh rõ, nên đây là chỉ số để theo dõi, không phải dấu hiệu bệnh.",
      high: "cơ đùi sau và lưng của con có thể kém linh hoạt, dễ căng cơ khi vận động mạnh. Mối liên hệ giữa độ dẻo và đau lưng ở tuổi học sinh chưa được chứng minh rõ, nên đây là chỉ số để theo dõi, không phải dấu hiệu bệnh.",
    },
    action: "Giãn cơ đùi sau và lưng 5–10 phút mỗi ngày, giữ mỗi động tác 20–30 giây, không nhún mạnh.",
  },
  // Sức bền cơ bụng – lưng: Plank (chỉ có số liệu tham chiếu, chưa có chuẩn sức khỏe)
  core: {
    evidence: "limited",
    sources: ["NAM"],
    text: {
      primary: "con có thể mau mỏi lưng khi ngồi học lâu và khó giữ tư thế thẳng. Plank chưa có chuẩn sức khỏe chính thức, đây là chỉ số tham khảo so với các bạn cùng tuổi.",
      middle: "con có thể mau mỏi lưng khi ngồi học lâu và khó giữ tư thế thẳng. Plank chưa có chuẩn sức khỏe chính thức, đây là chỉ số tham khảo so với các bạn cùng tuổi.",
      high: "con có thể mau mỏi lưng khi ngồi học lâu và khó giữ tư thế thẳng. Plank chưa có chuẩn sức khỏe chính thức, đây là chỉ số tham khảo so với các bạn cùng tuổi.",
    },
    action: "Tập plank 3 hiệp mỗi ngày, mỗi hiệp giữ thêm 5–10 giây so với tuần trước; xen kẽ bài cầu vai (glute bridge).",
  },
  // Thừa cân (z > +1)
  overweight: {
    evidence: "strong",
    sources: ["WHO-OB", "SIMMONDS"],
    text: {
      primary: "nếu cân nặng tiếp tục tăng nhanh hơn chiều cao, con có nguy cơ chuyển sang béo phì, kèm nguy cơ hen suyễn và các vấn đề xương khớp (gối, bàn chân).",
      middle: "nếu cân nặng tiếp tục tăng nhanh hơn chiều cao, con có nguy cơ chuyển sang béo phì; tiểu đường type 2 và bệnh tim mạch có thể đến sớm hơn.",
      high: "nếu duy trì, con có nguy cơ thừa cân kéo dài sang tuổi trưởng thành, cùng nguy cơ tiểu đường type 2 và bệnh tim mạch đến sớm hơn.",
    },
    action: "Cả nhà cùng đổi thói quen: bớt nước ngọt, trà sữa, đồ chiên; thêm rau và trái cây; 60 phút vận động mỗi ngày; giảm giờ màn hình giải trí. Không bắt con nhịn ăn hay ăn kiêng.",
  },
  // Béo phì (z > +2)
  obese: {
    evidence: "strong",
    sources: ["WHO-OB", "SIMMONDS"],
    text: {
      primary: "khoảng một nửa trẻ béo phì vẫn béo phì khi lên tuổi thiếu niên; con có nguy cơ cao hơn về hen suyễn, các vấn đề xương khớp và rối loạn đường huyết từ sớm.",
      middle: "khoảng 4/5 thiếu niên béo phì vẫn béo phì khi trưởng thành; con có nguy cơ cao hơn về tiểu đường type 2, bệnh tim mạch đến sớm, và dễ bị trêu chọc, tự ti, ảnh hưởng việc học.",
      high: "khoảng 4/5 thiếu niên béo phì vẫn béo phì khi trưởng thành; con có nguy cơ cao hơn về tiểu đường type 2 và bệnh tim mạch đến sớm hơn, kèm ảnh hưởng tới tâm lý, sự tự tin.",
    },
    action: "Cả nhà cùng đổi thói quen ăn uống và vận động (bớt nước ngọt, đồ chiên; thêm rau; 60 phút vận động/ngày). Nên cho con khám dinh dưỡng để có kế hoạch phù hợp; không tự cho con ăn kiêng.",
  },
  // Gầy còm (z < −2)
  thin: {
    evidence: "moderate",
    sources: ["WHO-OB"],
    text: {
      primary: "nếu thiếu cân kéo dài, con có nguy cơ thiếu năng lượng cho học tập và vui chơi, sức đề kháng kém, ảnh hưởng tăng trưởng chiều cao.",
      middle: "nếu thiếu cân kéo dài, con có nguy cơ thiếu năng lượng cho học tập, sức đề kháng kém và ảnh hưởng tới bước tăng trưởng chiều cao, xương ở tuổi dậy thì.",
      high: "nếu thiếu cân kéo dài, con có nguy cơ mệt mỏi, sức đề kháng kém và xương kém chắc khỏe khi trưởng thành.",
    },
    action: "Đủ 3 bữa chính và 1–2 bữa phụ, thêm đạm (trứng, cá, thịt, sữa, đậu). Nếu cân nặng không tăng sau 2–3 tháng, nên cho con khám dinh dưỡng.",
  },
};

const BMI_KEYS = ["overweight", "obese", "thin"];

// Lấy nội dung nguy cơ. key: endurance | muscle | speed | flexibility | core | overweight | obese | thin
export function healthRisk(key, ageYears) {
  const r = RISKS[key];
  if (!r) return null;
  const raw = r.text[riskAgeGroup(ageYears)];
  // Chỉ số thể lực: "Nếu duy trì mức hiện tại, …"; BMI: câu đứng riêng
  const text = BMI_KEYS.includes(key) ? raw.charAt(0).toUpperCase() + raw.slice(1) : `Nếu duy trì mức hiện tại, ${raw}`;
  return { key, evidence: r.evidence, evidenceLabel: EVIDENCE_LABELS[r.evidence], text, action: r.action, sources: r.sources };
}

// Chỉ số BMI → loại nguy cơ theo z-score WHO (null nếu bình thường)
export function bmiRiskKey(z) {
  if (z == null) return null;
  if (z > 2) return "obese";
  if (z > 1) return "overweight";
  if (z < -2) return "thin";
  return null;
}

// Bài test Bộ GD&ĐT → loại nguy cơ
export const MOET_RISK_KEY = { run_5min: "endurance", long_jump: "muscle", situps: "muscle", grip: "muscle", sprint_30m: "speed", shuttle: "speed" };
