import { motion, useReducedMotion } from "framer-motion";
import { Apple, Dumbbell, Activity } from "lucide-react";
import { getNutritionAdvice, getFitnessAdvice, calculateMacros, AGE_LABELS } from "@/lib/healthAdvice";

// Hiển thị lời khuyên dinh dưỡng + bài tập phát triển dựa trên tình trạng WHO, lứa tuổi và kết quả thể lực
export default function HealthAdvice({ anthro, fitness, sex }) {
  const reduce = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1];

  const anim = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease, delay: 0.8 } };

  const status = anthro?.nutritional_status || "Chờ dữ liệu tham chiếu WHO";
  const ageMonths = anthro?.age_months;
  const weightKg = anthro?.weight_kg;
  const nutritionPlan = getNutritionAdvice(status, ageMonths);
  const ageLabel = AGE_LABELS[nutritionPlan.ageGroup] || AGE_LABELS.unknown;
  const macros = calculateMacros(weightKg, ageMonths, status);

  const fitnessAdvices = [];
  if (fitness) {
    const pacer = getFitnessAdvice("pacer", fitness.pacer_level, ageMonths);
    if (pacer) fitnessAdvices.push({ title: "Sức bền tim phổi (PACER)", tips: pacer.tips });
    const sitReach = getFitnessAdvice("sit_and_reach", fitness.sit_and_reach_cm, ageMonths);
    if (sitReach) fitnessAdvices.push({ title: "Độ linh hoạt (Sit & Reach)", tips: sitReach.tips });
    const pushup = getFitnessAdvice("pushup", fitness.pushup_count, ageMonths);
    if (pushup) fitnessAdvices.push({ title: "Sức mạnh thân trên (Push-up)", tips: pushup.tips });
    const plank = getFitnessAdvice("plank", fitness.plank_seconds, ageMonths);
    if (plank) fitnessAdvices.push({ title: "Sức bền Core (Plank)", tips: plank.tips });
  }

  return (
    <motion.div {...anim} className="fg-card p-5 sm:p-6 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#F9DD0E", color: "#26275D" }}>
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-navy text-base sm:text-lg">Lời khuyên sức khỏe & Phát triển</h3>
          <p className="text-xs text-muted-foreground">
            Dựa trên tham chiếu WHO · Lứa tuổi: {ageLabel}
          </p>
        </div>
      </div>

      {/* Nutritional status badge */}
      <div
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5"
        style={{ background: nutritionPlan.bg, color: nutritionPlan.color }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: nutritionPlan.color }} />
        <span className="text-sm font-bold">Tình trạng: {nutritionPlan.label}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Nutrition advice */}
        <div className="rounded-2xl p-4 sm:p-5" style={{ background: "#F7F8FC" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FEF3B0", color: "#26275D" }}>
              <Apple className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-navy text-sm">Dinh dưỡng</h4>
          </div>

          {/* Macro targets calculated from weight */}
          {macros && (
            <div className="mb-4 rounded-xl p-3" style={{ background: "#FFFFFF", border: "1px solid rgba(38,39,93,0.08)" }}>
              <div className="text-xs font-bold text-navy uppercase tracking-wide mb-2">
                Mục tiêu macro/ngày · {macros.weight}kg
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <MacroStat label="Năng lượng" value={macros.targetCalories} unit="kcal" color="#26275D" />
                <MacroStat label="Protein" value={macros.proteinG} unit="g" sub={`${macros.proteinPerKg}g/kg`} color="#E85D4A" />
                <MacroStat label="Tinh bột" value={macros.carbG} unit="g" sub={`${macros.carbPct}%`} color="#F59E0B" />
                <MacroStat label="Chất béo" value={macros.fatG} unit="g" sub={`${macros.fatPct}%`} color="#16a34a" />
              </div>
            </div>
          )}

          <ul className="space-y-2.5">
            {nutritionPlan.nutrition.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-navy/80 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: nutritionPlan.color }} />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Exercise advice */}
        <div className="rounded-2xl p-4 sm:p-5" style={{ background: "#F7F8FC" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F4F5F8", color: "#26275D" }}>
              <Dumbbell className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-navy text-sm">Bài tập phát triển</h4>
          </div>
          {fitnessAdvices.length > 0 ? (
            <div className="space-y-3">
              {fitnessAdvices.map((fa, i) => (
                <div key={i}>
                  <div className="text-xs font-bold text-navy uppercase tracking-wide mb-1.5">{fa.title}</div>
                  <ul className="space-y-1.5">
                    {fa.tips.map((tip, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-navy/80 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#26275D" }} />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Chưa có dữ liệu thể lực để đưa ra lời khuyên cụ thể. Vui lòng cập nhật sau đợt kiểm tra.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MacroStat({ label, value, unit, sub, color }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-base font-extrabold tabular-nums" style={{ color }}>{value}<span className="text-[10px] font-semibold ml-0.5">{unit}</span></div>
      <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
      {sub && <div className="text-[9px] text-muted-foreground/70">{sub}</div>}
    </div>
  );
}