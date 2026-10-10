import { Navigate } from "react-router-dom";
import { ROLE_HOMES, useRole } from "@/lib/RoleContext";

// Chỉ cho phép admin truy cập; người khác về trang chủ của vai trò mình (cán bộ → CLB, phụ huynh → tổng quan)
export default function AdminRoute({ children }) {
  const { role } = useRole();
  if (role !== "admin") {
    return <Navigate to={ROLE_HOMES[role] || "/"} replace />;
  }
  return children;
}