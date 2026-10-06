import { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { STAFF_ROLES } from "@/lib/clubs/model";

const RoleContext = createContext();

// Phân vai trò dựa trên user đăng nhập (profiles.role):
// - admin   → quản trị (dữ liệu thể lực + CLB)
// - lead    → Tổ trưởng Tổ Thể dục (quản lý CLB)
// - hr      → Phòng Nhân sự (duyệt minh chứng CLB)
// - teacher → giáo viên phụ trách CLB
// - mọi người còn lại → "parent" (chỉ giao diện phụ huynh)
export function RoleProvider({ children }) {
  const { user } = useAuth();

  const role = useMemo(() => (STAFF_ROLES.includes(user?.role) ? user.role : "parent"), [user?.role]);

  return <RoleContext.Provider value={{ role }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

export const ROLE_HOMES = { parent: "/", admin: "/admin", lead: "/clb", teacher: "/clb", hr: "/clb/duyet" };
export const ROLE_LABELS = { parent: "Phụ huynh", teacher: "Giáo viên", lead: "Tổ trưởng", hr: "Nhân sự", admin: "Quản trị" };
