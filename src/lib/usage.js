// Ghi nhận thời gian và tính năng sử dụng (báo cáo cho Major OS — xem docs/major-os.md).
// Không bao giờ chặn giao diện: lỗi mạng bị bỏ qua.
import { useEffect } from "react";
import { supabase } from "@/api/base44Client";

export const USAGE_NOTICE = "Ứng dụng ghi nhận thời gian và tính năng sử dụng để cải thiện sản phẩm.";

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
let token = null;
supabase.auth.getSession().then(({ data }) => {
  token = data.session?.access_token || null;
});
supabase.auth.onAuthStateChange((_event, session) => {
  token = session?.access_token || null;
});

// keepalive: yêu cầu vẫn gửi xong khi trang đang chuyển hoặc đóng
function send(body) {
  if (!URL_ || !ANON) return Promise.resolve();
  return fetch(`${URL_}/rest/v1/rpc/log_usage`, {
    method: "POST",
    keepalive: true,
    headers: { apikey: ANON, Authorization: `Bearer ${token || ANON}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(
    () => {},
    () => {}
  );
}

// tinhNang: khoá cố định trong bảng usage_features (vd "xem_kho_anh")
export function track(tinhNang, { studentId = null, soLan = 1, chiTiet = null } = {}) {
  return send({ p_tinh_nang: tinhNang, p_student_id: studentId, p_so_lan: soLan, p_so_phut: null, p_chi_tiet: chiTiet });
}

// Ghi một lượt xem khi trang mở (và khi đổi học sinh / đối tượng đang xem)
export function useTrackView(tinhNang, { studentId = null, chiTiet = null, enabled = true } = {}) {
  const detail = chiTiet ? JSON.stringify(chiTiet) : "";
  useEffect(() => {
    if (enabled) track(tinhNang, { studentId, chiTiet: detail ? JSON.parse(detail) : null });
  }, [tinhNang, studentId, detail, enabled]);
}

// Chờ ghi xong tối đa `ms` (dùng trước khi rời trang)
export const trackAndWait = (tinhNang, opts, ms = 800) => Promise.race([track(tinhNang, opts), new Promise((r) => setTimeout(r, ms))]);

const currentStudentId = () => {
  try {
    return JSON.parse(sessionStorage.getItem("fg_student_ids") || "[]")[0] || null;
  } catch (e) {
    return null;
  }
};

// Thời gian sử dụng: chỉ tính lúc tab đang hiển thị; gửi mỗi 5 phút và khi ẩn / đóng trang
export function startUsageClock() {
  let since = document.visibilityState === "visible" ? Date.now() : null;
  let acc = 0;
  const flush = () => {
    if (since) {
      acc += Date.now() - since;
      since = document.visibilityState === "visible" ? Date.now() : null;
    }
    const minutes = Math.round(acc / 6000) / 10;
    if (minutes < 0.5) return;
    const studentId = token ? null : currentStudentId();
    if (!token && !studentId) return; // trang đăng nhập, chưa xác định người dùng
    acc = 0;
    send({ p_tinh_nang: "phien_su_dung", p_student_id: studentId, p_so_lan: 1, p_so_phut: minutes, p_chi_tiet: null });
  };
  const onVisibility = () => {
    if (document.visibilityState === "hidden") flush();
    else since = Date.now();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", flush);
  const timer = setInterval(flush, 5 * 60 * 1000);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", flush);
    clearInterval(timer);
  };
}
