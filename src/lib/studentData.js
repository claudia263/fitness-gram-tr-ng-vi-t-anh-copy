import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { calculateBMI, calculateAgeMonths } from "@/lib/fitness";
import { computeZScore, nutritionalStatusFromZScore } from "@/lib/whoReference";

// Load a student's full fitness history (results + anthropometric + comments + sessions)
export async function loadStudentBundle(studentId) {
  const [fitness, anthro, comments, sessions] = await Promise.all([
    base44.entities.FitnessResult.filter({ student_id: studentId }, "-created_date", 100),
    base44.entities.AnthropometricResult.filter({ student_id: studentId }, "-created_date", 100),
    base44.entities.TeacherComment.filter({ student_id: studentId }, "-created_date", 100),
    base44.entities.TestSession.list("-test_date", 100),
  ]);

  const sessionMap = {};
  sessions.forEach((s) => (sessionMap[s.id] = s));

  // Join results with sessions and sort by test_date ascending (oldest first)
  const buildRow = (fr) => {
    const sess = sessionMap[fr.session_id] || {};
    return { ...fr, session: sess };
  };
  const buildAnthro = (a) => {
    const sess = sessionMap[a.session_id] || {};
    return { ...a, session: sess };
  };

  const fitnessRows = fitness
    .map(buildRow)
    .sort((a, b) => new Date(a.session.test_date || a.created_date) - new Date(b.session.test_date || b.created_date));
  const anthroRows = anthro
    .map(buildAnthro)
    .sort((a, b) => new Date(a.session.test_date || a.created_date) - new Date(b.session.test_date || b.created_date));

  const commentBySession = {};
  comments.forEach((c) => {
    commentBySession[c.session_id] = c;
  });

  return { fitnessRows, anthroRows, commentBySession, sessions };
}

// Resolve which student(s) the current user should see — theo danh sách id đã lưu
// từ trang đăng nhập (nhập tên học sinh). Chỉ xem được đúng học sinh đó.
export async function resolveStudentsByIds(ids) {
  const students = [];
  for (const id of ids || []) {
    try {
      const s = await base44.entities.Student.get(id);
      students.push(s);
    } catch (e) {
      // bỏ qua id không hợp lệ
    }
  }
  return students;
}

export function useStudentBundle(studentId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const bundle = await loadStudentBundle(studentId);
      setData(bundle);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

// Recompute BMI / age / z-score / status on the fly for an anthropometric record (ensures consistency)
export function enrichAnthro(a, birthDate, sex) {
  const bmi = a.bmi != null ? a.bmi : calculateBMI(a.weight_kg, a.height_cm);
  const age_months = a.age_months != null ? a.age_months : (a.session?.test_date ? calculateAgeMonths(birthDate, a.session.test_date) : null);
  const zScore = a.bmi_for_age_zscore != null
    ? a.bmi_for_age_zscore
    : (bmi != null && age_months != null && sex ? computeZScore(sex, age_months, bmi) : null);
  const nutritional_status = a.nutritional_status || nutritionalStatusFromZScore(zScore);
  return { ...a, bmi, age_months, bmi_for_age_zscore: zScore, nutritional_status };
}