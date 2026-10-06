import { Navigate } from "react-router-dom";
import { ROLE_HOMES, useRole } from "@/lib/RoleContext";

// Chỉ cho các vai trò trong `roles` vào; người khác về trang chủ của vai trò mình
export default function StaffRoute({ roles, children }) {
  const { role } = useRole();
  if (!roles.includes(role)) {
    return <Navigate to={ROLE_HOMES[role] || "/"} replace />;
  }
  return children;
}
