import { Navigate } from "react-router-dom";
import { useRole } from "@/lib/RoleContext";

// Chỉ cho phép admin truy cập; người dùng thường (phụ huynh) bị chuyển về trang chủ
export default function AdminRoute({ children }) {
  const { role } = useRole();
  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}