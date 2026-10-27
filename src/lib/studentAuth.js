// Học sinh / phụ huynh đăng nhập bằng tài khoản email học sinh @student.truongvietanh.com
// (xem supabase/migrations/0009_student_email_login.sql).
import { base44, supabase } from "@/api/base44Client";

export const STUDENT_DOMAIN = "student.truongvietanh.com";
export const STUDENT_FLAG = "fg_student_login"; // đang quay lại từ Google / link email của học sinh

export const isStudentEmail = (email) => String(email || "").trim().toLowerCase().endsWith(`@${STUDENT_DOMAIN}`);

// { student_login: boolean } — chưa chạy migration thì coi như tắt
export async function fetchPublicSettings() {
  try {
    return (await base44.rpc("public_settings")) || { student_login: false };
  } catch (e) {
    return { student_login: false };
  }
}

export async function myStudents() {
  const { data, error } = await supabase.rpc("my_students");
  if (error) throw error;
  return data || [];
}

const returnUrl = () => `${window.location.origin}/login?hoc-sinh=1`;

export async function loginStudentWithGoogle() {
  sessionStorage.setItem(STUDENT_FLAG, "1");
  await base44.auth.loginWithProvider("google", returnUrl(), { hd: STUDENT_DOMAIN, prompt: "select_account" });
}

export async function sendStudentLoginLink(email) {
  sessionStorage.setItem(STUDENT_FLAG, "1");
  await base44.auth.sendLoginLink(email.trim().toLowerCase(), returnUrl());
}

// Ghi nhớ học sinh được xem trong phiên này rồi vào trang tổng quan
export function enterAsStudents(students) {
  sessionStorage.setItem("fg_entered", "true");
  sessionStorage.setItem("fg_student_ids", JSON.stringify(students.map((s) => s.id)));
  sessionStorage.removeItem(STUDENT_FLAG);
  window.dispatchEvent(new Event("fg_students_changed"));
}
