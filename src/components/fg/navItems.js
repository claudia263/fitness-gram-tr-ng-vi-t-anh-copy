// Mục điều hướng theo vai trò (dùng chung cho thanh trên và thanh dưới trên điện thoại)
import { Archive, BarChart3, ClipboardEdit, Database, History, LayoutGrid, School, ShieldCheck, Trophy, UserCircle, Users } from "lucide-react";

const PARENT = [
  { label: "Tổng quan", to: "/", icon: LayoutGrid },
  { label: "Kết quả", to: "/results", icon: BarChart3 },
  { label: "Lịch sử", to: "/history", icon: History },
  { label: "Hồ sơ", to: "/profile", icon: UserCircle },
];
const CLUBS = { label: "CLB", to: "/clb", icon: Trophy };
const REVIEW = { label: "Duyệt minh chứng", short: "Duyệt", to: "/clb/duyet", icon: ShieldCheck };
const ARCHIVE = { label: "Kho ảnh", to: "/clb/kho-anh", icon: Archive };
const STAFF = { label: "Cán bộ", to: "/can-bo", icon: Users };

export const NAV_BY_ROLE = {
  parent: PARENT,
  // Điện thoại chỉ hiện 5 mục đầu ở thanh dưới
  admin: [{ label: "Quản trị", to: "/admin", icon: School }, { label: "Dữ liệu", to: "/admin/du-lieu", icon: Database }, { label: "Nhập liệu", to: "/teacher", icon: ClipboardEdit }, CLUBS, REVIEW, ARCHIVE, STAFF],
  lead: [CLUBS, ARCHIVE, STAFF],
  teacher: [CLUBS, ARCHIVE],
  hr: [REVIEW, ARCHIVE, CLUBS],
};

// Mục đang mở = mục có đường dẫn dài nhất khớp với trang hiện tại
export function activeNav(items, pathname) {
  let best = null;
  for (const it of items) {
    const match = it.to === "/" ? pathname === "/" : pathname === it.to || pathname.startsWith(`${it.to}/`);
    if (match && (!best || it.to.length > best.length)) best = it.to;
  }
  return best;
}
