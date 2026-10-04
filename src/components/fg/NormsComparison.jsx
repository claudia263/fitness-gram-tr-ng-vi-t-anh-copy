import {
  evaluate,
  resolvePacerType,
  PACER_15M_ESTIMATE_NOTE,
  NO_WORLD_STANDARD_NOTE,
  PLANK_REFERENCE_NOTE,
} from "@/lib/fitnessNorms";
import { formatPlankTime } from "@/lib/fitness";
import NormCard from "@/components/fg/NormCard";

// Gợi ý ngắn, khích lệ — hiển thị dưới các bài "Cần cải thiện"
const TIPS = {
  bmi: "Con vận động 60 phút mỗi ngày, thêm rau xanh và bớt nước ngọt để cân nặng về vùng khỏe mạnh nhé.",
  pacer: "Mỗi ngày con chạy nhẹ 10–15 phút, sức bền sẽ tăng lên rõ rệt chỉ sau vài tuần.",
  pushup: "Con tập 2–3 hiệp chống đẩy mỗi ngày, bắt đầu 5–8 lần rồi tăng dần nhé.",
  sitReach: "Con giữ duỗi thẳng chân 20 giây mỗi bên sau khi tập, độ dẻo sẽ cải thiện nhanh.",
};

const BAR_COLORS = { green: "#16A34A", amber: "#E0B400", red: "#C0392B", grey: "#6B6E8F" };

export default function NormsComparison({ student, fitness, anthro }) {
  if (!student || (!fitness && !anthro)) return null;

  const session = (fitness && fitness.session) || (anthro && anthro.session) || null;
  const ev = evaluate({
    sex: student.sex,
    birthDate: student.birth_date,
    testDate: session ? session.test_date : null,
    heightCm: anthro ? anthro.height_cm : null,
    weightKg: anthro ? anthro.weight_kg : null,
    pacerLaps: fitness ? fitness.pacer_laps : null,
    pacerType: resolvePacerType(fitness ? fitness.pacer_type : null, student.grade),
    pushups: fitness ? fitness.pushup_count : null,
    plankSec: fitness ? fitness.plank_seconds : null,
    sitReachCm: fitness ? fitness.sit_and_reach_cm : null,
  });

  const pacer = ev.pacer;
  const showWorldBar = pacer && pacer.percentile != null;
  const sitReachMinCm = ev.sitReach && ev.sitReach.minInch != null ? Math.round(ev.sitReach.minInch * 2.54 * 10) / 10 : null;

  return (
    <section className="mb-6">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-extrabold text-navy uppercase tracking-tight">So sánh với chuẩn</h2>
        <p className="text-sm text-muted-foreground">Đối chiếu kết quả gần nhất với chuẩn sức khỏe quốc tế (WHO 2007 · FitnessGram)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {ev.bmi && (
          <NormCard
            title="BMI"
            subtitle="Thể trạng theo tuổi"
            value={ev.bmi.value.toFixed(2)}
            status={ev.bmi.status}
            meta={ev.bmi.z != null ? `Z-score WHO: ${ev.bmi.z.toFixed(2)} · ${ev.bmi.nutritionLabel}` : "Chưa đủ dữ liệu để tính Z-score"}
            tip={TIPS.bmi}
          />
        )}

        {pacer && (
          <NormCard
            title="PACER"
            subtitle="Sức bền tim phổi"
            value={pacer.laps}
            unit="lượt"
            status={pacer.status}
            meta={pacer.hfzMinLaps != null ? `Chuẩn FitnessGram (20m): ≥ ${pacer.hfzMinLaps} lượt` : null}
            tip={TIPS.pacer}
          >
            {showWorldBar ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-navy">
                  <span>Bách phân vị thế giới</span>
                  <span className="tabular-nums">P{pacer.percentile}</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F4F5F8" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(2, Math.min(100, pacer.percentile))}%`, background: BAR_COLORS[pacer.tone] || BAR_COLORS.grey }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Mức: <b className="text-navy">{pacer.worldLabel}</b>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground leading-snug">{NO_WORLD_STANDARD_NOTE}</div>
            )}
            {pacer.converted && (
              <div className="text-[11px] font-semibold" style={{ color: "#8A6100" }}>
                {PACER_15M_ESTIMATE_NOTE} · quy đổi ≈ {pacer.laps20} lượt 20m
              </div>
            )}
          </NormCard>
        )}

        {ev.pushup && (
          <NormCard
            title="Push-up"
            subtitle="Sức mạnh thân trên"
            value={ev.pushup.value}
            unit="lần"
            status={ev.pushup.status}
            meta={ev.pushup.min != null ? `Chuẩn FitnessGram: ≥ ${ev.pushup.min} lần` : null}
            tip={TIPS.pushup}
          />
        )}

        {ev.sitReach && (
          <NormCard
            title="Sit & Reach"
            subtitle="Độ linh hoạt"
            value={ev.sitReach.valueCm}
            unit="cm"
            status={ev.sitReach.status}
            meta={ev.sitReach.minInch != null ? `Chuẩn FitnessGram: ≥ ${ev.sitReach.minInch} inch (~${sitReachMinCm} cm)` : null}
            tip={TIPS.sitReach}
          />
        )}

        {ev.plank && (
          <NormCard
            title="Plank"
            subtitle="Sức bền Core"
            value={formatPlankTime(ev.plank.value)}
            status={ev.plank.status}
            note={PLANK_REFERENCE_NOTE}
            meta={ev.plank.median != null ? `Trung vị cùng tuổi và giới: ${ev.plank.median} giây` : null}
          />
        )}
      </div>
    </section>
  );
}