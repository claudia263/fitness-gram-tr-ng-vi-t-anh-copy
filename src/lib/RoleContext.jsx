import { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { siteRole } from "@/lib/school";

const RoleContext = createContext();

// Phân vai trò dựa trên user đăng nhập (profiles.role):
// - admin   → quản trị (dữ liệu thể lực + CLB)
// - lead    → Tổ trưởng Tổ Thể dục (quản lý CLB)
// - hr      → Phòng Nhân sự (duyệt minh chứng CLB)
// - teacher → giáo viên phụ trách CLB
// - mọi người còn lại → "parent" (chỉ giao diện phụ huynh)
export function RoleProvider({ children }) {
  const { user } = useAuth();

  const role = useMemo(() => siteRole(user) || "parent", [user]);

  return <RoleContext.Provider value={{ role }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

export const ROLE_HOMES = { parent: "/", admin: "/admin", school_admin: "/admin", lead: "/clb", teacher: "/clb", hr: "/clb" };
export const ROLE_LABELS = { parent: "Phụ huynh", teacher: "Giáo viên", lead: "Tổ trưởng", hr: "Nhân sự", admin: "Quản trị", school_admin: "Quản trị trường" };
