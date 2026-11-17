// Cơ sở đang xem của cán bộ: mỗi lần chỉ xem MỘT cơ sở để trang không bị trộn dữ liệu.
// Lựa chọn được nhớ trên trình duyệt và dùng chung giữa các trang cán bộ.
import { useState } from "react";

const KEY = "fg_campus_scope";

const read = () => {
  try {
    return localStorage.getItem(KEY);
  } catch (e) {
    return null;
  }
};

// campuses: danh sách mã cơ sở có trong dữ liệu. Trả về [cơ sở đang chọn, hàm đổi].
// Chưa chọn hoặc cơ sở đã lưu không còn thì lấy cơ sở đầu tiên.
export function useCampusScope(campuses) {
  const [saved, setSaved] = useState(read);
  const campus = campuses.includes(saved) ? saved : campuses[0] || null;
  const setCampus = (c) => {
    setSaved(c);
    try {
      localStorage.setItem(KEY, c);
    } catch (e) {
      /* không lưu được thì vẫn đổi trong phiên này */
    }
  };
  return [campus, setCampus];
}
