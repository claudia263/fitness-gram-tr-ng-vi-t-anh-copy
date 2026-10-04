import { Outlet, Navigate } from 'react-router-dom';

// Cổng đăng nhập đơn giản: kiểm tra cờ sessionStorage "fg_entered"
// Nếu chưa "đăng nhập" (chưa bấm nút trên trang Login) → chuyển về /login
export default function ProtectedRoute() {
  const entered = sessionStorage.getItem("fg_entered") === "true";
  if (!entered) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}