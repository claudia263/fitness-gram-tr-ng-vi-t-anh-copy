import { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";

const RoleContext = createContext();

// Phân vai trò dựa trên user đăng nhập:
// - admin (User.role === "admin") → "admin" (xem được teacher + admin)
// - mọi người còn lại → "parent" (chỉ giao diện phụ huynh)
export function RoleProvider({ children }) {
  const { user } = useAuth();

  const role = useMemo(() => {
    if (user?.role === "admin") return "admin";
    return "parent";
  }, [user?.role]);

  return <RoleContext.Provider value={{ role }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

export const ROLE_HOMES = { parent: "/", teacher: "/teacher", admin: "/admin" };
export const ROLE_LABELS = { parent: "Phụ huynh", teacher: "Giáo viên", admin: "Quản trị" };