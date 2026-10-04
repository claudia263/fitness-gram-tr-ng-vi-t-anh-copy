import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

// Cổng vào app, có 2 đường:
// 1. Phụ huynh/học sinh: đã tra cứu đúng tên học sinh (cờ sessionStorage "fg_entered")
// 2. Cán bộ nhà trường (tài khoản quản trị của app): đã đăng nhập → vào thẳng khu vực quản trị
export default function ProtectedRoute() {
  const { user, isAuthenticated } = useAuth();
  const entered = sessionStorage.getItem("fg_entered") === "true";
  const isAdmin = isAuthenticated && user?.role === "admin";

  if (entered || isAdmin) {
    return <Outlet />;
  }
  return <Navigate to="/login" replace />;
}