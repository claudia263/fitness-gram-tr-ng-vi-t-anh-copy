// Mục điều hướng theo vai trò (dùng chung cho thanh trên và thanh dưới trên điện thoại)
import { Archive, BarChart3, ClipboardEdit, History, LayoutGrid, School, ShieldCheck, Trophy, UserCircle } from "lucide-react";

const PARENT = [
  { label: "Tổng quan", to: "/", icon: LayoutGrid },
  { label: "Kết quả", to: "/results", icon: BarChart3 },
  { label: "Lịch sử", to: "/history", icon: History },
  { label: "Hồ sơ", to: "/profile", icon: UserCircle },
];
const CLUBS = { label: "CLB", to: "/clb", icon: Trophy };
const REVIEW = { label: "Duyệt minh chứng", short: "Duyệt", to: "/clb/duyet", icon: ShieldCheck };
const ARCHIVE = { label: "Kho ảnh", to: "/clb/kho-anh", icon: Archive };

export const NAV_BY_ROLE = {
  parent: PARENT,
  admin: [{ label: "Quản trị", to: "/admin", icon: School }, { label: "Nhập liệu", to: "/teacher", icon: ClipboardEdit }, CLUBS, REVIEW, ARCHIVE],
  lead: [CLUBS, ARCHIVE],
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
