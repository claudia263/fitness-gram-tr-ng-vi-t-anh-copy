// Quản lý cán bộ: mời theo email (bảng staff_invites), đổi vai trò, gỡ quyền, gán CLB phụ trách.
// Người được mời tự kích hoạt tài khoản khi đăng nhập lần đầu (Google hoặc link email) — vai trò tự áp vào.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/api/base44Client";

export const SCHOOL_DOMAIN = "truongvietanh.com";

const fail = (error) => {
  throw Object.assign(new Error(error.message), { code: error.code, status: error.status });
};

export async function fetchInvites() {
  const { data, error } = await supabase.from("staff_invites").select("*").order("email");
  if (error) fail(error);
  return data;
}

export function useInvites() {
  return useQuery({ queryKey: ["staff-invites"], queryFn: fetchInvites });
}

export function useRefreshStaff() {
  const qc = useQueryClient();
  return () => Promise.all(["staff-invites", "staff", "clubs"].map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

// Admin: thêm hoặc cập nhật lời mời. Tổ trưởng: chỉ thêm mới, vai trò giáo viên (RLS).
export async function inviteStaff(list, { upsert }) {
  const rows = list.map((r) => ({ email: r.email.toLowerCase(), role: r.role, full_name: r.full_name || null }));
  const q = upsert ? supabase.from("staff_invites").upsert(rows, { onConflict: "email" }) : supabase.from("staff_invites").insert(rows);
  const { error } = await q;
  if (error) {
    if (error.code === "23505") throw new Error("Có email đã nằm trong danh sách cán bộ.");
    fail(error);
  }
}

// Admin đổi vai trò: sửa tài khoản (nếu đã có) và lời mời cho khớp nhau
export async function setRole({ email, profileId, full_name }, role) {
  if (profileId) {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
    if (error) fail(error);
  }
  await inviteStaff([{ email, role, full_name }], { upsert: true });
}

// Admin gỡ quyền: tài khoản về "thường" (không vào được khu cán bộ) và xoá lời mời
export async function revokeStaff({ email, profileId }) {
  if (profileId) {
    const { error } = await supabase.from("profiles").update({ role: "user" }).eq("id", profileId);
    if (error) fail(error);
  }
  const { error } = await supabase.from("staff_invites").delete().eq("email", email.toLowerCase());
  if (error) fail(error);
}

// Gán đúng danh sách CLB cho một giáo viên (CLB bỏ tích → bỏ gán)
export async function setTeacherClubs(teacherId, clubIds, clubs) {
  const add = clubIds.filter((id) => clubs.find((c) => c.id === id)?.teacher_id !== teacherId);
  const drop = clubs.filter((c) => c.teacher_id === teacherId && !clubIds.includes(c.id)).map((c) => c.id);
  if (add.length) {
    const { error } = await supabase.from("clubs").update({ teacher_id: teacherId }).in("id", add);
    if (error) fail(error);
  }
  if (drop.length) {
    const { error } = await supabase.from("clubs").update({ teacher_id: null }).in("id", drop);
    if (error) fail(error);
  }
}

/* ------------------------------ kiểm tra email ------------------------------ */
function distance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

// { ok, error?, warning?, fix? } — chặn email sai định dạng hoặc gõ nhầm đuôi email trường (vd .con)
export function checkEmail(raw) {
  const email = String(raw || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Email không hợp lệ" };
  const domain = email.split("@")[1];
  if (domain === SCHOOL_DOMAIN) return { ok: true };
  if (distance(domain, SCHOOL_DOMAIN) <= 3) {
    const fix = `${email.split("@")[0]}@${SCHOOL_DOMAIN}`;
    return { ok: false, error: `Có vẻ gõ nhầm đuôi email — đúng là ${fix}?`, fix };
  }
  return { ok: true, warning: "Không phải email trường" };
}

// Dán nhiều dòng: "email" hoặc "email, Họ tên" hoặc "Họ tên <tab> email"
export function parseStaffLines(text) {
  const out = [];
  const seen = new Set();
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split(/\t|;|,/).map((c) => c.trim()).filter(Boolean);
    if (!cells.length) continue;
    const emailCell = cells.find((c) => c.includes("@")) || cells[0];
    const name = cells.find((c) => c !== emailCell && !c.includes("@")) || "";
    const email = emailCell.toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    out.push({ email, full_name: name, check: checkEmail(email) });
  }
  return out;
}
